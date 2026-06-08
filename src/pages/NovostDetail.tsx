import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNewsPost } from "@/hooks/useNews";
import { ArrowLeft, CalendarDays, X } from "lucide-react";
import { format } from "date-fns";
import { SEO } from "@/components/SEO";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";

const NovostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: post, isLoading } = useNewsPost(id);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse space-y-4 max-w-2xl w-full px-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded-2xl" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold text-foreground mb-4">
            Novost nije pronađena
          </h1>
          <Button asChild>
            <Link to="/novosti">Nazad na novosti</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={post.title}
        description={post.summary || post.title}
        path={`/novost/${post.id}`}
        type="article"
        image={post.thumbnail_url || undefined}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: post.title,
          datePublished: post.published_at || post.created_at,
          image: post.thumbnail_url || undefined,
          description: post.summary || undefined,
          publisher: { "@type": "Organization", name: "JobFAIR" },
        }}
      />
      <PublicNavbar />

      {/* Content */}
      <article className="pt-24 pb-20 lg:pt-32">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <Button variant="ghost" size="sm" className="mb-6" asChild>
            <Link to="/novosti">
              <ArrowLeft className="w-4 h-4 mr-1" /> Sve novosti
            </Link>
          </Button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <CalendarDays className="w-4 h-4" />
            <span>
              {format(new Date(post.published_at || post.created_at), "dd.MM.yyyy")}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight mb-6 leading-tight">
            {post.title}
          </h1>

          {post.thumbnail_url && (
            <div className="rounded-2xl overflow-hidden mb-8">
              <img
                src={post.thumbnail_url}
                alt={post.title}
                className="w-full h-auto max-h-[400px] object-cover"
              />
            </div>
          )}

          {post.summary && (
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 font-medium">
              {post.summary}
            </p>
          )}

          {post.content && (
            <div className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
              {post.content}
            </div>
          )}

          {/* Gallery */}
          {post.gallery_urls.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-display font-bold text-foreground mb-6">
                Galerija
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {post.gallery_urls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setLightboxImg(url)}
                    className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <img
                      src={url}
                      alt={`Slika ${i + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-[100] bg-foreground/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <button
            className="absolute top-4 right-4 text-background hover:text-background/70 transition-colors"
            onClick={() => setLightboxImg(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={lightboxImg}
            alt="Uvećana slika"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <PublicFooter />
    </div>
  );
};

export default NovostDetail;
