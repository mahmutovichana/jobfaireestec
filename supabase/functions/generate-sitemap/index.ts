import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://jobfaireestec.lovable.app";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const staticUrls: { path: string; changefreq: string; priority: string }[] = [
    { path: "/", changefreq: "weekly", priority: "1.0" },
    { path: "/aktivnosti", changefreq: "weekly", priority: "0.8" },
    { path: "/novosti", changefreq: "daily", priority: "0.8" },
    { path: "/oglasi", changefreq: "daily", priority: "0.8" },
    { path: "/partneri", changefreq: "weekly", priority: "0.7" },
    { path: "/ostavi-cv", changefreq: "monthly", priority: "0.6" },
    { path: "/kontakt", changefreq: "monthly", priority: "0.6" },
  ];

  const [events, news] = await Promise.all([
    supabase.from("events").select("id, updated_at").eq("status", "live"),
    supabase.from("news_posts").select("id, updated_at").eq("published", true),
  ]);

  const urls: string[] = [];

  for (const u of staticUrls) {
    urls.push(
      `  <url>\n    <loc>${BASE_URL}${u.path}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
    );
  }

  for (const e of events.data ?? []) {
    urls.push(
      `  <url>\n    <loc>${BASE_URL}/event/${e.id}</loc>\n    <lastmod>${new Date(e.updated_at).toISOString()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`,
    );
  }

  for (const n of news.data ?? []) {
    urls.push(
      `  <url>\n    <loc>${BASE_URL}/novost/${n.id}</loc>\n    <lastmod>${new Date(n.updated_at).toISOString()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`,
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

  return new Response(xml, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});