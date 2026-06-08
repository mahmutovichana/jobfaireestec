
-- Restore column-level access (admins read via authenticated role)
GRANT SELECT (email, phone) ON public.team_members TO authenticated;
-- Drop the broad public select policy; anon/authenticated public-facing reads must go through the view
DROP POLICY IF EXISTS "Public can view visible team members (safe cols only via view)" ON public.team_members;
-- For the view to work for anon (security_invoker), anon needs SELECT on the safe columns only
GRANT SELECT (id, name, role, committee, photo_url, linkedin_url, display_order, visible, created_at, updated_at) ON public.team_members TO anon;
-- And re-create a SELECT policy on the table that allows anon/authenticated to read visible rows (column grants restrict which columns)
CREATE POLICY "Anyone can read visible team members (column-restricted)" ON public.team_members
  FOR SELECT TO anon, authenticated
  USING (visible = true);
