import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Linkedin, Mail, Phone, Users, ArrowRight } from "lucide-react";
import { getPhotoStyle, type TeamMember } from "@/hooks/useTeam";

interface TeamSectionProps {
  teamMembers: TeamMember[];
}

function initialsOf(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();
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
      <div className={`relative rounded-2xl overflow-hidden bg-white/[0.04] border border-white/[0.06] hover:border-primary/20 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 ${isLeader ? "w-64" : "w-full"}`}>
        {/* Photo */}
        <div className="aspect-[3/4] overflow-hidden bg-muted/20 relative">
          {member.photo_url ? (
            <img
              src={member.photo_url}
              alt={member.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              style={getPhotoStyle(member.photo_crop)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-muted-foreground/20">
              {initialsOf(member.name)}
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
  const { currentYear, yearMembers, hasHistory } = useMemo(() => {
    const nowYear = new Date().getFullYear();
    const years = Array.from(new Set(teamMembers.map((m) => m.year ?? nowYear))).sort((a, b) => b - a);
    // Always prefer the current calendar year if it has members, otherwise fall back to latest.
    const cur = years.includes(nowYear) ? nowYear : (years[0] ?? nowYear);
    const members = teamMembers
      .filter((m) => (m.year ?? nowYear) === cur)
      .sort((a, b) => a.display_order - b.display_order);
    return { currentYear: cur, yearMembers: members, hasHistory: years.length > 1 };
  }, [teamMembers]);

  if (yearMembers.length === 0) return null;

  const leader = yearMembers[0];
  const rest = yearMembers.slice(1);

  return (
    <section id="organizacioni-odbor" className="py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <span className="text-primary font-semibold text-sm tracking-widest uppercase mb-4 block inline-flex items-center gap-2">
            <Users className="w-4 h-4" /> Upoznaj nas
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-4 text-foreground tracking-tight">
            Organizacioni <span className="text-primary">odbor</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Ljudi koji stoje iza JobFAIR-a {currentYear}.
          </p>
        </motion.div>

        <div className="space-y-8">
          {leader && <MemberCard member={leader} index={0} isLeader />}
          {rest.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 max-w-4xl mx-auto">
              {rest.map((m, i) => (
                <MemberCard key={m.id} member={m} index={i + 1} />
              ))}
            </div>
          )}
        </div>

        {hasHistory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-14 flex justify-center"
          >
            <Link
              to="/historijat-odbora"
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border/60 bg-background/40 backdrop-blur text-sm font-medium text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              Pogledaj prijašnje generacije
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
