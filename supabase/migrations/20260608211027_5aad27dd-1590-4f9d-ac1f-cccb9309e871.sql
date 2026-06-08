
-- Force registrations to go through register_for_event SECURITY DEFINER RPC
DROP POLICY IF EXISTS "Allow registration for live events" ON public.registrations;

-- Gallery storage bucket: admin-only writes
CREATE POLICY "Admins can upload gallery images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update gallery images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete gallery images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'::app_role));
