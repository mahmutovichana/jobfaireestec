import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Linkedin, Mail, Phone, Users, History } from "lucide-react";
import type { TeamMember } from "@/hooks/useTeam";

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

function HistoricAvatar({ member, index }: { member: TeamMember; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.015, 0.4) }}
      className="group relative"
    >
      <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden ring-2 ring-white/[0.08] hover:ring-primary/60 transition-all duration-300 hover:scale-110 cursor-default bg-muted/30">
        {member.photo_url ? (
          <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground/50">
            {initialsOf(member.name)}
          </div>
        )}
      </div>
      {/* Tooltip */}
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 whitespace-nowrap">
        <div className="bg-foreground text-background text-xs font-medium rounded-lg px-2.5 py-1.5 shadow-xl">
          <p className="font-semibold">{member.name}</p>
          <p className="opacity-70 text-[10px]">{member.role}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function TeamSection({ teamMembers }: TeamSectionProps) {
  const years = useMemo(() => {
    const set = new Set<number>(teamMembers.map((m) => m.year ?? new Date().getFullYear()));
    return Array.from(set).sort((a, b) => b - a);
  }, [teamMembers]);

  const currentYear = years[0];
  const [selectedYear, setSelectedYear] = useState<number | null>(currentYear ?? null);

  if (teamMembers.length === 0 || !currentYear) return null;

  const yearMembers = teamMembers
    .filter((m) => (m.year ?? currentYear) === selectedYear)
    .sort((a, b) => a.display_order - b.display_order);

  const otherYears = years.filter((y) => y !== selectedYear);
  // Historical members grouped by year (excluding selected year)
  const historic = otherYears.map((y) => ({
    year: y,
    members: teamMembers
      .filter((m) => (m.year ?? currentYear) === y)
      .sort((a, b) => a.display_order - b.display_order),
  }));

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
            Ljudi koji stoje iza najznačajnijeg sajma zapošljavanja u BiH.
          </p>
        </motion.div>

        {/* Year tabs */}
        {years.length > 1 && (
          <div className="flex items-center justify-center gap-2 flex-wrap mb-12">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`text-xs sm:text-sm font-semibold px-4 py-2 rounded-full border transition-all ${
                  selectedYear === y
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                    : "bg-white/[0.04] text-muted-foreground border-white/[0.08] hover:bg-white/[0.08] hover:text-foreground"
                }`}
              >
                {y === currentYear && <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1.5 align-middle" />}
                Generacija {y}
              </button>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedYear}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
          >
            {leader && <MemberCard member={leader} index={0} isLeader />}
            {rest.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 max-w-4xl mx-auto">
                {rest.map((m, i) => (
                  <MemberCard key={m.id} member={m} index={i + 1} />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Historical board avatars */}
        {historic.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-20 pt-12 border-t border-white/[0.06]"
          >
            <div className="text-center mb-10">
              <span className="text-muted-foreground font-semibold text-xs tracking-widest uppercase inline-flex items-center gap-2">
                <History className="w-3.5 h-3.5" /> Historijat odbora
              </span>
              <p className="text-sm text-muted-foreground mt-3 max-w-md mx-auto">
                Hvala svima koji su tokom godina gradili JobFAIR. Klikni godinu iznad da pogledaš njihov mandat.
              </p>
            </div>
            <div className="space-y-6 max-w-4xl mx-auto">
              {historic.map((h) => (
                <div key={h.year}>
                  <button
                    onClick={() => setSelectedYear(h.year)}
                    className="flex items-center gap-3 text-left mb-4 group"
                  >
                    <span className="text-2xl font-display font-bold text-foreground/80 group-hover:text-primary transition-colors">
                      {h.year}
                    </span>
                    <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
                      {h.members.length} {h.members.length === 1 ? "član" : "članova"}
                    </span>
                  </button>
                  <div className="flex flex-wrap items-center gap-3">
                    {h.members.map((m, i) => (
                      <HistoricAvatar key={m.id} member={m} index={i} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
