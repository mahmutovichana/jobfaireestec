CREATE TABLE identity.mail_webhook_events (
 id text PRIMARY KEY,
 received_at timestamptz NOT NULL DEFAULT now()
);
