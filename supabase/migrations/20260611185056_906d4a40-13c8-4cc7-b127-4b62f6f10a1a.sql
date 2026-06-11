
-- 1) Storage policies for partner-logos: let authenticated users manage their OWN logos (folder = their user id)
DROP POLICY IF EXISTS "Users can upload own partner logo" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own partner logo" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own partner logo" ON storage.objects;
DROP POLICY IF EXISTS "Public can read partner logos" ON storage.objects;

CREATE POLICY "Public can read partner logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'partner-logos');

CREATE POLICY "Users can upload own partner logo" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'partner-logos'
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR (storage.foldername(name))[1] = 'logos'
         AND (storage.foldername(name))[2] = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own partner logo" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'partner-logos'
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR ((storage.foldername(name))[1] = 'logos' AND (storage.foldername(name))[2] = auth.uid()::text)
    )
  );

CREATE POLICY "Users can delete own partner logo" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'partner-logos'
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR ((storage.foldername(name))[1] = 'logos' AND (storage.foldername(name))[2] = auth.uid()::text)
    )
  );

-- 2) profiles.avatar_crop for logo zoom/position
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_crop jsonb;

-- 3) access_requests.approved_at + backfill
ALTER TABLE public.access_requests ADD COLUMN IF NOT EXISTS approved_at timestamptz;
UPDATE public.access_requests SET approved_at = updated_at WHERE status = 'approved' AND approved_at IS NULL;

-- Keep approved_at in sync via trigger
CREATE OR REPLACE FUNCTION public.set_access_request_approved_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved' OR NEW.approved_at IS NULL) THEN
    NEW.approved_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_approved_at ON public.access_requests;
CREATE TRIGGER trg_set_approved_at BEFORE UPDATE ON public.access_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_access_request_approved_at();

-- 4) CV database access for approved companies (1 year window) + admins
CREATE OR REPLACE FUNCTION public.can_view_cv_database(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM auth.users u
    JOIN public.access_requests ar ON lower(ar.email) = lower(u.email)
    WHERE u.id = _user_id
      AND ar.status = 'approved'
      AND ar.approved_at IS NOT NULL
      AND ar.approved_at > now() - interval '1 year'
  )
$$;

GRANT EXECUTE ON FUNCTION public.can_view_cv_database(uuid) TO authenticated, anon;

DROP POLICY IF EXISTS "Approved companies can view CVs" ON public.cv_submissions;
CREATE POLICY "Approved companies can view CVs" ON public.cv_submissions
  FOR SELECT TO authenticated USING (public.can_view_cv_database(auth.uid()));

-- Allow approved companies to read CV files from private bucket too (for signed URLs)
DROP POLICY IF EXISTS "Approved companies can read CVs" ON storage.objects;
CREATE POLICY "Approved companies can read CVs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'cv-uploads' AND public.can_view_cv_database(auth.uid()));

-- 5) Audit log cleanup (>90 days), scheduled daily
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_deleted integer;
BEGIN
  DELETE FROM public.audit_logs WHERE created_at < now() - interval '90 days';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-audit-logs-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'cleanup-audit-logs-daily',
  '15 3 * * *',
  $$ SELECT public.cleanup_old_audit_logs(); $$
);
