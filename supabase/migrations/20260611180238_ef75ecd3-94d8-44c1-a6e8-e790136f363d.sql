-- Fix missing grants on access_requests so anon/authenticated can submit + admins can read/update
GRANT SELECT, INSERT ON public.access_requests TO anon, authenticated;
GRANT UPDATE ON public.access_requests TO authenticated;
GRANT ALL ON public.access_requests TO service_role;

-- Improve audit log trigger to record per-field old/new values on UPDATE
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
  v_changes jsonb := '{}'::jsonb;
  v_key text;
  v_old_val jsonb;
  v_new_val jsonb;
  v_skip_keys text[] := ARRAY['updated_at','created_at','id'];
BEGIN
  v_actor_id := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);
  BEGIN
    v_actor_email := current_setting('request.jwt.claims', true)::jsonb->>'email';
  EXCEPTION WHEN OTHERS THEN
    v_actor_email := NULL;
  END;

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

    -- Build a "changes" object: { field: { old, new } } for changed fields
    FOR v_key IN SELECT jsonb_object_keys(v_row) LOOP
      IF v_key = ANY(v_skip_keys) THEN CONTINUE; END IF;
      v_old_val := v_old_row->v_key;
      v_new_val := v_row->v_key;
      IF v_old_val IS DISTINCT FROM v_new_val THEN
        v_changes := v_changes || jsonb_build_object(
          v_key,
          jsonb_build_object('old', v_old_val, 'new', v_new_val)
        );
      END IF;
    END LOOP;
  END IF;

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
      || CASE WHEN v_changes <> '{}'::jsonb THEN jsonb_build_object('changes', v_changes) ELSE '{}'::jsonb END
  );

  RETURN COALESCE(NEW, OLD);
END;
$function$;