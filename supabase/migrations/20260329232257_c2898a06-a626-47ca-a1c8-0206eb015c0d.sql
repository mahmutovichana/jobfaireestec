-- Allow any authenticated user to manage all team members (self-serve model)
DROP POLICY IF EXISTS "Users can update own team members" ON public.team_members;
CREATE POLICY "Authenticated can update team members" ON public.team_members FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can delete own team members" ON public.team_members;
CREATE POLICY "Authenticated can delete team members" ON public.team_members FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can create team members" ON public.team_members;
CREATE POLICY "Authenticated can create team members" ON public.team_members FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own team members" ON public.team_members;
CREATE POLICY "Authenticated can view all team members" ON public.team_members FOR SELECT TO authenticated USING (true);

-- Same for job_ads
DROP POLICY IF EXISTS "Users can update own job ads" ON public.job_ads;
CREATE POLICY "Authenticated can update job ads" ON public.job_ads FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can delete own job ads" ON public.job_ads;
CREATE POLICY "Authenticated can delete job ads" ON public.job_ads FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can create job ads" ON public.job_ads;
CREATE POLICY "Authenticated can create job ads" ON public.job_ads FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own job ads" ON public.job_ads;
CREATE POLICY "Authenticated can view all job ads" ON public.job_ads FOR SELECT TO authenticated USING (true);