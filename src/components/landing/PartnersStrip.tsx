import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";
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
      <div className="w-16 h-16 sm:w-20 sm:h-20 relative flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.06] p-2.5 transition-all duration-300 hover:bg-white/[0.1] hover:border-white/[0.12]">
        {partner.logo_url ? (
          <img
            src={partner.logo_url}
            alt={partner.name}
            className="w-full h-full object-contain opacity-60 hover:opacity-100 transition-opacity duration-300"
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
  const [showAllMobile, setShowAllMobile] = useState(false);
  const MOBILE_LIMIT = 8;

  if (partners.length === 0) return null;

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

        {/* Logo grid - all partners, no descriptions */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-5xl mx-auto"
        >
          {partners.map((partner, idx) => (
            <div
              key={partner.id}
              className={!showAllMobile && idx >= MOBILE_LIMIT ? "hidden sm:flex" : "flex"}
            >
              <LogoItem partner={partner} />
            </div>
          ))}
        </motion.div>

        {partners.length > MOBILE_LIMIT && !showAllMobile && (
          <div className="mt-6 flex justify-center sm:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllMobile(true)}
              className="rounded-full text-xs"
            >
              Prikaži sve ({partners.length}) <ChevronDown className="ml-1 w-3.5 h-3.5" />
            </Button>
          </div>
        )}

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
