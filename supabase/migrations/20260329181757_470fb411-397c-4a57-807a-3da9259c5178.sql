
-- News posts table
CREATE TABLE public.news_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  summary text,
  content text,
  thumbnail_url text,
  gallery_urls jsonb DEFAULT '[]'::jsonb,
  published boolean NOT NULL DEFAULT false,
  published_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;

-- Public can view published posts
CREATE POLICY "Public can view published news"
  ON public.news_posts FOR SELECT
  TO anon, authenticated
  USING (published = true);

-- Authenticated users can view own posts (including drafts)
CREATE POLICY "Users can view own news"
  ON public.news_posts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users can create posts
CREATE POLICY "Users can create news"
  ON public.news_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update own posts
CREATE POLICY "Users can update own news"
  ON public.news_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users can delete own posts
CREATE POLICY "Users can delete own news"
  ON public.news_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Updated at trigger
CREATE TRIGGER update_news_posts_updated_at
  BEFORE UPDATE ON public.news_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for news images
INSERT INTO storage.buckets (id, name, public)
VALUES ('news-images', 'news-images', true);

-- Storage policies for news images
CREATE POLICY "Public can view news images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'news-images');

CREATE POLICY "Authenticated users can upload news images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'news-images');

CREATE POLICY "Users can update own news images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'news-images');

CREATE POLICY "Users can delete own news images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'news-images');
