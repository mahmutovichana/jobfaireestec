import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";

// ── Mocks ──
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const mod = await importOriginal<typeof import("react-router-dom")>();
  return { ...mod, useNavigate: () => mockNavigate };
});

const mockSupabase = {
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    signOut: vi.fn().mockResolvedValue({}),
  },
  from: vi.fn(),
  rpc: vi.fn(),
};

vi.mock("@/integrations/supabase/client", () => ({ supabase: mockSupabase }));
vi.mock("@/integrations/lovable/index", () => ({
  lovable: { auth: { signInWithOAuth: vi.fn().mockResolvedValue({ error: null }) } },
}));

import Auth from "@/pages/Auth";

function renderAuth() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <TooltipProvider>
          <BrowserRouter>
            <Auth />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

describe("Auth Page Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn(),
    });
  });

  it("renders login and access request sections", () => {
    renderAuth();
    expect(screen.getByText("Prijava")).toBeInTheDocument();
    expect(screen.getByText("Zahtjev za pristup")).toBeInTheDocument();
  });

  it("renders Google sign-in button", () => {
    renderAuth();
    expect(screen.getByText(/Prijavi se s Google/i)).toBeInTheDocument();
  });

  it("renders access request form fields", () => {
    renderAuth();
    expect(screen.getByLabelText(/Ime i prezime/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
  });

  it("disables submit button while loading", async () => {
    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [{ id: "1" }], error: null }),
    });
    mockSupabase.from.mockReturnValue({
      insert: insertMock,
      select: vi.fn().mockReturnThis(),
    });

    renderAuth();
    const nameInput = screen.getByLabelText(/Ime i prezime/i);
    const emailInput = screen.getByLabelText(/Email/i);

    await userEvent.type(nameInput, "Test User");
    await userEvent.type(emailInput, "test@example.com");

    const submitBtn = screen.getByText(/Pošalji zahtjev/i);
    expect(submitBtn).not.toBeDisabled();
  });

  it("shows success message after submitting access request", async () => {
    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [{ id: "1" }], error: null }),
    });
    mockSupabase.from.mockReturnValue({
      insert: insertMock,
      select: vi.fn().mockReturnThis(),
    });

    renderAuth();

    await userEvent.type(screen.getByLabelText(/Ime i prezime/i), "Test User");
    await userEvent.type(screen.getByLabelText(/Email/i), "test@example.com");
    
    fireEvent.click(screen.getByText(/Pošalji zahtjev/i));

    await waitFor(() => {
      expect(screen.getByText(/Zahtjev poslan/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("renders terms text at bottom", () => {
    renderAuth();
    expect(screen.getByText(/Uvjete korištenja/i)).toBeInTheDocument();
  });

  it("has logo linking to home", () => {
    renderAuth();
    const links = screen.getAllByRole("link");
    const homeLink = links.find(l => l.getAttribute("href") === "/");
    expect(homeLink).toBeTruthy();
  });
});
