import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";

import heroBg from "@/assets/hero-abstract-bg.jpg";
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

const stats = [
  { icon: Users, value: "5000+", label: "Posjetitelja godišnje" },
  { icon: Briefcase, value: "3000+", label: "Unosa u CV bazu" },
  { icon: Building2, value: "100+", label: "Kompanija učesnica" },
  { icon: Camera, value: "50+", label: "Medijskih partnera" },
];

const activities = [
  {
    title: "Prezentacije kompanija",
    description:
      "Predstavnici kompanija imaju mogućnost predstaviti svoj rad potencijalnim uposlenicima kroz profesionalne prezentacije.",
    icon: Mic,
    img: activityPresentation,
  },
  {
    title: "Career Speed Dating",
    description:
      "Jedinstveni spoj razgovora za posao i speed date-a — 5 minuta da se predstavite potencijalnom poslodavcu.",
    icon: Timer,
    img: activityNetworking,
  },
  {
    title: "Open Space Technology",
    description:
      "Inovativni tip interaktivne radionice gdje učesnici zajedno s predstavnicima kompanija rade na kreativnim rješenjima.",
    icon: Lightbulb,
    img: activityWorkshop,
  },
];

const timelineYears = [
  2008, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020,
  2021, 2022, 2023, 2024, 2025,
];

/* ── Glassmorphism card component ── */
const GlassCard = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] rounded-3xl ${className}`}
  >
    {children}
  </div>
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
    const duration = 2000;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = numericValue / steps;
    const timer = setInterval(() => {
      start += increment;
      if (start >= numericValue) {
        setCount(numericValue);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);
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

const Landing = () => {
  const [navVisible, setNavVisible] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    const handleScroll = () => setNavVisible(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ── Navbar (glass) ── */}
      <motion.nav
        className="fixed top-0 w-full z-50 bg-background/60 backdrop-blur-2xl border-b border-white/[0.06]"
        initial={{ y: -100 }}
        animate={{ y: navVisible ? 0 : -100 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between h-[64px] px-6 lg:px-8">
          <Link to="/">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="text-sm font-medium rounded-full" asChild>
              <Link to="/novosti">Novosti</Link>
            </Button>
            <Button variant="ghost" className="text-sm font-medium rounded-full" asChild>
              <Link to="/auth">Prijava</Link>
            </Button>
            <Button className="hidden sm:inline-flex text-sm font-semibold rounded-full" asChild>
              <Link to="/auth">Registracija</Link>
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
        {/* Abstract background */}
        <motion.div className="absolute inset-0" style={{ y: heroY }}>
          <img
            src={heroBg}
            alt=""
            className="w-full h-full object-cover scale-110"
            width={1920}
            height={1080}
            aria-hidden="true"
          />
        </motion.div>

        {/* Floating glass orbs */}
        <motion.div
          className="absolute top-[15%] left-[10%] w-64 h-64 rounded-full bg-primary/10 blur-3xl"
          animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[20%] right-[8%] w-48 h-48 rounded-full bg-primary/15 blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-28 w-full"
          style={{ opacity: heroOpacity }}
        >
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Logo size="lg" className="[&_span]:text-white [&_.text-foreground]:text-white justify-center" />
            </motion.div>

            {/* Glass pill badge */}
            <motion.div
              className="inline-flex items-center gap-2 bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] rounded-full px-5 py-2.5 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <CalendarDays className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-white/90">
                03. i 04. novembar 2026.
              </span>
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
              Sajam zapošljavanja za studente i diplomce tehničko-tehnoloških
              fakulteta i ekonomije
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Button
                size="lg"
                className="text-base font-semibold px-10 h-14 rounded-full"
                asChild
              >
                <Link to="/auth">
                  Ostavi svoj CV <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base font-semibold px-10 h-14 rounded-full border-white/[0.12] text-white hover:bg-white/[0.08] bg-white/[0.04] backdrop-blur-xl"
                asChild
              >
                <a href="#o-projektu">Saznaj više</a>
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
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-white/40"
              animate={{ y: [0, 16, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </section>

      {/* ── Stats (glass cards) ── */}
      <section className="py-20 lg:py-28 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <GlassCard className="p-6 lg:p-8 text-center hover:bg-white/[0.1] transition-colors duration-500">
                  <AnimatedCounter value={stat.value} label={stat.label} />
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Photo mosaic band ── */}
      <section className="py-4 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { src: teamPhoto1, alt: "JobFAIR tim", span: "md:col-span-2 aspect-[2/1]" },
            { src: eventInstagram, alt: "Event atmosfera", span: "aspect-square" },
            { src: sponsorsMerch, alt: "Sponzori i merch", span: "aspect-square" },
          ].map((photo, i) => (
            <motion.div
              key={photo.alt}
              className={`rounded-2xl overflow-hidden ${photo.span}`}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <img
                src={photo.src}
                alt={photo.alt}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── About / O projektu ── */}
      <section id="o-projektu" className="py-24 lg:py-36">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Text */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <span className="text-primary font-semibold text-sm tracking-widest uppercase mb-4 block">
                O projektu
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-8 text-foreground tracking-tight leading-tight">
                Spajamo mlade sa{" "}
                <span className="text-primary">njihovom budućnošću</span>
              </h2>

              <div className="space-y-5 text-muted-foreground text-base sm:text-lg leading-relaxed">
                <p>
                  JobFAIR je najznačajniji projekat Udruženja studenata
                  elektrotehnike Evrope, EESTEC LC Sarajevo. Ove godine održava se
                  po sedamnaesti put, dokazujući da u Bosni i Hercegovini postoje
                  mladi koji ne čekaju prilike, nego ih stvaraju sami!
                </p>
                <p>
                  Osnovni cilj JobFAIR-a je direktan kontakt između studenata i
                  poslodavaca. Tokom dva dana trajanja Sajma, posjetioci su u
                  mogućnosti razgovarati s predstavnicima kompanija, informisati se o
                  tome šta poslodavci očekuju od njih te koje su vještine poželjne za
                  njihovu struku.
                </p>
                <p>
                  Ovaj projekat direktno stimuliše zapošljavanje mladih u uspješnim
                  domaćim kompanijama. Kroz različita predavanja i savjete
                  profesionalaca pruža se podrška mladima koji imaju ambicije da
                  započnu sopstveni biznis.
                </p>
              </div>
            </motion.div>

            {/* Image collage */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className="relative">
                <div className="rounded-3xl overflow-hidden">
                  <img
                    src={teamPhoto2}
                    alt="EESTEC LC Sarajevo štand"
                    className="w-full aspect-[3/4] object-cover"
                    loading="lazy"
                  />
                  {/* Glass overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
                </div>
                {/* Floating glass card */}
                <motion.div
                  className="absolute -bottom-6 -left-6 w-44 h-44 rounded-2xl overflow-hidden border-2 border-white/[0.1] shadow-2xl"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <img
                    src={teamPhoto3}
                    alt="JobFAIR arhiva"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </motion.div>
                {/* Decorative glass blobs */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary/10 backdrop-blur-sm rounded-2xl -z-10 border border-primary/10" />
              </div>
            </motion.div>
          </div>

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-24"
          >
            <p className="text-center text-sm text-muted-foreground font-medium mb-6 tracking-wider uppercase">
              Naša historija
            </p>
            <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none justify-center flex-wrap">
              {timelineYears.map((year, i) => (
                <motion.div
                  key={year}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-default ${
                    i === timelineYears.length - 1
                      ? "bg-primary text-primary-foreground scale-110"
                      : "bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                  }`}
                >
                  {year}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Organizer (EESTEC) ── */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-primary font-semibold text-sm tracking-widest uppercase mb-4 block">
              Ko stoji iza svega
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-4 text-foreground tracking-tight">
              Organizator
            </h2>
          </motion.div>

          {/* EESTEC wall image + glass info cards */}
          <div className="grid lg:grid-cols-5 gap-8 items-start">
            {/* Wall photo */}
            <motion.div
              className="lg:col-span-2 rounded-3xl overflow-hidden"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <img
                src={eestecWall}
                alt="EESTEC LC Sarajevo projekti"
                className="w-full aspect-[4/3] object-cover"
                loading="lazy"
              />
            </motion.div>

            {/* Glass info cards */}
            <div className="lg:col-span-3 grid sm:grid-cols-2 gap-6">
              {[
                {
                  icon: Users,
                  title: "Misija Udruženja",
                  text: "EESTEC je udruženje studenata elektrotehnike Evrope s 46 lokalnih komiteta. Osnovni cilj je promocija i razvoj međunarodnih kontakata između studenata i profesionalaca.",
                },
                {
                  icon: Building2,
                  title: "Višegodišnja tradicija",
                  text: "Tokom 15 godina aktivnog rada, EESTEC LC Sarajevo se može pohvaliti velikim brojem organizovanih projekata na lokalnom i internacionalnom nivou.",
                },
                {
                  icon: MessageSquare,
                  title: "Razmjena iskustava",
                  text: "Studenti imaju priliku posjetiti bilo koji grad u kojem EESTEC ima komitet, upoznati kulturu i običaje, te stvoriti prijateljstva za čitav život.",
                },
                {
                  icon: Leaf,
                  title: "Ekološka svijest",
                  text: "JobFAIR aktivno promovira ekološku odgovornost kroz reciklažu i edukaciju o održivosti, pokazujući da nam je stalo do budućnosti planete.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <GlassCard className="p-7 h-full hover:bg-white/[0.1] transition-all duration-500 group">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-500">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-display font-bold text-lg mb-3 text-foreground">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.text}
                    </p>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Eco + Atmosphere photo strip ── */}
      <section className="py-4 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { src: ecoAwareness, alt: "Ekološka svijest", span: "" },
            { src: eventInstagram, alt: "Event atmosfera", span: "" },
            { src: teamPhoto1, alt: "JobFAIR tim", span: "" },
          ].map((photo, i) => (
            <motion.div
              key={photo.alt + i}
              className={`rounded-2xl overflow-hidden aspect-[4/3] ${photo.span}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <img
                src={photo.src}
                alt={photo.alt}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Activities ── */}
      <section className="py-24 lg:py-32">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-primary font-semibold text-sm tracking-widest uppercase mb-4 block">
              Šta te čeka
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-4 text-foreground tracking-tight">
              Aktivnosti
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Tokom dva dana Sajma studenti imaju mogućnost učestvovati u nizu
              aktivnosti koje će im pomoći u razvoju karijere.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {activities.map((activity, i) => (
              <motion.div
                key={activity.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="group cursor-default"
              >
                <GlassCard className="overflow-hidden hover:bg-white/[0.1] transition-all duration-500 hover:border-primary/20">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={activity.img}
                      alt={activity.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                      width={800}
                      height={600}
                    />
                  </div>
                  <div className="p-7">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                        <activity.icon className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                      </div>
                      <h3 className="font-display font-bold text-lg text-foreground">
                        {activity.title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {activity.description}
                    </p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 lg:py-28">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <GlassCard className="relative overflow-hidden px-8 py-20 lg:px-16 lg:py-28 text-center">
              {/* Decorative glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -z-0" />

              <div className="relative z-10">
                <motion.div
                  className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Novo izdanje</span>
                </motion.div>

                <motion.h2
                  className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-5 text-foreground tracking-tight"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  Spreman za JobFAIR <span className="text-primary">'26</span>?
                </motion.h2>
                <motion.p
                  className="text-muted-foreground text-lg mb-10 max-w-lg mx-auto text-balance"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  Pridruži se hiljadama studenata i diplomaca koji grade svoju
                  karijeru kroz JobFAIR. Ne čekaj prilike — stvori ih sam!
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <Button
                    size="lg"
                    className="text-base font-semibold px-10 h-14 rounded-full"
                    asChild
                  >
                    <Link to="/auth">
                      Registruj se <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
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
            <a
              href="https://www.eestec-sa.ba/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              EESTEC LC Sarajevo
            </a>
            <span>© 2026 JobFAIR. Sva prava zadržana.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
