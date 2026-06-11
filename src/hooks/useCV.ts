import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CVSubmission {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  faculty: string | null;
  year_of_study: string | null;
  cv_url: string;
  created_at: string;
}

export function useCVSubmissions() {
  return useQuery({
    queryKey: ["cv-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cv_submissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CVSubmission[];
    },
  });
}

export function useCreateCVSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (submission: Omit<CVSubmission, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("cv_submissions")
        .insert(submission as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cv-submissions"] }),
  });
}

export function useDeleteCV() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cv_submissions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cv-submissions"] }),
  });
}

export async function uploadCV(file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  // Scope each upload to its own UUID folder so anonymous submitters cannot
  // overwrite another visitor's CV by reusing a file name.
  const uuid = (globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `submissions/${uuid}/${safeName || `cv.${ext}`}`;
  const { error } = await supabase.storage
    .from("cv-uploads")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  // Return the path - authenticated users will create signed URLs to access
  return path;
}
