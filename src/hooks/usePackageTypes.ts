import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PackageType {
  key: string;
  label: string;
  color_class: string;
  sort_order: number;
  is_custom: boolean;
}

export function usePackageTypes() {
  return useQuery({
    queryKey: ["package-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("package_types" as any)
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as PackageType[];
    },
  });
}

export function useUpsertPackageType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: PackageType) => {
      const { error } = await supabase
        .from("package_types" as any)
        .upsert(p as any, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["package-types"] });
      qc.invalidateQueries({ queryKey: ["partners"] });
      qc.invalidateQueries({ queryKey: ["package-prices"] });
      toast.success("Paket spremljen");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeletePackageType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      const { error } = await supabase.from("package_types" as any).delete().eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["package-types"] });
      qc.invalidateQueries({ queryKey: ["partners"] });
      qc.invalidateQueries({ queryKey: ["package-prices"] });
      toast.success("Paket obrisan");
    },
    onError: (e: any) => toast.error(e.message),
  });
}
