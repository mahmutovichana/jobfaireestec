
-- 1. Lock down team_members: remove broad anon SELECT, route public reads through view
DROP POLICY IF EXISTS "Anyone can read visible team members (column-restricted)" ON public.team_members;
REVOKE SELECT ON public.team_members FROM anon;

-- Recreate the public view as SECURITY DEFINER so anon can read non-sensitive columns
-- without direct access to the underlying table (phone/email stay protected).
DROP VIEW IF EXISTS public.public_team_members;
CREATE VIEW public.public_team_members
WITH (security_invoker = false)
AS
SELECT id, name, role, committee, photo_url, photo_crop, linkedin_url,
       display_order, visible, year, created_at, updated_at, gender, position_key
FROM public.team_members
WHERE visible = true;

GRANT SELECT ON public.public_team_members TO anon, authenticated;

-- 2. Harden cv-uploads storage: require submissions/<uuid>/<filename> path so
-- anonymous uploaders cannot overwrite each other's CVs by name collision.
DROP POLICY IF EXISTS "Anyone can upload CVs to submissions folder" ON storage.objects;
CREATE POLICY "Anyone can upload CVs to scoped submissions folder"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'cv-uploads'
  AND (storage.foldername(name))[1] = 'submissions'
  AND (storage.foldername(name))[2] ~ '^[0-9a-fA-F-]{16,}$'
);
