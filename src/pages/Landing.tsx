import { useState, useEffect, useRef, useMemo } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Users,
  Building2,
  Camera,
  Briefcase,
  MessageSquare,
  Lightbulb,
  Timer,
  Mic,
  Leaf,
  Sparkles,
  Radio,
  BookOpen,
  Handshake,
  Presentation,
  CircleDot,
  MessagesSquare,
} from "lucide-react";

import teamPhoto1 from "@/assets/team-photo-1.jpg";
import teamPhoto2 from "@/assets/team-photo-2.jpg";
import teamPhoto3 from "@/assets/team-photo-3.png";
import sponsorsMerch from "@/assets/sponsors-merch.jpg";
import ecoAwareness from "@/assets/eco-awareness.jpg";
import eestecWall from "@/assets/eestec-wall.png";
import eventInstagram from "@/assets/event-instagram.jpg";
import activityPresentation from "@/assets/activity-presentation.jpg";
import activityNetworking from "@/assets/activity-networking.jpg";
import activityWorkshop from "@/assets/activity-workshop.jpg";

import { LANDING_STATS, TIMELINE_YEARS, COUNTER_DURATION, COUNTER_STEP_TIME, NEXT_EVENT_DATE, NEXT_EVENT_YEAR_SHORT, HERO_SUBTITLE, COPYRIGHT_TEXT, EESTEC_WEBSITE, EESTEC_ORG_NAME } from "@/lib/constants";
import { useTeamMembers } from "@/hooks/useTeam";

const stats = LANDING_STATS.map((s, i) => ({
  icon: [Users, Briefcase, Building2, Camera][i],
  ...s,
}));

/* ── Activities ── */
const activitiesBefore = [
  {
    title: "Webinari i podcasti",
    description: "Kroz online predavanja obrađuju se razne teme od značaja za mlade koji žele da se istaknu na tržištu rada. Podcasti s istaknutim ličnostima iz struke daju uvid u tržište rada.",
    icon: Radio,
  },
  {
    title: "EESTEChat",
    description: "Društveni događaj gdje mladi iznose svoja mišljenja i stavove o zapošljavanju u BiH te diskutuju s iskusnim gostima koji dijele svoja iskustva.",
    icon: MessagesSquare,
  },
  {
    title: "Radionica poslovne komunikacije",
    description: "Radionica koja omogućava učesnicima pravilno razumijevanje komunikacije, unaprjeđenje verbalne i neverbalne komunikacije, te obradu stilova komuniciranja.",
    icon: BookOpen,
  },
];

const activitiesDuring = [
  {
    title: "Razgovor sa kompanijama",
    description: "Tokom dva dana posjetioci imaju priliku razgovarati s predstavnicima kompanija, informisati se o očekivanjima poslodavaca i poželjnim vještinama.",
    icon: Handshake,
    img: activityNetworking,
  },
  {
    title: "Prezentacije kompanija",
    description: "Predstavnici kompanija prezentiraju svoj rad potencijalnim uposlenicima, poslovnim partnerima i klijentima kroz profesionalne prezentacije.",
    icon: Presentation,
    img: activityPresentation,
  },
  {
    title: "Open Space Technology",
    description: "Inovativna interaktivna radionica gdje učesnici zajedno s kompanijama rade na pronalasku inovativnih rješenja za realne poslovne probleme.",
    icon: Lightbulb,
    img: activityWorkshop,
  },
  {
    title: "Career Speed Dating",
    description: "Jedinstveni spoj razgovora za posao i speed date-a — 5 minuta da se predstavite potencijalnom poslodavcu i istaknete iz mase kandidata.",
    icon: Timer,
  },
  {
    title: "Panel diskusija",
    description: "Paneli s istaknutim stručnjacima iz industrije na teme od značaja za mlade profesionalce i studente tehničkih nauka.",
    icon: CircleDot,
  },
];

const timelineYears = [...TIMELINE_YEARS];

/* ── Glassmorphism card ── */
const GlassCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] rounded-3xl ${className}`}>{children}</div>
);

/* ── Animated counter ── */
const AnimatedCounter = ({ value, label }: { value: string; label: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const numericValue = parseInt(value.replace(/[^0-9]/g, ""));
  const suffix = value.replace(/[0-9]/g, "");
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const steps = COUNTER_DURATION / COUNTER_STEP_TIME;
    const increment = numericValue / steps;
    const timer = setInterval(() => {
      start += increment;
      if (start >= numericValue) { setCount(numericValue); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, COUNTER_STEP_TIME);
    return () => clearInterval(timer);
  }, [isInView, numericValue]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-primary mb-1">
        {isInView ? `${count}${suffix}` : "0"}
      </div>
      <p className="text-sm sm:text-base text-muted-foreground font-medium">{label}</p>
    </div>
  );
};

/* ── Animated beam component ── */
const Beam = ({ delay, duration, angle, top, width }: { delay: number; duration: number; angle: number; top: string; width: string }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{
      top,
      left: "-20%",
      width,
      height: "1px",
      background: `linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.15) 20%, hsl(var(--primary) / 0.5) 50%, hsl(var(--primary) / 0.15) 80%, transparent 100%)`,
      rotate: `${angle}deg`,
      filter: "blur(0.5px)",
    }}
    animate={{ left: ["-20%", "120%"] }}
    transition={{ duration, repeat: Infinity, delay, ease: "linear" }}
  />
);

const Landing = () => {
  const [navVisible, setNavVisible] = useState(false);
  const { data: teamMembers = [] } = useTeamMembers(true);
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    const handleScroll = () => setNavVisible(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ── Navbar ── */}
      <motion.nav
        className="fixed top-0 w-full z-50 bg-background/60 backdrop-blur-2xl border-b border-white/[0.06]"
        initial={{ y: -100 }}
        animate={{ y: navVisible ? 0 : -100 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between h-[64px] px-6 lg:px-8">
          <Link to="/"><Logo size="md" /></Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="text-sm font-medium rounded-full" asChild><Link to="/novosti">Novosti</Link></Button>
            <Button variant="ghost" className="text-sm font-medium rounded-full" asChild><Link to="/oglasi">Oglasi</Link></Button>
            <Button variant="ghost" className="text-sm font-medium rounded-full" asChild><Link to="/partneri">Partneri</Link></Button>
            <Button variant="ghost" className="text-sm font-medium rounded-full" asChild><Link to="/kontakt">Za kompanije</Link></Button>
            <Button className="hidden sm:inline-flex text-sm font-semibold rounded-full" asChild>
              <Link to="/ostavi-cv">Ostavi CV</Link>
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero with animated beams ── */}
      <section ref={heroRef} className="relative min-h-[110vh] flex items-center overflow-hidden">
        {/* Dark base with subtle grid */}
        <div className="absolute inset-0 bg-[#070709]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:80px_80px]" />
        </div>

        {/* Gradient glow spots with hover-reactive feel */}
        <motion.div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/[0.08] rounded-full blur-[150px]"
          animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.12, 0.08] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-1/3 w-[400px] h-[300px] bg-primary/[0.05] rounded-full blur-[120px]"
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-primary/[0.04] rounded-full blur-[130px]"
          animate={{ scale: [1, 1.3, 1], y: [0, -20, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        {/* Animated beams */}
        <Beam delay={0} duration={5} angle={-12} top="15%" width="500px" />
        <Beam delay={1.5} duration={6} angle={-8} top="30%" width="600px" />
        <Beam delay={3} duration={4.5} angle={-15} top="50%" width="450px" />
        <Beam delay={4.5} duration={7} angle={-5} top="65%" width="550px" />
        <Beam delay={2} duration={5.5} angle={-18} top="80%" width="400px" />
        <Beam delay={6} duration={4} angle={-10} top="40%" width="350px" />

        {/* Vertical beams */}
        <motion.div
          className="absolute pointer-events-none w-[1px] h-[300px]"
          style={{
            left: "20%",
            top: "-300px",
            background: "linear-gradient(180deg, transparent, hsl(var(--primary) / 0.2), transparent)",
          }}
          animate={{ top: ["-300px", "120%"] }}
          transition={{ duration: 8, repeat: Infinity, delay: 1, ease: "linear" }}
        />
        <motion.div
          className="absolute pointer-events-none w-[1px] h-[200px]"
          style={{
            left: "75%",
            top: "-200px",
            background: "linear-gradient(180deg, transparent, hsl(var(--primary) / 0.15), transparent)",
          }}
          animate={{ top: ["-200px", "120%"] }}
          transition={{ duration: 10, repeat: Infinity, delay: 4, ease: "linear" }}
        />

        {/* Bottom gradient fade — extended */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background to-transparent" />

        <motion.div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-28 w-full" style={{ opacity: heroOpacity }}>
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div className="mb-8" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
              <Logo size="lg" className="[&_span]:text-white [&_.text-foreground]:text-white justify-center" />
            </motion.div>

            {/* Glass pill */}
            <motion.div
              className="inline-flex items-center gap-2 bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] rounded-full px-5 py-2.5 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <CalendarDays className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-white/90">{NEXT_EVENT_DATE}</span>
            </motion.div>

            <motion.h1
              className="text-5xl sm:text-6xl lg:text-8xl font-display font-bold text-white tracking-tight leading-[1.05] mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Iskoristi svoju{" "}
              <span className="text-primary relative inline-block">
                šansu!
                <motion.div
                  className="absolute -bottom-1 left-0 right-0 h-1 bg-primary/60 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 1.2 }}
                />
              </span>
            </motion.h1>

            <motion.p
              className="text-lg sm:text-xl text-white/60 max-w-xl mx-auto mb-10 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {HERO_SUBTITLE}
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Button size="lg" className="text-base font-semibold px-10 h-14 rounded-full" asChild>
                <Link to="/ostavi-cv">Ostavi svoj CV <ArrowRight className="ml-2 w-5 h-5" /></Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base font-semibold px-10 h-14 rounded-full border-white/[0.12] text-white hover:bg-white/[0.08] bg-white/[0.04] backdrop-blur-xl"
                asChild
              >
                <Link to="/kontakt">Za kompanije</Link>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5">
            <motion.div className="w-1.5 h-1.5 rounded-full bg-white/40" animate={{ y: [0, 16, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
          </div>
        </motion.div>
      </section>

      {/* ── Stats ── */}
      <section className="py-20 lg:py-28 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}>
                <GlassCard className="p-6 lg:p-8 text-center hover:bg-white/[0.1] transition-colors duration-500">
                  <AnimatedCounter value={stat.value} label={stat.label} />
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bento Grid ── */}
      <section className="py-4 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-4 md:grid-cols-6 grid-rows-2 gap-3 auto-rows-[200px] md:auto-rows-[260px]">
          <motion.div className="col-span-2 row-span-2 rounded-3xl overflow-hidden" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <img src={teamPhoto1} alt="JobFAIR tim" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" />
          </motion.div>
          <motion.div className="col-span-2 row-span-1 rounded-3xl overflow-hidden" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}>
            <img src={activityPresentation} alt="Prezentacija" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" />
          </motion.div>
          <motion.div className="col-span-2 row-span-2 rounded-3xl overflow-hidden" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}>
            <img src={sponsorsMerch} alt="Sponzori i merch" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" />
          </motion.div>
          <motion.div className="col-span-1 rounded-3xl overflow-hidden" initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }}>
            <img src={eventInstagram} alt="Event atmosfera" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" />
          </motion.div>
          <motion.div className="col-span-1 rounded-3xl overflow-hidden" initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4 }}>
            <img src={activityNetworking} alt="Networking" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" />
          </motion.div>
        </div>
      </section>

      {/* ── O projektu ── */}
      <section id="o-projektu" className="py-24 lg:py-36">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <span className="text-primary font-semibold text-sm tracking-widest uppercase mb-4 block">O projektu</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-8 text-foreground tracking-tight leading-tight">
                Spajamo mlade sa <span className="text-primary">njihovom budućnošću</span>
              </h2>
              <div className="space-y-5 text-muted-foreground text-base sm:text-lg leading-relaxed">
                <p>JobFAIR je najznačajniji projekat Udruženja studenata elektrotehnike Evrope, EESTEC LC Sarajevo. Ove godine održava se po sedamnaesti put, dokazujući da u Bosni i Hercegovini postoje mladi koji ne čekaju prilike, nego ih stvaraju sami!</p>
                <p>Osnovni cilj JobFAIR-a je direktan kontakt između studenata i poslodavaca. Tokom dva dana trajanja Sajma, posjetioci su u mogućnosti razgovarati s predstavnicima kompanija, informisati se o tome šta poslodavci očekuju od njih te koje su vještine poželjne za njihovu struku.</p>
                <p>Ovaj projekat direktno stimuliše zapošljavanje mladih u uspješnim domaćim kompanijama. Kroz različita predavanja i savjete profesionalaca pruža se podrška mladima koji imaju ambicije da započnu sopstveni biznis.</p>
              </div>
            </motion.div>

            <motion.div className="relative" initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }}>
              <div className="relative">
                <div className="rounded-3xl overflow-hidden">
                  <img src={teamPhoto2} alt="EESTEC LC Sarajevo štand" className="w-full aspect-[3/4] object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
                </div>
                <motion.div
                  className="absolute -bottom-6 -left-6 w-44 h-44 rounded-2xl overflow-hidden border-2 border-white/[0.1] shadow-2xl"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <img src={teamPhoto3} alt="JobFAIR arhiva" className="w-full h-full object-cover" loading="lazy" />
                </motion.div>
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary/10 backdrop-blur-sm rounded-2xl -z-10 border border-primary/10" />
              </div>
            </motion.div>
          </div>

          {/* Timeline */}
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }} className="mt-24">
            <p className="text-center text-sm text-muted-foreground font-medium mb-10 tracking-wider uppercase">Naša historija</p>
            <div className="relative max-w-5xl mx-auto">
              <div className="absolute top-4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent" />
              <div className="flex items-start justify-between">
                {timelineYears.map((year, i) => {
                  const isLast = i === timelineYears.length - 1;
                  const isRecent = i >= timelineYears.length - 5;
                  return (
                    <motion.div key={year} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.04 }} className="flex flex-col items-center group cursor-default">
                      <div className={`relative w-[9px] h-[9px] rounded-full transition-all duration-300 ${isLast ? "bg-primary scale-150 shadow-[0_0_20px_hsl(var(--primary)/0.5)]" : isRecent ? "bg-primary/60 group-hover:bg-primary group-hover:scale-150" : "bg-white/20 group-hover:bg-white/50 group-hover:scale-125"}`}>
                        {isLast && <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-30" />}
                      </div>
                      <span className={`mt-4 text-xs font-medium transition-all duration-300 ${isLast ? "text-primary font-bold text-sm" : isRecent ? "text-muted-foreground group-hover:text-primary" : "text-muted-foreground/50 group-hover:text-muted-foreground"}`}>{year}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Organizer ── */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
            <span className="text-primary font-semibold text-sm tracking-widest uppercase mb-4 block">Ko stoji iza svega</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-4 text-foreground tracking-tight">Organizator</h2>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left column: full-height image + caption */}
            <motion.div className="lg:row-span-2 flex flex-col gap-6" initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <div className="rounded-3xl overflow-hidden flex-1">
                <img src={eestecWall} alt="EESTEC LC Sarajevo projekti" className="w-full h-full min-h-[400px] object-cover" loading="lazy" />
              </div>
              <GlassCard className="p-6">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <span className="text-primary font-semibold">EESTEC LC Sarajevo</span> — lokalni komitet jednog od najvećih studentskih udruženja u Evropi, posvećen razvoju mladih profesionalaca od 2009. godine.
                </p>
              </GlassCard>
            </motion.div>

            {/* Right 2x2 grid of cards */}
            {[
              { icon: Users, title: "Misija Udruženja", text: "EESTEC je udruženje studenata elektrotehnike Evrope s 46 lokalnih komiteta. Osnovni cilj je promocija i razvoj međunarodnih kontakata između studenata i profesionalaca." },
              { icon: Building2, title: "Višegodišnja tradicija", text: "Tokom 15 godina aktivnog rada, EESTEC LC Sarajevo se može pohvaliti velikim brojem organizovanih projekata na lokalnom i internacionalnom nivou." },
              { icon: MessageSquare, title: "Razmjena iskustava", text: "Studenti imaju priliku posjetiti bilo koji grad u kojem EESTEC ima komitet, upoznati kulturu i običaje, te stvoriti prijateljstva za čitav život." },
              { icon: Leaf, title: "Ekološka svijest", text: "JobFAIR aktivno promovira ekološku odgovornost kroz reciklažu i edukaciju o održivosti, pokazujući da nam je stalo do budućnosti planete." },
            ].map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}>
                <GlassCard className="p-7 h-full hover:bg-white/[0.1] transition-all duration-500 group">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-500">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-3 text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Photo strip ── */}
      <section className="py-4 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { src: ecoAwareness, alt: "Ekološka svijest" },
            { src: eventInstagram, alt: "Event atmosfera" },
            { src: teamPhoto1, alt: "JobFAIR tim" },
          ].map((photo, i) => (
            <motion.div key={photo.alt + i} className="rounded-2xl overflow-hidden aspect-[4/3]" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}>
              <img src={photo.src} alt={photo.alt} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Activities ── */}
      <section className="py-24 lg:py-32">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
            <span className="text-primary font-semibold text-sm tracking-widest uppercase mb-4 block">Šta te čeka</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-4 text-foreground tracking-tight">Aktivnosti</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Kroz raznolike aktivnosti prije i tokom Sajma, studenti imaju priliku razviti karijeru i uspostaviti kontakte.</p>
          </motion.div>

          {/* Before fair */}
          <div className="mb-16">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 max-w-12 bg-primary/40" />
              <span className="text-sm font-semibold text-primary tracking-wider uppercase">Prije Sajma</span>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </motion.div>
            <div className="grid md:grid-cols-3 gap-6">
              {activitiesBefore.map((a, i) => (
                <motion.div key={a.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} className="group">
                  <GlassCard className="p-7 h-full hover:bg-white/[0.1] transition-all duration-500 hover:border-primary/20">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary transition-colors duration-300">
                      <a.icon className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                    </div>
                    <h3 className="font-display font-bold text-lg text-foreground mb-3">{a.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{a.description}</p>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>

          {/* During fair */}
          <div>
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 max-w-12 bg-primary/40" />
              <span className="text-sm font-semibold text-primary tracking-wider uppercase">Tokom Sajma</span>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </motion.div>
            <div className="grid md:grid-cols-3 gap-6">
              {activitiesDuring.map((a, i) => (
                <motion.div key={a.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} className="group">
                  <GlassCard className="overflow-hidden hover:bg-white/[0.1] transition-all duration-500 hover:border-primary/20">
                    {"img" in a && a.img && (
                      <div className="aspect-[4/3] overflow-hidden">
                        <img src={a.img} alt={a.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                      </div>
                    )}
                    <div className="p-7">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                          <a.icon className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                        </div>
                        <h3 className="font-display font-bold text-lg text-foreground">{a.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{a.description}</p>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Meet the Team ── */}
      {teamMembers.length > 0 && (
        <section className="py-24 lg:py-32">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
              <span className="text-primary font-semibold text-sm tracking-widest uppercase mb-4 block">Upoznaj nas</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-4 text-foreground tracking-tight">
                Organizacioni <span className="text-primary">odbor</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Ljudi koji stoje iza najznačajnijeg sajma zapošljavanja u BiH.</p>
            </motion.div>

            {/* Leader card (first member) */}
            {teamMembers.length > 0 && (() => {
              const leader = teamMembers[0];
              const rest = teamMembers.slice(1);
              return (
                <div className="space-y-10">
                  {/* Leader */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="flex justify-center"
                  >
                    <div className="group cursor-default w-56" style={{ perspective: "800px" }}>
                      <div className="relative transition-transform duration-500 group-hover:[transform:rotateY(6deg)_rotateX(-3deg)_scale(1.05)]">
                        <div className="rounded-2xl overflow-hidden bg-white/[0.04] border border-white/[0.06] group-hover:border-primary/20 group-hover:shadow-xl group-hover:shadow-primary/5 transition-all duration-500">
                          <div className="aspect-[3/4] overflow-hidden bg-muted/20">
                            {leader.photo_url ? (
                              <img src={leader.photo_url} alt={leader.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-muted-foreground/20 group-hover:text-primary/30 transition-colors duration-500">
                                {leader.name.split(" ").map(n => n[0]).join("")}
                              </div>
                            )}
                          </div>
                          <div className="p-4 text-center">
                            <p className="font-display font-bold text-sm text-foreground">{leader.name}</p>
                            <p className="text-xs text-primary mt-0.5 font-medium">{leader.role}</p>
                          </div>
                        </div>
                        <div className="absolute -inset-1 rounded-2xl bg-primary/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
                      </div>
                    </div>
                  </motion.div>

                  {/* Rest of team */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                    {rest.map((member, i) => (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: i * 0.08 }}
                        className="group cursor-default"
                        style={{ perspective: "800px" }}
                      >
                        <div className="relative transition-transform duration-500 group-hover:[transform:rotateY(6deg)_rotateX(-3deg)_scale(1.05)]">
                          <div className="rounded-2xl overflow-hidden bg-white/[0.04] border border-white/[0.06] group-hover:border-primary/20 group-hover:shadow-xl group-hover:shadow-primary/5 transition-all duration-500">
                            <div className="aspect-[3/4] overflow-hidden bg-muted/20">
                              {member.photo_url ? (
                                <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" loading="lazy" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-muted-foreground/20 group-hover:text-primary/30 transition-colors duration-500">
                                  {member.name.split(" ").map(n => n[0]).join("")}
                                </div>
                              )}
                            </div>
                            <div className="p-4 text-center">
                              <p className="font-display font-bold text-sm text-foreground">{member.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{member.role}</p>
                            </div>
                          </div>
                          <div className="absolute -inset-1 rounded-2xl bg-primary/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="py-20 lg:py-28">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <GlassCard className="relative overflow-hidden px-8 py-20 lg:px-16 lg:py-28 text-center">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -z-0" />
              <div className="relative z-10">
                <motion.div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-6" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Novo izdanje</span>
                </motion.div>
                <motion.h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-5 text-foreground tracking-tight" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}>
                  Spreman za JobFAIR <span className="text-primary">{NEXT_EVENT_YEAR_SHORT}</span>?
                </motion.h2>
                <motion.p className="text-muted-foreground text-lg mb-10 max-w-lg mx-auto text-balance" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }}>
                  Pridruži se hiljadama studenata i diplomaca koji grade svoju karijeru kroz JobFAIR. Ne čekaj prilike — stvori ih sam!
                </motion.p>
                <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4 }}>
                  <Button size="lg" className="text-base font-semibold px-10 h-14 rounded-full" asChild>
                    <Link to="/ostavi-cv">Ostavi CV <ArrowRight className="ml-2 w-5 h-5" /></Link>
                  </Button>
                  <Button size="lg" variant="outline" className="text-base font-semibold px-10 h-14 rounded-full border-white/[0.12] hover:bg-white/[0.08]" asChild>
                    <Link to="/kontakt">Za kompanije</Link>
                  </Button>
                </motion.div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 px-6 lg:px-8 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo size="md" />
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href={EESTEC_WEBSITE} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">{EESTEC_ORG_NAME}</a>
            <span>{COPYRIGHT_TEXT}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
