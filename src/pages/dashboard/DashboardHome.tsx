import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useEvents } from "@/hooks/useEvents";
import { usePartners } from "@/hooks/usePartners";
import { useTeamMembers } from "@/hooks/useTeam";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Users,
  Handshake,
  Newspaper,
  Megaphone,
  FileText,
  ArrowRight,
  BarChart3,
  Plus,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const quickActions = [
  { title: "Kreiraj event", icon: Plus, to: "/dashboard/events/create", color: "bg-primary/10 text-primary" },
  { title: "Dodaj novost", icon: Newspaper, to: "/dashboard/news", color: "bg-blue-500/10 text-blue-500" },
  { title: "Dodaj oglas", icon: Megaphone, to: "/dashboard/job-ads", color: "bg-amber-500/10 text-amber-500" },
  { title: "Dodaj partnera", icon: Handshake, to: "/dashboard/partners", color: "bg-emerald-500/10 text-emerald-500" },
];

export default function DashboardHome() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: events = [] } = useEvents();
  const { data: partners = [] } = usePartners();
  const { data: team = [] } = useTeamMembers();

  const firstName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "korisniče";

  const stats = [
    { label: "Ukupno evenata", value: events.length, icon: CalendarDays, to: "/dashboard/events" },
    { label: "Partneri", value: partners.length, icon: Handshake, to: "/dashboard/partners" },
    { label: "Članovi tima", value: team.length, icon: Users, to: "/dashboard/team" },
  ];

  const liveEvents = events.filter((e: any) => e.status === "live");

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
          Zdravo, {firstName}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">Evo pregleda tvog radnog prostora.</p>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Brze akcije</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="group flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-md transition-all"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-foreground text-center">{action.title}</span>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {stats.map((stat) => (
            <Link
              key={stat.label}
              to={stat.to}
              className="flex items-center gap-4 p-5 rounded-2xl border border-border/50 bg-card hover:border-primary/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Live Events */}
      {liveEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Aktivni eventi</h2>
            <Button variant="ghost" size="sm" className="text-xs rounded-full" asChild>
              <Link to="/dashboard/events">Vidi sve <ArrowRight className="w-3 h-3 ml-1" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {liveEvents.slice(0, 4).map((event: any) => (
              <Link
                key={event.id}
                to={`/dashboard/events/${event.id}`}
                className="flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-card hover:border-primary/30 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-5 h-5 text-success" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{event.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.event_date ? new Date(event.event_date).toLocaleDateString("bs-BA") : "Datum nije postavljen"}
                  </p>
                </div>
                <div className="ml-auto shrink-0">
                  <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">Aktivan</span>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Navigation Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Upravljanje</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { title: "CV Baza", icon: FileText, to: "/dashboard/cv-database", desc: "Pregledaj primljene CV-ove" },
            { title: "Upiti kompanija", icon: MessageSquare, to: "/dashboard/company-inquiries", desc: "Kontakt forme kompanija" },
            { title: "Analytics", icon: BarChart3, to: "/dashboard/analytics", desc: "Statistika i izvještaji" },
            { title: "Tim", icon: Users, to: "/dashboard/team", desc: "Organizacioni odbor" },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group p-4 rounded-2xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-md transition-all"
            >
              <item.icon className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
              <p className="font-medium text-sm text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-1 hidden sm:block">{item.desc}</p>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
