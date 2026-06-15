import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Re-downloads any news_posts thumbnail/gallery image that still lives on
// Instagram's CDN (signed, expiring URLs) and re-uploads it to our public
// `news-images` bucket so the link is permanent.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const isExternal = (url: string | null | undefined) =>
      !!url && /cdninstagram\.com|fbcdn\.net/i.test(url);

    const persist = async (sourceUrl: string, postId: string, idx: number): Promise<string> => {
      try {
        const res = await fetch(sourceUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; JobFAIRBot/1.0)",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          },
        });
        if (!res.ok) return "";
        const buf = new Uint8Array(await res.arrayBuffer());
        const contentType = res.headers.get("content-type") || "image/jpeg";
        const ext = contentType.includes("png") ? "png" : "jpg";
        const path = `instagram/${postId}-${idx}-${Date.now()}.${ext}`;
        const { error } = await supabase.storage
          .from("news-images")
          .upload(path, buf, { contentType, upsert: true });
        if (error) return "";
        const { data } = supabase.storage.from("news-images").getPublicUrl(path);
        return data.publicUrl || "";
      } catch {
        return "";
      }
    };

    const { data: posts, error } = await supabase
      .from("news_posts")
      .select("id, thumbnail_url, gallery_urls");
    if (error) throw error;

    let updated = 0;
    let imagesMigrated = 0;

    for (const post of posts ?? []) {
      const needsThumb = isExternal(post.thumbnail_url);
      const gallery: string[] = Array.isArray(post.gallery_urls) ? post.gallery_urls : [];
      const needsGallery = gallery.some(isExternal);
      if (!needsThumb && !needsGallery) continue;

      let newThumb = post.thumbnail_url;
      if (needsThumb) {
        const persisted = await persist(post.thumbnail_url, post.id, 0);
        if (persisted !== post.thumbnail_url) {
          newThumb = persisted;
          imagesMigrated++;
        }
      }

      const newGallery: string[] = [];
      for (let i = 0; i < gallery.length; i++) {
        const url = gallery[i];
        if (isExternal(url)) {
          const persisted = await persist(url, post.id, i + 1);
          if (persisted) newGallery.push(persisted);
          if (persisted !== url) imagesMigrated++;
        } else {
          newGallery.push(url);
        }
      }

      const { error: updErr } = await supabase
        .from("news_posts")
        .update({ thumbnail_url: newThumb, gallery_urls: newGallery })
        .eq("id", post.id);
      if (!updErr) updated++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        posts_updated: updated,
        images_migrated: imagesMigrated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});