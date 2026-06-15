CREATE TABLE public.performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  metric_name text NOT NULL CHECK (metric_name IN ('FCP', 'LCP', 'CLS', 'INP')),
  metric_value numeric NOT NULL,
  rating text NOT NULL CHECK (rating IN ('good', 'needs-improvement', 'poor')),
  session_id text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.performance_metrics TO anon, authenticated;
GRANT SELECT ON public.performance_metrics TO authenticated;
GRANT ALL ON public.performance_metrics TO service_role;

ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can add performance metrics"
  ON public.performance_metrics FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view performance metrics"
  ON public.performance_metrics FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX performance_metrics_created_at_idx ON public.performance_metrics (created_at DESC);
CREATE INDEX performance_metrics_name_created_at_idx ON public.performance_metrics (metric_name, created_at DESC);
CREATE INDEX performance_metrics_path_created_at_idx ON public.performance_metrics (path, created_at DESC);