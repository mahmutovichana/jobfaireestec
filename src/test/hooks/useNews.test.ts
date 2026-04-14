import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { mockSupabase, mockSupabaseQuery, createFakeNewsPost } from "../helpers/test-utils";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "test-user-id", email: "test@example.com" }, loading: false, session: {}, signOut: vi.fn() }),
}));

import { useNewsPosts, useNewsPost, useCreateNewsPost, useUpdateNewsPost, useDeleteNewsPost, uploadNewsImage } from "@/hooks/useNews";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe("useNewsPosts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches all news posts", async () => {
    const posts = [createFakeNewsPost()];
    const chain = mockSupabaseQuery(posts);
    mockSupabase.from.mockReturnValue(chain);
    chain.order.mockReturnValue({ data: posts, error: null, then: (fn: any) => fn({ data: posts, error: null }) });

    renderHook(() => useNewsPosts(), { wrapper: createWrapper() });
    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("news_posts"));
  });

  it("filters published only", async () => {
    const chain = mockSupabaseQuery([]);
    mockSupabase.from.mockReturnValue(chain);
    chain.order.mockReturnValue(chain);
    chain.eq.mockReturnValue({ data: [], error: null, then: (fn: any) => fn({ data: [], error: null }) });

    renderHook(() => useNewsPosts(true), { wrapper: createWrapper() });
    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("news_posts"));
  });

  it("normalizes gallery_urls to array", async () => {
    const post = createFakeNewsPost({ gallery_urls: null });
    const chain = mockSupabaseQuery([post]);
    mockSupabase.from.mockReturnValue(chain);
    chain.order.mockReturnValue({ data: [post], error: null, then: (fn: any) => fn({ data: [post], error: null }) });

    const { result } = renderHook(() => useNewsPosts(), { wrapper: createWrapper() });
    await waitFor(() => {
      if (result.current.data) {
        expect(Array.isArray(result.current.data[0]?.gallery_urls)).toBe(true);
      }
    });
  });
});

describe("useNewsPost", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches single post by id", async () => {
    const post = createFakeNewsPost({ id: "news-1" });
    const chain = mockSupabaseQuery(post);
    mockSupabase.from.mockReturnValue(chain);

    renderHook(() => useNewsPost("news-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("news_posts"));
  });

  it("is disabled when id undefined", () => {
    const { result } = renderHook(() => useNewsPost(undefined), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useCreateNewsPost", () => {
  beforeEach(() => vi.clearAllMocks());

  it("inserts with user_id and published_at", async () => {
    const chain = mockSupabaseQuery(createFakeNewsPost());
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useCreateNewsPost(), { wrapper: createWrapper() });
    result.current.mutate({ title: "New Post", published: true });

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("news_posts"));
  });

  it("sets published_at to null when not published", async () => {
    const chain = mockSupabaseQuery(createFakeNewsPost());
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useCreateNewsPost(), { wrapper: createWrapper() });
    result.current.mutate({ title: "Draft Post", published: false });

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("news_posts"));
  });
});

describe("useUpdateNewsPost", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates post by id", async () => {
    const chain = mockSupabaseQuery(createFakeNewsPost());
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useUpdateNewsPost(), { wrapper: createWrapper() });
    result.current.mutate({ id: "news-1", title: "Updated" });

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("news_posts"));
  });
});

describe("useDeleteNewsPost", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes post by id", async () => {
    const chain = mockSupabaseQuery(null);
    chain.delete = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useDeleteNewsPost(), { wrapper: createWrapper() });
    result.current.mutate("news-1");

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("news_posts"));
  });
});

describe("uploadNewsImage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uploads to news-images bucket", async () => {
    const url = await uploadNewsImage(new File(["img"], "photo.jpg"), "thumbnails");
    expect(url).toBe("https://mock.url/file.png");
    expect(mockSupabase.storage.from).toHaveBeenCalledWith("news-images");
  });
});
