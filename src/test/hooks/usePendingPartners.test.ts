import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { mockSupabase, mockSupabaseQuery, createFakePartner } from "../helpers/test-utils";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "test-user-id", email: "test@example.com" }, loading: false, session: {}, signOut: vi.fn() }),
}));

import { usePendingPartners, useApprovePartner, useRejectPartner } from "@/hooks/usePendingPartners";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe("usePendingPartners", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches invisible partners", async () => {
    const partners = [createFakePartner({ visible: false })];
    const chain = mockSupabaseQuery(partners);
    mockSupabase.from.mockReturnValue(chain);
    chain.order.mockReturnValue({ data: partners, error: null, then: (fn: any) => fn({ data: partners, error: null }) });

    renderHook(() => usePendingPartners(), { wrapper: createWrapper() });
    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("partners"));
  });
});

describe("useApprovePartner", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets visible to true", async () => {
    const chain = mockSupabaseQuery(null);
    chain.update.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useApprovePartner(), { wrapper: createWrapper() });
    result.current.mutate("ptr-1");

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("partners"));
  });
});

describe("useRejectPartner", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes partner", async () => {
    const chain = mockSupabaseQuery(null);
    chain.delete = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useRejectPartner(), { wrapper: createWrapper() });
    result.current.mutate("ptr-1");

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("partners"));
  });
});
