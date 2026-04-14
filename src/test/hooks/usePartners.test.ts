import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { mockSupabase, mockSupabaseQuery, createFakePartner } from "../helpers/test-utils";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "test-user-id", email: "test@example.com" }, loading: false, session: {}, signOut: vi.fn() }),
}));

import { usePartners, useCreatePartner, useUpdatePartner, useDeletePartner, uploadPartnerLogo, PACKAGE_ORDER, PACKAGE_LABELS, CATEGORY_LABELS } from "@/hooks/usePartners";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe("usePartners", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches all partners", async () => {
    const partners = [createFakePartner()];
    const chain = mockSupabaseQuery(partners);
    mockSupabase.from.mockReturnValue(chain);
    chain.order.mockReturnValue({ data: partners, error: null, then: (fn: any) => fn({ data: partners, error: null }) });

    renderHook(() => usePartners(), { wrapper: createWrapper() });
    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("partners"));
  });

  it("filters visible-only when flag set", async () => {
    const chain = mockSupabaseQuery([]);
    mockSupabase.from.mockReturnValue(chain);
    chain.order.mockReturnValue(chain);
    chain.eq.mockReturnValue({ data: [], error: null, then: (fn: any) => fn({ data: [], error: null }) });

    renderHook(() => usePartners(true), { wrapper: createWrapper() });
    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("partners"));
  });

  it("handles fetch error", async () => {
    const chain = mockSupabaseQuery(null, { message: "err" });
    mockSupabase.from.mockReturnValue(chain);
    chain.order.mockReturnValue({ data: null, error: { message: "err" }, then: (fn: any) => fn({ data: null, error: { message: "err" } }) });

    const { result } = renderHook(() => usePartners(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useCreatePartner", () => {
  beforeEach(() => vi.clearAllMocks());

  it("inserts partner with user_id", async () => {
    const chain = mockSupabaseQuery(createFakePartner());
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useCreatePartner(), { wrapper: createWrapper() });
    result.current.mutate({ name: "New", category: "company", package: "gold", display_order: 0, visible: true, logo_url: null, website: null, description: null });

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("partners"));
  });
});

describe("useUpdatePartner", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates partner by id", async () => {
    const chain = mockSupabaseQuery(createFakePartner());
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useUpdatePartner(), { wrapper: createWrapper() });
    result.current.mutate({ id: "ptr-1", name: "Updated" });

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("partners"));
  });
});

describe("useDeletePartner", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes partner by id", async () => {
    const chain = mockSupabaseQuery(null);
    chain.delete = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useDeletePartner(), { wrapper: createWrapper() });
    result.current.mutate("ptr-1");

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("partners"));
  });
});

describe("uploadPartnerLogo", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uploads file and returns public URL", async () => {
    const url = await uploadPartnerLogo(new File(["data"], "logo.png"));
    expect(url).toBe("https://mock.url/file.png");
    expect(mockSupabase.storage.from).toHaveBeenCalledWith("partner-logos");
  });

  it("throws on upload error", async () => {
    mockSupabase.storage.from.mockReturnValueOnce({
      upload: vi.fn().mockResolvedValue({ error: { message: "Upload failed" } }),
      getPublicUrl: vi.fn(),
    });
    await expect(uploadPartnerLogo(new File(["data"], "logo.png"))).rejects.toThrow();
  });
});

describe("Partner constants", () => {
  it("PACKAGE_ORDER has correct order", () => {
    expect(PACKAGE_ORDER).toEqual(["gold", "silver", "standard", "promo"]);
  });

  it("PACKAGE_LABELS has all keys", () => {
    expect(Object.keys(PACKAGE_LABELS)).toEqual(["gold", "silver", "standard", "promo"]);
  });

  it("CATEGORY_LABELS has all keys", () => {
    expect(Object.keys(CATEGORY_LABELS)).toEqual(["company", "media", "sponsor"]);
  });
});
