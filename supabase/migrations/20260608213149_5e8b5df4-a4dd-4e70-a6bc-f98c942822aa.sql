
-- 1) Add year to team_members (default current org year)
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS year integer NOT NULL DEFAULT 2026;

CREATE INDEX IF NOT EXISTS idx_team_members_year ON public.team_members(year);

-- Recreate public view to include year
DROP VIEW IF EXISTS public.public_team_members;
CREATE VIEW public.public_team_members
WITH (security_invoker = true)
AS
SELECT id, name, role, committee, photo_url, linkedin_url,
       display_order, visible, year, created_at, updated_at
FROM public.team_members
WHERE visible = true;

GRANT SELECT ON public.public_team_members TO anon, authenticated;

-- 2) Board / treasurer access function
CREATE OR REPLACE FUNCTION public.is_board_member(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = _user_id
      AND (
        lower(u.email) LIKE '%@eestec-sa.ba'
        OR public.has_role(_user_id, 'admin'::app_role)
      )
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_board_member(uuid) TO authenticated;

-- 3) package_prices table (per-year pricing)
CREATE TABLE IF NOT EXISTS public.package_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  package partner_package NOT NULL,
  price numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BAM',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (year, package)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.package_prices TO authenticated;
GRANT ALL ON public.package_prices TO service_role;

ALTER TABLE public.package_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Board can view package prices"
ON public.package_prices FOR SELECT
TO authenticated
USING (public.is_board_member(auth.uid()));

CREATE POLICY "Board can insert package prices"
ON public.package_prices FOR INSERT
TO authenticated
WITH CHECK (public.is_board_member(auth.uid()));

CREATE POLICY "Board can update package prices"
ON public.package_prices FOR UPDATE
TO authenticated
USING (public.is_board_member(auth.uid()))
WITH CHECK (public.is_board_member(auth.uid()));

CREATE POLICY "Board can delete package prices"
ON public.package_prices FOR DELETE
TO authenticated
USING (public.is_board_member(auth.uid()));

CREATE TRIGGER update_package_prices_updated_at
BEFORE UPDATE ON public.package_prices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed standard prices for 2025 / 2026 if none exist (BAM placeholders)
INSERT INTO public.package_prices (year, package, price, currency)
VALUES
  (2026, 'gold',     6000, 'BAM'),
  (2026, 'silver',   3500, 'BAM'),
  (2026, 'standard', 2000, 'BAM'),
  (2026, 'promo',    1000, 'BAM'),
  (2025, 'gold',     5500, 'BAM'),
  (2025, 'silver',   3200, 'BAM'),
  (2025, 'standard', 1800, 'BAM'),
  (2025, 'promo',    900,  'BAM')
ON CONFLICT (year, package) DO NOTHING;
