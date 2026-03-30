import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INSTAGRAM_USERNAME = "jobfairsarajevo";

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

    // Step 1: Fetch posts from Instagram via RapidAPI scraper
    console.log(`Fetching posts for @${INSTAGRAM_USERNAME}...`);

    const response = await fetch(
      "https://instagram120.p.rapidapi.com/api/instagram/posts",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": "instagram120.p.rapidapi.com",
          "x-rapidapi-key": rapidApiKey,
        },
        body: JSON.stringify({
          username: INSTAGRAM_USERNAME,
          maxId: "",
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`RapidAPI request failed [${response.status}]: ${errBody}`);
    }

    const result = await response.json();
    const items = result?.data?.items || [];

    console.log(`Fetched ${items.length} posts from RapidAPI`);

    const result = await response.json();
    const edges = result?.result?.edges || [];
    const items = edges.map((e: any) => e.node).filter(Boolean);

    console.log(`Fetched ${items.length} posts from RapidAPI`);

    // Take last 6 posts
    const posts = items.slice(0, 6);

    // Step 2: Check which posts already exist
    const igIds = posts.map((p: any) => p.code || p.pk?.toString() || p.id);
    const { data: existing } = await supabase
      .from("news_posts")
      .select("instagram_post_id")
      .in("instagram_post_id", igIds.filter(Boolean));

    const existingIds = new Set((existing || []).map((r: any) => r.instagram_post_id));

    // Step 3: Get admin user for attribution
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
      const postId = post.id || post.pk?.toString() || post.code;
      if (!postId || existingIds.has(postId)) {
        console.log(`Skipping already synced or invalid post: ${postId}`);
        continue;
      }

      // Extract images from the post
      let thumbnailUrl = "";
      const galleryUrls: string[] = [];

      if (post.carousel_media && post.carousel_media.length > 0) {
        // Carousel post - first image is thumbnail, rest are gallery
        for (let i = 0; i < post.carousel_media.length; i++) {
          const media = post.carousel_media[i];
          const imageUrl =
            media.image_versions2?.candidates?.[0]?.url ||
            media.image_versions?.items?.[0]?.url ||
            media.thumbnail_url ||
            "";
          if (i === 0) {
            thumbnailUrl = imageUrl;
          } else if (imageUrl) {
            galleryUrls.push(imageUrl);
          }
        }
      } else {
        // Single image post
        thumbnailUrl =
          post.image_versions2?.candidates?.[0]?.url ||
          post.image_versions?.items?.[0]?.url ||
          post.thumbnail_url ||
          post.display_url ||
          "";
      }

      if (!thumbnailUrl) {
        console.log(`Skipping post without image: ${postId}`);
        continue;
      }

      const caption = post.caption?.text || post.caption || "Instagram post";
      const captionText = typeof caption === "string" ? caption : "Instagram post";
      const lines = captionText.split("\n");
      const title = lines[0].substring(0, 200);
      const content = captionText;
      const summary = captionText.substring(0, 300);

      const publishedAt = post.taken_at
        ? new Date(post.taken_at * 1000).toISOString()
        : new Date().toISOString();

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
