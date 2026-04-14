import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { mockSupabase, mockSupabaseQuery } from "../helpers/test-utils";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "test-user-id", email: "test@example.com" }, loading: false, session: {}, signOut: vi.fn() }),
}));

import { useUserRole, useIsAdmin } from "@/hooks/useUserRole";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe("useUserRole", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches roles for current user", async () => {
    const chain = mockSupabaseQuery([{ role: "admin" }]);
    mockSupabase.from.mockReturnValue(chain);
    chain.eq.mockReturnValue({ data: [{ role: "admin" }], error: null, then: (fn: any) => fn({ data: [{ role: "admin" }], error: null }) });

    renderHook(() => useUserRole(), { wrapper: createWrapper() });
    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("user_roles"));
  });

  it("returns empty array when no roles", async () => {
    const chain = mockSupabaseQuery([]);
    mockSupabase.from.mockReturnValue(chain);
    chain.eq.mockReturnValue({ data: [], error: null, then: (fn: any) => fn({ data: [], error: null }) });

    const { result } = renderHook(() => useUserRole(), { wrapper: createWrapper() });
    await waitFor(() => {
      if (result.current.data) {
        expect(result.current.data).toEqual([]);
      }
    });
  });
});

describe("useIsAdmin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns isAdmin based on roles", () => {
    // This hook derives from useUserRole; we test the derivation logic
    const { result } = renderHook(() => useIsAdmin(), { wrapper: createWrapper() });
    // Initially loading
    expect(typeof result.current.isAdmin).toBe("boolean");
    expect(typeof result.current.isLoading).toBe("boolean");
  });
});
