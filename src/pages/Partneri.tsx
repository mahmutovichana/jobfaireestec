import { useMemo, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { usePartners, PACKAGE_LABELS, PACKAGE_ORDER, type Partner, type PartnerPackage } from "@/hooks/usePartners";
import { COPYRIGHT_TEXT, EESTEC_WEBSITE, EESTEC_ORG_NAME } from "@/lib/constants";
import { SEO } from "@/components/SEO";

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

/* ── Partner card with description ── */
function PartnerCard({ partner, index }: { partner: Partner; index: number }) {
  const pkg = partner.package || "standard";

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
        <p className="text-xs text-muted-foreground line-clamp-3">{partner.description}</p>
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
function CategorySection({ title, subtitle, partners, showPackages = false }: { title: string; subtitle?: string; partners: Partner[]; showPackages?: boolean }) {
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

      {showPackages ? (
        <div className="space-y-12">
          {PACKAGE_ORDER.map((pkg, pkgIdx) => {
            const pkgPartners = partners.filter((p) => p.package === pkg);
            if (pkgPartners.length === 0) return null;

            return (
              <motion.div
                key={pkg}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: pkgIdx * 0.1 }}
              >
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="h-px flex-1 max-w-24 bg-gradient-to-r from-transparent to-white/[0.1]" />
                  <span className={`text-sm font-semibold px-4 py-1.5 rounded-full border ${PACKAGE_BADGE[pkg]}`}>
                    {PACKAGE_LABELS[pkg]} paket
                  </span>
                  <div className="h-px flex-1 max-w-24 bg-gradient-to-l from-transparent to-white/[0.1]" />
                </div>

                <div className={`grid gap-4 ${pkg === "gold" ? "sm:grid-cols-3" : pkg === "silver" ? "sm:grid-cols-4" : "sm:grid-cols-4 md:grid-cols-5"} max-w-5xl mx-auto px-6`}>
                  {pkgPartners.map((partner, i) => (
                    <PartnerCard key={partner.id} partner={partner} index={i} />
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-5xl mx-auto px-6">
          {partners.map((partner, i) => (
            <PartnerCard key={partner.id} partner={partner} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Main Page ── */
export default function Partneri() {
  const { data: partners = [], isLoading } = usePartners(true);

  const companies = useMemo(() => partners.filter((p) => p.category === "company"), [partners]);
  const media = useMemo(() => partners.filter((p) => p.category === "media"), [partners]);
  const sponsors = useMemo(() => partners.filter((p) => p.category === "sponsor"), [partners]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Partneri"
        description="Kompanije učesnice, mediji i sponzori koji podržavaju JobFAIR sajam zapošljavanja u BiH."
        path="/partneri"
      />
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/60 backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6 lg:px-8">
          <Link to="/">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="text-sm font-medium rounded-full" asChild>
              <Link to="/novosti">Novosti</Link>
            </Button>
            <Button variant="ghost" className="text-sm font-medium rounded-full" asChild>
              <Link to="/oglasi">Oglasi</Link>
            </Button>
            <Button variant="ghost" className="text-sm font-medium rounded-full" asChild>
              <Link to="/partneri">Partneri</Link>
            </Button>
            <Button variant="ghost" className="text-sm font-medium rounded-full" asChild>
              <Link to="/auth">Prijava</Link>
            </Button>
          </div>
        </div>
      </nav>

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
        <div className="max-w-7xl mx-auto">
          <CategorySection title="Kompanije učesnice" subtitle="Učesnici" partners={companies} showPackages />
          <CategorySection title="Mediji" subtitle="Medijska podrška" partners={media} />
          <CategorySection title="Sponzori" subtitle="Podrška" partners={sponsors} />
        </div>
      )}

      {/* Footer */}
      <footer className="py-12 px-6 lg:px-8 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo size="md" />
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href={EESTEC_WEBSITE} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              {EESTEC_ORG_NAME}
            </a>
            <span>{COPYRIGHT_TEXT}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
