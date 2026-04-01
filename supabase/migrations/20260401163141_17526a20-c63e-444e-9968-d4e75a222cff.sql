
CREATE OR REPLACE FUNCTION public.log_table_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_action text;
  v_entity_id text;
  v_actor_id uuid;
  v_actor_email text;
  v_row jsonb;
  v_old_row jsonb;
  v_display_name text;
BEGIN
  v_actor_id := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);

  BEGIN
    v_actor_email := current_setting('request.jwt.claims', true)::jsonb->>'email';
  EXCEPTION WHEN OTHERS THEN
    v_actor_email := NULL;
  END;

  -- Convert records to JSONB for safe field access
  IF TG_OP = 'DELETE' THEN
    v_action := 'deleted';
    v_row := to_jsonb(OLD);
    v_old_row := v_row;
    v_entity_id := v_row->>'id';
  ELSIF TG_OP = 'INSERT' THEN
    v_action := 'created';
    v_row := to_jsonb(NEW);
    v_entity_id := v_row->>'id';
  ELSE
    v_action := 'updated';
    v_row := to_jsonb(NEW);
    v_old_row := to_jsonb(OLD);
    v_entity_id := v_row->>'id';
  END IF;

  -- Safely extract display name from whichever field exists
  v_display_name := COALESCE(
    v_row->>'title',
    v_row->>'name',
    v_row->>'full_name',
    v_row->>'email',
    TG_TABLE_NAME
  );

  INSERT INTO public.audit_logs (actor_id, actor_email, action, entity_type, entity_id, metadata)
  VALUES (
    v_actor_id,
    v_actor_email,
    v_action,
    TG_TABLE_NAME,
    v_entity_id,
    jsonb_build_object('display_name', v_display_name)
  );

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Recreate triggers on all relevant tables
DROP TRIGGER IF EXISTS audit_trigger ON public.team_members;
DROP TRIGGER IF EXISTS audit_trigger ON public.partners;
DROP TRIGGER IF EXISTS audit_trigger ON public.events;
DROP TRIGGER IF EXISTS audit_trigger ON public.news_posts;
DROP TRIGGER IF EXISTS audit_trigger ON public.job_ads;
DROP TRIGGER IF EXISTS audit_trigger ON public.access_requests;

CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.log_table_change();
CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON public.partners FOR EACH ROW EXECUTE FUNCTION public.log_table_change();
CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON public.events FOR EACH ROW EXECUTE FUNCTION public.log_table_change();
CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON public.news_posts FOR EACH ROW EXECUTE FUNCTION public.log_table_change();
CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON public.job_ads FOR EACH ROW EXECUTE FUNCTION public.log_table_change();
CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON public.access_requests FOR EACH ROW EXECUTE FUNCTION public.log_table_change();
