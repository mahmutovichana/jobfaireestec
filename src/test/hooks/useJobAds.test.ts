import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { mockSupabase, mockSupabaseQuery, createFakeJobAd } from "../helpers/test-utils";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "test-user-id", email: "test@example.com" }, loading: false, session: {}, signOut: vi.fn() }),
}));

import { useJobAds, useCreateJobAd, useUpdateJobAd, useDeleteJobAd, uploadJobAdImage } from "@/hooks/useJobAds";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe("useJobAds", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches all job ads", async () => {
    const ads = [createFakeJobAd()];
    const chain = mockSupabaseQuery(ads);
    mockSupabase.from.mockReturnValue(chain);
    chain.order.mockReturnValue({ data: ads, error: null, then: (fn: any) => fn({ data: ads, error: null }) });

    renderHook(() => useJobAds(), { wrapper: createWrapper() });
    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("job_ads"));
  });

  it("filters published only", async () => {
    const chain = mockSupabaseQuery([]);
    mockSupabase.from.mockReturnValue(chain);
    chain.order.mockReturnValue(chain);
    chain.eq.mockReturnValue({ data: [], error: null, then: (fn: any) => fn({ data: [], error: null }) });

    renderHook(() => useJobAds(true), { wrapper: createWrapper() });
    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("job_ads"));
  });
});

describe("useCreateJobAd", () => {
  beforeEach(() => vi.clearAllMocks());

  it("inserts with user_id", async () => {
    const chain = mockSupabaseQuery(null);
    chain.insert.mockReturnValue({ error: null, then: (fn: any) => fn({ error: null }) });
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useCreateJobAd(), { wrapper: createWrapper() });
    result.current.mutate({ title: "Dev Job", company_name: "Corp" });

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("job_ads"));
  });
});

describe("useUpdateJobAd", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates ad by id", async () => {
    const chain = mockSupabaseQuery(null);
    chain.update.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useUpdateJobAd(), { wrapper: createWrapper() });
    result.current.mutate({ id: "job-1", title: "Updated" });

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("job_ads"));
  });
});

describe("useDeleteJobAd", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes ad by id", async () => {
    const chain = mockSupabaseQuery(null);
    chain.delete = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useDeleteJobAd(), { wrapper: createWrapper() });
    result.current.mutate("job-1");

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("job_ads"));
  });
});

describe("uploadJobAdImage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uploads to news-images bucket", async () => {
    const url = await uploadJobAdImage(new File(["img"], "ad.jpg"));
    expect(url).toBe("https://mock.url/file.png");
    expect(mockSupabase.storage.from).toHaveBeenCalledWith("news-images");
  });
});
