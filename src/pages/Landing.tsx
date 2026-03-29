import { useState, useEffect } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
} from "lucide-react";

import heroImg from "@/assets/hero-jobfair.jpg";
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
      "Predstavnici kompanija imaju mogućnost predstaviti svoj rad potencijalnim uposlenicima, poslovnim partnerima ili klijentima kroz profesionalne prezentacije.",
    icon: Mic,
    img: activityPresentation,
  },
  {
    title: "Career Speed Dating",
    description:
      "Jedinstveni spoj razgovora za posao i speed date-a — 5 minuta da se predstavite potencijalnom poslodavcu i istaknete iz mase kandidata.",
    icon: Timer,
    img: activityNetworking,
  },
  {
    title: "Open Space Technology",
    description:
      "Inovativni tip interaktivne radionice gdje učesnici zajedno s predstavnicima kompanija rade na pronalasku kreativnih rješenja za stvarne izazove.",
    icon: Lightbulb,
    img: activityWorkshop,
  },
];

const timelineYears = [
  2008, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020,
  2021, 2022, 2023, 2024, 2025,
];

const Landing = () => {
  const [navVisible, setNavVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setNavVisible(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navbar */}
      <motion.nav
        className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-md"
        initial={{ y: -100 }}
        animate={{ y: navVisible ? 0 : -100 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between h-[72px] px-6 lg:px-8">
          <Link to="/">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-sm font-medium" asChild>
              <Link to="/auth">Prijava</Link>
            </Button>
            <Button className="hidden sm:inline-flex text-sm font-semibold" asChild>
              <Link to="/auth">Registracija</Link>
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="JobFAIR sajam"
            className="w-full h-full object-cover"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-foreground/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-28 w-full">
          <motion.div
            className="max-w-2xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="mb-6">
              <Logo size="lg" className="[&_span]:text-white [&_.text-foreground]:text-white" />
            </div>

            <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-full px-4 py-1.5 mb-6">
              <CalendarDays className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-white">
                03. i 04. novembar 2026.
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white tracking-tight leading-[1.1] mb-4">
              Iskoristi svoju{" "}
              <span className="text-primary">šansu!</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/80 max-w-lg mb-8 leading-relaxed">
              Sajam zapošljavanja za studente i diplomce tehničko-tehnoloških
              fakulteta i ekonomije
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="text-base font-semibold px-8 h-12"
                asChild
              >
                <Link to="/auth">
                  Ostavi svoj CV <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base font-semibold px-8 h-12 border-white/30 text-white hover:bg-white/10 bg-white/5"
                asChild
              >
                <a href="#o-projektu">Saznaj više</a>
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Decorative network dots */}
        <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none opacity-20">
          <svg
            viewBox="0 0 400 400"
            className="w-full h-full"
            fill="none"
          >
            {[...Array(20)].map((_, i) => {
              const cx = 50 + Math.random() * 300;
              const cy = 50 + Math.random() * 300;
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={2}
                  fill="white"
                />
              );
            })}
          </svg>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 lg:py-20 bg-card">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-7 h-7 text-primary" />
                </div>
                <div className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About / O projektu */}
      <section id="o-projektu" className="py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4 text-foreground tracking-tight">
              O projektu
            </h2>
            <div className="w-16 h-1 bg-primary rounded-full mx-auto" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6 text-muted-foreground text-base sm:text-lg leading-relaxed"
          >
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
          </motion.div>

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-14"
          >
            <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
              {timelineYears.map((year, i) => (
                <div
                  key={year}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                    i === timelineYears.length - 1
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {year}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Organizer */}
      <section className="py-20 lg:py-28 bg-card">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4 text-foreground tracking-tight">
              Organizator
            </h2>
            <div className="w-16 h-1 bg-primary rounded-full mx-auto" />
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
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
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-background rounded-2xl p-8 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <item.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display font-bold text-lg mb-3 text-foreground">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Activities */}
      <section className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4 text-foreground tracking-tight">
              Aktivnosti
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Tokom dva dana Sajma studenti imaju mogućnost učestvovati u nizu
              aktivnosti koje će im pomoći u razvoju karijere.
            </p>
            <div className="w-16 h-1 bg-primary rounded-full mx-auto mt-4" />
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {activities.map((activity, i) => (
              <motion.div
                key={activity.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="group"
              >
                <div className="rounded-2xl overflow-hidden bg-card border border-border hover:shadow-lg transition-shadow">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={activity.img}
                      alt={activity.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      width={800}
                      height={600}
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <activity.icon className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-display font-bold text-lg text-foreground">
                        {activity.title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {activity.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="bg-foreground rounded-3xl relative overflow-hidden px-8 py-16 lg:px-14 lg:py-20 text-center">
            {/* Decorative dots */}
            <div className="absolute inset-0 opacity-5">
              <svg className="w-full h-full" viewBox="0 0 400 200">
                {[...Array(30)].map((_, i) => (
                  <circle
                    key={i}
                    cx={Math.random() * 400}
                    cy={Math.random() * 200}
                    r={1.5}
                    fill="white"
                  />
                ))}
              </svg>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative z-10"
            >
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4 text-background tracking-tight">
                Spreman za JobFAIR '26?
              </h2>
              <p className="text-background/70 text-lg mb-8 max-w-lg mx-auto text-balance">
                Pridruži se hiljadama studenata i diplomaca koji grade svoju
                karijeru kroz JobFAIR. Ne čekaj prilike — stvori ih sam!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  className="text-base font-semibold px-8 h-12 bg-primary text-primary-foreground hover:bg-primary/90"
                  asChild
                >
                  <Link to="/auth">
                    Registruj se <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 lg:px-8 border-t border-border">
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
