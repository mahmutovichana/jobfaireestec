import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INSTAGRAM_USERNAME = "jobfair.sarajevo";

function extractImageUrl(node: any): string {
  // Try multiple known paths for the image URL
  return (
    node?.display_url ||
    node?.thumbnail_src ||
    node?.display_resources?.slice(-1)?.[0]?.src ||
    node?.image_versions2?.candidates?.[0]?.url ||
    node?.carousel_media?.[0]?.image_versions2?.candidates?.[0]?.url ||
    node?.thumbnail ||
    node?.media_url ||
    ""
  );
}

function extractGalleryUrls(node: any): string[] {
  const urls: string[] = [];

  // Carousel via edge_sidecar_to_children
  const sidecarEdges = node?.edge_sidecar_to_children?.edges;
  if (Array.isArray(sidecarEdges) && sidecarEdges.length > 1) {
    for (let i = 1; i < sidecarEdges.length; i++) {
      const url = extractImageUrl(sidecarEdges[i]?.node);
      if (url) urls.push(url);
    }
    return urls;
  }

  // Carousel via carousel_media
  const carouselMedia = node?.carousel_media;
  if (Array.isArray(carouselMedia) && carouselMedia.length > 1) {
    for (let i = 1; i < carouselMedia.length; i++) {
      const url = extractImageUrl(carouselMedia[i]);
      if (url) urls.push(url);
    }
    return urls;
  }

  return urls;
}

function extractThumbnail(node: any): string {
  // For carousel, use first child
  const sidecarEdges = node?.edge_sidecar_to_children?.edges;
  if (Array.isArray(sidecarEdges) && sidecarEdges.length > 0) {
    const firstChild = extractImageUrl(sidecarEdges[0]?.node);
    if (firstChild) return firstChild;
  }

  const carouselMedia = node?.carousel_media;
  if (Array.isArray(carouselMedia) && carouselMedia.length > 0) {
    const firstChild = extractImageUrl(carouselMedia[0]);
    if (firstChild) return firstChild;
  }

  return extractImageUrl(node);
}

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

    // Step 1: Fetch posts from Instagram via RapidAPI
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
      const apiMessage = result?.message || responseText || "Unknown error";
      throw new Error(`RapidAPI request failed [${response.status}]: ${apiMessage}`);
    }

    // Parse posts from various response formats
    let items: any[] = [];
    
    // Format 1: result.edges[].node
    if (result?.result?.edges) {
      items = result.result.edges.map((e: any) => e.node).filter(Boolean);
    }
    // Format 2: result.data.items[]
    else if (result?.data?.items) {
      items = result.data.items;
    }
    // Format 3: result.items[]
    else if (result?.items) {
      items = result.items;
    }
    // Format 4: direct array
    else if (Array.isArray(result)) {
      items = result;
    }

    console.log(`Fetched ${items.length} posts from RapidAPI`);

    if (items.length === 0) {
      // Log the response structure for debugging
      console.log("Response keys:", Object.keys(result || {}));
      if (result?.result) console.log("result.result keys:", Object.keys(result.result));
      throw new Error(`No Instagram posts were returned for @${INSTAGRAM_USERNAME}`);
    }

    // Log first post structure for debugging
    const samplePost = items[0];
    console.log("Sample post keys:", Object.keys(samplePost || {}));
    console.log("Sample thumbnail extraction:", extractThumbnail(samplePost) ? "found" : "NOT FOUND");

    // Take last 6 posts (most recent)
    const posts = items.slice(0, 6);

    // Step 2: Check which posts already exist
    const igIds = posts
      .map((p: any) => p.code || p.shortcode || p.pk?.toString() || p.id)
      .filter(Boolean);
    
    const { data: existing } = await supabase
      .from("news_posts")
      .select("instagram_post_id")
      .in("instagram_post_id", igIds);

    const existingIds = new Set((existing || []).map((r: any) => r.instagram_post_id));

    // Step 3: Get a user for attribution
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    const accessToken = authHeader?.replace(/^Bearer\s+/i, "") || null;

    let requesterUserId: string | null = null;
    if (accessToken) {
      const { data: requesterData } = await supabase.auth.getUser(accessToken);
      requesterUserId = requesterData?.user?.id ?? null;
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
    let skippedNoImage = 0;
    let skippedExisting = 0;

    for (const post of posts) {
      const postId = post.code || post.shortcode || post.pk?.toString() || post.id;
      if (!postId) {
        console.log("Skipping post with no ID");
        continue;
      }
      
      if (existingIds.has(postId)) {
        skippedExisting++;
        continue;
      }

      const thumbnailUrl = extractThumbnail(post);
      const galleryUrls = extractGalleryUrls(post);

      if (!thumbnailUrl) {
        skippedNoImage++;
        console.log(`Skipping post without image: ${postId}. Keys: ${Object.keys(post).join(", ")}`);
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
        : post.taken_at
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
        already_existed: skippedExisting,
        skipped_no_image: skippedNoImage,
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
