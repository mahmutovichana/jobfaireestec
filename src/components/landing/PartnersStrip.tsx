import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePartners, type Partner } from "@/hooks/usePartners";

function LogoItem({ partner }: { partner: Partner }) {
  return (
    <a
      href={partner.website || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center justify-center"
      title={partner.name}
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 relative flex items-center justify-center rounded-xl bg-card/50 border border-border/60 p-2.5 transition-all duration-300 hover:bg-card hover:border-primary/30 hover:-translate-y-0.5">
        {partner.logo_url ? (
          <img
            src={partner.logo_url}
            alt={partner.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain opacity-70 group-hover:opacity-100 transition-opacity duration-300"
          />
        ) : (
          <span className="text-sm font-bold text-muted-foreground/50">{partner.name.slice(0, 2)}</span>
        )}
      </div>
    </a>
  );
}

export function PartnersStrip() {
  const { data: partners = [] } = usePartners(true);

  // Rank by total number of participations (fair: most active → most prominent)
  const ranked = useMemo(() => {
    return partners
      .slice()
      .sort((a, b) => (b.participations?.length ?? 0) - (a.participations?.length ?? 0));
  }, [partners]);

  const VISIBLE_COUNT = 20;
  const visiblePartners = ranked.slice(0, VISIBLE_COUNT);
  const hiddenCount = Math.max(ranked.length - VISIBLE_COUNT, 0);

  if (ranked.length === 0) return null;

  return (
    <section className="py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <span className="text-primary font-semibold text-sm tracking-widest uppercase mb-4 block">Partneri</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-4 text-foreground tracking-tight">
            Oni koji nas <span className="text-primary">podržavaju</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative max-w-5xl mx-auto overflow-hidden pb-10"
        >
          {/* Reserve vertical space (CLS): images are lazy + sizes can vary. */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 min-h-[236px] sm:min-h-[260px] max-h-[236px] sm:max-h-[260px] overflow-hidden content-start">
            {visiblePartners.map((partner) => (
              <LogoItem key={partner.id} partner={partner} />
            ))}
          </div>
          {hiddenCount > 0 && (
            <div className="absolute inset-x-0 bottom-0 h-28 flex items-end justify-center bg-gradient-to-t from-background via-background/90 to-background/0">
              <Button className="rounded-full shadow-xl shadow-primary/15" asChild>
                <Link to="/partneri">
                  <Sparkles className="mr-2 w-4 h-4" /> Još {hiddenCount}+ partnera <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-10"
        >
          <Button variant="outline" className="rounded-full border-white/[0.12] hover:bg-white/[0.08]" asChild>
            <Link to="/partneri">Pogledaj sve partnere <ArrowRight className="ml-2 w-4 h-4" /></Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
