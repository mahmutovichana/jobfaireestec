import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function usePendingPartners() {
  return useQuery({
    queryKey: ["pending-partners"],
    queryFn: async () => {
      const { data, error } = await api
        .from("partners")
        .select("*")
        .eq("visible", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useApprovePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api
        .from("partners")
        .update({ visible: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-partners"] });
      queryClient.invalidateQueries({ queryKey: ["partners"] });
    },
  });
}

export function useRejectPartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api
        .from("partners")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-partners"] });
      queryClient.invalidateQueries({ queryKey: ["partners"] });
    },
  });
}
