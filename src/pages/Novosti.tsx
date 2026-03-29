import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useNewsPosts } from "@/hooks/useNews";
import { CalendarDays, ArrowRight, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

const Novosti = () => {
  const { data: posts, isLoading } = useNewsPosts(true);
  const [navVisible, setNavVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setNavVisible(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <motion.nav
        className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-md"
        initial={{ y: -100 }}
        animate={{ y: navVisible ? 0 : -100 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between h-[72px] px-6 lg:px-8">
          <Link to="/">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-sm font-medium" asChild>
              <Link to="/auth">Prijava</Link>
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Header */}
      <section className="pt-24 pb-12 lg:pt-32 lg:pb-16">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-1" /> Početna
              </Link>
            </Button>
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground tracking-tight">
            Novosti
          </h1>
          <p className="text-muted-foreground text-lg mt-3 max-w-2xl">
            Pratite najnovije vijesti i obavještenja vezana za JobFAIR sajam.
          </p>
          <div className="w-16 h-1 bg-primary rounded-full mt-4" />
        </div>
      </section>

      {/* Posts */}
      <section className="pb-20">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted rounded-2xl h-48 mb-4" />
                  <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-6 bg-muted rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : posts?.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg">Trenutno nema novosti.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts?.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <Link
                    to={`/novost/${post.id}`}
                    className="group block"
                  >
                    <div className="rounded-2xl overflow-hidden bg-card border border-border hover:shadow-lg transition-shadow">
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
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                            {post.summary}
                          </p>
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
      <footer className="py-12 px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo size="md" />
          <span className="text-sm text-muted-foreground">
            © 2026 JobFAIR. Sva prava zadržana.
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Novosti;
