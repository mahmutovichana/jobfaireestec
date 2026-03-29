import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  committee: string;
  photo_url: string | null;
  linkedin_url: string | null;
  display_order: number;
  visible: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export function useTeamMembers(onlyVisible = false) {
  return useQuery({
    queryKey: ["team-members", onlyVisible],
    queryFn: async () => {
      let query = supabase
        .from("team_members")
        .select("*")
        .order("display_order", { ascending: true });
      if (onlyVisible) query = query.eq("visible", true);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as TeamMember[];
    },
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
      return data;
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
      return data;
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
