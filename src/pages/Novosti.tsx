import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNewsPosts } from "@/hooks/useNews";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { SEO } from "@/components/SEO";
import { CalendarDays, ArrowRight, ArrowLeft, Search, X, Newspaper } from "lucide-react";
import { format } from "date-fns";

const Novosti = () => {
  const { data: posts, isLoading } = useNewsPosts(true);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState<string>("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const years = useMemo(() => {
    const set = new Set<number>();
    posts?.forEach((p) => {
      set.add(new Date(p.published_at || p.created_at).getFullYear());
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [posts]);

  const filtered = useMemo(() => {
    if (!posts) return [];
    let result = [...posts];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.summary?.toLowerCase().includes(q) ||
          p.content?.toLowerCase().includes(q)
      );
    }
    if (year !== "all") {
      result = result.filter(
        (p) => new Date(p.published_at || p.created_at).getFullYear() === parseInt(year)
      );
    }
    result.sort((a, b) => {
      const da = new Date(a.published_at || a.created_at).getTime();
      const db = new Date(b.published_at || b.created_at).getTime();
      return sort === "newest" ? db - da : da - db;
    });
    return result;
  }, [posts, search, year, sort]);

  const featured = !search && year === "all" && sort === "newest" ? filtered[0] : null;
  const rest = featured ? filtered.slice(1) : filtered;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Novosti"
        description="Najnovije vijesti, obavještenja i novosti vezane za JobFAIR sajam zapošljavanja u Sarajevu."
        path="/novosti"
      />
      <PublicNavbar />

      {/* Header */}
      <section className="pt-24 pb-8 lg:pt-32 lg:pb-12">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" className="rounded-full" asChild>
              <Link to="/"><ArrowLeft className="w-4 h-4 mr-1" /> Početna</Link>
            </Button>
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground tracking-tight">
            Novosti
          </h1>
          <p className="text-muted-foreground text-lg mt-3 max-w-2xl">
            Pratite najnovije vijesti i obavještenja vezana za JobFAIR sajam.
          </p>
        </div>
      </section>

      {/* Search */}
      <section className="pb-4">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pretraži novosti..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-full bg-white/[0.06] backdrop-blur-sm border-white/[0.08]"
              />
              {search && (
                <button aria-label="Obriši pretragu" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-36 rounded-full bg-white/[0.06] border-white/[0.08]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Sve godine</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as any)}>
              <SelectTrigger className="w-40 rounded-full bg-white/[0.06] border-white/[0.08]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Najnovije prvo</SelectItem>
                <SelectItem value="oldest">Najstarije prvo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Posts */}
      <section className="pb-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-white/[0.06] rounded-2xl h-48 mb-4" />
                  <div className="h-4 bg-white/[0.06] rounded w-1/3 mb-2" />
                  <div className="h-6 bg-white/[0.06] rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg">
                {search || year !== "all" ? "Nema rezultata." : "Trenutno nema novosti."}
              </p>
            </div>
          ) : (
            <>
              {featured && (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mb-8"
                >
                  <Link to={`/novost/${featured.id}`} className="group block">
                    <div className="grid md:grid-cols-2 gap-0 rounded-3xl overflow-hidden bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] hover:bg-white/[0.1] transition-all duration-300">
                      {featured.thumbnail_url ? (
                        <div className="aspect-[16/10] md:aspect-auto overflow-hidden">
                          <img
                            src={featured.thumbnail_url}
                            alt={featured.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        </div>
                      ) : (
                        <div className="aspect-[16/10] md:aspect-auto bg-primary/10 flex items-center justify-center">
                          <CalendarDays className="w-12 h-12 text-primary/40" />
                        </div>
                      )}
                      <div className="p-8 lg:p-10 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">Najnovije</span>
                          <p className="text-xs text-muted-foreground font-medium">
                            {format(new Date(featured.published_at || featured.created_at), "dd.MM.yyyy")}
                          </p>
                        </div>
                        <h2 className="font-display font-bold text-2xl lg:text-3xl leading-tight text-foreground group-hover:text-primary transition-colors">
                          {featured.title}
                        </h2>
                        {featured.summary && (
                          <p className="text-muted-foreground mt-3 line-clamp-3">{featured.summary}</p>
                        )}
                        <div className="flex items-center gap-1 text-primary text-sm font-medium mt-5">
                          Pročitaj cijeli članak <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <Link to={`/novost/${post.id}`} className="group block">
                    <div className="rounded-2xl overflow-hidden bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] hover:bg-white/[0.1] transition-all duration-300">
                      {post.thumbnail_url ? (
                        <div className="aspect-[16/10] overflow-hidden">
                          <img
                            src={post.thumbnail_url}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="aspect-[16/10] bg-primary/10 flex items-center justify-center">
                          <CalendarDays className="w-10 h-10 text-primary/40" />
                        </div>
                      )}
                      <div className="p-5">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">
                          {format(new Date(post.published_at || post.created_at), "dd.MM.yyyy")}
                        </p>
                        <h3 className="font-display font-bold text-foreground text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        {post.summary && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{post.summary}</p>
                        )}
                        <div className="flex items-center gap-1 text-primary text-sm font-medium mt-4">
                          Opširnije <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Novosti;
