import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { mockSupabase, mockSupabaseQuery, createFakeInquiry } from "../helpers/test-utils";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "test-user-id", email: "test@example.com" }, loading: false, session: {}, signOut: vi.fn() }),
}));

import { useInquiries, useCreateInquiry, useUpdateInquiryStatus } from "@/hooks/useInquiries";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe("useInquiries", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches all inquiries", async () => {
    const inqs = [createFakeInquiry()];
    const chain = mockSupabaseQuery(inqs);
    mockSupabase.from.mockReturnValue(chain);
    chain.order.mockReturnValue({ data: inqs, error: null, then: (fn: any) => fn({ data: inqs, error: null }) });

    renderHook(() => useInquiries(), { wrapper: createWrapper() });
    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("company_inquiries"));
  });
});

describe("useCreateInquiry", () => {
  beforeEach(() => vi.clearAllMocks());

  it("inserts inquiry", async () => {
    const chain = mockSupabaseQuery(createFakeInquiry());
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useCreateInquiry(), { wrapper: createWrapper() });
    result.current.mutate({ company_name: "Corp", contact_person: "John", email: "j@c.com", phone: null, message: "Hi", interest_type: "participation" });

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("company_inquiries"));
  });
});

describe("useUpdateInquiryStatus", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates inquiry status", async () => {
    const chain = mockSupabaseQuery(null);
    chain.update.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useUpdateInquiryStatus(), { wrapper: createWrapper() });
    result.current.mutate({ id: "inq-1", status: "contacted" });

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("company_inquiries"));
  });
});
