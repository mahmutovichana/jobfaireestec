import { motion } from "framer-motion";
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

        {/* Uniform grid — all images same aspect ratio, no overlap */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.slice(0, 8).map((img, i) => (
            <motion.div
              key={i}
              className="overflow-hidden rounded-2xl relative group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                <img
                  src={img.url}
                  alt={img.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4">
                <span className="text-white text-sm font-medium">{img.title}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
