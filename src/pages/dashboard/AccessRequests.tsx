import { useAccessRequests, useUpdateAccessRequest } from "@/hooks/useAccessRequests";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock, Building2, Mail, User } from "lucide-react";

export default function AccessRequests() {
  const { data: requests = [], isLoading } = useAccessRequests();
  const updateRequest = useUpdateAccessRequest();

  const handleUpdate = async (id: string, status: string) => {
    try {
      await updateRequest.mutateAsync({ id, status });
      toast.success(status === "approved" ? "Zahtjev odobren!" : "Zahtjev odbijen.");
    } catch {
      toast.error("Greška pri ažuriranju zahtjeva.");
    }
  };

  const pending = requests.filter((r) => r.status === "pending");
  const processed = requests.filter((r) => r.status !== "pending");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Zahtjevi za pristup</h1>
        <p className="text-muted-foreground mt-1">Pregled i odobravanje zahtjeva za registraciju.</p>
      </div>

      {/* Pending */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Na čekanju ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-border/50 rounded-2xl">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Nema zahtjeva na čekanju.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((req, i) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 sm:p-5 rounded-2xl border border-border/50 bg-card"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground truncate">{req.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground truncate">{req.email}</span>
                    </div>
                    {req.company_name && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm text-muted-foreground">{req.company_name}</span>
                        {req.company_domain && (
                          <span className="text-xs text-muted-foreground/60">({req.company_domain})</span>
                        )}
                      </div>
                    )}
                    {req.message && (
                      <p className="text-sm text-muted-foreground mt-2 bg-muted/50 rounded-lg p-2">{req.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground/60">
                      {new Date(req.created_at).toLocaleDateString("bs-BA", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="rounded-full gap-1.5"
                      onClick={() => handleUpdate(req.id, "approved")}
                      disabled={updateRequest.isPending}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Odobri
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full gap-1.5"
                      onClick={() => handleUpdate(req.id, "rejected")}
                      disabled={updateRequest.isPending}
                    >
                      <XCircle className="w-4 h-4" />
                      Odbij
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Processed */}
      {processed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Obrađeni ({processed.length})
          </h2>
          <div className="space-y-2">
            {processed.map((req) => (
              <div key={req.id} className="flex items-center gap-3 p-3 sm:p-4 rounded-xl border border-border/30 bg-card/50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{req.full_name}</span>
                    <span className="text-xs text-muted-foreground truncate hidden sm:inline">{req.email}</span>
                  </div>
                  {req.company_name && (
                    <span className="text-xs text-muted-foreground">{req.company_name}</span>
                  )}
                </div>
                <Badge variant={req.status === "approved" ? "default" : "destructive"} className="rounded-full text-xs">
                  {req.status === "approved" ? "Odobreno" : "Odbijeno"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
