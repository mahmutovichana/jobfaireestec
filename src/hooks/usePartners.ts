import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type PartnerCategory = "company" | "media" | "sponsor";
export type PartnerPackage = string;

export interface Partner {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  description: string | null;
  category: PartnerCategory;
  package: PartnerPackage | null;
  display_order: number;
  visible: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  participations?: PartnerParticipation[];
}

export interface PartnerParticipation {
  id: string;
  partner_id: string;
  year: number;
  package: PartnerPackage | null;
  custom_price?: number | null;
  currency?: string;
}

export const PACKAGE_LABELS: Record<string, string> = {
  gold: "Zlatni",
  silver: "Srebrni",
  standard: "Standardni",
  promo: "Promo",
  custom: "Custom",
};

export const PACKAGE_ORDER: PartnerPackage[] = ["gold", "silver", "standard", "promo", "custom"];

export const CATEGORY_LABELS: Record<PartnerCategory, string> = {
  company: "Kompanije",
  media: "Mediji",
  sponsor: "Sponzori",
};

export async function fetchPartners(onlyVisible = false) {
  // Anon visitors do NOT have column-level SELECT on `custom_price` / `currency`
  // (commercially sensitive — see migration). Request only the publicly safe
  // columns on the public path so PostgREST doesn't reject the embedded query.
  const publicColumns = "id, name, logo_url, website, description, category, package, display_order, visible, user_id, created_at, updated_at, participations:partner_participations(id, partner_id, year, package)";

  let query = supabase
    .from("partners")
    .select(onlyVisible ? publicColumns : "*, participations:partner_participations(id, partner_id, year, package, custom_price, currency)")
    .order("display_order", { ascending: true });

  if (onlyVisible) {
    query = query.eq("visible", true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Partner[];
}

export function usePartners(onlyVisible = false) {
  return useQuery({
    queryKey: ["partners", onlyVisible],
    queryFn: () => fetchPartners(onlyVisible),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useCreatePartner() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (partner: Omit<Partner, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("partners")
        .insert({ ...partner, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast.success("Partner dodan!");
    },
    onError: (err: any) => toast.error(err.message),
  });
}

export function useUpdatePartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Partner> & { id: string }) => {
      const { data, error } = await supabase
        .from("partners")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast.success("Partner ažuriran!");
    },
    onError: (err: any) => toast.error(err.message),
  });
}

export function useDeletePartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("partners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast.success("Partner obrisan!");
    },
    onError: (err: any) => toast.error(err.message),
  });
}

export async function uploadPartnerLogo(file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `logos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from("partner-logos").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from("partner-logos").getPublicUrl(path);
  return data.publicUrl;
}
