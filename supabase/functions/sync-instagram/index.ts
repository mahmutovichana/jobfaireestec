import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INSTAGRAM_GRAPH_URL = "https://graph.instagram.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const igToken = Deno.env.get("INSTAGRAM_ACCESS_TOKEN");
    if (!igToken) {
      throw new Error("INSTAGRAM_ACCESS_TOKEN is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Step 1: Get user's media from Instagram Graph API
    // First get the user ID
    const meRes = await fetch(
      `${INSTAGRAM_GRAPH_URL}/me?fields=id,username&access_token=${igToken}`
    );
    if (!meRes.ok) {
      const errBody = await meRes.text();
      throw new Error(`Instagram /me failed [${meRes.status}]: ${errBody}`);
    }
    const meData = await meRes.json();
    console.log(`Instagram user: ${meData.username} (${meData.id})`);

    // Step 2: Fetch recent media (last 6 posts)
    const mediaRes = await fetch(
      `${INSTAGRAM_GRAPH_URL}/${meData.id}/media?fields=id,caption,media_type,media_url,timestamp,permalink,children{media_url,media_type}&limit=6&access_token=${igToken}`
    );
    if (!mediaRes.ok) {
      const errBody = await mediaRes.text();
      throw new Error(`Instagram /media failed [${mediaRes.status}]: ${errBody}`);
    }
    const mediaData = await mediaRes.json();
    const posts = mediaData.data || [];

    console.log(`Fetched ${posts.length} Instagram posts`);

    // Step 3: Check which posts already exist in news_posts
    const igIds = posts.map((p: any) => p.id);
    const { data: existing } = await supabase
      .from("news_posts")
      .select("instagram_post_id")
      .in("instagram_post_id", igIds);

    const existingIds = new Set((existing || []).map((r: any) => r.instagram_post_id));

    // Step 4: We need a user_id for creating posts. Get the first admin user.
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .single();

    // Fallback: get any profile
    let userId: string;
    if (adminRole) {
      userId = adminRole.user_id;
    } else {
      const { data: anyProfile } = await supabase
        .from("profiles")
        .select("id")
        .limit(1)
        .single();
      if (!anyProfile) throw new Error("No users found to attribute posts to");
      userId = anyProfile.id;
    }

    let synced = 0;

    for (const post of posts) {
      if (existingIds.has(post.id)) {
        console.log(`Skipping already synced post: ${post.id}`);
        continue;
      }

      // Only sync IMAGE, CAROUSEL_ALBUM posts (skip VIDEO-only for now)
      if (post.media_type !== "IMAGE" && post.media_type !== "CAROUSEL_ALBUM") {
        console.log(`Skipping ${post.media_type} post: ${post.id}`);
        continue;
      }

      let thumbnailUrl = post.media_url;
      let galleryUrls: string[] = [];

      if (post.media_type === "CAROUSEL_ALBUM" && post.children?.data) {
        const images = post.children.data.filter(
          (c: any) => c.media_type === "IMAGE"
        );
        if (images.length > 0) {
          thumbnailUrl = images[0].media_url;
          galleryUrls = images.slice(1).map((c: any) => c.media_url);
        }
      }

      const caption = post.caption || "Instagram post";
      // Use first line as title, rest as content
      const lines = caption.split("\n");
      const title = lines[0].substring(0, 200);
      const content = caption;
      const summary = caption.substring(0, 300);

      const { error: insertError } = await supabase.from("news_posts").insert({
        user_id: userId,
        title,
        summary,
        content,
        thumbnail_url: thumbnailUrl,
        gallery_urls: galleryUrls,
        published: true,
        published_at: post.timestamp,
        instagram_post_id: post.id,
      });

      if (insertError) {
        console.error(`Failed to insert post ${post.id}:`, insertError.message);
      } else {
        synced++;
        console.log(`Synced Instagram post: ${post.id}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${synced} new posts from Instagram`,
        total_fetched: posts.length,
        already_existed: posts.length - synced,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error syncing Instagram:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
