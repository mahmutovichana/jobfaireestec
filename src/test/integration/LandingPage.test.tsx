import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";

const mockSupabase = {
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    signOut: vi.fn().mockResolvedValue({}),
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: (r: any) => r({ data: [], error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  }),
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "" } }),
    }),
  },
};

vi.mock("@/integrations/supabase/client", () => ({ supabase: mockSupabase }));
vi.mock("@/integrations/lovable/index", () => ({
  lovable: { auth: { signInWithOAuth: vi.fn().mockResolvedValue({ error: null }) } },
}));

const mockUseAuth = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockUseIsAdmin = vi.fn();
vi.mock("@/hooks/useUserRole", () => ({
  useIsAdmin: () => mockUseIsAdmin(),
  useUserRole: () => ({ data: ["admin"], isLoading: false }),
}));

import Landing from "@/pages/Landing";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <TooltipProvider>
            <BrowserRouter>{children}</BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  };
}

describe("Landing Page Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    mockUseIsAdmin.mockReturnValue({ isAdmin: false, isLoading: false });
  });

  it("renders hero section with title", () => {
    render(<Landing />, { wrapper: createWrapper() });
    expect(screen.getByText(/Iskoristi svoju/i)).toBeInTheDocument();
  });

  it("renders hero accent text", () => {
    render(<Landing />, { wrapper: createWrapper() });
    expect(screen.getByText(/šansu!/i)).toBeInTheDocument();
  });

  it("renders statistics section", () => {
    render(<Landing />, { wrapper: createWrapper() });
    expect(screen.getByText(/5000\+/i)).toBeInTheDocument();
  });

  it("renders navigation links", () => {
    render(<Landing />, { wrapper: createWrapper() });
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
  });
});
