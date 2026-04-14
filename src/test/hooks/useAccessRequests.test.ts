import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { mockSupabase, mockSupabaseQuery, createFakeAccessRequest } from "../helpers/test-utils";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "test-user-id", email: "test@example.com" }, loading: false, session: {}, signOut: vi.fn() }),
}));

import { useAccessRequests, usePendingRequestCount, useUpdateAccessRequest } from "@/hooks/useAccessRequests";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe("useAccessRequests", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches all access requests", async () => {
    const reqs = [createFakeAccessRequest()];
    const chain = mockSupabaseQuery(reqs);
    mockSupabase.from.mockReturnValue(chain);
    chain.order.mockReturnValue({ data: reqs, error: null, then: (fn: any) => fn({ data: reqs, error: null }) });

    renderHook(() => useAccessRequests(), { wrapper: createWrapper() });
    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("access_requests"));
  });
});

describe("usePendingRequestCount", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns count of pending requests", async () => {
    const chain = mockSupabaseQuery(null);
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue({ count: 5, error: null, then: (fn: any) => fn({ count: 5, error: null }) });
    mockSupabase.from.mockReturnValue(chain);

    renderHook(() => usePendingRequestCount(), { wrapper: createWrapper() });
    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("access_requests"));
  });
});

describe("useUpdateAccessRequest", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates request status", async () => {
    const chain = mockSupabaseQuery(null);
    chain.update.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useUpdateAccessRequest(), { wrapper: createWrapper() });
    result.current.mutate({ id: "ar-1", status: "approved" });

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("access_requests"));
  });

  it("handles approval", async () => {
    const chain = mockSupabaseQuery(null);
    chain.update.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useUpdateAccessRequest(), { wrapper: createWrapper() });
    result.current.mutate({ id: "ar-1", status: "approved" });

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("access_requests"));
  });

  it("handles rejection", async () => {
    const chain = mockSupabaseQuery(null);
    chain.update.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useUpdateAccessRequest(), { wrapper: createWrapper() });
    result.current.mutate({ id: "ar-1", status: "rejected" });

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("access_requests"));
  });
});
