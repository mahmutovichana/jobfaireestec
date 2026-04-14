import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock auth context
const mockUseAuth = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock user role
const mockUseIsAdmin = vi.fn();
vi.mock("@/hooks/useUserRole", () => ({
  useIsAdmin: () => mockUseIsAdmin(),
}));

import { ProtectedRoute } from "@/components/ProtectedRoute";

function renderProtected(requireAdmin = false) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route path="/auth" element={<div>Auth Page</div>} />
          <Route path="/dashboard/home" element={<div>Dashboard Home</div>} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute requireAdmin={requireAdmin}>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockUseIsAdmin.mockReset();
  });

  it("shows loading state when auth is loading", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    mockUseIsAdmin.mockReturnValue({ isAdmin: false, isLoading: true });
    renderProtected();
    // Should not show protected content
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("redirects to /auth when user is not authenticated", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    mockUseIsAdmin.mockReturnValue({ isAdmin: false, isLoading: false });
    renderProtected();
    expect(screen.getByText("Auth Page")).toBeInTheDocument();
  });

  it("shows content when user is authenticated (no admin required)", () => {
    mockUseAuth.mockReturnValue({ user: { id: "test" }, loading: false });
    mockUseIsAdmin.mockReturnValue({ isAdmin: false, isLoading: false });
    renderProtected(false);
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("redirects non-admin user when admin is required", () => {
    mockUseAuth.mockReturnValue({ user: { id: "test" }, loading: false });
    mockUseIsAdmin.mockReturnValue({ isAdmin: false, isLoading: false });
    renderProtected(true);
    expect(screen.getByText("Dashboard Home")).toBeInTheDocument();
  });

  it("shows content for admin when admin is required", () => {
    mockUseAuth.mockReturnValue({ user: { id: "test" }, loading: false });
    mockUseIsAdmin.mockReturnValue({ isAdmin: true, isLoading: false });
    renderProtected(true);
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });
});
