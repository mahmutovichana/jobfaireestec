import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

type ReorderTable = "partners" | "team_members";

export function useReorderItems(table: ReorderTable, queryKey: string[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const { error } = await api.rpc("reorder_entities", {
        table,
        ids: orderedIds,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success("Redoslijed sačuvan");
    },
    onError: (e: any) =>
      toast.error(e.message || "Greška pri spašavanju redoslijeda"),
  });
}
