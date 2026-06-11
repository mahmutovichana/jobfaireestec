
DROP VIEW IF EXISTS public.public_team_members;
CREATE VIEW public.public_team_members
WITH (security_invoker = true)
AS
SELECT id, name, role, committee, photo_url, photo_crop, linkedin_url,
       display_order, visible, year, created_at, updated_at, gender, position_key
FROM public.team_members
WHERE visible = true;

GRANT SELECT ON public.public_team_members TO anon, authenticated;

-- Re-add a column-restricted SELECT policy on team_members so the security-invoker
-- view can return rows for anon, but phone/email are never accessible.
CREATE POLICY "Public can read non-sensitive team columns"
ON public.team_members
FOR SELECT
TO anon
USING (visible = true);

-- Column-level grant: anon may only read non-sensitive columns directly.
GRANT SELECT (id, name, role, committee, photo_url, photo_crop, linkedin_url,
              display_order, visible, year, created_at, updated_at, gender, position_key)
ON public.team_members TO anon;
