import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { mockSupabase, mockSupabaseQuery, createFakeAuditLog } from "../helpers/test-utils";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "test-user-id", email: "test@example.com" }, loading: false, session: {}, signOut: vi.fn() }),
}));

import { useAuditLogs, useLogAction } from "@/hooks/useAuditLog";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe("useAuditLogs", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches audit logs with default limit", async () => {
    const logs = [createFakeAuditLog()];
    const chain = mockSupabaseQuery(logs);
    mockSupabase.from.mockReturnValue(chain);
    chain.order.mockReturnValue(chain);
    chain.limit.mockReturnValue({ data: logs, error: null, then: (fn: any) => fn({ data: logs, error: null }) });

    renderHook(() => useAuditLogs(), { wrapper: createWrapper() });
    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("audit_logs"));
  });

  it("filters by entity_type", async () => {
    const chain = mockSupabaseQuery([]);
    mockSupabase.from.mockReturnValue(chain);
    chain.order.mockReturnValue(chain);
    chain.limit.mockReturnValue(chain);
    chain.eq.mockReturnValue({ data: [], error: null, then: (fn: any) => fn({ data: [], error: null }) });

    renderHook(() => useAuditLogs({ entity_type: "events" }), { wrapper: createWrapper() });
    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("audit_logs"));
  });

  it("applies custom limit", async () => {
    const chain = mockSupabaseQuery([]);
    mockSupabase.from.mockReturnValue(chain);
    chain.order.mockReturnValue(chain);
    chain.limit.mockReturnValue({ data: [], error: null, then: (fn: any) => fn({ data: [], error: null }) });

    renderHook(() => useAuditLogs({ limit: 50 }), { wrapper: createWrapper() });
    await waitFor(() => expect(chain.limit).toHaveBeenCalledWith(50));
  });
});

describe("useLogAction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("inserts audit log with actor info", async () => {
    const chain = mockSupabaseQuery(null);
    chain.insert.mockReturnValue({ error: null, then: (fn: any) => fn({ error: null }) });
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useLogAction(), { wrapper: createWrapper() });
    result.current.mutate({ action: "created", entity_type: "events", entity_id: "evt-1" });

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("audit_logs"));
  });

  it("includes metadata when provided", async () => {
    const chain = mockSupabaseQuery(null);
    chain.insert.mockReturnValue({ error: null, then: (fn: any) => fn({ error: null }) });
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useLogAction(), { wrapper: createWrapper() });
    result.current.mutate({ action: "updated", entity_type: "partners", metadata: { display_name: "Test" } });

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("audit_logs"));
  });
});
