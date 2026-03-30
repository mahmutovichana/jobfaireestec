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

// Grid layout definitions - each image gets a fixed cell
const gridItems = [
  { colSpan: "md:col-span-2", rowSpan: "md:row-span-2", aspect: "aspect-square" },
  { colSpan: "md:col-span-1", rowSpan: "", aspect: "aspect-[4/3]" },
  { colSpan: "md:col-span-1", rowSpan: "", aspect: "aspect-[4/3]" },
  { colSpan: "md:col-span-2", rowSpan: "", aspect: "aspect-[16/9]" },
  { colSpan: "md:col-span-1", rowSpan: "", aspect: "aspect-[3/4]" },
  { colSpan: "md:col-span-1", rowSpan: "md:row-span-2", aspect: "aspect-[3/4] md:aspect-auto md:h-full" },
  { colSpan: "md:col-span-1", rowSpan: "", aspect: "aspect-[4/3]" },
  { colSpan: "md:col-span-1", rowSpan: "", aspect: "aspect-[4/3]" },
];

export function GallerySection() {
  const { data: dbImages = [] } = useGalleryImages(true);

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

        {/* Clean grid - no overlapping */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {images.slice(0, 8).map((img, i) => {
            const layout = gridItems[i] || gridItems[0];
            return (
              <motion.div
                key={i}
                className={`${layout.colSpan} ${layout.rowSpan} overflow-hidden rounded-2xl relative group`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
              >
                <div className={`${layout.aspect} w-full overflow-hidden`}>
                  <img
                    src={img.url}
                    alt={img.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                {/* Title overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4">
                  <span className="text-white text-sm font-medium">{img.title}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
