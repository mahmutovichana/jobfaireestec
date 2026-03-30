import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INSTAGRAM_USERNAME = "jobfair.sarajevo";

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

    const responseText = await response.text();
    let result: any = null;

    try {
      result = responseText ? JSON.parse(responseText) : null;
    } catch {
      result = null;
    }

    if (!response.ok) {
      if (result?.response_type === "link not found") {
        throw new Error(
          `Instagram username \"${INSTAGRAM_USERNAME}\" was not found by RapidAPI. Check that the username matches the working endpoint in RapidAPI.`
        );
      }

      const apiMessage = result?.message || responseText || "Unknown error";
      throw new Error(`RapidAPI request failed [${response.status}]: ${apiMessage}`);
    }

    if (result?.success === false && result?.response_type === "link not found") {
      throw new Error(
        `Instagram username \"${INSTAGRAM_USERNAME}\" was not found by RapidAPI. Check that the username matches the working endpoint in RapidAPI.`
      );
    }

    const edges = result?.result?.edges || [];
    const items = edges.map((e: any) => e.node).filter(Boolean);

    if (items.length === 0) {
      throw new Error(`No Instagram posts were returned for @${INSTAGRAM_USERNAME}`);
    }

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

    // Step 3: Get a user for attribution
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    const accessToken = authHeader?.replace(/^Bearer\s+/i, "") || null;

    let requesterUserId: string | null = null;
    if (accessToken) {
      const { data: requesterData, error: requesterError } = await supabase.auth.getUser(accessToken);
      if (requesterError) {
        console.warn("Could not resolve requesting user:", requesterError.message);
      } else {
        requesterUserId = requesterData.user?.id ?? null;
      }
    }

    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();

    let userId: string | null = adminRole?.user_id ?? requesterUserId;

    if (!userId) {
      const { data: anyProfile } = await supabase
        .from("profiles")
        .select("id")
        .limit(1)
        .maybeSingle();

      userId = anyProfile?.id ?? null;
    }

    if (!userId) {
      throw new Error("No users found to attribute posts to");
    }

    let synced = 0;

    for (const post of posts) {
      const postId = post.code || post.pk?.toString() || post.id;
      if (!postId || existingIds.has(postId)) {
        console.log(`Skipping already synced or invalid post: ${postId}`);
        continue;
      }

      // Extract images from the post
      let thumbnailUrl = "";
      const galleryUrls: string[] = [];

      if (post.edge_sidecar_to_children?.edges?.length > 0) {
        // Carousel post
        const children = post.edge_sidecar_to_children.edges;
        for (let i = 0; i < children.length; i++) {
          const child = children[i].node;
          const imageUrl = child?.display_url || "";
          if (i === 0) {
            thumbnailUrl = imageUrl;
          } else if (imageUrl) {
            galleryUrls.push(imageUrl);
          }
        }
      } else {
        // Single image post
        thumbnailUrl = post.display_url || post.thumbnail_src || "";
      }

      if (!thumbnailUrl) {
        console.log(`Skipping post without image: ${postId}`);
        continue;
      }

      const captionText =
        post.edge_media_to_caption?.edges?.[0]?.node?.text ||
        post.caption?.text ||
        (typeof post.caption === "string" ? post.caption : "") ||
        "Instagram post";
      const lines = captionText.split("\n");
      const title = lines[0].substring(0, 200);
      const content = captionText;
      const summary = captionText.substring(0, 300);

      const publishedAt = post.taken_at_timestamp
        ? new Date(post.taken_at_timestamp * 1000).toISOString()
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
