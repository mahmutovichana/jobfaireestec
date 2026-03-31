import { useState } from "react";
import { useAuditLogs, AuditLog } from "@/hooks/useAuditLog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Clock, Filter, User, FileText, Handshake, ShieldCheck, Newspaper, Megaphone, UsersRound, CalendarDays, BarChart3 } from "lucide-react";

const ENTITY_TYPES = [
  { value: "all", label: "Sve" },
  { value: "access_request", label: "Zahtjevi" },
  { value: "partner", label: "Partneri" },
  { value: "event", label: "Događaji" },
  { value: "news", label: "Novosti" },
  { value: "job_ad", label: "Oglasi" },
  { value: "team_member", label: "Tim" },
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
  access_request: ShieldCheck,
  partner: Handshake,
  event: CalendarDays,
  news: Newspaper,
  job_ad: Megaphone,
  team_member: UsersRound,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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

      {logs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-border/50 rounded-2xl">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Nema zabilježenih akcija.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log, i) => {
            const Icon = ENTITY_ICONS[log.entity_type] ?? FileText;
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className="flex items-start gap-3 p-3 sm:p-4 rounded-xl border border-border/30 bg-card/50 hover:bg-card transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {getActionBadge(log.action)}
                    <span className="text-sm text-muted-foreground">{getEntityLabel(log.entity_type)}</span>
                    {log.entity_id && (
                      <span className="text-xs text-muted-foreground/50 font-mono truncate max-w-[120px]">{log.entity_id.slice(0, 8)}…</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span className="truncate">{log.actor_email ?? "Nepoznat"}</span>
                    <span className="text-muted-foreground/40">•</span>
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(log.created_at)}</span>
                  </div>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <p className="text-xs text-muted-foreground/60 mt-1 font-mono bg-muted/50 rounded px-2 py-1 break-all">
                      {JSON.stringify(log.metadata)}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
