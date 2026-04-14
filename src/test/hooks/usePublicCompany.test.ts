import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { mockSupabase, mockSupabaseQuery } from "../helpers/test-utils";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: null, loading: false, session: null, signOut: vi.fn() }),
}));

import { useCompanyBySlug, usePublicEventsByUser, usePublicRegistrationCounts } from "@/hooks/usePublicCompany";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe("useCompanyBySlug", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches company profile by slug", async () => {
    const profile = { id: "u-1", company: "Corp", company_slug: "corp" };
    const chain = mockSupabaseQuery(profile);
    mockSupabase.from.mockReturnValue(chain);

    renderHook(() => useCompanyBySlug("corp"), { wrapper: createWrapper() });
    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("profiles"));
  });

  it("is disabled when slug undefined", () => {
    const { result } = renderHook(() => useCompanyBySlug(undefined), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("usePublicEventsByUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches live events for user", async () => {
    const chain = mockSupabaseQuery([]);
    mockSupabase.from.mockReturnValue(chain);
    chain.order.mockReturnValue({ data: [], error: null, then: (fn: any) => fn({ data: [], error: null }) });

    renderHook(() => usePublicEventsByUser("u-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("events"));
  });

  it("is disabled when userId undefined", () => {
    const { result } = renderHook(() => usePublicEventsByUser(undefined), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("usePublicRegistrationCounts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls RPC for each event id", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: 5, error: null });

    renderHook(() => usePublicRegistrationCounts(["evt-1", "evt-2"]), { wrapper: createWrapper() });
    await waitFor(() => expect(mockSupabase.rpc).toHaveBeenCalledWith("get_registration_count", expect.any(Object)));
  });

  it("is disabled when no event ids", () => {
    const { result } = renderHook(() => usePublicRegistrationCounts([]), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});
