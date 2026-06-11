
-- Clean orphans first
DELETE FROM public.partner_participations WHERE package IS NOT NULL AND package NOT IN (SELECT key FROM public.package_types);
DELETE FROM public.package_prices WHERE package NOT IN (SELECT key FROM public.package_types);
UPDATE public.partners SET package = NULL WHERE package IS NOT NULL AND package NOT IN (SELECT key FROM public.package_types);

-- Add FKs with cascading behavior
ALTER TABLE public.partner_participations
  ADD CONSTRAINT partner_participations_package_fkey
  FOREIGN KEY (package) REFERENCES public.package_types(key) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.package_prices
  ADD CONSTRAINT package_prices_package_fkey
  FOREIGN KEY (package) REFERENCES public.package_types(key) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.partners
  ADD CONSTRAINT partners_package_fkey
  FOREIGN KEY (package) REFERENCES public.package_types(key) ON DELETE SET NULL ON UPDATE CASCADE;
