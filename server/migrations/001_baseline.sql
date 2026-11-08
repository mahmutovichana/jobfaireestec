-- Exact public schema baseline from the 2026-11-08 export; no production data.

CREATE SCHEMA IF NOT EXISTS identity;

CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE identity.users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),email text NOT NULL,google_sub text UNIQUE,full_name text,avatar_url text,legacy_data jsonb NOT NULL DEFAULT '{}',created_at timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX users_email_normalized ON identity.users(lower(email));
CREATE TABLE identity.sessions (token_hash text PRIMARY KEY,user_id uuid NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,expires_at timestamptz NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX sessions_expiry ON identity.sessions(expires_at);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.user_id',true),'')::uuid $$;
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;

CREATE TYPE public.app_role AS ENUM ('admin','editor','viewer');

CREATE TYPE public.email_template_type AS ENUM ('confirmation','reminder','followup');

CREATE TYPE public.event_status AS ENUM ('draft','live','past');

CREATE TYPE public.partner_category AS ENUM ('company','media','sponsor');

CREATE TYPE public.partner_package AS ENUM ('standard','silver','gold','promo');

CREATE TYPE public.registration_status AS ENUM ('registered','checked_in','cancelled');

CREATE TABLE public."access_requests" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL,
  "full_name" text NOT NULL,
  "company_name" text,
  "company_domain" text,
  "message" text,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "reviewed_by" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "approved_at" timestamptz
);

CREATE TABLE public."audit_logs" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "actor_id" uuid NOT NULL,
  "actor_email" text,
  "action" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public."company_inquiries" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "company_name" text NOT NULL,
  "contact_person" text NOT NULL,
  "email" text NOT NULL,
  "phone" text,
  "message" text NOT NULL,
  "interest_type" text DEFAULT 'participation'::text,
  "status" text DEFAULT 'new'::text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public."cv_submissions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "full_name" text NOT NULL,
  "email" text NOT NULL,
  "phone" text,
  "faculty" text,
  "year_of_study" text,
  "cv_url" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public."email_send_log" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "message_id" text,
  "template_name" text NOT NULL,
  "recipient_email" text NOT NULL,
  "status" text NOT NULL,
  "error_message" text,
  "metadata" jsonb,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public."email_send_state" (
  "id" int4 DEFAULT 1 NOT NULL,
  "retry_after_until" timestamptz,
  "batch_size" int4 DEFAULT 10 NOT NULL,
  "send_delay_ms" int4 DEFAULT 200 NOT NULL,
  "auth_email_ttl_minutes" int4 DEFAULT 15 NOT NULL,
  "transactional_email_ttl_minutes" int4 DEFAULT 60 NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public."email_templates" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "event_id" uuid NOT NULL,
  "template_type" email_template_type NOT NULL,
  "subject" text DEFAULT ''::text NOT NULL,
  "body" text DEFAULT ''::text NOT NULL,
  "enabled" bool DEFAULT true NOT NULL
);

CREATE TABLE public."email_unsubscribe_tokens" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "token" text NOT NULL,
  "email" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "used_at" timestamptz
);

CREATE TABLE public."events" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "description" text,
  "event_date" timestamptz,
  "event_type" text DEFAULT 'webinar'::text,
  "status" event_status DEFAULT 'draft'::event_status NOT NULL,
  "template" text DEFAULT 'minimal'::text,
  "primary_color" text DEFAULT '#7C3AED'::text,
  "logo_url" text,
  "background_image_url" text,
  "registration_limit" int4,
  "registration_deadline" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "event_end_date" timestamptz,
  "timezone" text DEFAULT 'America/New_York'::text,
  "location_type" text,
  "location_value" text,
  "ticket_price" numeric,
  "requires_approval" bool DEFAULT false,
  "capacity" int4,
  "color_mode" text DEFAULT 'light'::text
);

CREATE TABLE public."form_fields" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "event_id" uuid NOT NULL,
  "label" text NOT NULL,
  "field_type" text DEFAULT 'text'::text NOT NULL,
  "placeholder" text,
  "required" bool DEFAULT true NOT NULL,
  "position" int4 DEFAULT 0 NOT NULL
);

CREATE TABLE public."gallery_images" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "title" text DEFAULT ''::text,
  "image_url" text NOT NULL,
  "display_order" int4 DEFAULT 0 NOT NULL,
  "visible" bool DEFAULT true NOT NULL,
  "user_id" uuid NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public."job_ads" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "company_name" text NOT NULL,
  "deadline" timestamptz,
  "image_url" text,
  "external_link" text,
  "published" bool DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public."news_posts" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "title" text NOT NULL,
  "summary" text,
  "content" text,
  "thumbnail_url" text,
  "gallery_urls" jsonb DEFAULT '[]'::jsonb,
  "published" bool DEFAULT false NOT NULL,
  "published_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "instagram_post_id" text
);

CREATE TABLE public."package_prices" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "year" int4 NOT NULL,
  "package" text NOT NULL,
  "price" numeric DEFAULT 0 NOT NULL,
  "currency" text DEFAULT 'BAM'::text NOT NULL,
  "notes" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public."package_types" (
  "key" text NOT NULL,
  "label" text NOT NULL,
  "color_class" text DEFAULT 'bg-muted text-foreground border-border'::text NOT NULL,
  "sort_order" int4 DEFAULT 0 NOT NULL,
  "is_custom" bool DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public."page_views" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "path" text NOT NULL,
  "referrer" text,
  "referrer_domain" text,
  "user_agent" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public."partner_participations" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "partner_id" uuid NOT NULL,
  "year" int4 NOT NULL,
  "package" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "custom_price" numeric,
  "currency" text DEFAULT 'BAM'::text NOT NULL
);

CREATE TABLE public."partners" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "logo_url" text,
  "website" text,
  "description" text,
  "category" partner_category DEFAULT 'company'::partner_category NOT NULL,
  "package" text DEFAULT 'standard'::text,
  "display_order" int4 DEFAULT 0 NOT NULL,
  "visible" bool DEFAULT true NOT NULL,
  "user_id" uuid NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public."performance_metrics" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "path" text NOT NULL,
  "metric_name" text NOT NULL,
  "metric_value" numeric NOT NULL,
  "rating" text NOT NULL,
  "session_id" text,
  "user_agent" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public."profiles" (
  "id" uuid NOT NULL,
  "full_name" text,
  "company" text,
  "avatar_url" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "website" text,
  "company_description" text,
  "social_links" jsonb DEFAULT '[]'::jsonb,
  "company_slug" text,
  "avatar_crop" jsonb
);

CREATE TABLE public."registrations" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "event_id" uuid NOT NULL,
  "data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "status" registration_status DEFAULT 'registered'::registration_status NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public."suppressed_emails" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL,
  "reason" text NOT NULL,
  "metadata" jsonb,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public."team_members" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "role" text DEFAULT ''::text NOT NULL,
  "committee" text DEFAULT 'Organizacioni odbor'::text NOT NULL,
  "photo_url" text,
  "linkedin_url" text,
  "display_order" int4 DEFAULT 0 NOT NULL,
  "visible" bool DEFAULT true NOT NULL,
  "user_id" uuid NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "email" text,
  "phone" text,
  "year" int4 DEFAULT 2026 NOT NULL,
  "photo_crop" jsonb,
  "gender" text,
  "position_key" text
);

CREATE TABLE public."user_roles" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "role" app_role NOT NULL
);

ALTER TABLE public."email_templates" ADD CONSTRAINT "email_templates_event_id_template_type_key" UNIQUE (event_id, template_type);

ALTER TABLE public."email_templates" ADD CONSTRAINT "email_templates_pkey" PRIMARY KEY (id);

ALTER TABLE public."events" ADD CONSTRAINT "events_pkey" PRIMARY KEY (id);

ALTER TABLE public."events" ADD CONSTRAINT "events_slug_key" UNIQUE (slug);

ALTER TABLE public."access_requests" ADD CONSTRAINT "access_requests_pkey" PRIMARY KEY (id);

ALTER TABLE public."email_send_log" ADD CONSTRAINT "email_send_log_pkey" PRIMARY KEY (id);

ALTER TABLE public."email_send_log" ADD CONSTRAINT "email_send_log_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'suppressed'::text, 'failed'::text, 'bounced'::text, 'complained'::text, 'dlq'::text])));

ALTER TABLE public."partners" ADD CONSTRAINT "partners_pkey" PRIMARY KEY (id);

ALTER TABLE public."email_send_state" ADD CONSTRAINT "email_send_state_id_check" CHECK ((id = 1));

ALTER TABLE public."email_send_state" ADD CONSTRAINT "email_send_state_pkey" PRIMARY KEY (id);

ALTER TABLE public."gallery_images" ADD CONSTRAINT "gallery_images_pkey" PRIMARY KEY (id);

ALTER TABLE public."performance_metrics" ADD CONSTRAINT "performance_metrics_metric_name_check" CHECK ((metric_name = ANY (ARRAY['FCP'::text, 'LCP'::text, 'CLS'::text, 'INP'::text])));

ALTER TABLE public."performance_metrics" ADD CONSTRAINT "performance_metrics_pkey" PRIMARY KEY (id);

ALTER TABLE public."performance_metrics" ADD CONSTRAINT "performance_metrics_rating_check" CHECK ((rating = ANY (ARRAY['good'::text, 'needs-improvement'::text, 'poor'::text])));

ALTER TABLE public."audit_logs" ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY (id);

ALTER TABLE public."cv_submissions" ADD CONSTRAINT "cv_submissions_pkey" PRIMARY KEY (id);

ALTER TABLE public."company_inquiries" ADD CONSTRAINT "company_inquiries_pkey" PRIMARY KEY (id);

ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_company_slug_key" UNIQUE (company_slug);

ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_pkey" PRIMARY KEY (id);

ALTER TABLE public."registrations" ADD CONSTRAINT "registrations_pkey" PRIMARY KEY (id);

ALTER TABLE public."package_prices" ADD CONSTRAINT "package_prices_pkey" PRIMARY KEY (id);

ALTER TABLE public."package_prices" ADD CONSTRAINT "package_prices_year_package_key" UNIQUE (year, package);

ALTER TABLE public."partner_participations" ADD CONSTRAINT "partner_participations_partner_id_year_key" UNIQUE (partner_id, year);

ALTER TABLE public."partner_participations" ADD CONSTRAINT "partner_participations_pkey" PRIMARY KEY (id);

ALTER TABLE public."page_views" ADD CONSTRAINT "page_views_pkey" PRIMARY KEY (id);

ALTER TABLE public."news_posts" ADD CONSTRAINT "news_posts_instagram_post_id_key" UNIQUE (instagram_post_id);

ALTER TABLE public."news_posts" ADD CONSTRAINT "news_posts_pkey" PRIMARY KEY (id);

ALTER TABLE public."user_roles" ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY (id);

ALTER TABLE public."user_roles" ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE (user_id, role);

ALTER TABLE public."email_unsubscribe_tokens" ADD CONSTRAINT "email_unsubscribe_tokens_email_key" UNIQUE (email);

ALTER TABLE public."email_unsubscribe_tokens" ADD CONSTRAINT "email_unsubscribe_tokens_pkey" PRIMARY KEY (id);

ALTER TABLE public."email_unsubscribe_tokens" ADD CONSTRAINT "email_unsubscribe_tokens_token_key" UNIQUE (token);

ALTER TABLE public."job_ads" ADD CONSTRAINT "job_ads_pkey" PRIMARY KEY (id);

ALTER TABLE public."suppressed_emails" ADD CONSTRAINT "suppressed_emails_email_key" UNIQUE (email);

ALTER TABLE public."suppressed_emails" ADD CONSTRAINT "suppressed_emails_pkey" PRIMARY KEY (id);

ALTER TABLE public."suppressed_emails" ADD CONSTRAINT "suppressed_emails_reason_check" CHECK ((reason = ANY (ARRAY['unsubscribe'::text, 'bounce'::text, 'complaint'::text])));

ALTER TABLE public."team_members" ADD CONSTRAINT "team_members_pkey" PRIMARY KEY (id);

ALTER TABLE public."form_fields" ADD CONSTRAINT "form_fields_pkey" PRIMARY KEY (id);

ALTER TABLE public."package_types" ADD CONSTRAINT "package_types_pkey" PRIMARY KEY (key);

ALTER TABLE public."email_templates" ADD CONSTRAINT "email_templates_event_id_fkey" FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

ALTER TABLE public."events" ADD CONSTRAINT "events_user_id_fkey" FOREIGN KEY (user_id) REFERENCES identity.users(id) ON DELETE CASCADE;

ALTER TABLE public."access_requests" ADD CONSTRAINT "access_requests_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES identity.users(id) ON DELETE SET NULL;

ALTER TABLE public."partners" ADD CONSTRAINT "partners_package_fkey" FOREIGN KEY (package) REFERENCES package_types(key) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES identity.users(id) ON DELETE CASCADE;

ALTER TABLE public."registrations" ADD CONSTRAINT "registrations_event_id_fkey" FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

ALTER TABLE public."package_prices" ADD CONSTRAINT "package_prices_package_fkey" FOREIGN KEY (package) REFERENCES package_types(key) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."partner_participations" ADD CONSTRAINT "partner_participations_package_fkey" FOREIGN KEY (package) REFERENCES package_types(key) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."partner_participations" ADD CONSTRAINT "partner_participations_partner_id_fkey" FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE;

ALTER TABLE public."user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES identity.users(id) ON DELETE CASCADE;

ALTER TABLE public."form_fields" ADD CONSTRAINT "form_fields_event_id_fkey" FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$function$
;

CREATE OR REPLACE FUNCTION public.is_email_approved(check_email text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.access_requests
    WHERE lower(email) = lower(check_email)
      AND status = 'approved'
  )
$function$
;

CREATE OR REPLACE FUNCTION public.is_board_member(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM identity.users u
    WHERE u.id = _user_id
      AND (
        lower(u.email) LIKE '%@eestec-sa.ba'
        OR public.has_role(_user_id, 'admin'::app_role)
      )
  )
$function$
;

CREATE OR REPLACE FUNCTION public.can_view_cv_database(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM identity.users u
    JOIN public.access_requests ar ON lower(ar.email) = lower(u.email)
    WHERE u.id = _user_id
      AND ar.status = 'approved'
      AND ar.approved_at IS NOT NULL
      AND ar.approved_at > now() - interval '1 year'
  )
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

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
$function$
;

CREATE OR REPLACE FUNCTION public.set_access_request_approved_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved' OR NEW.approved_at IS NULL) THEN
    NEW.approved_at := now();
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_registration_count(p_event_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT count(*)::integer
  FROM registrations
  WHERE event_id = p_event_id
    AND status != 'cancelled'::registration_status
$function$
;

CREATE OR REPLACE FUNCTION public.register_for_event(p_event_id uuid, p_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
  v_event record;
  v_current_count integer;
  v_email text;
  v_email_count integer;
BEGIN
  -- Fetch event details with lock to prevent race conditions
  SELECT id, status, capacity, registration_limit, registration_deadline
  INTO v_event
  FROM events
  WHERE id = p_event_id AND status = 'live'::event_status
  FOR UPDATE;

  IF v_event IS NULL THEN
    RAISE EXCEPTION 'Event not found or not accepting registrations';
  END IF;

  -- Check registration deadline
  IF v_event.registration_deadline IS NOT NULL AND now() > v_event.registration_deadline THEN
    RAISE EXCEPTION 'Registration deadline has passed';
  END IF;

  -- Get current registration count
  SELECT count(*) INTO v_current_count
  FROM registrations
  WHERE event_id = p_event_id AND status != 'cancelled'::registration_status;

  -- Check capacity
  IF v_event.capacity IS NOT NULL AND v_current_count >= v_event.capacity THEN
    RAISE EXCEPTION 'Event is at full capacity';
  END IF;

  -- Check registration limit
  IF v_event.registration_limit IS NOT NULL AND v_current_count >= v_event.registration_limit THEN
    RAISE EXCEPTION 'Registration limit reached';
  END IF;

  -- Validate required data field is not empty
  IF p_data IS NULL OR p_data = '{}'::jsonb THEN
    RAISE EXCEPTION 'Registration data is required';
  END IF;

  -- Payload size guard (max 4KB)
  IF octet_length(p_data::text) > 4096 THEN
    RAISE EXCEPTION 'Registration data too large';
  END IF;

  -- Duplicate prevention: extract email (case-insensitive) and limit to 2 per event
  v_email := lower(trim(COALESCE(p_data->>'Email Address', p_data->>'email', p_data->>'Email', '')));

  IF v_email IS NOT NULL AND v_email != '' THEN
    SELECT count(*) INTO v_email_count
    FROM registrations
    WHERE event_id = p_event_id
      AND status != 'cancelled'::registration_status
      AND lower(trim(COALESCE(data->>'Email Address', data->>'email', data->>'Email', ''))) = v_email;

    IF v_email_count >= 2 THEN
      RAISE EXCEPTION 'This email has already been used to register for this event';
    END IF;
  END IF;

  INSERT INTO registrations (event_id, data)
  VALUES (p_event_id, p_data)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_deleted integer;
BEGIN
  DELETE FROM public.audit_logs WHERE created_at < now() - interval '90 days';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$function$
;

CREATE TRIGGER "trg_audit_team_members" AFTER INSERT OR DELETE OR UPDATE ON public."team_members" FOR EACH ROW EXECUTE FUNCTION log_table_change();

CREATE TRIGGER "trg_audit_partners" AFTER INSERT OR DELETE OR UPDATE ON public."partners" FOR EACH ROW EXECUTE FUNCTION log_table_change();

CREATE TRIGGER "trg_audit_events" AFTER INSERT OR DELETE OR UPDATE ON public."events" FOR EACH ROW EXECUTE FUNCTION log_table_change();

CREATE TRIGGER "trg_audit_news_posts" AFTER INSERT OR DELETE OR UPDATE ON public."news_posts" FOR EACH ROW EXECUTE FUNCTION log_table_change();

CREATE TRIGGER "trg_audit_job_ads" AFTER INSERT OR DELETE OR UPDATE ON public."job_ads" FOR EACH ROW EXECUTE FUNCTION log_table_change();

CREATE TRIGGER "trg_audit_access_requests" AFTER INSERT OR DELETE OR UPDATE ON public."access_requests" FOR EACH ROW EXECUTE FUNCTION log_table_change();

CREATE TRIGGER "audit_trigger" AFTER INSERT OR DELETE OR UPDATE ON public."team_members" FOR EACH ROW EXECUTE FUNCTION log_table_change();

CREATE TRIGGER "audit_trigger" AFTER INSERT OR DELETE OR UPDATE ON public."partners" FOR EACH ROW EXECUTE FUNCTION log_table_change();

CREATE TRIGGER "audit_trigger" AFTER INSERT OR DELETE OR UPDATE ON public."events" FOR EACH ROW EXECUTE FUNCTION log_table_change();

CREATE TRIGGER "audit_trigger" AFTER INSERT OR DELETE OR UPDATE ON public."news_posts" FOR EACH ROW EXECUTE FUNCTION log_table_change();

CREATE TRIGGER "audit_trigger" AFTER INSERT OR DELETE OR UPDATE ON public."job_ads" FOR EACH ROW EXECUTE FUNCTION log_table_change();

CREATE TRIGGER "audit_trigger" AFTER INSERT OR DELETE OR UPDATE ON public."access_requests" FOR EACH ROW EXECUTE FUNCTION log_table_change();

CREATE TRIGGER "update_events_updated_at" BEFORE UPDATE ON public."events" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "update_news_posts_updated_at" BEFORE UPDATE ON public."news_posts" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON public."profiles" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "update_partners_updated_at" BEFORE UPDATE ON public."partners" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "update_team_members_updated_at" BEFORE UPDATE ON public."team_members" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "update_package_prices_updated_at" BEFORE UPDATE ON public."package_prices" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "trg_set_approved_at" BEFORE UPDATE ON public."access_requests" FOR EACH ROW EXECUTE FUNCTION set_access_request_approved_at();

CREATE TRIGGER "update_package_types_updated_at" BEFORE UPDATE ON public."package_types" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE VIEW public.public_team_members AS SELECT "id","name","role","committee","photo_url","photo_crop","linkedin_url","display_order","visible","year","created_at","updated_at","gender","position_key" FROM public.team_members WHERE visible = true;

CREATE VIEW public.public_company_profiles AS SELECT "id","company","company_description","website","avatar_url","social_links","company_slug" FROM public.profiles WHERE company_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events (slug);

CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events (user_id);

CREATE INDEX IF NOT EXISTS idx_form_fields_event_id ON public.form_fields (event_id);

CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON public.registrations (event_id);

CREATE INDEX IF NOT EXISTS idx_email_send_log_created ON public.email_send_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_send_log_recipient ON public.email_send_log(recipient_email);

CREATE INDEX IF NOT EXISTS idx_email_send_log_message ON public.email_send_log(message_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_send_log_message_sent_unique
  ON public.email_send_log(message_id) WHERE status = 'sent';

CREATE INDEX IF NOT EXISTS idx_suppressed_emails_email ON public.suppressed_emails(email);

CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_token ON public.email_unsubscribe_tokens(token);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_partner_participations_partner ON public.partner_participations(partner_id);

CREATE INDEX IF NOT EXISTS idx_partner_participations_year ON public.partner_participations(year);

CREATE INDEX IF NOT EXISTS page_views_created_at_idx ON public.page_views (created_at DESC);

CREATE INDEX IF NOT EXISTS page_views_path_idx ON public.page_views (path);

CREATE INDEX IF NOT EXISTS page_views_referrer_domain_idx ON public.page_views (referrer_domain);

CREATE INDEX IF NOT EXISTS idx_team_members_year ON public.team_members(year);

CREATE INDEX IF NOT EXISTS performance_metrics_created_at_idx ON public.performance_metrics (created_at DESC);

CREATE INDEX IF NOT EXISTS performance_metrics_name_created_at_idx ON public.performance_metrics (metric_name, created_at DESC);

CREATE INDEX IF NOT EXISTS performance_metrics_path_created_at_idx ON public.performance_metrics (path, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_partners_visible_display_order
  ON public.partners (visible, display_order);

CREATE INDEX IF NOT EXISTS idx_partner_participations_year_partner
  ON public.partner_participations (year, partner_id);

CREATE INDEX IF NOT EXISTS idx_news_posts_created_at
  ON public.news_posts (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_news_posts_published_published_at
  ON public.news_posts (published, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_team_members_display_order
  ON public.team_members (display_order);

CREATE INDEX IF NOT EXISTS idx_events_created_at
  ON public.events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_status_created_at
  ON public.events (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cv_submissions_created_at
  ON public.cv_submissions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_package_prices_year_desc_package
  ON public.package_prices (year DESC, package);

CREATE INDEX IF NOT EXISTS idx_page_views_path_created_at
  ON public.page_views (path, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_perf_metrics_metric_path_created
  ON public.performance_metrics (metric_name, path, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_company_inquiries_created_at
  ON public.company_inquiries (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_ads_created_at
  ON public.job_ads (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_access_requests_created_at
  ON public.access_requests (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_access_requests_email_lower
  ON public.access_requests (lower(email));

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created
  ON public.audit_logs (actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gallery_images_created_at
  ON public.gallery_images (created_at DESC);

CREATE TABLE identity.settings (key text PRIMARY KEY,value jsonb NOT NULL);
INSERT INTO identity.settings VALUES ('board_domains','["eestec-sa.ba"]'),('admin_emails','[]');
CREATE TABLE identity.storage_objects (bucket text NOT NULL,path text NOT NULL,owner_id uuid,size bigint NOT NULL,mime text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(bucket,path));
CREATE TABLE identity.mail_jobs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),dedup_key text UNIQUE,recipient text NOT NULL,template text NOT NULL,payload jsonb NOT NULL,status text NOT NULL DEFAULT 'pending',attempts integer NOT NULL DEFAULT 0,available_at timestamptz NOT NULL DEFAULT now(),locked_at timestamptz,lease uuid,last_error text,created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX mail_jobs_ready ON identity.mail_jobs(status,available_at);
CREATE TABLE identity.migration_imports (digest text PRIMARY KEY,report jsonb NOT NULL,imported_at timestamptz NOT NULL DEFAULT now());