DROP POLICY IF EXISTS "Public can read non-sensitive team columns" ON public.team_members;
GRANT SELECT ON public.public_team_members TO anon, authenticated;

REVOKE SELECT ON public.partner_participations FROM anon;
GRANT  SELECT (id, partner_id, year, package, created_at)
       ON public.partner_participations TO anon;

DROP POLICY IF EXISTS "Anyone can add performance metrics" ON public.performance_metrics;
CREATE POLICY "Anyone can submit web-vitals metrics"
  ON public.performance_metrics
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    metric_name IS NOT NULL
    AND length(metric_name) BETWEEN 1 AND 64
    AND metric_value IS NOT NULL
    AND metric_value >= 0
    AND metric_value < 1e9
    AND (path IS NULL OR length(path) <= 512)
  );
