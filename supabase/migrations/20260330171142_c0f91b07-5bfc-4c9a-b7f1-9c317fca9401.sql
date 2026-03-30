CREATE TABLE public.gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text DEFAULT '',
  image_url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view visible gallery images" ON public.gallery_images
  FOR SELECT TO anon, authenticated USING (visible = true);

CREATE POLICY "Authenticated can manage gallery images" ON public.gallery_images
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create storage bucket for gallery
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;