
-- 1) Recreate public_team_members view with security_invoker (fixes SECURITY DEFINER VIEW)
DROP VIEW IF EXISTS public.public_team_members;
CREATE VIEW public.public_team_members
WITH (security_invoker = true) AS
SELECT id, name, role, committee, photo_url, photo_crop, linkedin_url,
       display_order, visible, year, created_at, updated_at, gender, position_key
FROM public.team_members
WHERE visible = true;
GRANT SELECT ON public.public_team_members TO anon, authenticated;

-- 2) Profiles: remove broad public SELECT, replace with safe public view
DROP POLICY IF EXISTS "Public can view company profiles by slug" ON public.profiles;

DROP VIEW IF EXISTS public.public_company_profiles;
CREATE VIEW public.public_company_profiles
WITH (security_invoker = true) AS
SELECT id, company, company_description, website, avatar_url, social_links, company_slug
FROM public.profiles
WHERE company_slug IS NOT NULL;
GRANT SELECT ON public.public_company_profiles TO anon, authenticated;

-- 3) Storage: scope uploads to user_id path prefix
DROP POLICY IF EXISTS "Authenticated users can upload event assets" ON storage.objects;
CREATE POLICY "Users can upload event assets to own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'event-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Authenticated users can upload news images" ON storage.objects;
CREATE POLICY "Users can upload news images to own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'news-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4) Drop broad public SELECT policies on public buckets (CDN still serves files)
DROP POLICY IF EXISTS "Anyone can view event assets" ON storage.objects;
DROP POLICY IF EXISTS "Public can view news images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view partner logos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view team photos" ON storage.objects;

-- 5) Tighten "always true" RLS WITH CHECK clauses with sane input validation
DROP POLICY IF EXISTS "Anyone can submit CV" ON public.cv_submissions;
CREATE POLICY "Anyone can submit CV"
  ON public.cv_submissions FOR INSERT
  WITH CHECK (
    length(trim(full_name)) BETWEEN 2 AND 200
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND length(cv_url) BETWEEN 5 AND 2048
  );

DROP POLICY IF EXISTS "Anyone can submit inquiry" ON public.company_inquiries;
CREATE POLICY "Anyone can submit inquiry"
  ON public.company_inquiries FOR INSERT
  WITH CHECK (
    length(trim(company_name)) BETWEEN 1 AND 200
    AND length(trim(contact_person)) BETWEEN 2 AND 200
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND length(message) BETWEEN 1 AND 4000
  );

DROP POLICY IF EXISTS "Anyone can submit access request" ON public.access_requests;
CREATE POLICY "Anyone can submit access request"
  ON public.access_requests FOR INSERT
  WITH CHECK (
    length(trim(full_name)) BETWEEN 2 AND 200
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND status = 'pending'
  );

DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
CREATE POLICY "Anyone can insert page views"
  ON public.page_views FOR INSERT
  WITH CHECK (
    length(coalesce(path, '')) BETWEEN 1 AND 1024
  );

-- 6) Revoke EXECUTE on internal SECURITY DEFINER functions from anon/authenticated/PUBLIC
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_assign_admin_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_table_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_email_approved(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_board_member(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
-- Keep these callable for public registration flow:
-- public.register_for_event(uuid, jsonb) and public.get_registration_count(uuid)
