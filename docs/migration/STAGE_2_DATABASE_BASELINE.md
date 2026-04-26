# Stage 2 Database Migration Baseline (Opalstack PostgreSQL)

This stage locks backend stack and migration tooling, then establishes the initial Prisma schema baseline for an Opalstack-only backend.

## Locked Decisions (from user)

- Backend framework: Node.js + NestJS
- Migration tooling: Prisma
- Deployment flow: production-first
- Email provider: Mailgun (selected as primary for easier parity with existing suppression/webhook workflows)
- AI provider: Google Gemini API (free tier first)

## Why Mailgun over SMTP for this project

Mailgun keeps feature parity closer to the current system:

- Native event webhooks for bounce/complaint/suppression
- Easier unsubscribe and delivery status tracking
- Better fit for queue + retry + DLQ workflow

Opalstack SMTP can remain as an emergency fallback channel, but not as primary for v1 migration parity.

## Why Gemini for AI in this stage

- Free tier availability for low-volume usage
- Good fit for short text enhancement endpoint used in event description improvements
- Server-side key handling through backend API only

## Stage 2 Deliverables

1. Prisma schema baseline under backend/prisma
2. Migration runbook for local, staging, and production
3. Database model parity checklist against existing app features

## Model Parity Scope

This baseline includes all existing business domains required by the current app:

- Users, profiles, roles
- Events, form fields, registrations
- Partners, team members, news posts, job ads
- CV submissions, company inquiries, access requests
- Gallery images, audit logs
- Email templates, send log, unsubscribe tokens, suppression list, send state
- New queue tables for Opalstack worker execution

## Execution Notes for Next Stage

Stage 3 will scaffold NestJS modules around these models and wire auth + role guards.

## User Action Checklist (before Stage 3)

1. Confirm production PostgreSQL credentials are finalized.
2. Confirm production backend callback URL for Google OAuth.
3. Confirm Mailgun production sending key is active.
4. Confirm Gemini API key is active.
5. Confirm production domain routing for API path is planned.
