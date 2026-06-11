import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AuditLog = {
  id: string;
  actor_id: string;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export function useAuditLogs(filters?: { entity_type?: string; limit?: number }) {
  return useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(filters?.limit ?? 200);

      if (filters?.entity_type) {
        query = query.eq("entity_type", filters.entity_type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as AuditLog[];
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });
}

export function useLogAction() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      action: string;
      entity_type: string;
      entity_id?: string;
      metadata?: Record<string, unknown>;
    }) => {
      if (!user) return;
      const { error } = await supabase.from("audit_logs").insert({
        actor_id: user.id,
        actor_email: user.email ?? null,
        action: input.action,
        entity_type: input.entity_type,
        entity_id: input.entity_id ?? null,
        metadata: input.metadata ?? {},
      } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["audit-logs"] }),
  });
}
