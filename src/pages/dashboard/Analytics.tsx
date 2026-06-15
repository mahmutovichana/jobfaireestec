import { Users, TrendingUp, CalendarDays, Loader2, Building2, Radio, FileText, Briefcase, Globe, Wallet, Gauge } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useRegistrationStats } from "@/hooks/useRegistrations";
import { usePartners } from "@/hooks/usePartners";
import { useEvents } from "@/hooks/useEvents";
import { usePageViews } from "@/hooks/usePageViews";
import { useTreasury } from "@/hooks/useTreasury";
import { usePerformanceMetrics, usePerformanceSummary } from "@/hooks/usePerformanceMonitoring";
import { useIsAdmin } from "@/hooks/useUserRole";
import { TeamAnalytics } from "@/components/dashboard/TeamAnalytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, useState } from "react";
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
  const { isAdmin } = useIsAdmin();
  const [tab, setTab] = useState("events");
  // Lightweight hooks for header stat cards only. Heavy / tab-specific
  // queries live inside the per-tab components so they fire only when the
  // tab is actually opened (Radix Tabs unmounts inactive content).
  const { data: stats } = useRegistrationStats();
  const { data: partners = [] } = usePartners();
  const { data: events = [] } = useEvents();
  const { data: pageViews = [] } = usePageViews(30);

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

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-muted rounded-full p-1 flex flex-wrap h-auto">
          <TabsTrigger value="events" className="rounded-full text-foreground/70 data-[state=active]:text-foreground data-[state=active]:bg-card data-[state=active]:shadow-sm text-sm">Eventi & registracije</TabsTrigger>
          <TabsTrigger value="partners" className="rounded-full text-foreground/70 data-[state=active]:text-foreground data-[state=active]:bg-card data-[state=active]:shadow-sm text-sm">Partneri</TabsTrigger>
          <TabsTrigger value="traffic" className="rounded-full text-foreground/70 data-[state=active]:text-foreground data-[state=active]:bg-card data-[state=active]:shadow-sm text-sm">Promet</TabsTrigger>
          <TabsTrigger value="performance" className="rounded-full text-foreground/70 data-[state=active]:text-foreground data-[state=active]:bg-card data-[state=active]:shadow-sm text-sm gap-1.5"><Gauge className="w-3.5 h-3.5" aria-hidden /> Performanse</TabsTrigger>
          <TabsTrigger value="team" className="rounded-full text-foreground/70 data-[state=active]:text-foreground data-[state=active]:bg-card data-[state=active]:shadow-sm text-sm">Tim</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="finance" className="rounded-full text-foreground/70 data-[state=active]:text-foreground data-[state=active]:bg-card data-[state=active]:shadow-sm text-sm gap-1.5">
              <Wallet className="w-3.5 h-3.5" aria-hidden /> Finansije
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="events" className="mt-6 space-y-5">
          <EventsTab stats={stats} events={events} />
        </TabsContent>
        <TabsContent value="partners" className="mt-6 space-y-5">
          <PartnersTab partners={partners} />
        </TabsContent>
        <TabsContent value="traffic" className="mt-6 space-y-5">
          <TrafficTab pageViews={pageViews} />
        </TabsContent>
        <TabsContent value="performance" className="mt-6 space-y-5">
          <PerformanceTab />
        </TabsContent>
        <TabsContent value="team" className="mt-6">
          <TeamAnalytics />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="finance" className="mt-6 space-y-5">
            <FinanceTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Analytics;

// ---------- Per-tab subcomponents (hooks fire only when tab is opened) ----------

function EventsTab({ stats, events }: { stats: ReturnType<typeof useRegistrationStats>["data"]; events: any[] }) {
  const perEventData = useMemo(() => {
    if (!stats?.events || !stats?.registrations) return [];
    const countMap: Record<string, { name: string; registrations: number }> = {};
    stats.events.forEach((e) => { countMap[e.id] = { name: e.name, registrations: 0 }; });
    stats.registrations.forEach((r) => { if (countMap[r.event_id]) countMap[r.event_id].registrations++; });
    return Object.values(countMap).filter((d) => d.registrations > 0).sort((a, b) => b.registrations - a.registrations);
  }, [stats]);

  const overTimeData = useMemo(() => {
    if (!stats?.registrations?.length) return [];
    const weekMap: Record<string, number> = {};
    stats.registrations.forEach((r) => {
      const week = format(startOfWeek(parseISO(r.created_at)), "MMM d");
      weekMap[week] = (weekMap[week] || 0) + 1;
    });
    return Object.entries(weekMap).map(([week, count]) => ({ week, registrations: count }));
  }, [stats]);

  const eventsByStatus = useMemo(() => {
    const statuses: Record<string, number> = {};
    events.forEach((e) => { statuses[e.status] = (statuses[e.status] || 0) + 1; });
    return Object.entries(statuses).map(([status, count]) => ({
      name: status === "live" ? "Aktivni" : status === "draft" ? "Nacrt" : "Prošli",
      value: count,
    }));
  }, [events]);

  const registrationsByStatus = useMemo(() => {
    if (!stats?.registrations) return [];
    const statuses: Record<string, number> = {};
    stats.registrations.forEach((r) => { statuses[r.status] = (statuses[r.status] || 0) + 1; });
    return Object.entries(statuses).map(([status, count], i) => ({
      name: status === "registered" ? "Registrirani" : status === "checked_in" ? "Prisutni" : "Otkazani",
      value: count,
      color: COLORS[i % COLORS.length],
    }));
  }, [stats]);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card rounded-xl p-5 sm:p-6">
          <h2 className="font-display font-semibold mb-4 text-base">Registracije po eventu</h2>
          {perEventData.length > 0 ? (
            <div className="h-72" role="img" aria-label="Grafikon registracija po eventu">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perEventData} layout="vertical" margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis type="number" className="text-xs" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={120} className="text-xs" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 13 }} labelStyle={{ fontWeight: 600 }} />
                  <Bar dataKey="registrations" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (<p className="text-muted-foreground text-center py-12 text-sm">Nema podataka o registracijama.</p>)}
        </div>
        <div className="bg-card rounded-xl p-5 sm:p-6">
          <h2 className="font-display font-semibold mb-4 text-base">Registracije tokom vremena</h2>
          {overTimeData.length > 0 ? (
            <div className="h-72" role="img" aria-label="Grafikon registracija tokom vremena">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={overTimeData} margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="week" className="text-xs" tick={{ fontSize: 11 }} />
                  <YAxis className="text-xs" allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 13 }} labelStyle={{ fontWeight: 600 }} />
                  <Line type="monotone" dataKey="registrations" stroke="hsl(var(--success))" strokeWidth={2.5} dot={{ fill: "hsl(var(--success))", r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (<p className="text-muted-foreground text-center py-12 text-sm">Nema podataka o registracijama.</p>)}
        </div>
      </div>

      <div className="bg-card rounded-xl p-5 sm:p-6">
        <h2 className="font-display font-semibold mb-4 text-base">Pregled evenata po statusu</h2>
        <div className="grid grid-cols-3 gap-4">
          {eventsByStatus.map((item) => (
            <div key={item.name} className="text-center p-4 rounded-xl bg-muted/30">
              <p className="text-2xl font-display font-bold">{item.value}</p>
              <p className="text-sm text-muted-foreground">{item.name}</p>
            </div>
          ))}
          {eventsByStatus.length === 0 && (<p className="col-span-3 text-muted-foreground text-center py-8 text-sm">Nema evenata.</p>)}
        </div>
      </div>

      <div className="bg-card rounded-xl p-5 sm:p-6">
        <h2 className="font-display font-semibold mb-4 text-base">Status registracija</h2>
        {registrationsByStatus.length > 0 ? (
          <div className="h-64" role="img" aria-label="Status registracija">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={registrationsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={80} label>
                  {registrationsByStatus.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 13 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (<p className="text-muted-foreground text-center py-12 text-sm">Nema podataka.</p>)}
      </div>
    </>
  );
}

function PartnersTab({ partners }: { partners: any[] }) {
  const partnersByCategory = useMemo(() => {
    const cats = { company: 0, media: 0, sponsor: 0 };
    partners.forEach((p) => { if (cats[p.category] !== undefined) cats[p.category]++; });
    return [
      { name: "Kompanije", value: cats.company, color: COLORS[0] },
      { name: "Mediji", value: cats.media, color: COLORS[1] },
      { name: "Sponzori", value: cats.sponsor, color: COLORS[2] },
    ].filter((c) => c.value > 0);
  }, [partners]);

  const partnersByPackage = useMemo(() => {
    const pkgs: Record<string, number> = {};
    partners.forEach((p) => { const pkg = p.package || "standard"; pkgs[pkg] = (pkgs[pkg] || 0) + 1; });
    return Object.entries(pkgs).map(([pkg, count], i) => ({
      name: pkg.charAt(0).toUpperCase() + pkg.slice(1),
      value: count,
      color: COLORS[i % COLORS.length],
    }));
  }, [partners]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="bg-card rounded-xl p-5 sm:p-6">
        <h2 className="font-display font-semibold mb-4 text-base">Partneri po kategoriji</h2>
        {partnersByCategory.length > 0 ? (
          <div className="h-64" role="img" aria-label="Partneri po kategoriji">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={partnersByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {partnersByCategory.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (<p className="text-muted-foreground text-center py-12 text-sm">Nema partnera.</p>)}
      </div>
      <div className="bg-card rounded-xl p-5 sm:p-6">
        <h2 className="font-display font-semibold mb-4 text-base">Partneri po paketu</h2>
        {partnersByPackage.length > 0 ? (
          <div className="h-64" role="img" aria-label="Partneri po paketu">
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
        ) : (<p className="text-muted-foreground text-center py-12 text-sm">Nema podataka.</p>)}
      </div>
    </div>
  );
}

function TrafficTab({ pageViews }: { pageViews: any[] }) {
  const topSources = useMemo(() => {
    const map: Record<string, number> = {};
    pageViews.forEach((pv) => { const src = pv.referrer_domain || "Direktno"; map[src] = (map[src] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [pageViews]);

  const sourcesByPage = useMemo(() => {
    const pageMap: Record<string, Record<string, number>> = {};
    pageViews.forEach((pv) => {
      const src = pv.referrer_domain || "Direktno";
      if (!pageMap[pv.path]) pageMap[pv.path] = {};
      pageMap[pv.path][src] = (pageMap[pv.path][src] || 0) + 1;
    });
    return Object.entries(pageMap).map(([path, sources]) => {
      const sorted = Object.entries(sources).sort((a, b) => b[1] - a[1]);
      const total = sorted.reduce((s, [, v]) => s + v, 0);
      return { path, total, top: sorted.slice(0, 3) };
    }).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [pageViews]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="bg-card rounded-xl p-5 sm:p-6">
        <h2 className="font-display font-semibold mb-1 text-base">Top izvori prometa (30 dana)</h2>
        <p className="text-xs text-muted-foreground mb-4">Odakle posjetitelji dolaze na sajt</p>
        {topSources.length > 0 ? (
          <div className="h-72" role="img" aria-label="Top izvori prometa">
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
        ) : (<p className="text-muted-foreground text-center py-12 text-sm">Još nema podataka o posjetama.</p>)}
      </div>
      <div className="bg-card rounded-xl p-5 sm:p-6">
        <h2 className="font-display font-semibold mb-1 text-base">Izvori po stranicama</h2>
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
                    <span key={src} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{src} · {count}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (<p className="text-muted-foreground text-center py-12 text-sm">Još nema podataka.</p>)}
      </div>
    </div>
  );
}

function PerformanceTab() {
  const { data: perfMetrics = [], isLoading } = usePerformanceMetrics(7);
  const perfSummary = usePerformanceSummary(perfMetrics);
  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" aria-label="Učitavanje" /></div>;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {perfSummary.map((metric) => (
        <div key={metric.name} className="bg-card rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1.5">{metric.name}</p>
          <p className="text-2xl font-display font-bold">
            {metric.count ? (metric.name === "CLS" ? metric.avg.toFixed(3) : `${Math.round(metric.avg)}ms`) : "—"}
          </p>
          <p className={`text-xs mt-2 ${metric.rating === "good" ? "text-success" : metric.rating === "poor" ? "text-destructive" : "text-warning"}`}>
            {metric.count ? metric.rating : "nema mjerenja"}
          </p>
        </div>
      ))}
    </div>
  );
}

function FinanceTab() {
  const treasury = useTreasury();
  return <FinanceAnalytics treasury={treasury} />;
}

// ---------- Finance analytics (admin only) ----------
function FinanceAnalytics({ treasury }: { treasury: ReturnType<typeof useTreasury> }) {
  const { breakdown, grandTotal, partners, pkgTypes, prices, isLoading } = treasury;
  const currency = breakdown[0]?.currency || "BAM";
  const fmt = (n: number) => `${Math.round(n).toLocaleString("bs-BA")} ${currency}`;

  // Revenue per year (asc for trend)
  const revenueByYear = [...breakdown].sort((a, b) => a.year - b.year).map((b) => ({
    year: String(b.year),
    revenue: Math.round(b.total),
    partners: b.partnerCount,
  }));

  // Stacked by package per year
  const packageKeys = pkgTypes.map((t) => t.key);
  const stacked = [...breakdown].sort((a, b) => a.year - b.year).map((b) => {
    const row: Record<string, number | string> = { year: String(b.year) };
    packageKeys.forEach((k) => { row[k] = Math.round(b.byPackage[k]?.revenue || 0); });
    return row;
  });

  // Top partners by lifetime contribution
  const topPartners = partners
    .map((p) => {
      const total = (p.participations ?? []).reduce((s, pp) => {
        if (!pp.package) return s;
        const t = pkgTypes.find((x) => x.key === pp.package);
        const useCustom = t?.is_custom || pp.custom_price != null;
        const price = prices.find((pr) => pr.year === pp.year && pr.package === pp.package);
        const amt = useCustom ? Number(pp.custom_price ?? 0) : price ? Number(price.price) : 0;
        return s + amt;
      }, 0);
      const years = (p.participations ?? []).filter((pp) => pp.package).length;
      return { name: p.name, total: Math.round(total), years };
    })
    .filter((p) => p.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Total revenue by package (across all years)
  const revByPackage = packageKeys
    .map((k, i) => {
      const t = pkgTypes.find((x) => x.key === k);
      const total = breakdown.reduce((s, b) => s + (b.byPackage[k]?.revenue || 0), 0);
      return { name: t?.label || k, value: Math.round(total), color: COLORS[i % COLORS.length] };
    })
    .filter((d) => d.value > 0);

  const avgPerPartner = partners.length > 0 ? grandTotal / partners.length : 0;
  const bestYear = [...breakdown].sort((a, b) => b.total - a.total)[0];

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5">
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Ukupni prihod (svi mandati)", value: fmt(grandTotal) },
          { label: "Aktivnih godina", value: String(breakdown.length) },
          { label: "Prosjek po partneru", value: fmt(avgPerPartner) },
          { label: "Najbolja godina", value: bestYear ? `${bestYear.year} · ${fmt(bestYear.total)}` : "—" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1.5">{s.label}</p>
            <p className="text-xl font-display font-bold truncate">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card rounded-xl p-5 sm:p-6">
          <h3 className="font-display font-semibold mb-1">Prihod po godini</h3>
          <p className="text-xs text-muted-foreground mb-4">Ukupno {currency} sakupljeno po mandatu</p>
          {revenueByYear.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByYear} margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="year" className="text-xs" tick={{ fontSize: 11 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 13 }}
                    formatter={(v: number) => fmt(v)}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12 text-sm">Još nema podataka.</p>
          )}
        </div>

        <div className="bg-card rounded-xl p-5 sm:p-6">
          <h3 className="font-display font-semibold mb-1">Prihod po paketu (svi mandati)</h3>
          <p className="text-xs text-muted-foreground mb-4">Koji paket donosi najviše</p>
          {revByPackage.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={revByPackage} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} label={({ name, value }) => `${name}: ${fmt(value as number)}`}>
                    {revByPackage.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 13 }}
                    formatter={(v: number) => fmt(v)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12 text-sm">Još nema podataka.</p>
          )}
        </div>
      </div>

      <div className="bg-card rounded-xl p-5 sm:p-6">
        <h3 className="font-display font-semibold mb-1">Struktura prihoda po godinama (paket vs. paket)</h3>
        <p className="text-xs text-muted-foreground mb-4">Stacked: vidi se odnos paketa kroz mandate</p>
        {stacked.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stacked} margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="year" className="text-xs" tick={{ fontSize: 11 }} />
                <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 13 }} formatter={(v: number) => fmt(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {packageKeys.map((k, i) => {
                  const t = pkgTypes.find((x) => x.key === k);
                  return <Bar key={k} dataKey={k} stackId="rev" name={t?.label || k} fill={COLORS[i % COLORS.length]} radius={i === packageKeys.length - 1 ? [6, 6, 0, 0] : 0} />;
                })}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-12 text-sm">Još nema podataka.</p>
        )}
      </div>

      <div className="bg-card rounded-xl p-5 sm:p-6">
        <h3 className="font-display font-semibold mb-1">Top 10 partnera po doprinosu</h3>
        <p className="text-xs text-muted-foreground mb-4">Lifetime vrijednost partnerstva</p>
        {topPartners.length > 0 ? (
          <div className="space-y-2">
            {topPartners.map((p, i) => {
              const max = topPartners[0].total || 1;
              const pct = (p.total / max) * 100;
              return (
                <div key={p.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{i + 1}. {p.name}</span>
                    <span className="text-muted-foreground shrink-0 ml-2">{fmt(p.total)} <span className="text-[11px]">· {p.years}g</span></span>
                  </div>
                  <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-12 text-sm">Još nema podataka.</p>
        )}
      </div>
    </div>
  );
}
