import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export function useUserRole() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      if (user?.roles) return user.roles;
      const { data, error } = await api
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data?.map((r) => r.role) ?? [];
    },
    enabled: !!user,
  });
}

export function useIsAdmin() {
  const { data: roles = [], isLoading } = useUserRole();
  return { isAdmin: roles.includes("admin"), isLoading };
}
