import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PageView {
  id: string;
  path: string;
  referrer: string | null;
  referrer_domain: string | null;
  user_agent: string | null;
  created_at: string;
}

export function usePageViews(days = 30) {
  return useQuery({
    queryKey: ["page-views", days],
    queryFn: async () => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("page_views")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(10000);
      if (error) throw error;
      return (data ?? []) as PageView[];
    },
    staleTime: 60 * 1000,
  });
}