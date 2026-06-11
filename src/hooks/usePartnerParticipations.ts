import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PartnerPackage } from "@/hooks/usePartners";

export function useAddParticipation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { partner_id: string; year: number; package: PartnerPackage | null; custom_price?: number | null; currency?: string }) => {
      const { error } = await supabase
        .from("partner_participations")
        .upsert(p as any, { onConflict: "partner_id,year" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partners"] });
      qc.invalidateQueries({ queryKey: ["treasury"] });
      toast.success("Godina dodana");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateParticipation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { id: string; package?: PartnerPackage | null; custom_price?: number | null; currency?: string }) => {
      const { id, ...rest } = p;
      const { error } = await supabase
        .from("partner_participations")
        .update(rest as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partners"] });
      qc.invalidateQueries({ queryKey: ["treasury"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useBatchUpsertParticipations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: { partner_id: string; year: number; package: PartnerPackage | null; custom_price?: number | null; currency?: string }[]) => {
      if (rows.length === 0) return;
      const { error } = await supabase
        .from("partner_participations")
        .upsert(rows as any, { onConflict: "partner_id,year" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partners"] });
      qc.invalidateQueries({ queryKey: ["treasury"] });
      toast.success("Godine dodane");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteParticipation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("partner_participations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partners"] });
      qc.invalidateQueries({ queryKey: ["treasury"] });
      toast.success("Obrisano");
    },
    onError: (e: any) => toast.error(e.message),
  });
}