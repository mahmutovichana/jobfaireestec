DROP VIEW IF EXISTS public.public_team_members;
CREATE VIEW public.public_team_members
WITH (security_invoker = false) AS
SELECT id, name, role, committee, photo_url, linkedin_url,
       display_order, visible, year, created_at, updated_at
FROM public.team_members
WHERE visible = true;
GRANT SELECT ON public.public_team_members TO anon, authenticated;