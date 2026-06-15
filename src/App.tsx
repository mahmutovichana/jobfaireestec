import { Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { initClarity } from "@/lib/clarity";
import { usePageTracking } from "@/hooks/usePageTracking";
import { usePerformanceMonitoring } from "@/hooks/usePerformanceMonitoring";
import { fetchPartners } from "@/hooks/usePartners";
import { fetchNewsPosts } from "@/hooks/useNews";
import { fetchPackageTypes } from "@/hooks/usePackageTypes";
import { QUERY_CONFIG } from "@/lib/queryConfig";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { PageSkeleton } from "@/components/PageSkeleton";

// Landing is the most common first paint — keep it eager to avoid a flash of skeleton.
import Landing from "./pages/Landing";

// Public routes
const Auth = lazyWithRetry(() => import("./pages/Auth"));
const Register = lazyWithRetry(() => import("./pages/Register"));
const CompanyPage = lazyWithRetry(() => import("./pages/CompanyPage"));
const Novosti = lazyWithRetry(() => import("./pages/Novosti"));
const NovostDetail = lazyWithRetry(() => import("./pages/NovostDetail"));
const Oglasi = lazyWithRetry(() => import("./pages/Oglasi"));
const Partneri = lazyWithRetry(() => import("./pages/Partneri"));
const OstaviCV = lazyWithRetry(() => import("./pages/OstaviCV"));
const Kontakt = lazyWithRetry(() => import("./pages/Kontakt"));
const Unsubscribe = lazyWithRetry(() => import("./pages/Unsubscribe"));
const Aktivnosti = lazyWithRetry(() => import("./pages/Aktivnosti"));
const HistorijatOdbora = lazyWithRetry(() => import("./pages/HistorijatOdbora"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));

// Dashboard routes (admin-heavy, perfect candidates for code-splitting)
const Events = lazyWithRetry(() => import("./pages/dashboard/Events"));
const CreateEvent = lazyWithRetry(() => import("./pages/dashboard/CreateEvent"));
const EventDetail = lazyWithRetry(() => import("./pages/dashboard/EventDetail"));
const Attendees = lazyWithRetry(() => import("./pages/dashboard/Attendees"));
const Analytics = lazyWithRetry(() => import("./pages/dashboard/Analytics"));
const Integrations = lazyWithRetry(() => import("./pages/dashboard/Integrations"));
const SettingsPage = lazyWithRetry(() => import("./pages/dashboard/SettingsPage"));
const NewsManager = lazyWithRetry(() => import("./pages/dashboard/NewsManager"));
const JobAdsManager = lazyWithRetry(() => import("./pages/dashboard/JobAdsManager"));
const PartnersManager = lazyWithRetry(() => import("./pages/dashboard/PartnersManager"));
const TeamManager = lazyWithRetry(() => import("./pages/dashboard/TeamManager"));
const CVDatabase = lazyWithRetry(() => import("./pages/dashboard/CVDatabase"));
const CompanyInquiries = lazyWithRetry(() => import("./pages/dashboard/CompanyInquiries"));
const DashboardHome = lazyWithRetry(() => import("./pages/dashboard/DashboardHome"));
const AccessRequests = lazyWithRetry(() => import("./pages/dashboard/AccessRequests"));
const CompanyProfile = lazyWithRetry(() => import("./pages/dashboard/CompanyProfile"));
const AuditLogs = lazyWithRetry(() => import("./pages/dashboard/AuditLogs"));
const Treasury = lazyWithRetry(() => import("./pages/dashboard/Treasury"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_CONFIG.staleTime,
      gcTime: QUERY_CONFIG.gcTime,
      refetchOnWindowFocus: false,
      retry: QUERY_CONFIG.retry,
    },
  },
});

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AnalyticsTracker() {
  usePerformanceMonitoring();
  usePageTracking();
  useEffect(() => {
    // Defer Clarity until the browser is idle to keep it off the LCP/TBT path.
    const ric = (window as any).requestIdleCallback as undefined | ((cb: () => void, o?: any) => number);
    const cancel = (window as any).cancelIdleCallback as undefined | ((id: number) => void);
    if (ric) {
      const id = ric(() => initClarity(), { timeout: 4000 });
      return () => cancel?.(id);
    }
    const t = window.setTimeout(initClarity, 3000);
    return () => window.clearTimeout(t);
  }, []);
  return null;
}

function AppPrefetcher() {
  const qc = useQueryClient();
  const { pathname } = useLocation();
  useEffect(() => {
    // Skip background prefetch of landing-page data on dashboard routes —
    // those queries otherwise compete with critical dashboard fetches and inflate LCP.
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/auth")) return;
    const run = () => {
      qc.prefetchQuery({ queryKey: ["partners", true], queryFn: () => fetchPartners(true), staleTime: QUERY_CONFIG.publicStaleTime });
      qc.prefetchQuery({ queryKey: ["package-types"], queryFn: fetchPackageTypes, staleTime: QUERY_CONFIG.referenceStaleTime });
      qc.prefetchQuery({ queryKey: ["news-posts", true, undefined], queryFn: () => fetchNewsPosts(true), staleTime: QUERY_CONFIG.publicStaleTime });
    };
    const id = window.setTimeout(run, QUERY_CONFIG.prefetchDelayMs);
    return () => window.clearTimeout(id);
  }, [qc, pathname]);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="app-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <AnalyticsTracker />
            <AppPrefetcher />
            <Suspense fallback={<PageSkeleton />}>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/register/:slug" element={<Register />} />
              <Route path="/company/:companySlug" element={<CompanyPage />} />
              <Route path="/novosti" element={<Novosti />} />
              <Route path="/novost/:id" element={<NovostDetail />} />
              <Route path="/oglasi" element={<Oglasi />} />
              <Route path="/partneri" element={<Partneri />} />
              <Route path="/ostavi-cv" element={<OstaviCV />} />
              <Route path="/kontakt" element={<Kontakt />} />
              <Route path="/aktivnosti" element={<Aktivnosti />} />
              <Route path="/historijat-odbora" element={<HistorijatOdbora />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />

              {/* Dashboard (protected) */}
              <Route path="/dashboard" element={<Navigate to="/dashboard/home" replace />} />
              <Route path="/dashboard/*" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Routes>
                      <Route path="home" element={<DashboardHome />} />
                      <Route path="settings" element={<SettingsPage />} />
                      <Route path="company-profile" element={<CompanyProfile />} />
                      <Route path="cv-database" element={<CVDatabase />} />
                      {/* Admin-only routes */}
                      <Route path="events" element={<ProtectedRoute requireAdmin><Events /></ProtectedRoute>} />
                      <Route path="events/create" element={<ProtectedRoute requireAdmin><CreateEvent /></ProtectedRoute>} />
                      <Route path="events/:id" element={<ProtectedRoute requireAdmin><EventDetail /></ProtectedRoute>} />
                      <Route path="events/:id/edit" element={<ProtectedRoute requireAdmin><CreateEvent /></ProtectedRoute>} />
                      <Route path="attendees" element={<ProtectedRoute requireAdmin><Attendees /></ProtectedRoute>} />
                      <Route path="analytics" element={<ProtectedRoute requireAdmin><Analytics /></ProtectedRoute>} />
                      <Route path="integrations" element={<ProtectedRoute requireAdmin><Integrations /></ProtectedRoute>} />
                      <Route path="news" element={<ProtectedRoute requireAdmin><NewsManager /></ProtectedRoute>} />
                      <Route path="job-ads" element={<ProtectedRoute requireAdmin><JobAdsManager /></ProtectedRoute>} />
                      <Route path="partners" element={<ProtectedRoute requireAdmin><PartnersManager /></ProtectedRoute>} />
                      <Route path="team" element={<ProtectedRoute requireAdmin><TeamManager /></ProtectedRoute>} />
                      <Route path="company-inquiries" element={<ProtectedRoute requireAdmin><CompanyInquiries /></ProtectedRoute>} />
                      <Route path="access-requests" element={<ProtectedRoute requireAdmin><AccessRequests /></ProtectedRoute>} />
                      <Route path="audit-logs" element={<ProtectedRoute requireAdmin><AuditLogs /></ProtectedRoute>} />
                      <Route path="treasury" element={<Treasury />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
