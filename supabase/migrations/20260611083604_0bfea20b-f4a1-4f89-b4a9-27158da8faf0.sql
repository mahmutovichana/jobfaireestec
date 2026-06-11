
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS position_key text;

DROP VIEW IF EXISTS public.public_team_members;
CREATE VIEW public.public_team_members
WITH (security_invoker = false) AS
SELECT
  id, name, role, committee, photo_url, photo_crop, linkedin_url,
  display_order, visible, year, created_at, updated_at,
  gender, position_key
FROM public.team_members
WHERE visible = true;

GRANT SELECT ON public.public_team_members TO anon, authenticated;
