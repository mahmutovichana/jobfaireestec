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
      .select("instagram_post_id")
      .in("instagram_post_id", igIds);

    const existingIds = new Set((existing || []).map((r: any) => r.instagram_post_id));

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

    let synced = 0;

    for (const post of posts) {
      const postId = post.code || post.id || (post.pk != null ? String(post.pk) : null);
      if (!postId || existingIds.has(postId)) {
        console.log(`Skipping already synced or invalid post: ${postId}`);
        continue;
      }

      let thumbnailUrl = "";
      const galleryUrls: string[] = [];

      const carousel =
        post.carousel_media ||
        post.edge_sidecar_to_children?.edges?.map((e: any) => e?.node) ||
        null;

      if (Array.isArray(carousel) && carousel.length > 0) {
        carousel.forEach((media: any, i: number) => {
          const url = pickImage(media);
          if (i === 0) thumbnailUrl = url;
          else if (url) galleryUrls.push(url);
        });
      } else {
        thumbnailUrl = pickImage(post);
      }

      if (!thumbnailUrl) {
        console.log(`Skipping post without image: ${postId}`);
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
        message: `Synced ${synced} new posts from Instagram`,
        total_fetched: posts.length,
        already_existed: posts.length - synced,
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
