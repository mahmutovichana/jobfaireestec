import { useMemo, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { usePartners, PACKAGE_LABELS, PACKAGE_ORDER, CATEGORY_LABELS, type Partner, type PartnerPackage } from "@/hooks/usePartners";
import { COPYRIGHT_TEXT, EESTEC_WEBSITE, EESTEC_ORG_NAME } from "@/lib/constants";

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

const LOGO_SIZE: Record<PartnerPackage, string> = {
  gold: "w-24 h-24",
  silver: "w-20 h-20",
  standard: "w-16 h-16",
  promo: "w-14 h-14",
};

/* ── Infinite marquee row ── */
function MarqueeRow({ partners, reverse = false, speed = 12 }: { partners: Partner[]; reverse?: boolean; speed?: number }) {
  if (partners.length === 0) return null;
  // Duplicate for seamless loop
  const items = [...partners, ...partners, ...partners];
  const duration = partners.length * speed;

  return (
    <div className="overflow-hidden py-4">
      <motion.div
        className="flex items-center gap-10 w-max"
        animate={{ x: reverse ? [0, -(partners.length * 160)] : [-(partners.length * 160), 0] }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
      >
        {items.map((partner, i) => (
          <PartnerLogo key={`${partner.id}-${i}`} partner={partner} />
        ))}
      </motion.div>
    </div>
  );
}

/* ── Single logo with grayscale → color hover ── */
function PartnerLogo({ partner }: { partner: Partner }) {
  const pkg = partner.package || "standard";
  const sizeClass = LOGO_SIZE[pkg];

  return (
    <a
      href={partner.website || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex-shrink-0 flex items-center justify-center"
    >
      <div className={`${sizeClass} relative flex items-center justify-center rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] p-3 transition-all duration-500 group-hover:bg-white/[0.1] group-hover:border-white/[0.15] group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-primary/5`}>
        {partner.logo_url ? (
          <img
            src={partner.logo_url}
            alt={partner.name}
            className="w-full h-full object-contain grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
          />
        ) : (
          <span className="text-lg font-bold text-muted-foreground/50 group-hover:text-foreground transition-colors duration-500">
            {partner.name.slice(0, 2)}
          </span>
        )}
      </div>

      {/* Tooltip on hover */}
      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10">
        <div className="bg-background/90 backdrop-blur-xl border border-white/[0.1] rounded-lg px-3 py-1.5 whitespace-nowrap shadow-xl">
          <p className="text-xs font-medium text-foreground">{partner.name}</p>
        </div>
      </div>
    </a>
  );
}

/* ── Section for a category ── */
function CategorySection({ title, partners, showPackages = false }: { title: string; partners: Partner[]; showPackages?: boolean }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  if (partners.length === 0) return null;

  if (showPackages) {
    return (
      <section ref={ref} className="py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-semibold text-sm tracking-widest uppercase mb-3 block">
            Učesnici
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground tracking-tight">
            {title}
          </h2>
        </motion.div>

        <div className="space-y-16">
          {PACKAGE_ORDER.map((pkg, pkgIdx) => {
            const pkgPartners = partners.filter((p) => p.package === pkg);
            if (pkgPartners.length === 0) return null;

            return (
              <motion.div
                key={pkg}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: pkgIdx * 0.15 }}
              >
                {/* Package header */}
                <div className="flex items-center justify-center gap-3 mb-8">
                  <div className="h-px flex-1 max-w-24 bg-gradient-to-r from-transparent to-white/[0.1]" />
                  <span className={`text-sm font-semibold px-4 py-1.5 rounded-full border ${PACKAGE_BADGE[pkg]}`}>
                    {PACKAGE_LABELS[pkg]} paket
                  </span>
                  <div className="h-px flex-1 max-w-24 bg-gradient-to-l from-transparent to-white/[0.1]" />
                </div>

                {/* Marquee for this package */}
                <MarqueeRow partners={pkgPartners} reverse={pkgIdx % 2 === 1} speed={pkg === "gold" ? 40 : 30} />

                {/* Grid underneath for gold/silver */}
                {(pkg === "gold" || pkg === "silver") && (
                  <div className={`mt-8 grid gap-4 ${pkg === "gold" ? "sm:grid-cols-3" : "sm:grid-cols-4"} max-w-5xl mx-auto px-6`}>
                    {pkgPartners.map((partner, i) => (
                      <motion.a
                        key={partner.id}
                        href={partner.website || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                        className={`group relative bg-gradient-to-b ${PACKAGE_ACCENT[pkg]} backdrop-blur-xl border rounded-2xl p-6 text-center hover:scale-[1.03] transition-all duration-500`}
                      >
                        <div className="flex items-center justify-center mb-4">
                          {partner.logo_url ? (
                            <img
                              src={partner.logo_url}
                              alt={partner.name}
                              className="w-16 h-16 object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-white/[0.06] flex items-center justify-center text-2xl font-bold text-muted-foreground">
                              {partner.name[0]}
                            </div>
                          )}
                        </div>
                        <h3 className="font-display font-bold text-sm text-foreground mb-1">{partner.name}</h3>
                        {partner.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{partner.description}</p>
                        )}
                        {partner.website && (
                          <div className="mt-3 flex items-center justify-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <ExternalLink className="w-3 h-3" />
                            Posjeti
                          </div>
                        )}
                      </motion.a>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>
    );
  }

  // Media / Sponsors — simple marquee + grid
  return (
    <section ref={ref} className="py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center mb-10"
      >
        <span className="text-primary font-semibold text-sm tracking-widest uppercase mb-3 block">
          {title === "Mediji" ? "Medijska podrška" : "Podrška"}
        </span>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">
          {title}
        </h2>
      </motion.div>

      <MarqueeRow partners={partners} speed={25} />

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 max-w-5xl mx-auto px-6">
        {partners.map((partner, i) => (
          <motion.a
            key={partner.id}
            href={partner.website || "#"}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-500"
          >
            {partner.logo_url ? (
              <img
                src={partner.logo_url}
                alt={partner.name}
                className="w-12 h-12 object-contain grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center text-lg font-bold text-muted-foreground">
                {partner.name[0]}
              </div>
            )}
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{partner.name}</span>
          </motion.a>
        ))}
      </div>
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
          <CategorySection title="Kompanije učesnice" partners={companies} showPackages />
          <CategorySection title="Mediji" partners={media} />
          <CategorySection title="Sponzori" partners={sponsors} />
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
