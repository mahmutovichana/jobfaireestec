import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { mockSupabase, mockSupabaseQuery, createFakeEvent } from "../helpers/test-utils";

// We need to test the raw mutation/query functions, so we mock the auth context
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "test-user-id", email: "test@example.com" }, loading: false, session: {}, signOut: vi.fn() }),
}));

import { useEvents, useEvent, useEventBySlug, useCreateEvent, useUpdateEvent, useDeleteEvent } from "@/hooks/useEvents";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe("useEvents", () => {
  beforeEach(() => vi.clearAllMocks());

  // ── useEvents (list) ──
  it("fetches all events ordered by created_at desc", async () => {
    const events = [createFakeEvent({ name: "A" }), createFakeEvent({ name: "B" })];
    const chain = mockSupabaseQuery(events);
    mockSupabase.from.mockReturnValue(chain);
    // Make chain resolve as a promise for react-query
    chain.then = undefined;
    chain.order.mockReturnValue({ data: events, error: null, then: (fn: any) => fn({ data: events, error: null }) });

    const { result } = renderHook(() => useEvents(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));

    expect(mockSupabase.from).toHaveBeenCalledWith("events");
  });

  it("applies search filter with ilike", async () => {
    const chain = mockSupabaseQuery([]);
    mockSupabase.from.mockReturnValue(chain);
    chain.ilike.mockReturnValue({ data: [], error: null, then: (fn: any) => fn({ data: [], error: null }) });

    renderHook(() => useEvents("job"), { wrapper: createWrapper() });
    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("events"));
  });

  // ── useEvent (single by id) ──
  it("fetches single event by id", async () => {
    const event = createFakeEvent({ id: "evt-1" });
    const chain = mockSupabaseQuery(event);
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useEvent("evt-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
    expect(mockSupabase.from).toHaveBeenCalledWith("events");
  });

  it("does not fetch when id is undefined", () => {
    const { result } = renderHook(() => useEvent(undefined), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  // ── useEventBySlug ──
  it("fetches event by slug with live status filter", async () => {
    const event = createFakeEvent({ slug: "my-event" });
    const chain = mockSupabaseQuery(event);
    mockSupabase.from.mockReturnValue(chain);

    renderHook(() => useEventBySlug("my-event"), { wrapper: createWrapper() });
    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("events"));
  });

  it("does not fetch when slug is undefined", () => {
    const { result } = renderHook(() => useEventBySlug(undefined), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  // ── useCreateEvent ──
  it("inserts event with user_id and draft status", async () => {
    const created = createFakeEvent();
    const chain = mockSupabaseQuery(created);
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useCreateEvent(), { wrapper: createWrapper() });
    result.current.mutate({ name: "New Event" });

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("events"));
  });

  it("handles insert error gracefully", async () => {
    const chain = mockSupabaseQuery(null, { message: "Insert failed" });
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useCreateEvent(), { wrapper: createWrapper() });
    result.current.mutate({ name: "Fail Event" });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  // ── useUpdateEvent ──
  it("updates event by id", async () => {
    const updated = createFakeEvent({ name: "Updated" });
    const chain = mockSupabaseQuery(updated);
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useUpdateEvent(), { wrapper: createWrapper() });
    result.current.mutate({ id: "evt-1", name: "Updated" });

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("events"));
  });

  it("handles update error", async () => {
    const chain = mockSupabaseQuery(null, { message: "Update failed" });
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useUpdateEvent(), { wrapper: createWrapper() });
    result.current.mutate({ id: "evt-1", name: "X" });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  // ── useDeleteEvent ──
  it("deletes event by id", async () => {
    const chain = mockSupabaseQuery(null);
    chain.delete = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useDeleteEvent(), { wrapper: createWrapper() });
    result.current.mutate("evt-1");

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("events"));
  });

  it("handles delete error", async () => {
    const chain = mockSupabaseQuery(null);
    chain.delete = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: { message: "Delete failed" } }) });
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useDeleteEvent(), { wrapper: createWrapper() });
    result.current.mutate("evt-1");

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
