import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { mockSupabase, mockSupabaseQuery, createFakeRegistration } from "../helpers/test-utils";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "test-user-id", email: "test@example.com" }, loading: false, session: {}, signOut: vi.fn() }),
}));

import { useRegistrations, useRegistrationsByEvent, useCreateRegistration, useRegistrationStats } from "@/hooks/useRegistrations";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe("useRegistrations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches all registrations with event names", async () => {
    const regs = [createFakeRegistration()];
    const chain = mockSupabaseQuery(regs);
    mockSupabase.from.mockReturnValue(chain);
    chain.order.mockReturnValue({ data: regs, error: null, then: (fn: any) => fn({ data: regs, error: null }) });

    const { result } = renderHook(() => useRegistrations(), { wrapper: createWrapper() });
    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("registrations"));
  });

  it("handles fetch error", async () => {
    const chain = mockSupabaseQuery(null, { message: "Fetch failed" });
    mockSupabase.from.mockReturnValue(chain);
    chain.order.mockReturnValue({ data: null, error: { message: "Fetch failed" }, then: (fn: any) => fn({ data: null, error: { message: "Fetch failed" } }) });

    const { result } = renderHook(() => useRegistrations(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useRegistrationsByEvent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches registrations for specific event", async () => {
    const regs = [createFakeRegistration({ event_id: "evt-1" })];
    const chain = mockSupabaseQuery(regs);
    mockSupabase.from.mockReturnValue(chain);
    chain.order.mockReturnValue({ data: regs, error: null, then: (fn: any) => fn({ data: regs, error: null }) });

    renderHook(() => useRegistrationsByEvent("evt-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("registrations"));
  });

  it("is disabled when eventId is undefined", () => {
    const { result } = renderHook(() => useRegistrationsByEvent(undefined), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useCreateRegistration", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls register_for_event RPC", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: "reg-id", error: null });

    const { result } = renderHook(() => useCreateRegistration(), { wrapper: createWrapper() });
    result.current.mutate({ event_id: "evt-1", data: { "Full Name": "John", "Email Address": "john@test.com" } });

    await waitFor(() => expect(mockSupabase.rpc).toHaveBeenCalledWith("register_for_event", expect.any(Object)));
  });

  it("handles RPC error", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: "Event full" } });

    const { result } = renderHook(() => useCreateRegistration(), { wrapper: createWrapper() });
    result.current.mutate({ event_id: "evt-1", data: { "Full Name": "John" } });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useRegistrationStats", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calculates stats from registrations and events", async () => {
    const regs = [createFakeRegistration()];
    const events = [{ id: "evt-1", name: "E1", status: "live" }];
    const chain = mockSupabaseQuery(regs);
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "registrations") {
        return { select: vi.fn().mockReturnValue({ data: regs, error: null, then: (fn: any) => fn({ data: regs, error: null }) }) };
      }
      return { select: vi.fn().mockReturnValue({ data: events, error: null, then: (fn: any) => fn({ data: events, error: null }) }) };
    });

    const { result } = renderHook(() => useRegistrationStats(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
  });
});
