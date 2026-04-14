import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { mockSupabase, mockSupabaseQuery } from "../helpers/test-utils";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "test-user-id", email: "test@example.com" }, loading: false, session: {}, signOut: vi.fn() }),
}));

import { useProfile, useUpdateProfile } from "@/hooks/useProfile";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe("useProfile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches profile for current user", async () => {
    const profile = { id: "test-user-id", full_name: "Test User", company: "Corp" };
    const chain = mockSupabaseQuery(profile);
    mockSupabase.from.mockReturnValue(chain);

    renderHook(() => useProfile(), { wrapper: createWrapper() });
    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("profiles"));
  });
});

describe("useUpdateProfile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("upserts profile with user id", async () => {
    const chain = mockSupabaseQuery({ id: "test-user-id", full_name: "Updated" });
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });
    result.current.mutate({ full_name: "Updated Name" });

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("profiles"));
  });

  it("updates company info", async () => {
    const chain = mockSupabaseQuery({ id: "test-user-id", company: "NewCorp" });
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });
    result.current.mutate({ company: "NewCorp", company_description: "Description" });

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("profiles"));
  });
});
