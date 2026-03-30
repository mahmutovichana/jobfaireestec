import { motion } from "framer-motion";
import { Linkedin, Mail, Phone } from "lucide-react";
import type { TeamMember } from "@/hooks/useTeam";

interface TeamSectionProps {
  teamMembers: TeamMember[];
}

function MemberCard({ member, index, isLeader = false }: { member: TeamMember; index: number; isLeader?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className={`group ${isLeader ? "col-span-full flex justify-center" : ""}`}
    >
      <div className={`relative rounded-2xl overflow-hidden bg-white/[0.04] border border-white/[0.06] hover:border-primary/20 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 ${isLeader ? "w-60" : "w-full"}`}>
        {/* Photo */}
        <div className="aspect-[3/4] overflow-hidden bg-muted/20 relative">
          {member.photo_url ? (
            <img
              src={member.photo_url}
              alt={member.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-muted-foreground/20">
              {member.name.split(" ").map(n => n[0]).join("")}
            </div>
          )}
          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
        </div>

        {/* Info */}
        <div className="p-4 text-center">
          <p className="font-display font-bold text-sm text-foreground">{member.name}</p>
          <p className="text-xs text-primary mt-0.5 font-medium">{member.role}</p>

          {/* Social/Contact row */}
          <div className="flex items-center justify-center gap-2 mt-3">
            {member.linkedin_url && (
              <a
                href={member.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-primary/20 flex items-center justify-center transition-colors duration-300"
              >
                <Linkedin className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
              </a>
            )}
            {member.email && (
              <a
                href={`mailto:${member.email}`}
                className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-primary/20 flex items-center justify-center transition-colors duration-300"
              >
                <Mail className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
              </a>
            )}
            {member.phone && (
              <a
                href={`tel:${member.phone}`}
                className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-primary/20 flex items-center justify-center transition-colors duration-300"
              >
                <Phone className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function TeamSection({ teamMembers }: TeamSectionProps) {
  if (teamMembers.length === 0) return null;

  const leader = teamMembers[0];
  const rest = teamMembers.slice(1);

  return (
    <section className="py-16 lg:py-20">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="text-primary font-semibold text-sm tracking-widest uppercase mb-4 block">Upoznaj nas</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-4 text-foreground tracking-tight">
            Organizacioni <span className="text-primary">odbor</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Ljudi koji stoje iza najznačajnijeg sajma zapošljavanja u BiH.</p>
        </motion.div>

        <div className="space-y-8">
          {/* Leader */}
          <MemberCard member={leader} index={0} isLeader />

          {/* Rest */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {rest.map((member, i) => (
              <MemberCard key={member.id} member={member} index={i + 1} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
