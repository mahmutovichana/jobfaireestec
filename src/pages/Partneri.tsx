import { useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { ExternalLink, Info, X } from "lucide-react";
import { usePartners, type Partner } from "@/hooks/usePartners";
import { usePackageTypes } from "@/hooks/usePackageTypes";
import { SEO } from "@/components/SEO";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";

/* Strong per-package visuals so the package is immediately recognizable */
const PACKAGE_VISUAL: Record<string, { ring: string; glow: string; stripe: string }> = {
  gold:     { ring: "ring-yellow-400/60 border-yellow-400/50",  glow: "shadow-[0_0_0_1px_rgba(250,204,21,0.35),0_8px_30px_-12px_rgba(250,204,21,0.45)]", stripe: "bg-gradient-to-r from-yellow-400 to-amber-500" },
  silver:   { ring: "ring-gray-300/60 border-gray-300/50",      glow: "shadow-[0_0_0_1px_rgba(209,213,219,0.35),0_8px_30px_-12px_rgba(156,163,175,0.45)]", stripe: "bg-gradient-to-r from-gray-300 to-gray-400" },
  standard: { ring: "ring-blue-400/60 border-blue-400/50",      glow: "shadow-[0_0_0_1px_rgba(59,130,246,0.35),0_8px_30px_-12px_rgba(59,130,246,0.45)]",  stripe: "bg-gradient-to-r from-blue-400 to-blue-500" },
  promo:    { ring: "ring-purple-400/60 border-purple-400/50",  glow: "shadow-[0_0_0_1px_rgba(168,85,247,0.35),0_8px_30px_-12px_rgba(168,85,247,0.45)]", stripe: "bg-gradient-to-r from-purple-400 to-purple-500" },
  custom:   { ring: "ring-emerald-400/60 border-emerald-400/50",glow: "shadow-[0_0_0_1px_rgba(16,185,129,0.35),0_8px_30px_-12px_rgba(16,185,129,0.45)]", stripe: "bg-gradient-to-r from-emerald-400 to-emerald-500" },
};
const DEFAULT_VISUAL = { ring: "border-border", glow: "", stripe: "bg-muted" };
const DEFAULT_BADGE = "bg-muted text-foreground border-border";

/* ── Partner card with description and year/package badges ── */
function PartnerCard({ partner, index, yearFilter, typeMap }: { partner: Partner; index: number; yearFilter: number | null; typeMap: Record<string, { label: string; color_class: string }> }) {
  const parts = (partner.participations ?? []).slice().sort((a, b) => b.year - a.year);
  const visibleParts = yearFilter ? parts.filter((p) => p.year === yearFilter) : parts;
  const pkg = (visibleParts[0]?.package || partner.package || "standard");
  const visual = PACKAGE_VISUAL[pkg] || DEFAULT_VISUAL;

  return (
    <motion.a
      href={partner.website || "#"}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -50px 0px" }}
      transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.02 }}
      className={`group relative overflow-hidden bg-card/40 backdrop-blur-xl border ${visual.ring} ${visual.glow} rounded-2xl p-6 text-center hover:scale-[1.02] transition-transform duration-300`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${visual.stripe}`} />
      <div className="flex items-center justify-center mb-4">
        {partner.logo_url ? (
          <img
            src={partner.logo_url}
            alt={partner.name}
            loading="lazy"
            decoding="async"
            className="w-16 h-16 object-contain opacity-80 group-hover:opacity-100 transition-opacity duration-500"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-white/[0.06] flex items-center justify-center text-2xl font-bold text-muted-foreground">
            {partner.name[0]}
          </div>
        )}
      </div>
      <h3 className="font-display font-bold text-sm text-foreground mb-1">{partner.name}</h3>
      {partner.description && (
        <p className="text-xs text-muted-foreground line-clamp-3 mb-2">{partner.description}</p>
      )}
      {visibleParts.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-1 mt-2">
          {visibleParts.map((p) => {
            const t = p.package ? typeMap[p.package] : null;
            return (
              <span
                key={p.id}
                title={t ? `${t.label} paket` : (p.package ? `${p.package} paket` : undefined)}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${t?.color_class || DEFAULT_BADGE}`}
              >
                {p.year}
              </span>
            );
          })}
        </div>
      )}
      {partner.website && (
        <div className="mt-3 flex items-center justify-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <ExternalLink className="w-3 h-3" />
          Posjeti
        </div>
      )}
    </motion.a>
  );
}

/* ── Section for a category ── */
function CategorySection({ title, subtitle, partners, yearFilter, typeMap }: { title: string; subtitle?: string; partners: Partner[]; yearFilter: number | null; typeMap: Record<string, { label: string; color_class: string }> }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  if (partners.length === 0) return null;

  return (
    <section ref={ref} className="py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center mb-10"
      >
        <span className="text-primary font-semibold text-sm tracking-widest uppercase mb-3 block">
          {subtitle || title}
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground tracking-tight">
          {title}
        </h2>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-5xl mx-auto px-6">
        {partners.map((partner, i) => (
          <PartnerCard key={partner.id} partner={partner} index={i} yearFilter={yearFilter} typeMap={typeMap} />
        ))}
      </div>
    </section>
  );
}

/* ── Main Page ── */
export default function Partneri() {
  const { data: partners = [], isLoading } = usePartners(true);
  const { data: pkgTypes = [] } = usePackageTypes();
  const typeMap = useMemo(() => {
    const m: Record<string, { label: string; color_class: string }> = {};
    pkgTypes.forEach((t) => (m[t.key] = { label: t.label, color_class: t.color_class }));
    return m;
  }, [pkgTypes]);
  const [yearFilter, setYearFilter] = useState<number | null>(null);

  const allYears = useMemo(() => {
    const set = new Set<number>();
    partners.forEach((p) => p.participations?.forEach((pp) => set.add(pp.year)));
    return Array.from(set).sort((a, b) => b - a);
  }, [partners]);

  const filterPartner = (p: Partner) => {
    if (!yearFilter) return true;
    return (p.participations ?? []).some((pp) => pp.year === yearFilter);
  };

  const companies = useMemo(() => partners.filter((p) => p.category === "company" && filterPartner(p)), [partners, yearFilter]);
  const media = useMemo(() => partners.filter((p) => p.category === "media" && filterPartner(p)), [partners, yearFilter]);
  const sponsors = useMemo(() => partners.filter((p) => p.category === "sponsor" && filterPartner(p)), [partners, yearFilter]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Partneri"
        description="Kompanije učesnice, mediji i sponzori koji podržavaju JobFAIR sajam zapošljavanja u BiH."
        path="/partneri"
      />
      <PublicNavbar />

      {/* Hero */}
      <section className="py-20 lg:py-28 text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="text-primary font-semibold text-sm tracking-widest uppercase mb-4 block">
            JobFAIR 2026
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-foreground tracking-tight mb-4">
            Naši <span className="text-primary">partneri</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Kompanije, mediji i sponzori koji podržavaju i učestvuju u najznačajnijem sajmu zapošljavanja u BiH.
          </p>
        </motion.div>
      </section>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">Učitavanje partnera...</div>
      ) : (
        <>
          {/* Year filter */}
          {allYears.length > 0 && (
            <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center justify-center gap-2 pb-4">
              <button
                onClick={() => setYearFilter(null)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  yearFilter === null ? "bg-primary text-primary-foreground border-primary" : "bg-white/[0.04] text-muted-foreground border-white/[0.08] hover:bg-white/[0.08]"
                }`}
              >
                Sve godine
              </button>
              {allYears.map((y) => (
                <button
                  key={y}
                  onClick={() => setYearFilter(y)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                    yearFilter === y ? "bg-primary text-primary-foreground border-primary" : "bg-white/[0.04] text-muted-foreground border-white/[0.08] hover:bg-white/[0.08]"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
          <div className="max-w-7xl mx-auto">
            <CategorySection title="Kompanije učesnice" subtitle="Učesnici" partners={companies} yearFilter={yearFilter} typeMap={typeMap} />
            <CategorySection title="Mediji" subtitle="Medijska podrška" partners={media} yearFilter={yearFilter} typeMap={typeMap} />
            <CategorySection title="Sponzori" subtitle="Podrška" partners={sponsors} yearFilter={yearFilter} typeMap={typeMap} />
          </div>
        </>
      )}

      <PublicFooter />
      <PackageLegend pkgTypes={pkgTypes} />
    </div>
  );
}

/* ── Floating package legend that follows scroll ── */
const LEGEND_SWATCH: Record<string, { bg: string; ring: string }> = {
  gold:     { bg: "#eab308", ring: "rgba(234,179,8,0.35)" },
  silver:   { bg: "#9ca3af", ring: "rgba(156,163,175,0.35)" },
  standard: { bg: "#3b82f6", ring: "rgba(59,130,246,0.35)" },
  promo:    { bg: "#a855f7", ring: "rgba(168,85,247,0.35)" },
  custom:   { bg: "#10b981", ring: "rgba(16,185,129,0.35)" },
};
const FALLBACK_SWATCH = { bg: "hsl(var(--primary))", ring: "hsl(var(--primary) / 0.35)" };

function PackageLegend({ pkgTypes }: { pkgTypes: { key: string; label: string; color_class: string }[] }) {
  const [open, setOpen] = useState(false);
  if (pkgTypes.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.95 }}
          className="w-64 rounded-2xl border border-border bg-card shadow-2xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Legenda paketa</p>
            <button
              onClick={() => setOpen(false)}
              aria-label="Zatvori legendu"
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <ul className="space-y-2">
            {pkgTypes.map((t) => {
              const sw = LEGEND_SWATCH[t.key] ?? FALLBACK_SWATCH;
              return (
                <li key={t.key} className="flex items-center gap-2.5 text-sm">
                  <span
                    className="inline-block w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: sw.bg, boxShadow: `0 0 0 3px ${sw.ring}` }}
                    aria-hidden="true"
                  />
                  <span className="text-foreground font-medium">{t.label}</span>
                </li>
              );
            })}
          </ul>
        </motion.div>
      ) : (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setOpen(true)}
          aria-label="Otvori legendu paketa"
          className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform flex items-center justify-center"
        >
          <Info className="w-5 h-5" />
        </motion.button>
      )}
    </div>
  );
}
