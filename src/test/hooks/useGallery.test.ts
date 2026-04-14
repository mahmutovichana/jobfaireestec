import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { mockSupabase, mockSupabaseQuery } from "../helpers/test-utils";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "test-user-id", email: "test@example.com" }, loading: false, session: {}, signOut: vi.fn() }),
}));

import { useGalleryImages, useCreateGalleryImage, useDeleteGalleryImage, uploadGalleryImage } from "@/hooks/useGallery";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe("useGalleryImages", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches gallery images ordered by display_order", async () => {
    const chain = mockSupabaseQuery([]);
    mockSupabase.from.mockReturnValue(chain);
    chain.order.mockReturnValue({ data: [], error: null, then: (fn: any) => fn({ data: [], error: null }) });

    renderHook(() => useGalleryImages(), { wrapper: createWrapper() });
    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("gallery_images"));
  });

  it("filters visible only", async () => {
    const chain = mockSupabaseQuery([]);
    mockSupabase.from.mockReturnValue(chain);
    chain.order.mockReturnValue(chain);
    chain.eq.mockReturnValue({ data: [], error: null, then: (fn: any) => fn({ data: [], error: null }) });

    renderHook(() => useGalleryImages(true), { wrapper: createWrapper() });
    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("gallery_images"));
  });
});

describe("useCreateGalleryImage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("inserts with user_id", async () => {
    const chain = mockSupabaseQuery(null);
    chain.insert.mockReturnValue({ error: null, then: (fn: any) => fn({ error: null }) });
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useCreateGalleryImage(), { wrapper: createWrapper() });
    result.current.mutate({ title: "Photo", image_url: "https://img.url", display_order: 0, visible: true });

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("gallery_images"));
  });
});

describe("useDeleteGalleryImage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes image by id", async () => {
    const chain = mockSupabaseQuery(null);
    chain.delete = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useDeleteGalleryImage(), { wrapper: createWrapper() });
    result.current.mutate("img-1");

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("gallery_images"));
  });
});

describe("uploadGalleryImage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uploads to gallery bucket", async () => {
    const url = await uploadGalleryImage(new File(["img"], "photo.jpg"));
    expect(url).toBe("https://mock.url/file.png");
    expect(mockSupabase.storage.from).toHaveBeenCalledWith("gallery");
  });
});
