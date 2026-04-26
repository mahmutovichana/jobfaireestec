# Opalstack Migration Stages (Rollback-Friendly)

This document defines the execution order for migrating from Supabase/Lovable to an Opalstack-only stack.

## Branching and Commit Rules

- Work on `main` only if explicitly approved.
- Keep each stage in a dedicated commit.
- Push after every stage commit.
- Use descriptive commit messages with stage prefix.

Commit format:

- `stage-1: architecture blueprint and execution checklist`
- `stage-2: database migration baseline`
- `stage-3: backend auth skeleton`
- ...

## Stage Order

1. Stage 1 - Architecture blueprint and execution checklist
2. Stage 2 - Database migration baseline (Opalstack PostgreSQL)
3. Stage 3 - Backend API skeleton + auth + role guards
4. Stage 4 - Storage, email queue, AI provider integration
5. Stage 5 - Frontend refactor from Supabase client to API client
6. Stage 6 - Production deployment validation
7. Stage 7 - Post-cutover cleanup and hardening

## Rollback Strategy

- After each stage, tag commit:
  - `migration-stage-1`
  - `migration-stage-2`
  - ...
- If stage fails, rollback to previous tag.
- Never combine multiple stages in one commit.

## Stage 1 Deliverables

- Migration execution plan in repository
- Task checklist for Stage 2 kickoff
- Technical blueprint with mapping table and API contracts
- Explicit user action list for hosting and credentials

## User Action Checklist (Needed Before Stage 2)

1. Confirm Opalstack app type for backend (Node.js app preferred).
2. Confirm PostgreSQL database name and credentials are created on Opalstack.
3. Confirm preferred email provider (Resend, Mailgun, SendGrid, or Opalstack SMTP).
4. Confirm preferred AI provider (OpenAI, Google, Anthropic).
5. Confirm whether we use staging domain first (recommended).

## Stage 2 Locked Choices

- Backend: Node.js + NestJS
- Migration tooling: Prisma
- Email provider: Mailgun (primary)
- AI provider: Google Gemini API (free tier first)
- Deployment strategy: production-first

## Notes

- No code migration starts before Stage 1 is committed and pushed.
- All future stage documents should be added under `docs/migration/`.
- Stage 1 technical lock file: `docs/migration/STAGE_1_TECHNICAL_BLUEPRINT.md`.
