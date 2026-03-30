import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Register from "./pages/Register";
import CompanyPage from "./pages/CompanyPage";
import Novosti from "./pages/Novosti";
import NovostDetail from "./pages/NovostDetail";
import Oglasi from "./pages/Oglasi";
import Partneri from "./pages/Partneri";
import OstaviCV from "./pages/OstaviCV";
import Kontakt from "./pages/Kontakt";
import Unsubscribe from "./pages/Unsubscribe";
import Events from "./pages/dashboard/Events";
import CreateEvent from "./pages/dashboard/CreateEvent";
import EventDetail from "./pages/dashboard/EventDetail";
import Attendees from "./pages/dashboard/Attendees";
import Analytics from "./pages/dashboard/Analytics";
import Integrations from "./pages/dashboard/Integrations";
import SettingsPage from "./pages/dashboard/SettingsPage";
import NewsManager from "./pages/dashboard/NewsManager";
import JobAdsManager from "./pages/dashboard/JobAdsManager";
import PartnersManager from "./pages/dashboard/PartnersManager";
import TeamManager from "./pages/dashboard/TeamManager";
import CVDatabase from "./pages/dashboard/CVDatabase";
import CompanyInquiries from "./pages/dashboard/CompanyInquiries";
import DashboardHome from "./pages/dashboard/DashboardHome";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
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
              <Route path="/unsubscribe" element={<Unsubscribe />} />

              {/* Dashboard (protected) */}
              <Route path="/dashboard" element={<Navigate to="/dashboard/home" replace />} />
              <Route path="/dashboard/*" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Routes>
                      <Route path="home" element={<DashboardHome />} />
                      <Route path="events" element={<Events />} />
                      <Route path="events/create" element={<CreateEvent />} />
                      <Route path="events/:id" element={<EventDetail />} />
                      <Route path="events/:id/edit" element={<CreateEvent />} />
                      <Route path="attendees" element={<Attendees />} />
                      <Route path="analytics" element={<Analytics />} />
                      <Route path="integrations" element={<Integrations />} />
                      <Route path="settings" element={<SettingsPage />} />
                      <Route path="news" element={<NewsManager />} />
                      <Route path="job-ads" element={<JobAdsManager />} />
                      <Route path="partners" element={<PartnersManager />} />
                      <Route path="team" element={<TeamManager />} />
                      <Route path="cv-database" element={<CVDatabase />} />
                      <Route path="company-inquiries" element={<CompanyInquiries />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
