-- 1) Drop defaults that reference the enum so we can change column types
ALTER TABLE public.partners ALTER COLUMN package DROP DEFAULT;

-- 2) Convert enum columns to text
ALTER TABLE public.partners ALTER COLUMN package TYPE text USING package::text;
ALTER TABLE public.partner_participations ALTER COLUMN package TYPE text USING package::text;
ALTER TABLE public.package_prices ALTER COLUMN package TYPE text USING package::text;

ALTER TABLE public.partners ALTER COLUMN package SET DEFAULT 'standard';

-- 3) Create package_types table (configurable package catalog)
CREATE TABLE IF NOT EXISTS public.package_types (
  key text PRIMARY KEY,
  label text NOT NULL,
  color_class text NOT NULL DEFAULT 'bg-muted text-foreground border-border',
  sort_order integer NOT NULL DEFAULT 0,
  is_custom boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.package_types TO anon, authenticated;
GRANT ALL ON public.package_types TO service_role;

ALTER TABLE public.package_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view package types"
  ON public.package_types FOR SELECT
  USING (true);

CREATE POLICY "Admins manage package types"
  ON public.package_types FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_package_types_updated_at
  BEFORE UPDATE ON public.package_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.package_types (key, label, color_class, sort_order, is_custom) VALUES
  ('gold',     'Zlatni',     'bg-yellow-500/15 text-yellow-500 border-yellow-500/30', 1, false),
  ('silver',   'Srebrni',    'bg-gray-400/15 text-gray-400 border-gray-400/30',       2, false),
  ('standard', 'Standardni', 'bg-blue-500/15 text-blue-500 border-blue-500/30',       3, false),
  ('promo',    'Promo',      'bg-purple-500/15 text-purple-500 border-purple-500/30', 4, false),
  ('custom',   'Custom',     'bg-emerald-500/15 text-emerald-500 border-emerald-500/30', 5, true)
ON CONFLICT (key) DO NOTHING;

-- 4) Add custom_price and currency to participations
ALTER TABLE public.partner_participations
  ADD COLUMN IF NOT EXISTS custom_price numeric(12,2),
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'BAM';

-- 5) Restrict package_prices to admins only (not all board members)
DROP POLICY IF EXISTS "Board can view package prices" ON public.package_prices;
DROP POLICY IF EXISTS "Board can insert package prices" ON public.package_prices;
DROP POLICY IF EXISTS "Board can update package prices" ON public.package_prices;
DROP POLICY IF EXISTS "Board can delete package prices" ON public.package_prices;

CREATE POLICY "Admins manage package prices"
  ON public.package_prices FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));