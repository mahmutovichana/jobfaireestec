
-- 1. Create participations table
CREATE TABLE public.partner_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  package partner_package,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (partner_id, year)
);

GRANT SELECT ON public.partner_participations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_participations TO authenticated;
GRANT ALL ON public.partner_participations TO service_role;

ALTER TABLE public.partner_participations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view participations of visible partners"
ON public.partner_participations FOR SELECT
USING (EXISTS (SELECT 1 FROM public.partners p WHERE p.id = partner_id AND p.visible = true));

CREATE POLICY "Admins manage participations"
ON public.partner_participations FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_partner_participations_partner ON public.partner_participations(partner_id);
CREATE INDEX idx_partner_participations_year ON public.partner_participations(year);

-- 2. Backfill participations from current description "Učesnik JobFAIR-a YYYY."
INSERT INTO public.partner_participations (partner_id, year, package)
SELECT id, (regexp_match(description, '(\d{4})'))[1]::int, package
FROM public.partners
WHERE description ~ '\d{4}'
ON CONFLICT DO NOTHING;

-- 3. Deduplicate: merge known duplicate pairs (keep first by name asc, move participations)
-- Helper: function to merge B into A
CREATE OR REPLACE FUNCTION public._merge_partner(keep_id uuid, drop_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.partner_participations SET partner_id = keep_id
  WHERE partner_id = drop_id
    AND NOT EXISTS (
      SELECT 1 FROM public.partner_participations pp2
      WHERE pp2.partner_id = keep_id AND pp2.year = partner_participations.year
    );
  DELETE FROM public.partner_participations WHERE partner_id = drop_id;
  DELETE FROM public.partners WHERE id = drop_id;
END;
$$;

-- Normalize known duplicates
DO $$
DECLARE
  pairs TEXT[][] := ARRAY[
    ['Academy387','Academy387 Sarajevo'],
    ['Enit','Enit(Nites)'],
    ['Isatis','Isatis Software Solutions'],
    ['KING ICT','King-ICT'],
    ['Hoću.ba-Sarajevo','Hocu.ba'],
    ['Bljesak.info','Bljesak info'],
    ['Akta.ba','Akta'],
    ['TVSA','TVSA.BA'],
    ['Univerzitet u Sarajevu','UNSA'],
    ['Pogled.ba','Pogled.ba-Mostar']
  ];
  i int;
  keep_id uuid;
  drop_id uuid;
BEGIN
  FOR i IN 1..array_length(pairs,1) LOOP
    SELECT id INTO keep_id FROM public.partners WHERE name = pairs[i][1] LIMIT 1;
    SELECT id INTO drop_id FROM public.partners WHERE name = pairs[i][2] LIMIT 1;
    IF keep_id IS NOT NULL AND drop_id IS NOT NULL AND keep_id <> drop_id THEN
      PERFORM public._merge_partner(keep_id, drop_id);
    END IF;
  END LOOP;
END $$;

-- Also merge unsa.ba into Univerzitet u Sarajevu
DO $$
DECLARE keep_id uuid; drop_id uuid;
BEGIN
  SELECT id INTO keep_id FROM public.partners WHERE name = 'Univerzitet u Sarajevu' LIMIT 1;
  SELECT id INTO drop_id FROM public.partners WHERE name = 'unsa.ba' LIMIT 1;
  IF keep_id IS NOT NULL AND drop_id IS NOT NULL THEN
    PERFORM public._merge_partner(keep_id, drop_id);
  END IF;
END $$;

-- 4. Clear placeholder descriptions so we can refill with real content
UPDATE public.partners
SET description = NULL
WHERE description ~ '^Učesnik JobFAIR-a';

DROP FUNCTION public._merge_partner(uuid, uuid);
