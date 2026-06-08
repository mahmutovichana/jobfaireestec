
-- team_members: revoke blanket ALL from anon, regrant only safe columns
REVOKE ALL ON public.team_members FROM anon;
GRANT SELECT (id, name, role, committee, photo_url, linkedin_url, display_order, visible, created_at, updated_at)
  ON public.team_members TO anon;

-- cv-uploads: restrict INSERT to a 'submissions/' folder; add admin delete
DROP POLICY IF EXISTS "Anyone can upload CV files" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous cv uploads" ON storage.objects;
CREATE POLICY "Anyone can upload CVs to submissions folder" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    bucket_id = 'cv-uploads'
    AND (storage.foldername(name))[1] = 'submissions'
  );
CREATE POLICY "Admins can delete CV files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'cv-uploads' AND public.has_role(auth.uid(), 'admin'::app_role));

-- registrations: allow admins to delete PII per GDPR/data-deletion requests
CREATE POLICY "Admins can delete registrations" ON public.registrations
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
