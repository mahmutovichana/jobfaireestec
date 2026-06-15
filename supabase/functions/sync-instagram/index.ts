import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INSTAGRAM_USERNAME = "jobfair.sarajevo";
const RAPIDAPI_HOST = "instagram120.p.rapidapi.com";
const RAPIDAPI_URL = `https://${RAPIDAPI_HOST}/api/instagram/posts`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rapidApiKey = Deno.env.get("RAPIDAPI_KEY");
    if (!rapidApiKey) {
      throw new Error("RAPIDAPI_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    console.log(`Fetching posts for @${INSTAGRAM_USERNAME}...`);

    const response = await fetch(RAPIDAPI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": RAPIDAPI_HOST,
        "x-rapidapi-key": rapidApiKey,
      },
      body: JSON.stringify({ username: INSTAGRAM_USERNAME, maxId: "" }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`RapidAPI request failed [${response.status}]: ${errBody}`);
    }

    const result = await response.json();
    // instagram120 returns: { result: { edges: [{ node: {...} }, ...] } }
    const edges = result?.result?.edges || result?.data?.edges || [];
    const items = edges.map((e: any) => e?.node ?? e).filter(Boolean);

    console.log(`Fetched ${items.length} posts from RapidAPI`);

    // Process all returned posts so newly published ones aren't missed
    // when older posts still occupy the top of the feed.
    const posts = items;

    const igIds = posts
      .map((p: any) => p.code || p.id || (p.pk != null ? String(p.pk) : null))
      .filter(Boolean);
    const { data: existing } = await supabase
      .from("news_posts")
      .select("id, instagram_post_id, thumbnail_url, gallery_urls")
      .in("instagram_post_id", igIds);

    const existingByIgId = new Map((existing || []).map((r: any) => [r.instagram_post_id, r]));

    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .single();

    let userId: string;
    if (adminRole) {
      userId = adminRole.user_id;
    } else {
      const { data: anyProfile } = await supabase.from("profiles").select("id").limit(1).single();
      if (!anyProfile) throw new Error("No users found to attribute posts to");
      userId = anyProfile.id;
    }

    const pickImage = (media: any): string => {
      return (
        media?.image_versions2?.candidates?.[0]?.url ||
        media?.image_versions?.items?.[0]?.url ||
        media?.display_url ||
        media?.thumbnail_url ||
        ""
      );
    };

    // Download an Instagram CDN image and re-upload it to our public storage bucket
    // so the URL doesn't expire when Instagram's signed CDN tokens rotate.
    const persistImage = async (sourceUrl: string, postId: string, idx: number): Promise<string> => {
      try {
        if (!sourceUrl) return "";
        const res = await fetch(sourceUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; JobFAIRBot/1.0)",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          },
        });
        if (!res.ok) {
          console.warn(`Failed to fetch image ${sourceUrl}: ${res.status}`);
          return "";
        }
        const buf = new Uint8Array(await res.arrayBuffer());
        const contentType = res.headers.get("content-type") || "image/jpeg";
        const ext = contentType.includes("png") ? "png" : "jpg";
        const path = `instagram/${postId}-${idx}-${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("news-images")
          .upload(path, buf, { contentType, upsert: true });
        if (uploadErr) {
          console.warn(`Upload failed for ${path}:`, uploadErr.message);
          return "";
        }
        const { data: pub } = supabase.storage.from("news-images").getPublicUrl(path);
        return pub.publicUrl || "";
      } catch (e) {
        console.warn(`persistImage error:`, (e as Error).message);
        return "";
      }
    };

    let synced = 0;
    let refreshed = 0;

    for (const post of posts) {
      const postId = post.code || post.id || (post.pk != null ? String(post.pk) : null);
      if (!postId) {
        console.log(`Skipping invalid post: ${postId}`);
        continue;
      }

      let thumbnailUrl = "";
      const galleryUrls: string[] = [];

      const carousel =
        post.carousel_media ||
        post.edge_sidecar_to_children?.edges?.map((e: any) => e?.node) ||
        null;

      if (Array.isArray(carousel) && carousel.length > 0) {
        for (let i = 0; i < carousel.length; i++) {
          const url = pickImage(carousel[i]);
          if (!url) continue;
          const stored = await persistImage(url, postId, i);
          if (!stored) continue;
          if (i === 0) thumbnailUrl = stored;
          else galleryUrls.push(stored);
        }
      } else {
        const url = pickImage(post);
        thumbnailUrl = url ? await persistImage(url, postId, 0) : "";
      }

      if (!thumbnailUrl) {
        console.log(`Skipping post without image: ${postId}`);
        continue;
      }

      const existingPost = existingByIgId.get(postId);
      if (existingPost) {
        const { error: updateError } = await supabase
          .from("news_posts")
          .update({ thumbnail_url: thumbnailUrl, gallery_urls: galleryUrls })
          .eq("id", existingPost.id);
        if (updateError) console.error(`Failed to refresh media ${postId}:`, updateError.message);
        else {
          refreshed++;
          console.log(`Refreshed Instagram media: ${postId}`);
        }
        continue;
      }

      const caption =
        post.caption?.text ||
        post.edge_media_to_caption?.edges?.[0]?.node?.text ||
        (typeof post.caption === "string" ? post.caption : "") ||
        "Instagram post";
      const captionText = typeof caption === "string" ? caption : "Instagram post";
      const lines = captionText.split("\n");
      const title = (lines.find((l: string) => l.trim()) || "Instagram post").substring(0, 200);
      const content = captionText;
      const summary = captionText.substring(0, 300);

      const takenAt = post.taken_at || post.taken_at_timestamp;
      const publishedAt = takenAt ? new Date(takenAt * 1000).toISOString() : new Date().toISOString();

      const { error: insertError } = await supabase.from("news_posts").insert({
        user_id: userId,
        title,
        summary,
        content,
        thumbnail_url: thumbnailUrl,
        gallery_urls: galleryUrls,
        published: true,
        published_at: publishedAt,
        instagram_post_id: postId,
      });

      if (insertError) {
        console.error(`Failed to insert post ${postId}:`, insertError.message);
      } else {
        synced++;
        console.log(`Synced Instagram post: ${postId}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
          message: `Sync završen: ${synced} novih, ${refreshed} osvježenih Instagram novosti`,
        total_fetched: posts.length,
          refreshed,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("Error syncing Instagram:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
