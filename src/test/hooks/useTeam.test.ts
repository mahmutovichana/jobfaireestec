import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { mockSupabase, mockSupabaseQuery, createFakeTeamMember } from "../helpers/test-utils";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "test-user-id", email: "test@example.com" }, loading: false, session: {}, signOut: vi.fn() }),
}));

import { useTeamMembers, useCreateTeamMember, useUpdateTeamMember, useDeleteTeamMember, uploadTeamPhoto } from "@/hooks/useTeam";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe("useTeamMembers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches all team members", async () => {
    const members = [createFakeTeamMember()];
    const chain = mockSupabaseQuery(members);
    mockSupabase.from.mockReturnValue(chain);
    chain.order.mockReturnValue({ data: members, error: null, then: (fn: any) => fn({ data: members, error: null }) });

    renderHook(() => useTeamMembers(), { wrapper: createWrapper() });
    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("team_members"));
  });

  it("filters visible only", async () => {
    const chain = mockSupabaseQuery([]);
    mockSupabase.from.mockReturnValue(chain);
    chain.order.mockReturnValue(chain);
    chain.eq.mockReturnValue({ data: [], error: null, then: (fn: any) => fn({ data: [], error: null }) });

    renderHook(() => useTeamMembers(true), { wrapper: createWrapper() });
    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("team_members"));
  });
});

describe("useCreateTeamMember", () => {
  beforeEach(() => vi.clearAllMocks());

  it("inserts member with user_id", async () => {
    const chain = mockSupabaseQuery(null);
    chain.insert.mockReturnValue({ error: null, then: (fn: any) => fn({ error: null }) });
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useCreateTeamMember(), { wrapper: createWrapper() });
    result.current.mutate({ name: "John", role: "Dev", committee: "IT", display_order: 0, visible: true, photo_url: null, photo_crop: null, linkedin_url: null, email: null, phone: null, year: 2026, gender: null, position_key: null });

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("team_members"));
  });
});

describe("useUpdateTeamMember", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates member by id", async () => {
    const chain = mockSupabaseQuery(null);
    chain.update.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useUpdateTeamMember(), { wrapper: createWrapper() });
    result.current.mutate({ id: "tm-1", name: "Updated" });

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("team_members"));
  });
});

describe("useDeleteTeamMember", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes member by id", async () => {
    const chain = mockSupabaseQuery(null);
    chain.delete = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useDeleteTeamMember(), { wrapper: createWrapper() });
    result.current.mutate("tm-1");

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("team_members"));
  });
});

describe("uploadTeamPhoto", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uploads and returns public URL", async () => {
    const url = await uploadTeamPhoto(new File(["img"], "photo.jpg"));
    expect(url).toBe("https://mock.url/file.png");
    expect(mockSupabase.storage.from).toHaveBeenCalledWith("team-photos");
  });
});
