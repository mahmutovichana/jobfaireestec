import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CompanyInquiry {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string | null;
  message: string;
  interest_type: string;
  status: string;
  created_at: string;
}

export function useInquiries() {
  return useQuery({
    queryKey: ["company-inquiries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_inquiries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CompanyInquiry[];
    },
  });
}

export function useCreateInquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inquiry: Omit<CompanyInquiry, "id" | "created_at" | "status">) => {
      const { data, error } = await supabase
        .from("company_inquiries")
        .insert(inquiry as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["company-inquiries"] }),
  });
}

export function useUpdateInquiryStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("company_inquiries")
        .update({ status } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["company-inquiries"] }),
  });
}
