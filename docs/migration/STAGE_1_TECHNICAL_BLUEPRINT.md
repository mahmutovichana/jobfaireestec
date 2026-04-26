# Stage 1 Technical Blueprint (Opalstack-Only)

This blueprint locks migration decisions before implementation.

## 1. Functional Mapping Table

| Current Functionality | Current Dependency | New Opalstack Component | Notes |
|---|---|---|---|
| Public content pages (landing, news, jobs, partners) | Supabase queries from frontend | Backend REST API + Opalstack PostgreSQL | Frontend no longer reads DB directly |
| Dashboard CRUD (events, news, jobs, partners, team) | Supabase tables + RLS | Backend service layer + role guards | Authorization enforced in API layer |
| Event registrations | Supabase table + RPC | POST/GET API endpoints + SQL transactions | Keep duplicate-check and capacity rules |
| Access requests workflow | Supabase table + admin update | API endpoints + admin moderation routes | Preserves pending/approved/rejected flow |
| Google sign-in | Lovable wrapper + Supabase auth | Backend OAuth flow + JWT/refresh cookie | Single auth source in backend |
| Role model (admin/editor/viewer) | Supabase roles + policies | PostgreSQL roles table + backend middleware | Explicit per-route authorization |
| Company profile public page | Supabase profile tables | Profile API + slug index in PostgreSQL | Same public URL behavior |
| File uploads (images, logos, gallery) | Supabase storage buckets | Opalstack media root + upload API | Public media through static route |
| CV uploads (private files) | Supabase private bucket | Private media directory + signed download endpoint | No direct public access |
| Email sending/queue | Supabase edge functions + Lovable email | Backend worker + job table + provider API | Retry and DLQ preserved |
| Unsubscribe/suppression | Supabase edge functions | API routes + database suppression tables | Provider webhook verification in backend |
| Instagram sync | Supabase edge function | Scheduled backend worker on Opalstack | Triggered via cron |
| AI description enhancement | Lovable AI gateway | Backend AI proxy endpoint (provider selectable) | Provider key kept server-side |
| Audit logging | Supabase trigger + table | API-level logging + optional DB trigger | Start with API-level logs |
| Analytics dashboard cards | Supabase queries | Aggregation endpoints in backend | Add caching after parity |

## 2. API Contracts (Predefined)

Base URL: /api/v1

### 2.1 Auth

| Method | Route | Purpose | Request | Response |
|---|---|---|---|---|
| GET | /auth/google/start | Start OAuth flow | Query: redirect_uri | 302 redirect |
| GET | /auth/google/callback | Handle OAuth callback | Query: code, state | Sets refresh cookie, returns access token payload |
| POST | /auth/refresh | Rotate access token | Refresh cookie | New access token |
| POST | /auth/logout | Revoke session | Refresh cookie | success: true |
| GET | /auth/me | Current user and roles | Bearer access token | user profile + roles |

### 2.2 Users and Profiles

| Method | Route | Purpose |
|---|---|---|
| GET | /profiles/me | Get own profile |
| PATCH | /profiles/me | Update own profile |
| GET | /profiles/company/:slug | Public company profile by slug |

### 2.3 Events and Registrations

| Method | Route | Purpose |
|---|---|---|
| GET | /events | List events (public or scoped) |
| POST | /events | Create event (admin/editor) |
| GET | /events/:id | Event detail |
| PATCH | /events/:id | Update event |
| DELETE | /events/:id | Delete event |
| GET | /events/slug/:slug | Public live event by slug |
| POST | /events/:id/registrations | Register to event |
| GET | /events/:id/registrations | List event registrations (authorized) |
| GET | /events/:id/registrations/count | Registration count |

### 2.4 Content Modules

| Method | Route | Purpose |
|---|---|---|
| GET/POST/PATCH/DELETE | /news | Manage news posts |
| GET/POST/PATCH/DELETE | /job-ads | Manage job ads |
| GET/POST/PATCH/DELETE | /partners | Manage partners |
| GET/POST/PATCH/DELETE | /team-members | Manage team members |
| GET/POST/PATCH/DELETE | /gallery | Manage gallery images |

### 2.5 CV and Inquiries

| Method | Route | Purpose |
|---|---|---|
| POST | /cv-submissions | Public CV submit |
| GET | /cv-submissions | Authorized CV listing |
| GET | /cv-submissions/:id/download | Signed private CV download URL |
| POST | /company-inquiries | Public inquiry submit |
| GET/PATCH | /company-inquiries | Authorized inquiry management |

### 2.6 Access Requests and Admin

| Method | Route | Purpose |
|---|---|---|
| POST | /access-requests | Public access request submit |
| GET | /access-requests | Admin list |
| PATCH | /access-requests/:id | Admin approve/reject |
| GET | /admin/analytics/overview | Dashboard totals |
| GET | /admin/audit-logs | Audit entries |

### 2.7 Media

| Method | Route | Purpose |
|---|---|---|
| POST | /media/upload | Upload file by media category |
| DELETE | /media/:category/:filename | Delete uploaded file |
| GET | /media/:category/:filename | Public media for public categories |

Upload categories:

- event-assets
- news-images
- partner-logos
- team-photos
- gallery
- cv-uploads (private)

## 3. Authentication Lock (Final for Stage 1)

### 3.1 OAuth

- Provider: Google OAuth 2.0
- Start endpoint: /auth/google/start
- Callback endpoint: /auth/google/callback
- Allowed callback domains: staging + production only

### 3.2 Session and Token Policy

- Access token (JWT): 15 minutes
- Refresh token: 30 days
- Refresh token rotation: enabled on every refresh
- Refresh token storage: httpOnly, secure cookie, sameSite=lax
- Logout: revokes refresh token server-side

### 3.3 Role Model

- Roles: admin, editor, viewer
- Authorization strategy:
  - admin: full dashboard access
  - editor: content and event management without system settings
  - viewer: limited dashboard read and profile actions
- Role checks enforced in backend middleware, not frontend-only guards

## 4. Storage Strategy Lock (Final for Stage 1)

Decision: use Opalstack local media root as primary storage for v1.

### 4.1 Media Layout

Backend-configured media root with subfolders:

- event-assets/
- news-images/
- partner-logos/
- team-photos/
- gallery/
- cv-uploads/ (private)

### 4.2 Access Rules

- Public categories served as static files through backend/static route
- CV uploads are private and served only through signed/authorized endpoint
- File naming: UUID + sanitized extension
- File validation: mime type + max size enforced server-side

### 4.3 Future Extension

- Storage interface will be abstracted to allow future switch to S3-compatible object storage without frontend changes

## 5. Stage 2 Inputs Still Needed

These are not blockers for blueprint completion, but required before full backend implementation:

1. Email provider selection
2. AI provider selection
3. Staging domain confirmation
