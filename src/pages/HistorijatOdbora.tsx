import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, History, Linkedin, Mail } from "lucide-react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { SEO } from "@/components/SEO";
import { useTeamMembers, getPhotoStyle, type TeamMember } from "@/hooks/useTeam";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function initialsOf(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function MemberTile({ member, idx }: { member: TeamMember; idx: number }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(idx * 0.025, 0.4) }}
      className="group relative"
    >
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted/30 ring-1 ring-border/40 hover:ring-primary/60 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10">
        {member.photo_url ? (
          <img
            src={member.photo_url}
            alt={member.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            style={getPhotoStyle(member.photo_crop)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl font-display font-bold text-muted-foreground/40">
            {initialsOf(member.name)}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
          <p className="text-[11px] sm:text-xs font-semibold text-white leading-tight truncate">{member.name}</p>
          <p className="text-[10px] text-white/70 truncate">{member.role}</p>
        </div>
        {(member.linkedin_url || member.email) && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {member.linkedin_url && (
              <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-background/90 backdrop-blur flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Linkedin className="w-3.5 h-3.5" />
              </a>
            )}
            {member.email && (
              <a href={`mailto:${member.email}`} className="w-7 h-7 rounded-full bg-background/90 backdrop-blur flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Mail className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}
      </div>
    </motion.div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px]">
          <p className="font-semibold text-sm">{member.name}</p>
          <p className="text-xs text-muted-foreground">{member.role}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function HistorijatOdbora() {
  const { data: members = [], isLoading } = useTeamMembers(true);

  const grouped = useMemo(() => {
    const nowYear = new Date().getFullYear();
    const map = new Map<number, TeamMember[]>();
    for (const m of members) {
      const y = m.year ?? nowYear;
      if (!map.has(y)) map.set(y, []);
      map.get(y)!.push(m);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([year, list]) => ({ year, members: list.sort((a, b) => a.display_order - b.display_order) }));
  }, [members]);

  const years = grouped.map((g) => g.year);
  const [activeYear, setActiveYear] = useState<number | null>(null);

  const activeIdx = activeYear ? grouped.findIndex((g) => g.year === activeYear) : 0;
  const active = grouped[activeIdx];

  return (
    <>
      <SEO
        title="Historijat odbora — JobFAIR"
        description="Pregled svih generacija organizacionog odbora JobFAIR-a kroz godine."
        path="/historijat-odbora"
      />
      <PublicNavbar />

      <main className="min-h-screen pt-20 pb-24 bg-background">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 lg:px-8 pt-12 pb-10">
          <Link
            to="/#organizacioni-odbor"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Nazad na početnu
          </Link>
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-primary" />
            <span className="text-xs uppercase tracking-widest font-semibold text-primary">Naša priča</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight">
            Historijat <span className="text-primary">odbora</span>
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground text-lg">
            Svaka generacija ostavila je svoj trag. Pregledaj ljude koji su gradili JobFAIR kroz godine.
          </p>
        </section>

        {isLoading ? (
          <div className="max-w-6xl mx-auto px-6 lg:px-8 text-muted-foreground">Učitavanje…</div>
        ) : grouped.length === 0 ? (
          <div className="max-w-6xl mx-auto px-6 lg:px-8 text-muted-foreground">Nema podataka.</div>
        ) : (
          <section className="max-w-6xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-10">
            {/* Vertical timeline rail */}
            <aside className="relative md:sticky md:top-28 md:self-start">
              <div className="absolute left-3 top-2 bottom-2 w-px bg-border hidden md:block" />
              <ul className="flex md:flex-col gap-2 md:gap-1 overflow-x-auto md:overflow-visible no-scrollbar">
                {grouped.map((g) => {
                  const isActive = (activeYear ?? years[0]) === g.year;
                  return (
                    <li key={g.year} className="relative">
                      <button
                        onClick={() => setActiveYear(g.year)}
                        className={`relative flex items-center gap-3 w-full text-left pl-1 md:pl-7 pr-3 py-2 rounded-lg transition-all ${
                          isActive
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span
                          className={`hidden md:block absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 transition-all ${
                            isActive
                              ? "bg-primary border-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]"
                              : "bg-background border-border"
                          }`}
                        />
                        <span className={`font-display font-bold text-lg tabular-nums ${isActive ? "text-primary" : ""}`}>
                          {g.year}
                        </span>
                        <span className="text-[10px] text-muted-foreground bg-muted/40 rounded-full px-2 py-0.5">
                          {g.members.length}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>

            {/* Year content */}
            <div className="min-h-[400px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active?.year}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="flex items-baseline gap-3 mb-6">
                    <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">
                      Generacija {active?.year}
                    </h2>
                    <span className="text-sm text-muted-foreground">
                      {active?.members.length} {active?.members.length === 1 ? "član" : "članova"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
                    {active?.members.map((m, i) => (
                      <MemberTile key={m.id} member={m} idx={i} />
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </section>
        )}
      </main>

      <PublicFooter />
    </>
  );
}