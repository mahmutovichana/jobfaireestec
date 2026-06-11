import { useState, useMemo } from "react";
import { useAuditLogs, AuditLog } from "@/hooks/useAuditLog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Clock, User, FileText, Handshake, ShieldCheck, Newspaper, Megaphone, UsersRound, CalendarDays, Activity, TrendingUp, Users, Search, X } from "lucide-react";

const ENTITY_TYPES = [
  { value: "all", label: "Sve" },
  { value: "access_requests", label: "Zahtjevi" },
  { value: "partners", label: "Partneri" },
  { value: "events", label: "Događaji" },
  { value: "news_posts", label: "Novosti" },
  { value: "job_ads", label: "Oglasi" },
  { value: "team_members", label: "Tim" },
  { value: "profile", label: "Profili" },
];

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  approved: { label: "Odobreno", color: "bg-emerald-500/10 text-emerald-600" },
  rejected: { label: "Odbijeno", color: "bg-red-500/10 text-red-600" },
  created: { label: "Kreirano", color: "bg-blue-500/10 text-blue-600" },
  updated: { label: "Ažurirano", color: "bg-amber-500/10 text-amber-600" },
  deleted: { label: "Obrisano", color: "bg-red-500/10 text-red-600" },
  published: { label: "Objavljeno", color: "bg-emerald-500/10 text-emerald-600" },
  unpublished: { label: "Povučeno", color: "bg-gray-500/10 text-gray-600" },
};

const ENTITY_ICONS: Record<string, React.ElementType> = {
  access_requests: ShieldCheck,
  partners: Handshake,
  events: CalendarDays,
  news_posts: Newspaper,
  job_ads: Megaphone,
  team_members: UsersRound,
  profile: User,
};

const META_LABELS: Record<string, string> = {
  display_name: "Naziv",
  name: "Naziv",
  old_name: "Stari naziv",
  title: "Naslov",
  full_name: "Ime",
  email: "Email",
  status: "Status",
  company_name: "Firma",
  published: "Objavljeno",
};

const FIELD_LABELS: Record<string, string> = {
  full_name: "Ime i prezime",
  first_name: "Ime",
  last_name: "Prezime",
  email: "Email",
  phone: "Telefon",
  title: "Naslov",
  summary: "Sažetak",
  content: "Sadržaj",
  description: "Opis",
  position: "Pozicija",
  position_id: "Pozicija",
  gender: "Spol",
  year: "Godina",
  status: "Status",
  published: "Objavljeno",
  photo_url: "Fotografija",
  photo_crop: "Kadriranje fotografije",
  sort_order: "Redoslijed",
  thumbnail_url: "Thumbnail",
  gallery_urls: "Galerija",
  company_name: "Naziv firme",
  company_domain: "Domena firme",
  message: "Poruka",
  deadline: "Krajnji rok",
  location: "Lokacija",
  start_date: "Datum početka",
  end_date: "Datum završetka",
  capacity: "Kapacitet",
  notes: "Bilješke",
};

function fieldLabel(key: string) {
  return FIELD_LABELS[key] ?? key.replace(/_/g, " ");
}

function formatFieldValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Da" : "Ne";
  if (Array.isArray(v)) return v.length ? `[${v.length}] ${JSON.stringify(v).slice(0, 60)}` : "[]";
  if (typeof v === "object") return JSON.stringify(v).slice(0, 120);
  const s = String(v);
  return s.length > 160 ? s.slice(0, 160) + "…" : s;
}

function ChangesDisplay({ changes }: { changes: Record<string, { old: unknown; new: unknown }> }) {
  const entries = Object.entries(changes);
  if (entries.length === 0) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wide">
        Izmijenjena polja ({entries.length})
      </p>
      <div className="space-y-1.5">
        {entries.map(([key, diff]) => (
          <div key={key} className="rounded-lg border border-border/40 bg-muted/30 p-2 text-[11px]">
            <p className="font-semibold text-foreground mb-1">{fieldLabel(key)}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <div className="rounded-md bg-red-500/5 border border-red-500/15 p-1.5">
                <span className="text-[10px] uppercase text-red-600/80 font-medium">Prije</span>
                <p className="text-foreground/80 break-words mt-0.5 line-clamp-3">
                  {formatFieldValue(diff?.old)}
                </p>
              </div>
              <div className="rounded-md bg-emerald-500/5 border border-emerald-500/15 p-1.5">
                <span className="text-[10px] uppercase text-emerald-600/80 font-medium">Sada</span>
                <p className="text-foreground/80 break-words mt-0.5 line-clamp-3">
                  {formatFieldValue(diff?.new)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getActionBadge(action: string) {
  const info = ACTION_LABELS[action] ?? { label: action, color: "bg-muted text-muted-foreground" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${info.color}`}>{info.label}</span>;
}

function getEntityLabel(type: string) {
  return ENTITY_TYPES.find(e => e.value === type)?.label ?? type;
}

function formatRelative(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Upravo sada";
  if (diffMin < 60) return `Prije ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Prije ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `Prije ${diffD}d`;
}

function formatExactTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("bs-BA", { hour: "2-digit", minute: "2-digit" });
}

function MetadataDisplay({ metadata }: { metadata: Record<string, unknown> | null }) {
  if (!metadata || Object.keys(metadata).length === 0) return null;
  const changes = metadata.changes as Record<string, { old: unknown; new: unknown }> | undefined;
  const entries = Object.entries(metadata).filter(([k, v]) =>
    v !== null && v !== undefined && v !== "" && k !== "id" && k !== "changes"
  );
  if (entries.length === 0 && !changes) return null;

  return (
    <div className="mt-2 space-y-2">
      {entries.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 p-2.5 rounded-lg bg-muted/40 border border-border/30">
          {entries.map(([key, value]) => {
            const label = META_LABELS[key] ?? fieldLabel(key);
            const display = formatFieldValue(value);
            return (
              <div key={key} className="flex gap-1.5 text-[11px] min-w-0">
                <span className="text-muted-foreground/70 shrink-0">{label}:</span>
                <span className="text-foreground/80 truncate font-medium">{display}</span>
              </div>
            );
          })}
        </div>
      )}
      {changes && <ChangesDisplay changes={changes} />}
    </div>
  );
}

export default function AuditLogs() {
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  // Filtered view (for the list below)
  const { data: logs = [], isLoading } = useAuditLogs(
    entityFilter !== "all" ? { entity_type: entityFilter, limit: 500 } : { limit: 500 }
  );
  // Always-on full feed for the top KPI cards — independent of active filters,
  // so stats reflect the whole platform and refresh every 30s like the list.
  const { data: allLogs = [] } = useAuditLogs({ limit: 1000 });

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (actionFilter !== "all" && log.action !== actionFilter) return false;
      if (dateFrom && new Date(log.created_at) < new Date(dateFrom)) return false;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (new Date(log.created_at) > end) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const meta = JSON.stringify(log.metadata ?? "").toLowerCase();
        const hay = `${log.actor_email ?? ""} ${log.entity_type} ${log.action} ${meta}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [logs, actionFilter, dateFrom, dateTo, search]);

  const stats = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const last24h = allLogs.filter(l => now - new Date(l.created_at).getTime() < dayMs).length;
    const last7d = allLogs.filter(l => now - new Date(l.created_at).getTime() < 7 * dayMs).length;
    const uniqueActors = new Set(allLogs.map(l => l.actor_email).filter(Boolean)).size;
    return { total: allLogs.length, last24h, last7d, uniqueActors };
  }, [allLogs]);

  const grouped = useMemo(() => {
    const groups: Record<string, AuditLog[]> = {};
    filteredLogs.forEach(log => {
      const d = new Date(log.created_at);
      const today = new Date();
      const yesterday = new Date(today.getTime() - 86400000);
      let key: string;
      if (d.toDateString() === today.toDateString()) key = "Danas";
      else if (d.toDateString() === yesterday.toDateString()) key = "Jučer";
      else key = d.toLocaleDateString("bs-BA", { day: "numeric", month: "long", year: "numeric" });
      (groups[key] ||= []).push(log);
    });
    return groups;
  }, [filteredLogs]);

  const resetFilters = () => {
    setEntityFilter("all");
    setActionFilter("all");
    setSearch("");
    setDateFrom("");
    setDateTo("");
  };

  const hasFilters = entityFilter !== "all" || actionFilter !== "all" || search || dateFrom || dateTo;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Audit logovi</h1>
        <p className="text-muted-foreground text-sm mt-1">Pregled svih admin akcija na platformi.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Ukupno akcija", value: stats.total, icon: Activity, color: "text-blue-500" },
          { label: "Posljednja 24h", value: stats.last24h, icon: Clock, color: "text-emerald-500" },
          { label: "Posljednjih 7 dana", value: stats.last7d, icon: TrendingUp, color: "text-amber-500" },
          { label: "Aktivnih korisnika", value: stats.uniqueActors, icon: Users, color: "text-violet-500" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-border/50 bg-card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-foreground leading-tight">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-border/50 bg-card p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Pretraži po email-u, akciji, sadržaju..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 rounded-full text-sm"
          />
        </div>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-36 rounded-full h-9 text-sm"><SelectValue placeholder="Tip" /></SelectTrigger>
          <SelectContent>
            {ENTITY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-36 rounded-full h-9 text-sm"><SelectValue placeholder="Akcija" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Sve akcije</SelectItem>
            {Object.entries(ACTION_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 rounded-full text-sm w-40"
            placeholder="Od"
          />
          <span className="text-muted-foreground text-xs">do</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 rounded-full text-sm w-40"
          />
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9 rounded-full gap-1">
            <X className="w-3.5 h-3.5" /> Reset
          </Button>
        )}
      </div>

      {filteredLogs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-border/50 rounded-2xl">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>{hasFilters ? "Nema rezultata za zadane filtere." : "Nema zabilježenih akcija."}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([day, items]) => (
            <div key={day}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-semibold text-foreground">{day}</h2>
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-[11px] text-muted-foreground">{items.length} akcija</span>
              </div>
              <div className="relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-border/40 space-y-2">
                {items.map((log, i) => {
                  const Icon = ENTITY_ICONS[log.entity_type] ?? FileText;
                  const meta = (log.metadata ?? {}) as Record<string, unknown>;
                  const summary = (meta.display_name || meta.name || meta.old_name || meta.title || meta.full_name) as string | undefined;
                  const hasDetails = Object.keys(meta).length > 0;
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.01, 0.15) }}
                      className="relative flex items-start gap-3 p-3 rounded-xl border border-border/40 bg-card hover:border-primary/30 hover:shadow-sm transition-all"
                    >
                      <span className="absolute -left-[19px] top-4 w-2.5 h-2.5 rounded-full bg-background border-2 border-primary/40" />
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {getActionBadge(log.action)}
                          <span className="text-xs font-medium text-foreground">{getEntityLabel(log.entity_type)}</span>
                          {summary && (
                            <span className="text-xs text-foreground/70 truncate">— <span className="font-semibold">{summary}</span></span>
                          )}
                          <span className="ml-auto text-[11px] text-muted-foreground shrink-0 tabular-nums">
                            {formatExactTime(log.created_at)} · {formatRelative(log.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
                          <User className="w-3 h-3" />
                          <span className="truncate">{log.actor_email ?? "Nepoznat"}</span>
                          {log.entity_id && (
                            <>
                              <span className="text-muted-foreground/40">•</span>
                              <span className="font-mono text-[10px] text-muted-foreground/60 truncate">{log.entity_id.slice(0, 8)}</span>
                            </>
                          )}
                        </div>
                        {hasDetails && <MetadataDisplay metadata={meta} />}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
