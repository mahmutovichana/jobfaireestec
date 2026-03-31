
-- Allow admins to update any partner (for approval)
CREATE POLICY "Admins can update all partners"
ON public.partners FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete any partner (for rejection)
CREATE POLICY "Admins can delete all partners"
ON public.partners FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
