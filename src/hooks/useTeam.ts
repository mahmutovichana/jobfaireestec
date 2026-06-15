import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PhotoCrop {
  x: number;
  y: number;
  zoom?: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  committee: string;
  photo_url: string | null;
  photo_crop: PhotoCrop | null;
  linkedin_url: string | null;
  email: string | null;
  phone: string | null;
  display_order: number;
  visible: boolean;
  year: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  gender: string | null;
  position_key: string | null;
}

export function getPhotoPosition(crop?: PhotoCrop | null): string {
  if (!crop) return "50% 50%";
  return `${crop.x}% ${crop.y}%`;
}

export function getPhotoStyle(crop?: PhotoCrop | null): React.CSSProperties {
  if (!crop) return { objectPosition: "50% 50%" };
  const zoom = crop.zoom && crop.zoom > 1 ? crop.zoom : 1;
  return {
    objectPosition: `${crop.x}% ${crop.y}%`,
    transform: zoom !== 1 ? `scale(${zoom})` : undefined,
    transformOrigin: `${crop.x}% ${crop.y}%`,
  };
}

export function useTeamMembers(onlyVisible = false) {
  return useQuery({
    queryKey: ["team-members", onlyVisible],
    queryFn: async () => {
      // Public/visible-only path uses the email/phone-free view (safe for anon).
      if (onlyVisible) {
        const { data, error } = await supabase
          .from("public_team_members" as any)
          .select("*")
          .order("display_order", { ascending: true });
        if (error) throw error;
        return (data ?? []) as unknown as TeamMember[];
      }
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as TeamMember[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useCreateTeamMember() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (m: Omit<TeamMember, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { error } = await supabase
        .from("team_members")
        .insert({ ...m, user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["team-members"] }); toast.success("Član dodan!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...u }: Partial<TeamMember> & { id: string }) => {
      const { error } = await supabase
        .from("team_members")
        .update(u as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["team-members"] }); toast.success("Član ažuriran!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("team_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["team-members"] }); toast.success("Član obrisan!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export async function uploadTeamPhoto(file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("team-photos").upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("team-photos").getPublicUrl(path);
  return data.publicUrl;
}
