# JobFAIR on Opalstack

This is a standalone Node.js/PostgreSQL application. No runtime request goes to Lovable or a hosted Supabase service. `server/` is the authoritative backend; the incomplete NestJS/Prisma prototype is replaced.

## Services and data

- Express API and React/Vite frontend share an origin. PostgreSQL is accessed only by the server through a bounded connection pool and parameterized queries.
- Google OpenID Connect uses verified ID tokens, state, PKCE and a signed temporary cookie. Opaque server-side sessions are stored as SHA-256 hashes, never in browser localStorage or redirect URLs. Existing user UUIDs and role assignments are imported.
- All 24 original public tables, columns, defaults, enums, keys, checks, views, audit/update triggers and application functions have a standalone migration baseline. PostgreSQL money precision follows the original migration history. Provider-specific auth, queue and storage internals are replaced by `identity.*` tables.
- Resource access is enforced in the server, including ownership, approval, board access, commercial-field restrictions and private CV access. Clients never get database credentials or arbitrary SQL execution.
- File storage is on disk under `STORAGE_ROOT`. Private CVs are not exposed by static hosting; short-lived signed URLs authorize downloads. Keep this directory outside the frontend web root and back it up with the database.
- Registration capacity checks use the original locked database function. Notifications enter a durable outbox in the same database transaction as successful registrations or inquiries. The worker leases jobs with `SKIP LOCKED`, retries transient failures, recovers expired leases and retains exhausted jobs as `dlq`. SMTP delivery is at least once; a crash after provider acceptance can cause a duplicate. Stable Message-IDs reduce this risk.
- SMTP can use Opalstack's mailbox service. Development writes `.eml` files instead of sending mail. Daily/monthly limits are configurable and conservatively below the default Opalstack account limits. Other applications sharing that mailbox account must be included in quota planning.
- Gemini handles description enhancement directly, and the configured Instagram provider handles sync. Both fail explicitly when unconfigured; there is no cloud fallback. Instagram images are copied into local storage through a restricted HTTPS host allowlist.
- Editable site identity, date, timezone, social links and statistics live in `identity.settings` (`public_site`). Board domains and optional admin bootstrap emails are separate settings. Admin-only `PATCH /api/v1/settings/site` validates site settings.

## Local development

Use Node.js 22.12+ and PostgreSQL 16+.

1. `npm ci` and `npm --prefix server ci`.
2. Copy `server/.env.example` to `server/.env`; create a dedicated database and a long random `SESSION_SECRET`.
3. From `server/`, run `npm run migrate`.
4. From `server/`, run `npm run import -- /private/path/to/backup` only against a new empty target.
5. Run `npm run verify -- /private/path/to/backup`. This compares all imported original rows and the immutable archive, not just row counts. New activity may add rows after import.
6. Run the API in `server/` with `npm start` (default port 3001) and the frontend at repository root with `npm run dev` (8081, proxy `/api` to 3001).
7. Alternatively, build with `npm run build`, set `PORT=8081`/`APP_ORIGIN=http://localhost:8081` in the server environment and run only the integrated API/static server.
8. Run the mail worker from `server/` using `npm run worker`. Use `MAIL_TRANSPORT=file` locally.

Frontend tests: `npm test`, or `node scripts/test-frontend.mjs` when the host cannot bundle the TypeScript test configuration. Backend integration tests require a separate database ending in `_test`; migrate that database first and run `npm --prefix server test` with its `DATABASE_URL`. Tests never target the imported development database.

## Opalstack preparation (no change to the current website)

1. Create a separate shell user/application, staging hostname and PostgreSQL database in the Opalstack dashboard. Do not reuse or replace the current jobfair.ba application/database.
2. Create a custom proxy application with its assigned port. Set `HOST=127.0.0.1`, `PORT` to that assigned port, `APP_ORIGIN` to the HTTPS staging hostname and `TRUST_PROXY_HOPS` to the actual trusted proxy count.
3. Check out the migration branch into a release directory and create a private `server/.env` (mode 600). Persistent storage, logs and database exports must never be placed in `dist/` or committed to GitHub.
4. Configure `DATABASE_URL` for the dedicated Opalstack database. It does not need database-server superuser privileges or permission to create PostgreSQL roles. `identity` and the compatibility `auth` schema belong to this app's database.
5. Create your own Google OAuth web client. Register the exact HTTPS staging and later production callback `/api/v1/auth/google/callback`. Supply `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `GOOGLE_CALLBACK_URL` privately.
6. Configure the correct regional SMTP hostname, mailbox username, port 465 (TLS) or 587 (STARTTLS), password and sender domain. Set `MAIL_TRANSPORT=smtp`. Confirm DKIM/SPF/DMARC and provider quotas before live sending.
7. Configure Gemini and the existing RapidAPI Instagram integration using your own keys; never place them in `VITE_*` variables. These values belong only to the server.
8. Run `bash deploy/build.sh`, import into the empty database, verify the import, then run `bash deploy/start.sh`. Use Opalstack's process/startup facilities or a user cron watchdog for both web and worker. A deployment automation workflow deliberately does not publish to Opalstack yet.
9. Test on staging with the production-shaped services. Verify Google roundtrip, approved/unapproved access, admin/board/company boundaries, event wizard, templates, registration, QR/check-in, exports, CV upload/preview/download/delete, partner participation/pricing, content CRUD, analytics, audit log, inquiries, approval notifications, SMTP retry, unsubscribe, Instagram sync and AI enhancement.

Official platform references: [applications](https://docs.opalstack.com/user-guide/applications/), [PostgreSQL](https://docs.opalstack.com/user-guide/postgresql-databases/), [email](https://docs.opalstack.com/user-guide/email/).

## Cutover gates and rollback

The local snapshot contains 5,222 application rows, five users and 457 downloaded storage objects. Four original private CV files remain unavailable in the source export. This is a release blocker; metadata is retained and the importer reports the missing paths. Do not declare a complete migration or switch jobfair.ba until these files are supplied or recovered with authorized source access.

Before cutover, freeze writes briefly on the old app, take a fresh complete export, import it into a new target, and compare every row, UUID, relationship, file hash and storage reference. The current snapshot is not a fresh or transactionally atomic dump of the still-running source. Keep the original archive unchanged. Importing or replaying historical messages must not trigger notifications; the importer disables application triggers only inside its import transaction.

From `server/`, run `node scripts/readiness.mjs` and `npm run verify -- /private/path/to/backup --cutover`. Missing integrations, private objects or data mismatches block readiness. Configuration presence alone is not proof that real providers work: complete the staging checklist with actual credentials.

Take encrypted `pg_dump -Fc` exports and storage snapshots together, retain off-server copies and rehearse restoration into another database. Test the deployment rollback by restoring the previous release and database/storage snapshot. If the new system has accepted writes, do not point users back to the old database without reconciling those writes. Switch only the Opalstack application route/DNS once all gates pass; keep the old jobfair.ba application available for rollback.

## Known verification limits

Mail bounce/complaint integration accepts signed JSON at `POST /api/v1/mail/events`: `{ "id": "unique-provider-event", "email": "recipient@example.org", "type": "bounce" }` (`complaint` and `unsubscribe` are also accepted). The trusted provider adapter must set `x-jobfair-timestamp` to Unix milliseconds and `x-jobfair-signature` to lowercase hex HMAC-SHA256 of `timestamp + "." + rawBody`, using the private `MAIL_WEBHOOK_SECRET`. Events older than five minutes are rejected and event IDs are deduplicated. SMTP by itself does not generate this webhook; configure a trusted delivery-event adapter or monitored bounce mailbox on staging.

Automated tests use local PostgreSQL, local files and simulated email delivery. They do not claim a successful real Google authorization, SMTP delivery, AI response, Instagram sync or deployment to Opalstack. These require the credentials and staging setup above. Local build-size measurements are not a guarantee of Opalstack response times; benchmark staging before cutover.
