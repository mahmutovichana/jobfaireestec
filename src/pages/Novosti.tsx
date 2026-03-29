import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNewsPosts } from "@/hooks/useNews";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { ROUTES } from "@/lib/constants";
import { CalendarDays, ArrowRight, ArrowLeft, Search, X } from "lucide-react";
import { format } from "date-fns";

const Novosti = () => {
  const { data: posts, isLoading } = useNewsPosts(true);
  const [navVisible, setNavVisible] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const handleScroll = () => setNavVisible(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filtered = useMemo(() => {
    if (!posts) return [];
    if (!search) return posts;
    const q = search.toLowerCase();
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.summary?.toLowerCase().includes(q) ||
        p.content?.toLowerCase().includes(q)
    );
  }, [posts, search]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <motion.nav
        className="fixed top-0 w-full z-50 bg-background/60 backdrop-blur-2xl border-b border-white/[0.06]"
        initial={{ y: -100 }}
        animate={{ y: navVisible ? 0 : -100 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between h-[64px] px-6 lg:px-8">
          <Link to="/"><Logo size="md" /></Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="text-sm font-medium rounded-full" asChild>
              <Link to="/oglasi">Oglasi</Link>
            </Button>
            <Button variant="ghost" className="text-sm font-medium rounded-full" asChild>
              <Link to="/auth">Prijava</Link>
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Header */}
      <section className="pt-24 pb-8 lg:pt-32 lg:pb-12">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
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
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pretraži novosti..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-full bg-white/[0.06] backdrop-blur-sm border-white/[0.08]"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Posts */}
      <section className="pb-20">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
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
              <p className="text-lg">
                {search ? "Nema rezultata za vašu pretragu." : "Trenutno nema novosti."}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((post, i) => (
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
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 lg:px-8 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo size="md" />
          <span className="text-sm text-muted-foreground">© 2026 JobFAIR. Sva prava zadržana.</span>
        </div>
      </footer>
    </div>
  );
};

export default Novosti;
