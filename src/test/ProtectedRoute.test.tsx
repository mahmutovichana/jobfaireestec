import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/hooks/useUserRole", () => ({
  useIsAdmin: vi.fn(),
}));

import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useUserRole";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseIsAdmin = vi.mocked(useIsAdmin);

describe("ProtectedRoute", () => {
  it("shows spinner when loading", () => {
    mockedUseAuth.mockReturnValue({ user: null, session: null, loading: true, signOut: vi.fn() });
    mockedUseIsAdmin.mockReturnValue({ isAdmin: false, isLoading: true });

    const { container } = render(
      <MemoryRouter>
        <ProtectedRoute><div>Protected</div></ProtectedRoute>
      </MemoryRouter>
    );
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    expect(screen.queryByText("Protected")).not.toBeInTheDocument();
  });

  it("shows spinner while checking roles for authenticated user", () => {
    mockedUseAuth.mockReturnValue({
      user: { id: "1", email: "t@t.com" } as any, session: {} as any, loading: false, signOut: vi.fn(),
    });
    mockedUseIsAdmin.mockReturnValue({ isAdmin: false, isLoading: true });

    const { container } = render(
      <MemoryRouter>
        <ProtectedRoute><div>Protected</div></ProtectedRoute>
      </MemoryRouter>
    );
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("redirects to /auth when no user", () => {
    mockedUseAuth.mockReturnValue({ user: null, session: null, loading: false, signOut: vi.fn() });
    mockedUseIsAdmin.mockReturnValue({ isAdmin: false, isLoading: false });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <ProtectedRoute><div>Protected</div></ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.queryByText("Protected")).not.toBeInTheDocument();
  });

  it("renders children for authenticated user", () => {
    mockedUseAuth.mockReturnValue({
      user: { id: "1", email: "t@t.com" } as any, session: {} as any, loading: false, signOut: vi.fn(),
    });
    mockedUseIsAdmin.mockReturnValue({ isAdmin: false, isLoading: false });

    render(
      <MemoryRouter>
        <ProtectedRoute><div>Protected</div></ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.getByText("Protected")).toBeInTheDocument();
  });

  it("redirects non-admin from requireAdmin route", () => {
    mockedUseAuth.mockReturnValue({
      user: { id: "1", email: "t@t.com" } as any, session: {} as any, loading: false, signOut: vi.fn(),
    });
    mockedUseIsAdmin.mockReturnValue({ isAdmin: false, isLoading: false });

    render(
      <MemoryRouter>
        <ProtectedRoute requireAdmin><div>Admin</div></ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  it("renders admin content for admin user", () => {
    mockedUseAuth.mockReturnValue({
      user: { id: "1", email: "admin@t.com" } as any, session: {} as any, loading: false, signOut: vi.fn(),
    });
    mockedUseIsAdmin.mockReturnValue({ isAdmin: true, isLoading: false });

    render(
      <MemoryRouter>
        <ProtectedRoute requireAdmin><div>Admin</div></ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });
});
