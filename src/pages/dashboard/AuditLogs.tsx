import { useState, useMemo } from "react";
import { useAuditLogs, AuditLog } from "@/hooks/useAuditLog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Clock, Filter, User, FileText, Handshake, ShieldCheck, Newspaper, Megaphone, UsersRound, CalendarDays, Activity, TrendingUp, Users } from "lucide-react";

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

function getActionBadge(action: string) {
  const info = ACTION_LABELS[action] ?? { label: action, color: "bg-muted text-muted-foreground" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${info.color}`}>{info.label}</span>;
}

function getEntityLabel(type: string) {
  return ENTITY_TYPES.find(e => e.value === type)?.label ?? type;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Upravo sada";
  if (diffMin < 60) return `Prije ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Prije ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `Prije ${diffD}d`;
  return d.toLocaleDateString("bs-BA", { day: "numeric", month: "short", year: "numeric" });
}

export default function AuditLogs() {
  const [entityFilter, setEntityFilter] = useState("all");
  const { data: logs = [], isLoading } = useAuditLogs(
    entityFilter !== "all" ? { entity_type: entityFilter } : undefined
  );

  const stats = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const last24h = logs.filter(l => now - new Date(l.created_at).getTime() < dayMs).length;
    const last7d = logs.filter(l => now - new Date(l.created_at).getTime() < 7 * dayMs).length;
    const uniqueActors = new Set(logs.map(l => l.actor_email).filter(Boolean)).size;
    return { total: logs.length, last24h, last7d, uniqueActors };
  }, [logs]);

  const grouped = useMemo(() => {
    const groups: Record<string, AuditLog[]> = {};
    logs.forEach(log => {
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
  }, [logs]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Audit logovi</h1>
          <p className="text-muted-foreground text-sm mt-1">Pregled svih admin akcija na platformi.</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-40 rounded-full h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENTITY_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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

      {logs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-border/50 rounded-2xl">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Nema zabilježenih akcija.</p>
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
              <div className="relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-border/40">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                  {items.map((log, i) => {
                    const Icon = ENTITY_ICONS[log.entity_type] ?? FileText;
                    const meta = log.metadata as any;
                    const summary = meta?.name || meta?.old_name || meta?.title || null;
                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(i * 0.015, 0.2) }}
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
                          </div>
                          {summary && (
                            <p className="text-sm text-foreground/80 mt-1 truncate font-medium">{summary}</p>
                          )}
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
                            <User className="w-3 h-3" />
                            <span className="truncate">{log.actor_email ?? "Nepoznat"}</span>
                            <span className="text-muted-foreground/40">•</span>
                            <span>{formatTime(log.created_at)}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
