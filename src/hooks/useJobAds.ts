import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface JobAd {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  company_name: string;
  deadline: string | null;
  image_url: string | null;
  external_link: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export function useJobAds(onlyPublished = false) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["job-ads", onlyPublished, user?.id],
    queryFn: async () => {
      let query = supabase
        .from("job_ads")
        .select("*")
        .order("created_at", { ascending: false });

      if (onlyPublished) {
        query = query.eq("published", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as JobAd[];
    },
  });
}

export function useCreateJobAd() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (ad: {
      title: string;
      description?: string;
      company_name: string;
      deadline?: string;
      image_url?: string;
      external_link?: string;
      published?: boolean;
    }) => {
      const { error } = await supabase
        .from("job_ads")
        .insert({ ...ad, user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-ads"] });
      toast.success("Oglas kreiran!");
    },
    onError: (err: any) => toast.error(err.message),
  });
}

export function useUpdateJobAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Omit<JobAd, "id" | "user_id" | "created_at" | "updated_at">>) => {
      const { error } = await supabase
        .from("job_ads")
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-ads"] });
      toast.success("Oglas ažuriran!");
    },
    onError: (err: any) => toast.error(err.message),
  });
}

export function useDeleteJobAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("job_ads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-ads"] });
      toast.success("Oglas obrisan!");
    },
    onError: (err: any) => toast.error(err.message),
  });
}

export async function uploadJobAdImage(file: File): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const ext = file.name.split(".").pop();
  const path = `${user.id}/job-ads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from("news-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from("news-images").getPublicUrl(path);
  return data.publicUrl;
}
