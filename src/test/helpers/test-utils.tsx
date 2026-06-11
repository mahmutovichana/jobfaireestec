import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { vi } from "vitest";

// ── Supabase Mock ──
export const mockSupabase = {
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    signOut: vi.fn().mockResolvedValue({}),
    signInWithOAuth: vi.fn().mockResolvedValue({}),
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn(),
  }),
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://mock.url/file.png" } }),
      createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "https://mock.url/signed" }, error: null }),
    }),
  },
  functions: {
    invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
};

vi.mock("@/integrations/supabase/client", () => ({ supabase: mockSupabase }));
vi.mock("@/integrations/lovable/index", () => ({
  lovable: {
    auth: {
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

// ── Auth Context Mock ──
export const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  app_metadata: {},
  user_metadata: { full_name: "Test User" },
  aud: "authenticated",
  created_at: "2024-01-01T00:00:00Z",
};

export const mockSession = {
  access_token: "mock-token",
  refresh_token: "mock-refresh",
  expires_in: 3600,
  token_type: "bearer",
  user: mockUser,
};

export function createAuthContextValue(overrides: {
  user?: typeof mockUser | null;
  loading?: boolean;
} = {}) {
  return {
    session: overrides.user ? mockSession : null,
    user: overrides.user ?? null,
    loading: overrides.loading ?? false,
    signOut: vi.fn(),
  };
}

// ── Render Wrapper ──
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <TooltipProvider>
            <BrowserRouter>{children}</BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  };
}

export function renderWithProviders(ui: React.ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: createWrapper(), ...options });
}

// ── Helper for building chained Supabase mock responses ──
export function mockSupabaseQuery(data: any, error: any = null) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  };
  // Make the chain itself thenable for queries without .single()
  chain.then = (resolve: any) => resolve({ data: Array.isArray(data) ? data : [data], error });
  return chain;
}

// ── Fake Data Factories ──
export function createFakeEvent(overrides: Record<string, any> = {}) {
  return {
    id: "evt-" + Math.random().toString(36).slice(2),
    name: "Test Event",
    slug: "test-event-abc123",
    description: "A test event",
    status: "draft" as const,
    event_date: "2026-06-01T10:00:00Z",
    event_end_date: "2026-06-01T18:00:00Z",
    event_type: "conference",
    template: "minimal",
    primary_color: "#7C3AED",
    color_mode: "light",
    timezone: "Europe/Sarajevo",
    location_type: "venue",
    location_value: "Sarajevo",
    capacity: 100,
    registration_limit: null,
    registration_deadline: null,
    requires_approval: false,
    ticket_price: null,
    logo_url: null,
    background_image_url: null,
    user_id: "test-user-id",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function createFakePartner(overrides: Record<string, any> = {}) {
  return {
    id: "ptr-" + Math.random().toString(36).slice(2),
    name: "Test Partner",
    logo_url: "https://example.com/logo.png",
    website: "https://example.com",
    description: "A test partner",
    category: "company" as const,
    package: "gold" as const,
    display_order: 0,
    visible: true,
    user_id: "test-user-id",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function createFakeTeamMember(overrides: Record<string, any> = {}) {
  return {
    id: "tm-" + Math.random().toString(36).slice(2),
    name: "Test Member",
    role: "Developer",
    committee: "IT",
    photo_url: null,
    photo_crop: null,
    linkedin_url: null,
    email: "member@test.com",
    phone: null,
    display_order: 0,
    visible: true,
    user_id: "test-user-id",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function createFakeNewsPost(overrides: Record<string, any> = {}) {
  return {
    id: "news-" + Math.random().toString(36).slice(2),
    user_id: "test-user-id",
    title: "Test News",
    summary: "Summary",
    content: "Content body",
    thumbnail_url: null,
    gallery_urls: [],
    published: false,
    published_at: null,
    instagram_post_id: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function createFakeJobAd(overrides: Record<string, any> = {}) {
  return {
    id: "job-" + Math.random().toString(36).slice(2),
    user_id: "test-user-id",
    title: "Test Job",
    description: "Job description",
    company_name: "TestCorp",
    deadline: null,
    image_url: null,
    external_link: "https://example.com/apply",
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function createFakeCVSubmission(overrides: Record<string, any> = {}) {
  return {
    id: "cv-" + Math.random().toString(36).slice(2),
    full_name: "Test Student",
    email: "student@test.com",
    phone: "+38761123456",
    faculty: "ETF",
    year_of_study: "3",
    cv_url: "uploads/test-cv.pdf",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function createFakeRegistration(overrides: Record<string, any> = {}) {
  return {
    id: "reg-" + Math.random().toString(36).slice(2),
    event_id: "evt-123",
    data: { "Full Name": "Test Person", "Email Address": "test@example.com" },
    status: "registered" as const,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function createFakeAuditLog(overrides: Record<string, any> = {}) {
  return {
    id: "log-" + Math.random().toString(36).slice(2),
    actor_id: "test-user-id",
    actor_email: "test@example.com",
    action: "created",
    entity_type: "events",
    entity_id: "evt-123",
    metadata: { display_name: "Test Event" },
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function createFakeInquiry(overrides: Record<string, any> = {}) {
  return {
    id: "inq-" + Math.random().toString(36).slice(2),
    company_name: "TestCorp",
    contact_person: "John Doe",
    email: "john@testcorp.com",
    phone: "+38761000000",
    message: "We want to participate",
    interest_type: "participation",
    status: "new",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function createFakeFormField(overrides: Record<string, any> = {}) {
  return {
    id: "ff-" + Math.random().toString(36).slice(2),
    event_id: "evt-123",
    label: "Full Name",
    field_type: "text",
    placeholder: "Enter your name",
    required: true,
    position: 0,
    ...overrides,
  };
}

export function createFakeAccessRequest(overrides: Record<string, any> = {}) {
  return {
    id: "ar-" + Math.random().toString(36).slice(2),
    full_name: "New User",
    email: "newuser@company.com",
    company_name: "Company LLC",
    company_domain: "company.com",
    message: "Please grant access",
    status: "pending",
    reviewed_by: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}
