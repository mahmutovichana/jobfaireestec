import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useEvents } from "@/hooks/useEvents";
import { usePartners } from "@/hooks/usePartners";
import { useTeamMembers } from "@/hooks/useTeam";
import { useIsAdmin } from "@/hooks/useUserRole";
import { usePendingRequestCount } from "@/hooks/useAccessRequests";
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
  ShieldCheck,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const adminQuickActions = [
  { title: "Kreiraj event", icon: Plus, to: "/dashboard/events/create", color: "bg-primary/10 text-primary" },
  { title: "Dodaj novost", icon: Newspaper, to: "/dashboard/news", color: "bg-blue-500/10 text-blue-500" },
  { title: "Dodaj oglas", icon: Megaphone, to: "/dashboard/job-ads", color: "bg-amber-500/10 text-amber-500" },
  { title: "Dodaj partnera", icon: Handshake, to: "/dashboard/partners", color: "bg-emerald-500/10 text-emerald-500" },
];

const companyQuickActions = [
  { title: "Profil kompanije", icon: Settings, to: "/dashboard/company-profile", color: "bg-primary/10 text-primary" },
  { title: "CV Baza", icon: FileText, to: "/dashboard/cv-database", color: "bg-blue-500/10 text-blue-500" },
];

export default function DashboardHome() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { isAdmin, isLoading: roleLoading } = useIsAdmin();

  const firstName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "korisniče";

  // Render the greeting + role-appropriate body. Heavy admin data fetches are
  // isolated in <AdminBody/> so company users never trigger events/partners/team/
  // pending-count queries on initial dashboard load.
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Greeting — rendered without opacity animation so it's the LCP candidate immediately */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
          Zdravo, {firstName}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {roleLoading ? "\u00A0" : isAdmin ? "Evo pregleda tvog radnog prostora." : "Dobrodošli na JobFAIR platformu."}
        </p>
      </div>

      {roleLoading ? null : isAdmin ? <AdminBody /> : <CompanyBody />}
    </div>
  );
}

function AdminBody() {
  const { data: events = [] } = useEvents();
  const { data: partners = [] } = usePartners();
  const { data: team = [] } = useTeamMembers();
  const { data: pendingCount = 0 } = usePendingRequestCount(true);
  const quickActions = adminQuickActions;

  return (
    <>
      {/* Pending requests alert for admins */}
      {pendingCount > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}>
          <Link
            to="/dashboard/access-requests"
            className="flex items-center gap-3 p-4 rounded-2xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{pendingCount} zahtjev{pendingCount > 1 ? "a" : ""} za pristup čeka odobrenje</p>
              <p className="text-xs text-muted-foreground">Kliknite za pregled</p>
            </div>
            <ArrowRight className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          </Link>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Brze akcije</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="group flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-md transition-all"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}>
                <action.icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <span className="text-sm font-medium text-foreground text-center">{action.title}</span>
            </Link>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Ukupno evenata", value: events.length, icon: CalendarDays, to: "/dashboard/events" },
              { label: "Partneri", value: partners.length, icon: Handshake, to: "/dashboard/partners" },
              { label: "Članovi tima", value: team.length, icon: Users, to: "/dashboard/team" },
            ].map((stat) => (
              <Link
                key={stat.label}
                to={stat.to}
                className="flex items-center gap-4 p-5 rounded-2xl border border-border/50 bg-card hover:border-primary/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <stat.icon className="w-6 h-6 text-primary" aria-hidden="true" />
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
      {(() => {
        const liveEvents = events.filter((e: any) => e.status === "live");
        return liveEvents.length > 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Aktivni eventi</h2>
              <Button variant="ghost" size="sm" className="text-xs rounded-full" asChild>
                <Link to="/dashboard/events">Vidi sve <ArrowRight className="w-3 h-3 ml-1" aria-hidden="true" /></Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {liveEvents.slice(0, 4).map((event: any) => (
                <Link
                  key={event.id}
                  to={`/dashboard/events/${event.id}`}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-card hover:border-primary/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-5 h-5 text-emerald-500" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{event.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.event_date ? new Date(event.event_date).toLocaleDateString("bs-BA") : "Datum nije postavljen"}
                    </p>
                  </div>
                  <span className="ml-auto text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full shrink-0">Aktivan</span>
                </Link>
              ))}
            </div>
          </motion.div>
        ) : null;
      })()}

      {/* Management grid */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
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
                <item.icon className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-primary transition-colors" aria-hidden="true" />
                <p className="font-medium text-sm text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-1 hidden sm:block">{item.desc}</p>
              </Link>
            ))}
          </div>
      </motion.div>
    </>
  );
}

function CompanyBody() {
  const quickActions = companyQuickActions;
  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Brze akcije</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="group flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-md transition-all"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}>
                <action.icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <span className="text-sm font-medium text-foreground text-center">{action.title}</span>
            </Link>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <div className="p-6 rounded-2xl border border-border/50 bg-card">
            <h2 className="font-display font-semibold text-foreground mb-2">Dobrodošli na platformu</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Kao partner, možete pregledati CV bazu studenata i urediti informacije o vašoj kompaniji putem postavki profila. Vaše promjene će biti vidljive nakon odobrenja admin tima.
            </p>
          </div>
      </motion.div>
    </>
  );
}
