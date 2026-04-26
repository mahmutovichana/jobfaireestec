# Stage 4 Storage + Mail Queue + AI Integration

This stage adds the first production-ready service modules to the NestJS backend.

## Delivered Components

- Media module for uploads, public file serving, private file access, and deletion
- Mail module with queue enqueue endpoint and worker processing endpoint
- Mailgun delivery integration with retry scheduling and DLQ fallback
- AI module with Gemini description enhancement endpoint
- AppModule wiring for new modules
- Environment template updates for media root and worker key

## Implemented Endpoints

- POST /api/v1/media/upload/:category (JWT)
- GET /api/v1/media/public/:category/:filename
- GET /api/v1/media/private/:category/:filename (JWT)
- DELETE /api/v1/media/:category/:filename (JWT)
- POST /api/v1/mail/queue (JWT + role admin/editor)
- POST /api/v1/mail/process?batchSize=10 (x-worker-key)
- POST /api/v1/ai/enhance-description (JWT + role admin/editor)

## Queue Behavior

- New mail jobs are created in email_jobs with status pending
- Worker picks pending/retry_scheduled jobs due for processing
- On success: status sent + send log entry
- On failure: exponential backoff retry scheduling
- On max attempts: moves into email_jobs_dlq and marks status dlq

## Validation Performed

- TypeScript compile/build validation for backend
- Diagnostics validation for backend source files

## Next Stage

Stage 5 will start frontend refactor to consume backend APIs instead of direct Supabase client calls.
