
-- Generic audit trigger function
CREATE OR REPLACE FUNCTION public.log_table_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action text;
  v_entity_id text;
  v_actor_id uuid;
  v_actor_email text;
  v_metadata jsonb;
BEGIN
  v_actor_id := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);
  
  -- Try to get actor email from auth.jwt()
  BEGIN
    v_actor_email := current_setting('request.jwt.claims', true)::jsonb->>'email';
  EXCEPTION WHEN OTHERS THEN
    v_actor_email := NULL;
  END;

  IF TG_OP = 'DELETE' THEN
    v_action := 'deleted';
    v_entity_id := OLD.id::text;
    v_metadata := jsonb_build_object('old_name', CASE WHEN TG_TABLE_NAME IN ('team_members', 'partners') THEN OLD.name WHEN TG_TABLE_NAME = 'events' THEN OLD.name WHEN TG_TABLE_NAME = 'news_posts' THEN OLD.title WHEN TG_TABLE_NAME = 'job_ads' THEN OLD.title ELSE NULL END);
  ELSIF TG_OP = 'INSERT' THEN
    v_action := 'created';
    v_entity_id := NEW.id::text;
    v_metadata := jsonb_build_object('name', CASE WHEN TG_TABLE_NAME IN ('team_members', 'partners') THEN NEW.name WHEN TG_TABLE_NAME = 'events' THEN NEW.name WHEN TG_TABLE_NAME = 'news_posts' THEN NEW.title WHEN TG_TABLE_NAME = 'job_ads' THEN NEW.title ELSE NULL END);
  ELSE
    v_action := 'updated';
    v_entity_id := NEW.id::text;
    v_metadata := jsonb_build_object('name', CASE WHEN TG_TABLE_NAME IN ('team_members', 'partners') THEN NEW.name WHEN TG_TABLE_NAME = 'events' THEN NEW.name WHEN TG_TABLE_NAME = 'news_posts' THEN NEW.title WHEN TG_TABLE_NAME = 'job_ads' THEN NEW.title ELSE NULL END);
  END IF;

  INSERT INTO public.audit_logs (actor_id, actor_email, action, entity_type, entity_id, metadata)
  VALUES (v_actor_id, v_actor_email, v_action, TG_TABLE_NAME, v_entity_id, v_metadata);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Triggers on key tables
CREATE TRIGGER trg_audit_team_members
  AFTER INSERT OR UPDATE OR DELETE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.log_table_change();

CREATE TRIGGER trg_audit_partners
  AFTER INSERT OR UPDATE OR DELETE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.log_table_change();

CREATE TRIGGER trg_audit_events
  AFTER INSERT OR UPDATE OR DELETE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.log_table_change();

CREATE TRIGGER trg_audit_news_posts
  AFTER INSERT OR UPDATE OR DELETE ON public.news_posts
  FOR EACH ROW EXECUTE FUNCTION public.log_table_change();

CREATE TRIGGER trg_audit_job_ads
  AFTER INSERT OR UPDATE OR DELETE ON public.job_ads
  FOR EACH ROW EXECUTE FUNCTION public.log_table_change();

CREATE TRIGGER trg_audit_access_requests
  AFTER INSERT OR UPDATE OR DELETE ON public.access_requests
  FOR EACH ROW EXECUTE FUNCTION public.log_table_change();
