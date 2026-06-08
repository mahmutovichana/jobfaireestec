import { useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { usePartners, PACKAGE_LABELS, type Partner, type PartnerPackage } from "@/hooks/usePartners";
import { SEO } from "@/components/SEO";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";

/* ── Package accent colors ── */
const PACKAGE_ACCENT: Record<PartnerPackage, string> = {
  gold: "from-yellow-500/20 via-yellow-600/10 to-transparent border-yellow-500/20",
  silver: "from-gray-300/20 via-gray-400/10 to-transparent border-gray-400/20",
  standard: "from-blue-500/15 via-blue-400/10 to-transparent border-blue-500/15",
  promo: "from-purple-500/15 via-purple-400/10 to-transparent border-purple-500/15",
};

const PACKAGE_BADGE: Record<PartnerPackage, string> = {
  gold: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  silver: "bg-gray-300/20 text-gray-200 border-gray-400/30",
  standard: "bg-blue-500/15 text-blue-300 border-blue-500/20",
  promo: "bg-purple-500/15 text-purple-300 border-purple-500/20",
};

/* ── Partner card with description and year/package badges ── */
function PartnerCard({ partner, index, yearFilter }: { partner: Partner; index: number; yearFilter: number | null }) {
  const parts = (partner.participations ?? []).slice().sort((a, b) => b.year - a.year);
  const visibleParts = yearFilter ? parts.filter((p) => p.year === yearFilter) : parts;
  const pkg = (visibleParts[0]?.package || partner.package || "standard") as PartnerPackage;

  return (
    <motion.a
      href={partner.website || "#"}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={`group relative bg-gradient-to-b ${PACKAGE_ACCENT[pkg]} backdrop-blur-xl border rounded-2xl p-6 text-center hover:scale-[1.02] transition-all duration-500`}
    >
      <div className="flex items-center justify-center mb-4">
        {partner.logo_url ? (
          <img
            src={partner.logo_url}
            alt={partner.name}
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
          {visibleParts.map((p) => (
            <span
              key={p.id}
              title={p.package ? `${PACKAGE_LABELS[p.package as PartnerPackage]} paket` : undefined}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                p.package ? PACKAGE_BADGE[p.package as PartnerPackage] : "bg-white/[0.05] text-muted-foreground border-white/[0.08]"
              }`}
            >
              {p.year}
            </span>
          ))}
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
function CategorySection({ title, subtitle, partners, yearFilter }: { title: string; subtitle?: string; partners: Partner[]; yearFilter: number | null }) {
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
          <PartnerCard key={partner.id} partner={partner} index={i} yearFilter={yearFilter} />
        ))}
      </div>
    </section>
  );
}

/* ── Main Page ── */
export default function Partneri() {
  const { data: partners = [], isLoading } = usePartners(true);
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
            <CategorySection title="Kompanije učesnice" subtitle="Učesnici" partners={companies} yearFilter={yearFilter} />
            <CategorySection title="Mediji" subtitle="Medijska podrška" partners={media} yearFilter={yearFilter} />
            <CategorySection title="Sponzori" subtitle="Podrška" partners={sponsors} yearFilter={yearFilter} />
          </div>
        </>
      )}

      <PublicFooter />
    </div>
  );
}
