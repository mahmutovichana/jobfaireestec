import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PartnerPackage } from "@/hooks/usePartners";

export interface PackagePrice {
  id: string;
  year: number;
  package: PartnerPackage;
  price: number;
  currency: string;
  notes: string | null;
}

export function usePackagePrices() {
  return useQuery({
    queryKey: ["package-prices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("package_prices" as any)
        .select("*")
        .order("year", { ascending: false })
        .order("package", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as PackagePrice[];
    },
  });
}

export function useUpsertPackagePrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { year: number; package: PartnerPackage; price: number; currency?: string }) => {
      const { error } = await supabase
        .from("package_prices" as any)
        .upsert(
          { year: p.year, package: p.package, price: p.price, currency: p.currency ?? "BAM" } as any,
          { onConflict: "year,package" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["package-prices"] });
      qc.invalidateQueries({ queryKey: ["treasury"] });
      toast.success("Cijena spremljena");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeletePackagePrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("package_prices" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["package-prices"] });
      qc.invalidateQueries({ queryKey: ["treasury"] });
      toast.success("Obrisano");
    },
    onError: (e: any) => toast.error(e.message),
  });
}