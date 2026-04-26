# Stage 3 Backend Skeleton (NestJS + Prisma + Auth)

This stage introduces the production-first backend skeleton for Opalstack deployment.

## Delivered in Stage 3

- NestJS backend application scaffold under backend/
- Prisma module/service wired to DATABASE_URL
- Auth module with Google OAuth start/callback endpoints
- JWT issuance foundation (access + refresh)
- /api/v1/auth/me protected endpoint with JWT guard
- Role metadata decorator and role guard foundation
- Users service with Google user upsert + default viewer role assignment
- Backend environment template (.env.example)

## Implemented Routes

- GET /api/v1/auth/google/start
- GET /api/v1/auth/google/callback
- GET /api/v1/auth/me

## Notes

- This stage is a skeleton and foundation; domain modules (events/news/partners/etc.) come in the next stages.
- Refresh token persistence/rotation table can be added when login/session hardening is expanded.
- Sensitive runtime keys must remain local/secret-managed and not committed.

## Next Stage

Stage 4 will add storage, email queue execution, and AI provider endpoints on top of this backend skeleton.
