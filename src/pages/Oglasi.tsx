import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useJobAds } from "@/hooks/useJobAds";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { SEO } from "@/components/SEO";
import { JOB_AD_FILTERS, type JobAdFilterKey } from "@/lib/constants";
import {
  CalendarDays, ArrowLeft, ExternalLink, Building2, Search, X,
} from "lucide-react";
import { format, isPast } from "date-fns";

const Oglasi = () => {
  const { data: ads, isLoading } = useJobAds(true);
  const [search, setSearch] = useState("");
  const [showActive, setShowActive] = useState<JobAdFilterKey>("all");
  const [company, setCompany] = useState<string>("all");
  const [sort, setSort] = useState<"newest" | "deadline">("newest");

  const companies = useMemo(() => {
    const set = new Set<string>();
    ads?.forEach((a) => set.add(a.company_name));
    return Array.from(set).sort();
  }, [ads]);

  const filtered = useMemo(() => {
    if (!ads) return [];
    let result = ads;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (ad) =>
          ad.title.toLowerCase().includes(q) ||
          ad.company_name.toLowerCase().includes(q) ||
          ad.description?.toLowerCase().includes(q)
      );
    }

    if (showActive === "active") {
      result = result.filter((ad) => !ad.deadline || !isPast(new Date(ad.deadline)));
    } else if (showActive === "expired") {
      result = result.filter((ad) => ad.deadline && isPast(new Date(ad.deadline)));
    }

    if (company !== "all") {
      result = result.filter((ad) => ad.company_name === company);
    }

    result = [...result].sort((a, b) => {
      if (sort === "deadline") {
        const da = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
        const db = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;
        return da - db;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [ads, search, showActive, company, sort]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Oglasi za posao"
        description="Aktuelni oglasi za posao i prakse od kompanija učesnica JobFAIR sajma zapošljavanja u Sarajevu."
        path="/oglasi"
        jsonLd={ads && ads.length > 0 ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: ads.map((ad, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "JobPosting",
              title: ad.title,
              description: ad.description || ad.title,
              datePosted: ad.created_at,
              validThrough: ad.deadline || undefined,
              hiringOrganization: {
                "@type": "Organization",
                name: ad.company_name,
              },
              jobLocation: {
                "@type": "Place",
                address: {
                  "@type": "PostalAddress",
                  addressLocality: "Sarajevo",
                  addressCountry: "BA",
                },
              },
            },
          })),
        } : undefined}
      />
      <PublicNavbar />

      {/* Header */}
      <section className="pt-24 pb-8 lg:pt-32 lg:pb-12">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" className="rounded-full" asChild>
              <Link to="/"><ArrowLeft className="w-4 h-4 mr-1" /> Početna</Link>
            </Button>
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground tracking-tight">
            Oglasi
          </h1>
          <p className="text-muted-foreground text-lg mt-3 max-w-2xl">
            Pronađite svoju priliku — otvorene pozicije od kompanija učesnica JobFAIR-a.
          </p>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="pb-4">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pretraži po nazivu, firmi..."
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
              <Select value={company} onValueChange={setCompany}>
                <SelectTrigger className="w-full sm:w-56 rounded-full bg-white/[0.06] border-white/[0.08]">
                  <SelectValue placeholder="Sve kompanije" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Sve kompanije</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(v) => setSort(v as any)}>
                <SelectTrigger className="w-full sm:w-44 rounded-full bg-white/[0.06] border-white/[0.08]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Najnoviji</SelectItem>
                  <SelectItem value="deadline">Po roku prijave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(JOB_AD_FILTERS) as JobAdFilterKey[]).map((filter) => (
                <Button
                  key={filter}
                  variant={showActive === filter ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setShowActive(filter)}
                >
                  {JOB_AD_FILTERS[filter]}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ads Grid */}
      <section className="pb-20">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <h2 className="sr-only">Aktuelni oglasi</h2>
          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse bg-white/[0.06] rounded-2xl p-6 h-48" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg">
                {search ? "Nema rezultata za vašu pretragu." : "Trenutno nema oglasa."}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filtered.map((ad, i) => {
                const isExpired = ad.deadline && isPast(new Date(ad.deadline));
                return (
                  <motion.div
                    key={ad.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                  >
                    <div className={`rounded-2xl overflow-hidden bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] hover:bg-white/[0.1] transition-all duration-300 ${isExpired ? "opacity-60" : ""}`}>
                      {ad.image_url && (
                        <div className="aspect-[2/1] overflow-hidden">
                          <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <h3 className="font-display font-bold text-lg text-foreground">{ad.title}</h3>
                            <p className="text-sm text-primary font-medium flex items-center gap-1 mt-1">
                              <Building2 className="w-3.5 h-3.5" /> {ad.company_name}
                            </p>
                          </div>
                          {isExpired && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive shrink-0">
                              Istekao
                            </span>
                          )}
                        </div>
                        {ad.description && (
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{ad.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          {ad.deadline && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <CalendarDays className="w-3.5 h-3.5" />
                              Rok: {format(new Date(ad.deadline), "dd.MM.yyyy")}
                            </p>
                          )}
                          {ad.external_link && (
                            <Button size="sm" className="rounded-full ml-auto" asChild>
                              <a href={ad.external_link} target="_blank" rel="noopener noreferrer">
                                Prijavi se <ExternalLink className="w-3.5 h-3.5 ml-1" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Oglasi;
