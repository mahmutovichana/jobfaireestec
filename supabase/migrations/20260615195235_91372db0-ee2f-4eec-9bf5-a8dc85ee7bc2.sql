-- =========================================================
-- Indexes derived from pg_stat_statements top offenders
-- =========================================================

-- Partners: filtered by `visible`, ordered by display_order on every public read
CREATE INDEX IF NOT EXISTS idx_partners_visible_display_order
  ON public.partners (visible, display_order);

-- Partner participations: filtered by year (analytics / dashboard tabs)
CREATE INDEX IF NOT EXISTS idx_partner_participations_year_partner
  ON public.partner_participations (year, partner_id);

-- News posts: ORDER BY created_at DESC, also frequent `published` filter
CREATE INDEX IF NOT EXISTS idx_news_posts_created_at
  ON public.news_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_posts_published_published_at
  ON public.news_posts (published, published_at DESC);

-- Team: ORDER BY display_order
CREATE INDEX IF NOT EXISTS idx_team_members_display_order
  ON public.team_members (display_order);

-- Events: dashboard sorts by created_at DESC; public reads filter by status
CREATE INDEX IF NOT EXISTS idx_events_created_at
  ON public.events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_status_created_at
  ON public.events (status, created_at DESC);

-- CV submissions: admin list ordered by created_at DESC
CREATE INDEX IF NOT EXISTS idx_cv_submissions_created_at
  ON public.cv_submissions (created_at DESC);

-- Package prices: ORDER BY year DESC, package ASC
CREATE INDEX IF NOT EXISTS idx_package_prices_year_desc_package
  ON public.package_prices (year DESC, package);

-- Page views: range scans by created_at, group by path / referrer_domain
CREATE INDEX IF NOT EXISTS idx_page_views_path_created_at
  ON public.page_views (path, created_at DESC);

-- Performance metrics: dashboard aggregates per metric over recent window
CREATE INDEX IF NOT EXISTS idx_perf_metrics_metric_path_created
  ON public.performance_metrics (metric_name, path, created_at DESC);

-- Company inquiries / job ads / access requests — admin lists ordered by created_at
CREATE INDEX IF NOT EXISTS idx_company_inquiries_created_at
  ON public.company_inquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_ads_created_at
  ON public.job_ads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_requests_created_at
  ON public.access_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_requests_email_lower
  ON public.access_requests (lower(email));

-- Audit logs: actor scoped lookups
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created
  ON public.audit_logs (actor_id, created_at DESC);

-- Gallery: ordered by created_at
CREATE INDEX IF NOT EXISTS idx_gallery_images_created_at
  ON public.gallery_images (created_at DESC);

-- =========================================================
-- Refresh planner stats for the touched tables
-- =========================================================
ANALYZE public.partners;
ANALYZE public.partner_participations;
ANALYZE public.news_posts;
ANALYZE public.team_members;
ANALYZE public.events;
ANALYZE public.cv_submissions;
ANALYZE public.package_prices;
ANALYZE public.page_views;
ANALYZE public.performance_metrics;
ANALYZE public.audit_logs;

-- =========================================================
-- Lock down internal SECURITY DEFINER helpers so anon /
-- authenticated cannot invoke them via PostgREST RPC. These
-- functions are only meant to run from triggers or from edge
-- functions using the service_role key.
-- =========================================================
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                          FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_table_change()                         FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_access_request_approved_at()           FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_assign_admin_role()                   FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column()                 FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_audit_logs()                   FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb)     FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb)                 FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint)                 FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer)   FROM anon, authenticated;

-- has_role / is_board_member / can_view_cv_database / is_email_approved are
-- called from RLS policies — they MUST remain executable by authenticated
-- (and anon for is_email_approved, which guards the public access-request flow).
-- register_for_event and get_registration_count stay open: anon registration.
