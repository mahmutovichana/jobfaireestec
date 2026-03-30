import { motion } from "framer-motion";
import { MapPin, Calendar, Clock } from "lucide-react";
import { NEXT_EVENT_DATE } from "@/lib/constants";

export function MapSection() {
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
          <span className="text-primary font-semibold text-sm tracking-widest uppercase mb-4 block">Lokacija</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-4 text-foreground tracking-tight">
            Gdje nas <span className="text-primary">pronaći</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative rounded-3xl overflow-hidden border border-white/[0.08] bg-white/[0.04]"
        >
          {/* Map embed */}
          <div className="aspect-[21/9] md:aspect-[3/1]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2877.5!2d18.3956!3d43.8563!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4758c8c41eefffff%3A0xb0e3f3b0c77e9a1a!2sKampus%20Univerziteta%20u%20Sarajevu!5e0!3m2!1sbs!2sba!4v1700000000000!5m2!1sbs!2sba"
              width="100%"
              height="100%"
              style={{ border: 0, filter: "invert(0.9) hue-rotate(180deg) saturate(0.3) brightness(0.8)" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Lokacija JobFAIR-a"
            />
          </div>

          {/* Info overlay */}
          <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-auto">
            <div className="bg-background/90 backdrop-blur-xl border border-white/[0.1] rounded-2xl p-5 max-w-sm shadow-2xl">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground text-sm">Kampus Univerziteta u Sarajevu</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Zmaja od Bosne bb, 71000 Sarajevo</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>{NEXT_EVENT_DATE}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>10:00 – 17:00</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
