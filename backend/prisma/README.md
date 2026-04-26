# Prisma Baseline (Stage 2)

This folder contains the initial PostgreSQL schema baseline for Opalstack migration.

## Scope

- Mirrors existing business-domain tables from current app usage.
- Replaces Supabase-specific queue primitives with explicit queue tables.
- Prepares schema for NestJS backend implementation in Stage 3.

## Commands (local)

1. Install prisma in backend workspace (Stage 3 will formalize package setup).
2. Set DATABASE_URL in environment.
3. Generate migration from baseline schema:

npm run prisma:migrate:dev

or

npx prisma migrate dev --name init_opalstack_baseline

4. Validate schema:

npx prisma validate
npx prisma format

## Staging rollout

- Apply migrations against staging first.
- Run seed script for initial admin users after Stage 3 auth module is ready.

## Production rollout

- Use prisma migrate deploy
- Verify migration table state before API cutover.
