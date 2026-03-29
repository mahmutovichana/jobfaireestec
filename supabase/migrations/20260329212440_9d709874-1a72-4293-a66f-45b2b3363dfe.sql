
-- Team members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  committee TEXT NOT NULL DEFAULT 'Organizacioni odbor',
  photo_url TEXT,
  linkedin_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view visible team members"
  ON public.team_members FOR SELECT TO anon, authenticated
  USING (visible = true);

CREATE POLICY "Users can view own team members"
  ON public.team_members FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create team members"
  ON public.team_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own team members"
  ON public.team_members FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own team members"
  ON public.team_members FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for team photos
INSERT INTO storage.buckets (id, name, public) VALUES ('team-photos', 'team-photos', true);

CREATE POLICY "Public can view team photos"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'team-photos');

CREATE POLICY "Auth users can upload team photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'team-photos');

CREATE POLICY "Auth users can update team photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'team-photos');

CREATE POLICY "Auth users can delete team photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'team-photos');
