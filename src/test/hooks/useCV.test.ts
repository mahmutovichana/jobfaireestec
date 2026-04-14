import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { mockSupabase, mockSupabaseQuery, createFakeCVSubmission } from "../helpers/test-utils";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "test-user-id", email: "test@example.com" }, loading: false, session: {}, signOut: vi.fn() }),
}));

import { useCVSubmissions, useCreateCVSubmission, useDeleteCV, uploadCV } from "@/hooks/useCV";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe("useCVSubmissions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches all CV submissions", async () => {
    const cvs = [createFakeCVSubmission()];
    const chain = mockSupabaseQuery(cvs);
    mockSupabase.from.mockReturnValue(chain);
    chain.order.mockReturnValue({ data: cvs, error: null, then: (fn: any) => fn({ data: cvs, error: null }) });

    renderHook(() => useCVSubmissions(), { wrapper: createWrapper() });
    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("cv_submissions"));
  });
});

describe("useCreateCVSubmission", () => {
  beforeEach(() => vi.clearAllMocks());

  it("inserts CV submission", async () => {
    const chain = mockSupabaseQuery(createFakeCVSubmission());
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useCreateCVSubmission(), { wrapper: createWrapper() });
    result.current.mutate({ full_name: "Student", email: "s@test.com", cv_url: "path/cv.pdf", phone: null, faculty: null, year_of_study: null });

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("cv_submissions"));
  });
});

describe("useDeleteCV", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes CV by id", async () => {
    const chain = mockSupabaseQuery(null);
    chain.delete = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockSupabase.from.mockReturnValue(chain);

    const { result } = renderHook(() => useDeleteCV(), { wrapper: createWrapper() });
    result.current.mutate("cv-1");

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith("cv_submissions"));
  });
});

describe("uploadCV", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uploads to cv-uploads bucket and returns path", async () => {
    const path = await uploadCV(new File(["pdf"], "cv.pdf"));
    expect(typeof path).toBe("string");
    expect(mockSupabase.storage.from).toHaveBeenCalledWith("cv-uploads");
  });
});
