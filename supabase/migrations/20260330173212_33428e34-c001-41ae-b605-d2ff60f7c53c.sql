
-- Create access_requests table for company registration requests
CREATE TABLE IF NOT EXISTS public.access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  full_name text NOT NULL,
  company_name text,
  company_domain text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Admins can view and manage access requests
CREATE POLICY "Admins can view access requests"
  ON public.access_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update access requests"
  ON public.access_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can submit a request
CREATE POLICY "Anyone can submit access request"
  ON public.access_requests FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Auto-assign admin role for whitelisted emails
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_email text;
  v_admin_emails text[] := ARRAY[
    'it@eestec-sa.ba', 'chair@eestec-sa.ba', 'cp@eestec-sa.ba',
    'pr@eestec-sa.ba', 'fr@eestec-sa.ba', 'treasurer@eestec-sa.ba',
    'hr@eestec-sa.ba', 'head@jobfair.ba', 'cp@jobfair.ba',
    'hr@jobfair.ba', 'it@jobfair.ba', 'design@jobfair.ba',
    'fr@jobfair.ba', 'pr@jobfair.ba'
  ];
BEGIN
  v_email := lower(NEW.email);
  IF v_email = ANY(v_admin_emails) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_admin_role();

-- Assign admin to existing whitelisted users
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u
WHERE lower(u.email) IN (
  'it@eestec-sa.ba', 'chair@eestec-sa.ba', 'cp@eestec-sa.ba',
  'pr@eestec-sa.ba', 'fr@eestec-sa.ba', 'treasurer@eestec-sa.ba',
  'hr@eestec-sa.ba', 'head@jobfair.ba', 'cp@jobfair.ba',
  'hr@jobfair.ba', 'it@jobfair.ba', 'design@jobfair.ba',
  'fr@jobfair.ba', 'pr@jobfair.ba'
)
ON CONFLICT (user_id, role) DO NOTHING;
