import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useAccessRequests() {
  return useQuery({
    queryKey: ["access-requests"],
    queryFn: async () => {
      const { data, error } = await api
        .from("access_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function usePendingRequestCount(enabled: boolean = true) {
  return useQuery({
    queryKey: ["access-requests-pending-count"],
    queryFn: async () => {
      const { count, error } = await api
        .from("access_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      if (error) throw error;
      return count ?? 0;
    },
    enabled,
    staleTime: 60 * 1000,
  });
}

export function useUpdateAccessRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await api
        .from("access_requests")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["access-requests"] });
      queryClient.invalidateQueries({ queryKey: ["access-requests-pending-count"] });
    },
  });
}
