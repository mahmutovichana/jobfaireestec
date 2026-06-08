
-- Allow admins to delete/update any news post (fixes inability to delete old Instagram-synced posts)
CREATE POLICY "Admins can delete any news"
ON public.news_posts FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any news"
ON public.news_posts FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all news"
ON public.news_posts FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
