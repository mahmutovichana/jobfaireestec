/**
 * Route-level prefetching helpers. Each entry returns the same dynamic
 * `import()` promise used by the corresponding `lazyWithRetry` route, so
 * Vite/Rollup deduplicates the chunk and the network only fires once.
 *
 * `prefetchRoute(url)` is a fire-and-forget call meant to be wired to
 * `onMouseEnter` / `onFocus` on navigation links — by the time the user
 * clicks, the JS bundle is already warm in the HTTP cache.
 */
const loaders: Record<string, () => Promise<unknown>> = {
  "/dashboard/home": () => import("@/pages/dashboard/DashboardHome"),
  "/dashboard/settings": () => import("@/pages/dashboard/SettingsPage"),
  "/dashboard/company-profile": () => import("@/pages/dashboard/CompanyProfile"),
  "/dashboard/cv-database": () => import("@/pages/dashboard/CVDatabase"),
  "/dashboard/events": () => import("@/pages/dashboard/Events"),
  "/dashboard/events/create": () => import("@/pages/dashboard/CreateEvent"),
  "/dashboard/attendees": () => import("@/pages/dashboard/Attendees"),
  "/dashboard/analytics": () => import("@/pages/dashboard/Analytics"),
  "/dashboard/integrations": () => import("@/pages/dashboard/Integrations"),
  "/dashboard/news": () => import("@/pages/dashboard/NewsManager"),
  "/dashboard/job-ads": () => import("@/pages/dashboard/JobAdsManager"),
  "/dashboard/partners": () => import("@/pages/dashboard/PartnersManager"),
  "/dashboard/team": () => import("@/pages/dashboard/TeamManager"),
  "/dashboard/company-inquiries": () => import("@/pages/dashboard/CompanyInquiries"),
  "/dashboard/access-requests": () => import("@/pages/dashboard/AccessRequests"),
  "/dashboard/audit-logs": () => import("@/pages/dashboard/AuditLogs"),
  "/dashboard/treasury": () => import("@/pages/dashboard/Treasury"),
  "/novosti": () => import("@/pages/Novosti"),
  "/oglasi": () => import("@/pages/Oglasi"),
  "/partneri": () => import("@/pages/Partneri"),
  "/ostavi-cv": () => import("@/pages/OstaviCV"),
  "/kontakt": () => import("@/pages/Kontakt"),
  "/aktivnosti": () => import("@/pages/Aktivnosti"),
  "/historijat-odbora": () => import("@/pages/HistorijatOdbora"),
  "/auth": () => import("@/pages/Auth"),
};

const inflight = new Set<string>();

export function prefetchRoute(url: string): void {
  // Find the longest matching prefix so `/dashboard/events/:id` style URLs map back.
  const match = Object.keys(loaders)
    .filter((key) => url === key || url.startsWith(key + "/"))
    .sort((a, b) => b.length - a.length)[0];
  if (!match || inflight.has(match)) return;
  inflight.add(match);
  loaders[match]().catch(() => inflight.delete(match));
}
