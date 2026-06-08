
-- 1. audit_logs: only triggers (SECURITY DEFINER) write
DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.audit_logs;

-- 2. company_inquiries: admin only read/update
DROP POLICY IF EXISTS "Authenticated can view inquiries" ON public.company_inquiries;
DROP POLICY IF EXISTS "Authenticated can update inquiries" ON public.company_inquiries;
CREATE POLICY "Admins can view inquiries" ON public.company_inquiries
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update inquiries" ON public.company_inquiries
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete inquiries" ON public.company_inquiries
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. cv_submissions: admin only read/delete
DROP POLICY IF EXISTS "Authenticated can view CVs" ON public.cv_submissions;
DROP POLICY IF EXISTS "Authenticated can delete CVs" ON public.cv_submissions;
CREATE POLICY "Admins can view CVs" ON public.cv_submissions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete CVs" ON public.cv_submissions
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. cv-uploads storage: admin only reads
DROP POLICY IF EXISTS "Authenticated can read CV files" ON storage.objects;
CREATE POLICY "Admins can read CV files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'cv-uploads' AND public.has_role(auth.uid(), 'admin'::app_role));

-- 5. gallery_images: replace blanket ALL policy with admin or owner
DROP POLICY IF EXISTS "Authenticated can manage gallery images" ON public.gallery_images;
CREATE POLICY "Owners or admins can insert gallery images" ON public.gallery_images
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Owners or admins can update gallery images" ON public.gallery_images
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Owners or admins can delete gallery images" ON public.gallery_images
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Owners or admins can view all gallery images" ON public.gallery_images
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- 6. job_ads: writes by owner or admin
DROP POLICY IF EXISTS "Authenticated can create job ads" ON public.job_ads;
DROP POLICY IF EXISTS "Authenticated can update job ads" ON public.job_ads;
DROP POLICY IF EXISTS "Authenticated can delete job ads" ON public.job_ads;
DROP POLICY IF EXISTS "Authenticated can view all job ads" ON public.job_ads;
CREATE POLICY "Owners or admins can create job ads" ON public.job_ads
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Owners or admins can update job ads" ON public.job_ads
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Owners or admins can delete job ads" ON public.job_ads
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Owners or admins can view all job ads" ON public.job_ads
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- 7. team_members: admin-only writes (drop blanket true)
DROP POLICY IF EXISTS "Authenticated can create team members" ON public.team_members;
DROP POLICY IF EXISTS "Authenticated can update team members" ON public.team_members;
DROP POLICY IF EXISTS "Authenticated can delete team members" ON public.team_members;
DROP POLICY IF EXISTS "Authenticated can view all team members" ON public.team_members;
CREATE POLICY "Admins can create team members" ON public.team_members
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update team members" ON public.team_members
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete team members" ON public.team_members
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all team members" ON public.team_members
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 8. team_members email/phone: remove from public exposure via view
DROP POLICY IF EXISTS "Public can view visible team members" ON public.team_members;
CREATE OR REPLACE VIEW public.public_team_members
WITH (security_invoker = true) AS
SELECT id, name, role, committee, photo_url, linkedin_url, display_order, visible, created_at, updated_at
FROM public.team_members
WHERE visible = true;
GRANT SELECT ON public.public_team_members TO anon, authenticated;
-- Restore minimal public SELECT to power the view (security_invoker honors caller perms)
CREATE POLICY "Public can view visible team members (safe cols only via view)" ON public.team_members
  FOR SELECT TO anon, authenticated
  USING (visible = true);
-- Note: view excludes email/phone; direct table reads still possible.
-- To truly hide email/phone from anon/authenticated direct reads, revoke column privs:
REVOKE SELECT (email, phone) ON public.team_members FROM anon, authenticated;

-- 9. partner-logos storage: admin only writes
DROP POLICY IF EXISTS "Authenticated users can upload partner logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update partner logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete partner logos" ON storage.objects;
CREATE POLICY "Admins can upload partner logos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'partner-logos' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update partner logos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'partner-logos' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete partner logos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'partner-logos' AND public.has_role(auth.uid(), 'admin'::app_role));

-- 10. team-photos storage: admin only writes
DROP POLICY IF EXISTS "Auth users can upload team photos" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can update team photos" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can delete team photos" ON storage.objects;
CREATE POLICY "Admins can upload team photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'team-photos' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update team photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'team-photos' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete team photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'team-photos' AND public.has_role(auth.uid(), 'admin'::app_role));

-- 11. news-images storage: scope update/delete to owner or admin
DROP POLICY IF EXISTS "Users can update own news images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own news images" ON storage.objects;
CREATE POLICY "Owners or admins can update news images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'news-images' AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Owners or admins can delete news images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'news-images' AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role)));

-- 12. Fix function search_path on email queue helpers
CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pgmq AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN NULL;
  END;
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pgmq AS $$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pgmq AS $$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pgmq AS $$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$$;

-- 13. Revoke EXECUTE from anon/authenticated on internal SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_email_approved(text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
