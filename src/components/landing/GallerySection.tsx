import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useGalleryImages } from "@/hooks/useGallery";

import teamPhoto1 from "@/assets/team-photo-1.jpg";
import teamPhoto2 from "@/assets/team-photo-2.jpg";
import sponsorsMerch from "@/assets/sponsors-merch.jpg";
import ecoAwareness from "@/assets/eco-awareness.jpg";
import eventInstagram from "@/assets/event-instagram.jpg";
import activityPresentation from "@/assets/activity-presentation.jpg";
import activityNetworking from "@/assets/activity-networking.jpg";
import activityWorkshop from "@/assets/activity-workshop.jpg";

const fallbackImages = [
  { url: teamPhoto1, title: "JobFAIR tim" },
  { url: activityPresentation, title: "Prezentacije" },
  { url: sponsorsMerch, title: "Sponzori" },
  { url: eventInstagram, title: "Atmosfera" },
  { url: activityNetworking, title: "Networking" },
  { url: ecoAwareness, title: "Ekologija" },
  { url: teamPhoto2, title: "Organizacija" },
  { url: activityWorkshop, title: "Radionice" },
];

function ParallaxImage({ src, alt, index }: { src: string; alt: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Alternate parallax direction and speed
  const yOffset = index % 2 === 0 ? 40 : -40;
  const y = useTransform(scrollYProgress, [0, 1], [-yOffset, yOffset]);

  return (
    <motion.div
      ref={ref}
      className="relative overflow-hidden rounded-2xl"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.08 }}
    >
      <motion.div style={{ y }} className="w-full h-full">
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          loading="lazy"
        />
      </motion.div>
      {/* Subtle overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  );
}

export function GallerySection() {
  const { data: dbImages = [] } = useGalleryImages(true);

  // Use DB images if available, otherwise fallback
  const images = dbImages.length > 0
    ? dbImages.map(img => ({ url: img.image_url, title: img.title }))
    : fallbackImages;

  return (
    <section className="py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-semibold text-sm tracking-widest uppercase mb-4 block">Galerija</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-4 text-foreground tracking-tight">
            Momenti sa <span className="text-primary">JobFAIR-a</span>
          </h2>
        </motion.div>

        {/* Masonry-like grid with varied sizes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-[180px] md:auto-rows-[220px]">
          {images.slice(0, 8).map((img, i) => {
            // Create visual variety with spanning
            const spanClass =
              i === 0 ? "col-span-2 row-span-2" :
              i === 3 ? "col-span-2" :
              i === 5 ? "row-span-2" :
              "";

            return (
              <div key={i} className={spanClass}>
                <ParallaxImage src={img.url} alt={img.title} index={i} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
