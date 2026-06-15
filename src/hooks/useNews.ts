import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface NewsPost {
  id: string;
  user_id: string;
  title: string;
  summary: string | null;
  content: string | null;
  thumbnail_url: string | null;
  gallery_urls: string[];
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export const isExpiringInstagramUrl = (url: string | null | undefined) =>
  !!url && /cdninstagram\.com|fbcdn\.net/i.test(url);

export const NEWS_POST_COLUMNS =
  "id, user_id, title, summary, content, thumbnail_url, gallery_urls, published, published_at, created_at, updated_at, instagram_post_id";

export const NEWS_LIST_COLUMNS =
  "id, user_id, title, summary, thumbnail_url, gallery_urls, published, published_at, created_at, updated_at, instagram_post_id";

function normalizeNewsPost(d: any): NewsPost {
  return {
    ...d,
    gallery_urls: Array.isArray(d.gallery_urls) ? d.gallery_urls : [],
  } as NewsPost;
}

export async function fetchNewsPosts(onlyPublished = false, full = false) {
  let query = supabase
    .from("news_posts")
    .select(full ? NEWS_POST_COLUMNS : NEWS_LIST_COLUMNS)
    .order(onlyPublished ? "published_at" : "created_at", { ascending: false, nullsFirst: false });

  if (onlyPublished) {
    query = query.eq("published", true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(normalizeNewsPost);
}

export function useNewsPosts(onlyPublished = false) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["news-posts", onlyPublished, user?.id],
    queryFn: () => fetchNewsPosts(onlyPublished, !onlyPublished),
    staleTime: onlyPublished ? 5 * 60 * 1000 : 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useNewsPost(id: string | undefined) {
  return useQuery({
    queryKey: ["news-post", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("news_posts")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return normalizeNewsPost(data);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useCreateNewsPost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (post: {
      title: string;
      summary?: string;
      content?: string;
      thumbnail_url?: string;
      gallery_urls?: string[];
      published?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("news_posts")
        .insert({
          ...post,
          user_id: user!.id,
          published_at: post.published ? new Date().toISOString() : null,
          gallery_urls: post.gallery_urls ?? [],
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news-posts"] });
      toast.success("Novost kreirana!");
    },
    onError: (err: any) => toast.error(err.message),
  });
}

export function useUpdateNewsPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      title?: string;
      summary?: string;
      content?: string;
      thumbnail_url?: string;
      gallery_urls?: string[];
      published?: boolean;
    }) => {
      const payload: any = { ...updates };
      if (updates.published !== undefined) {
        payload.published_at = updates.published ? new Date().toISOString() : null;
      }
      const { data, error } = await supabase
        .from("news_posts")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["news-posts"] });
      queryClient.invalidateQueries({ queryKey: ["news-post", vars.id] });
      toast.success("Novost ažurirana!");
    },
    onError: (err: any) => toast.error(err.message),
  });
}

export function useDeleteNewsPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("news_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news-posts"] });
      toast.success("Novost obrisana!");
    },
    onError: (err: any) => toast.error(err.message),
  });
}

export async function uploadNewsImage(file: File, folder: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const ext = file.name.split(".").pop();
  const path = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from("news-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from("news-images").getPublicUrl(path);
  return data.publicUrl;
}
