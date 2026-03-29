
-- Create job_ads table
CREATE TABLE public.job_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  company_name text NOT NULL,
  deadline timestamp with time zone,
  image_url text,
  external_link text,
  published boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_ads ENABLE ROW LEVEL SECURITY;

-- Public can view published ads
CREATE POLICY "Public can view published job ads"
ON public.job_ads FOR SELECT
TO anon, authenticated
USING (published = true);

-- Authenticated users can view own ads
CREATE POLICY "Users can view own job ads"
ON public.job_ads FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Authenticated users can create ads
CREATE POLICY "Users can create job ads"
ON public.job_ads FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update own ads
CREATE POLICY "Users can update own job ads"
ON public.job_ads FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Authenticated users can delete own ads
CREATE POLICY "Users can delete own job ads"
ON public.job_ads FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
