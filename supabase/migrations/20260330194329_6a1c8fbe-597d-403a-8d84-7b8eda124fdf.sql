CREATE OR REPLACE FUNCTION public.is_email_approved(check_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.access_requests
    WHERE lower(email) = lower(check_email)
      AND status = 'approved'
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_email_approved(text) TO anon;
GRANT EXECUTE ON FUNCTION public.is_email_approved(text) TO authenticated;