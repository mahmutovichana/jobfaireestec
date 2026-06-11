import { Users, TrendingUp, CalendarDays, Loader2, Building2, Radio, FileText, Briefcase, Globe } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useRegistrationStats } from "@/hooks/useRegistrations";
import { usePartners } from "@/hooks/usePartners";
import { useEvents } from "@/hooks/useEvents";
import { usePageViews } from "@/hooks/usePageViews";
import { TeamAnalytics } from "@/components/dashboard/TeamAnalytics";
import { useMemo } from "react";
import { format, parseISO, startOfWeek } from "date-fns";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(340 75% 58%)",
  "hsl(45 93% 58%)",
  "hsl(200 70% 55%)",
  "hsl(280 60% 55%)",
];

const Analytics = () => {
  const { data: stats, isLoading: statsLoading } = useRegistrationStats();
  const { data: partners = [], isLoading: partnersLoading } = usePartners();
  const { data: events = [], isLoading: eventsLoading } = useEvents();
  const { data: pageViews = [], isLoading: pvLoading } = usePageViews(30);

  const isLoading = statsLoading || partnersLoading || eventsLoading || pvLoading;

  // Top traffic sources (last 30 days, all pages)
  const topSources = useMemo(() => {
    const map: Record<string, number> = {};
    pageViews.forEach((pv) => {
      const src = pv.referrer_domain || "Direktno";
      map[src] = (map[src] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [pageViews]);

  // Top sources broken down by page (path)
  const sourcesByPage = useMemo(() => {
    const pageMap: Record<string, Record<string, number>> = {};
    pageViews.forEach((pv) => {
      const src = pv.referrer_domain || "Direktno";
      if (!pageMap[pv.path]) pageMap[pv.path] = {};
      pageMap[pv.path][src] = (pageMap[pv.path][src] || 0) + 1;
    });
    return Object.entries(pageMap)
      .map(([path, sources]) => {
        const sorted = Object.entries(sources).sort((a, b) => b[1] - a[1]);
        const total = sorted.reduce((s, [, v]) => s + v, 0);
        return { path, total, top: sorted.slice(0, 3) };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [pageViews]);

  const perEventData = useMemo(() => {
    if (!stats?.events || !stats?.registrations) return [];
    const countMap: Record<string, { name: string; registrations: number }> = {};
    stats.events.forEach(e => { countMap[e.id] = { name: e.name, registrations: 0 }; });
    stats.registrations.forEach(r => {
      if (countMap[r.event_id]) countMap[r.event_id].registrations++;
    });
    return Object.values(countMap)
      .filter(d => d.registrations > 0)
      .sort((a, b) => b.registrations - a.registrations);
  }, [stats]);

  const overTimeData = useMemo(() => {
    if (!stats?.registrations?.length) return [];
    const weekMap: Record<string, number> = {};
    stats.registrations.forEach(r => {
      const week = format(startOfWeek(parseISO(r.created_at)), "MMM d");
      weekMap[week] = (weekMap[week] || 0) + 1;
    });
    return Object.entries(weekMap).map(([week, count]) => ({ week, registrations: count }));
  }, [stats]);

  // Partner breakdown by category
  const partnersByCategory = useMemo(() => {
    const cats = { company: 0, media: 0, sponsor: 0 };
    partners.forEach(p => { if (cats[p.category] !== undefined) cats[p.category]++; });
    return [
      { name: "Kompanije", value: cats.company, color: COLORS[0] },
      { name: "Mediji", value: cats.media, color: COLORS[1] },
      { name: "Sponzori", value: cats.sponsor, color: COLORS[2] },
    ].filter(c => c.value > 0);
  }, [partners]);

  // Partner breakdown by package
  const partnersByPackage = useMemo(() => {
    const pkgs: Record<string, number> = {};
    partners.forEach(p => {
      const pkg = p.package || "standard";
      pkgs[pkg] = (pkgs[pkg] || 0) + 1;
    });
    return Object.entries(pkgs).map(([pkg, count], i) => ({
      name: pkg.charAt(0).toUpperCase() + pkg.slice(1),
      value: count,
      color: COLORS[i % COLORS.length],
    }));
  }, [partners]);

  // Events by status
  const eventsByStatus = useMemo(() => {
    const statuses: Record<string, number> = {};
    events.forEach(e => {
      statuses[e.status] = (statuses[e.status] || 0) + 1;
    });
    return Object.entries(statuses).map(([status, count]) => ({
      name: status === "live" ? "Aktivni" : status === "draft" ? "Nacrt" : "Prošli",
      value: count,
    }));
  }, [events]);

  // Registration status breakdown
  const registrationsByStatus = useMemo(() => {
    if (!stats?.registrations) return [];
    const statuses: Record<string, number> = {};
    stats.registrations.forEach(r => {
      statuses[r.status] = (statuses[r.status] || 0) + 1;
    });
    return Object.entries(statuses).map(([status, count], i) => ({
      name: status === "registered" ? "Registrirani" : status === "checked_in" ? "Prisutni" : "Otkazani",
      value: count,
      color: COLORS[i % COLORS.length],
    }));
  }, [stats]);

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const statCards = [
    { label: "Ukupno registracija", value: stats?.total ?? 0, icon: Users },
    { label: "Aktivni eventi", value: stats?.activeEvents ?? 0, icon: CalendarDays },
    { label: "Ukupno partnera", value: partners.length, icon: Building2 },
    { label: "Kompanije", value: partners.filter(p => p.category === "company").length, icon: Briefcase },
    { label: "Medijski partneri", value: partners.filter(p => p.category === "media").length, icon: Radio },
    { label: "Posjete (30d)", value: pageViews.length, icon: Globe },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Analitika</h1>
        <p className="text-muted-foreground">Pregled performansi evenata, registracija i partnera.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <stat.icon className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-2xl font-display font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card rounded-xl p-5 sm:p-6">
          <h3 className="font-display font-semibold mb-4">Registracije po eventu</h3>
          {perEventData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perEventData} layout="vertical" margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis type="number" className="text-xs" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={120} className="text-xs" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 13 }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Bar dataKey="registrations" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12 text-sm">Nema podataka o registracijama.</p>
          )}
        </div>

        <div className="bg-card rounded-xl p-5 sm:p-6">
          <h3 className="font-display font-semibold mb-4">Registracije tokom vremena</h3>
          {overTimeData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={overTimeData} margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="week" className="text-xs" tick={{ fontSize: 11 }} />
                  <YAxis className="text-xs" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 13 }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Line type="monotone" dataKey="registrations" stroke="hsl(var(--success))" strokeWidth={2.5} dot={{ fill: "hsl(var(--success))", r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12 text-sm">Nema podataka o registracijama.</p>
          )}
        </div>
      </div>

      {/* Charts row 2: Partner breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-card rounded-xl p-5 sm:p-6">
          <h3 className="font-display font-semibold mb-4">Partneri po kategoriji</h3>
          {partnersByCategory.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={partnersByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                    {partnersByCategory.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12 text-sm">Nema partnera.</p>
          )}
        </div>

        <div className="bg-card rounded-xl p-5 sm:p-6">
          <h3 className="font-display font-semibold mb-4">Partneri po paketu</h3>
          {partnersByPackage.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={partnersByPackage} margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 11 }} />
                  <YAxis className="text-xs" allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 13 }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12 text-sm">Nema podataka.</p>
          )}
        </div>

        <div className="bg-card rounded-xl p-5 sm:p-6">
          <h3 className="font-display font-semibold mb-4">Status registracija</h3>
          {registrationsByStatus.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={registrationsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={80} label>
                    {registrationsByStatus.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 13 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12 text-sm">Nema podataka.</p>
          )}
        </div>
      </div>

      {/* Events by status summary */}
      <div className="bg-card rounded-xl p-5 sm:p-6">
        <h3 className="font-display font-semibold mb-4">Pregled evenata po statusu</h3>
        <div className="grid grid-cols-3 gap-4">
          {eventsByStatus.map((item) => (
            <div key={item.name} className="text-center p-4 rounded-xl bg-muted/30">
              <p className="text-2xl font-display font-bold">{item.value}</p>
              <p className="text-sm text-muted-foreground">{item.name}</p>
            </div>
          ))}
          {eventsByStatus.length === 0 && (
            <p className="col-span-3 text-muted-foreground text-center py-8 text-sm">Nema evenata.</p>
          )}
        </div>
      </div>

      {/* Traffic sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card rounded-xl p-5 sm:p-6">
          <h3 className="font-display font-semibold mb-1">Top izvori prometa (30 dana)</h3>
          <p className="text-xs text-muted-foreground mb-4">Odakle posjetitelji dolaze na sajt</p>
          {topSources.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSources} layout="vertical" margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis type="number" className="text-xs" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={120} className="text-xs" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 13 }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12 text-sm">Još nema podataka o posjetama.</p>
          )}
        </div>

        <div className="bg-card rounded-xl p-5 sm:p-6">
          <h3 className="font-display font-semibold mb-1">Izvori po stranicama</h3>
          <p className="text-xs text-muted-foreground mb-4">Najposjećenije stranice i top 3 izvora</p>
          {sourcesByPage.length > 0 ? (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {sourcesByPage.map((p) => (
                <div key={p.path} className="p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-1.5">
                    <code className="text-sm font-medium text-foreground truncate">{p.path}</code>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">{p.total} posjeta</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.top.map(([src, count]) => (
                      <span key={src} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {src} · {count}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12 text-sm">Još nema podataka.</p>
          )}
        </div>
      </div>

      <div className="pt-2">
        <TeamAnalytics />
      </div>
    </div>
  );
};

export default Analytics;
