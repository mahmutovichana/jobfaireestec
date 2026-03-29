
-- Partner package type enum
CREATE TYPE public.partner_package AS ENUM ('standard', 'silver', 'gold', 'promo');

-- Partner category enum
CREATE TYPE public.partner_category AS ENUM ('company', 'media', 'sponsor');

-- Partners table
CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  description TEXT,
  category partner_category NOT NULL DEFAULT 'company',
  package partner_package DEFAULT 'standard',
  display_order INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Public can view visible partners
CREATE POLICY "Public can view visible partners"
  ON public.partners FOR SELECT
  TO anon, authenticated
  USING (visible = true);

-- Authenticated users can view own partners
CREATE POLICY "Users can view own partners"
  ON public.partners FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users can create partners
CREATE POLICY "Users can create partners"
  ON public.partners FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update own partners
CREATE POLICY "Users can update own partners"
  ON public.partners FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users can delete own partners
CREATE POLICY "Users can delete own partners"
  ON public.partners FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for partner logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('partner-logos', 'partner-logos', true);

-- Storage policies for partner logos
CREATE POLICY "Public can view partner logos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'partner-logos');

CREATE POLICY "Authenticated users can upload partner logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'partner-logos');

CREATE POLICY "Authenticated users can update partner logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'partner-logos');

CREATE POLICY "Authenticated users can delete partner logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'partner-logos');
