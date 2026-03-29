
-- CV submissions table
CREATE TABLE public.cv_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  faculty text,
  year_of_study text,
  cv_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cv_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit CV" ON public.cv_submissions
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can view CVs" ON public.cv_submissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can delete CVs" ON public.cv_submissions
  FOR DELETE TO authenticated USING (true);

-- Company inquiries table
CREATE TABLE public.company_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_person text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  interest_type text DEFAULT 'participation',
  status text DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit inquiry" ON public.company_inquiries
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can view inquiries" ON public.company_inquiries
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can update inquiries" ON public.company_inquiries
  FOR UPDATE TO authenticated USING (true);

-- CV uploads storage bucket (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('cv-uploads', 'cv-uploads', false);

CREATE POLICY "Anyone can upload CV files" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'cv-uploads');

CREATE POLICY "Authenticated can read CV files" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'cv-uploads');
