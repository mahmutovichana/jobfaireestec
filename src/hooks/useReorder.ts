import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ReorderTable = "partners" | "team_members";

export function useReorderItems(table: ReorderTable, queryKey: string[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      // Update each row with its new display_order
      await Promise.all(
        orderedIds.map((id, index) =>
          supabase.from(table).update({ display_order: index }).eq("id", id)
        )
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success("Redoslijed sačuvan");
    },
    onError: (e: any) => toast.error(e.message || "Greška pri spašavanju redoslijeda"),
  });
}