import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface GalleryImage {
  id: string;
  title: string;
  image_url: string;
  display_order: number;
  visible: boolean;
  user_id: string;
  created_at: string;
}

export function useGalleryImages(onlyVisible = false) {
  return useQuery({
    queryKey: ["gallery-images", onlyVisible],
    queryFn: async () => {
      let query = supabase
        .from("gallery_images" as any)
        .select("*")
        .order("display_order", { ascending: true });
      if (onlyVisible) query = query.eq("visible", true);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as GalleryImage[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useCreateGalleryImage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (img: Omit<GalleryImage, "id" | "user_id" | "created_at">) => {
      const { error } = await supabase
        .from("gallery_images" as any)
        .insert({ ...img, user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gallery-images"] }); toast.success("Slika dodana!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteGalleryImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gallery_images" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gallery-images"] }); toast.success("Slika obrisana!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export async function uploadGalleryImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("gallery").upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("gallery").getPublicUrl(path);
  return data.publicUrl;
}
