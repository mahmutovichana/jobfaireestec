import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { mockSupabase, mockSupabaseQuery, createFakeFormField } from "../helpers/test-utils";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "test-user-id", email: "test@example.com" }, loading: false, session: {}, signOut: vi.fn() }),
}));

import { useFormFields, useBulkInsertFormFields, useAddFormField, useDeleteFormField } from "@/hooks/useFormFields";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe("useFormFields", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches form fields for event", async () => {
    const fields = [createFakeFormField()];
    const chain = mockSupabaseQuery(fields);
    mockSupabase.from.mockReturnValue(chain);
    chain.order.mockReturnValue({ data: fields, error: null, then: (fn: any) => fn({ data: fields, error: null }) });

    renderHook(() => useFormFields("evt-123"), { wrapper: createWrapper() });
    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("form_fields"));
  });

  it("is disabled when eventId undefined", () => {
    const { result } = renderHook(() => useFormFields(undefined), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useBulkInsertFormFields", () => {
  beforeEach(() => vi.clearAllMocks());

  it("inserts multiple fields at once", async () => {
    const fields = [createFakeFormField(), createFakeFormField({ label: "Email", position: 1 })];
    const chain = mockSupabaseQuery(fields);
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useBulkInsertFormFields(), { wrapper: createWrapper() });
    result.current.mutate(fields as any);

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("form_fields"));
  });
});

describe("useAddFormField", () => {
  beforeEach(() => vi.clearAllMocks());

  it("inserts single field", async () => {
    const field = createFakeFormField();
    const chain = mockSupabaseQuery(field);
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useAddFormField(), { wrapper: createWrapper() });
    result.current.mutate(field as any);

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("form_fields"));
  });
});

describe("useDeleteFormField", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes field by id", async () => {
    const chain = mockSupabaseQuery(null);
    chain.delete = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useDeleteFormField(), { wrapper: createWrapper() });
    result.current.mutate({ id: "ff-1", eventId: "evt-123" });

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("form_fields"));
  });
});
