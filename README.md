# JobFAIR — Platforma za sajam zapošljavanja

> Sajam zapošljavanja za studente i diplomce tehničko-tehnoloških fakulteta i ekonomije, organiziran od strane **EESTEC LC Sarajevo**.

**Live URL**: [jobfaireestec.lovable.app](https://jobfaireestec.lovable.app)

---

## Sadržaj

- [Pregled projekta](#pregled-projekta)
- [Arhitektura sistema](#arhitektura-sistema)
- [Tehnološki stack](#tehnološki-stack)
- [Struktura direktorija](#struktura-direktorija)
- [Baza podataka](#baza-podataka)
- [Autentikacija i autorizacija](#autentikacija-i-autorizacija)
- [Javne stranice](#javne-stranice)
- [Dashboard (admin panel)](#dashboard-admin-panel)
- [Sistem registracije na evente](#sistem-registracije-na-evente)
- [Audit logging sistem](#audit-logging-sistem)
- [Email sistem](#email-sistem)
- [Storage (skladištenje fajlova)](#storage-skladištenje-fajlova)
- [Edge Functions](#edge-functions)
- [Branding i dizajn sistem](#branding-i-dizajn-sistem)
- [RLS politike (Row-Level Security)](#rls-politike-row-level-security)
- [Enumi (tipovi podataka)](#enumi-tipovi-podataka)
- [Database funkcije](#database-funkcije)
- [Konstante aplikacije](#konstante-aplikacije)
- [Lokalni razvoj](#lokalni-razvoj)

---

## Pregled projekta

JobFAIR je full-stack web aplikacija koja služi kao centralna platforma za organizaciju sajma zapošljavanja. Platforma ima dva glavna dijela:

1. **Javni dio** — Landing stranica, novosti, oglasi za posao, partneri, CV baza, aktivnosti sa online prijavama
2. **Dashboard** — Admin panel za upravljanje svim aspektima sajma (eventi, tim, partneri, novosti, analitika, audit logovi)

### Ključne funkcionalnosti

| Funkcionalnost | Opis |
|---|---|
| 🎪 Event management | Kreiranje, uređivanje, upravljanje eventima sa različitim šablonima registracije |
| 📝 Online prijave | Javne prijave na aktivnosti bez autentikacije |
| 👥 Tim management | Upravljanje članovima tima po odborima |
| 🤝 Partner management | Kategorije (kompanija/medij/sponzor) sa paketima (gold/silver/standard/promo) |
| 📰 Novosti | Blog sistem sa thumbnail slikama i galerijom |
| 💼 Oglasi za posao | Objave oglasa kompanija sa deadline-ovima |
| 📄 CV baza | Studenti ostavljaju CV-ove, kompanije ih pregledaju |
| 📊 Analitika | Grafovi registracija, statistike evenata |
| 🔍 Audit logovi | Automatsko praćenje svih promjena u sistemu |
| 🔐 Access control | Google OAuth + whitelist admin emailova + approval sistem |
| 📧 Email sistem | Transakcijski emailovi sa queue sistemom |

---

## Arhitektura sistema

### Visoki nivo arhitekture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React SPA)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Public Pages │  │  Dashboard   │  │  Auth Flow   │   │
│  │  (Landing,   │  │  (Events,    │  │  (Google     │   │
│  │   Novosti,   │  │   News,      │  │   OAuth,     │   │
│  │   Oglasi,    │  │   Partners,  │  │   Access     │   │
│  │   Aktivnosti)│  │   Team,      │  │   Requests)  │   │
│  │              │  │   Analytics) │  │              │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                 │           │
│  ┌──────┴─────────────────┴─────────────────┴───────┐   │
│  │           Supabase JS Client (SDK)               │   │
│  │    @supabase/supabase-js + @tanstack/react-query │   │
│  └──────────────────────┬───────────────────────────┘   │
└─────────────────────────┼───────────────────────────────┘
                          │ HTTPS
┌─────────────────────────┼───────────────────────────────┐
│              BACKEND (Lovable Cloud / Supabase)         │
│  ┌──────────────────────┴───────────────────────────┐   │
│  │                  PostgREST API                   │   │
│  └──────────────────────┬───────────────────────────┘   │
│         ┌───────────────┼───────────────┐               │
│  ┌──────┴──────┐ ┌──────┴──────┐ ┌──────┴──────┐       │
│  │ PostgreSQL  │ │   Storage   │ │    Edge      │       │
│  │ + RLS       │ │   Buckets   │ │  Functions   │       │
│  │ + Triggers  │ │   (6 total) │ │  (7 total)   │       │
│  │ + Functions │ │             │ │              │       │
│  └─────────────┘ └─────────────┘ └──────────────┘       │
└─────────────────────────────────────────────────────────┘
```

### Dijagram arhitekture (Mermaid)

![Architecture Overview](/__l5e/documents/architecture-overview.mmd)

<presentation-artifact path="architecture-overview.mmd" mime_type="text/vnd.mermaid"></presentation-artifact>

### Dijagram autentikacije

![Auth Flow](/__l5e/documents/auth-flow.mmd)

<presentation-artifact path="auth-flow.mmd" mime_type="text/vnd.mermaid"></presentation-artifact>

### Dijagram registracije

![Registration Flow](/__l5e/documents/registration-flow.mmd)

<presentation-artifact path="registration-flow.mmd" mime_type="text/vnd.mermaid"></presentation-artifact>

### Dijagram baze podataka (ER)

![Database Schema](/__l5e/documents/database-schema.mmd)

<presentation-artifact path="database-schema.mmd" mime_type="text/vnd.mermaid"></presentation-artifact>

---

## Tehnološki stack

### Frontend

| Tehnologija | Verzija | Namjena |
|---|---|---|
| React | 18.3+ | UI framework |
| TypeScript | 5.8+ | Type safety |
| Vite | 5.4+ | Build tool i dev server |
| Tailwind CSS | 3.4+ | Utility-first CSS |
| shadcn/ui | latest | UI komponente (Radix primitives) |
| Framer Motion | 12+ | Animacije i tranzicije |
| TanStack React Query | 5.83+ | Server state management |
| React Router | 6.30+ | Client-side routing |
| React Hook Form | 7.61+ | Form management |
| Zod | 3.25+ | Schema validacija |
| Recharts | 2.15+ | Grafovi i vizualizacija |
| next-themes | 0.3+ | Dark/light mode |
| date-fns | 3.6+ | Date formatting |
| Sonner | 1.7+ | Toast notifikacije |
| Lucide React | 0.462+ | Ikone |
| QRCode | 1.5+ | QR kod generacija |

### Backend (Lovable Cloud)

| Komponenta | Opis |
|---|---|
| PostgreSQL | Relaciona baza podataka |
| PostgREST | Automatski REST API iz DB sheme |
| GoTrue | Autentikacija (OAuth, email) |
| Storage | Skladištenje fajlova (S3-compatible) |
| Edge Functions | Serverless Deno runtime |
| Realtime | WebSocket subscriptions |
| pgmq | Message queue za emailove |

---

## Struktura direktorija

```
src/
├── assets/                    # Slike (team photos, event photos)
├── components/
│   ├── ui/                    # shadcn/ui komponente (40+ komponenti)
│   ├── layout/
│   │   ├── DashboardLayout.tsx    # Horizontal top-bar nav
│   │   ├── PublicNavbar.tsx        # Javni navbar
│   │   └── PublicFooter.tsx        # Javni footer
│   ├── landing/
│   │   ├── GallerySection.tsx     # Galerija slika
│   │   ├── MapSection.tsx         # Google Maps embed
│   │   ├── PartnersStrip.tsx      # Logo strip partnera
│   │   └── TeamSection.tsx        # Prikaz tima
│   ├── event-detail/
│   │   ├── EventAttendeesTable.tsx # Tabela registracija
│   │   ├── EventDetailHeader.tsx   # Header sa akcijama
│   │   ├── EventQRCode.tsx         # QR kod za event link
│   │   └── EventQuickInfo.tsx      # Brze informacije
│   ├── Logo.tsx                    # Centralizirana logo komponenta
│   ├── NavLink.tsx                 # Navigacijski link sa active state
│   ├── ProtectedRoute.tsx          # Auth guard + admin check
│   └── TemplatePreview.tsx         # Preview registracijskog šablona
├── contexts/
│   └── AuthContext.tsx             # Auth state provider
├── hooks/
│   ├── useEvents.ts               # CRUD za evente
│   ├── useRegistrations.ts        # Registracije + statistike
│   ├── useFormFields.ts           # Dinamička polja forme
│   ├── usePartners.ts             # Partner CRUD + upload
│   ├── useTeam.ts                 # Tim CRUD
│   ├── useNews.ts                 # Novosti CRUD
│   ├── useJobAds.ts               # Oglasi CRUD
│   ├── useCV.ts                   # CV submissions
│   ├── useGallery.ts              # Galerija slika
│   ├── useProfile.ts              # User profil
│   ├── useUserRole.ts             # Role check (admin/editor/viewer)
│   ├── useAuditLog.ts             # Audit logovi
│   ├── useAccessRequests.ts       # Access request management
│   ├── useInquiries.ts            # Upiti kompanija
│   ├── usePendingPartners.ts      # Pending partner count
│   ├── usePublicCompany.ts        # Public company profile
│   ├── useScrollNav.ts            # Scroll-triggered navbar
│   └── use-mobile.tsx             # Mobile detection
├── integrations/
│   ├── supabase/
│   │   ├── client.ts              # Supabase client (auto-generated)
│   │   └── types.ts               # Database types (auto-generated)
│   └── lovable/
│       └── index.ts               # Lovable Cloud integration
├── lib/
│   ├── constants.ts               # Sve konstante aplikacije
│   └── utils.ts                   # Utility funkcije (cn, etc.)
├── pages/
│   ├── Landing.tsx                # Glavna landing stranica
│   ├── Auth.tsx                   # Login + access request
│   ├── Register.tsx               # Javna registracija na event
│   ├── Aktivnosti.tsx             # Javna stranica aktivnosti
│   ├── Novosti.tsx                # Lista novosti
│   ├── NovostDetail.tsx           # Detalj novosti
│   ├── Oglasi.tsx                 # Lista oglasa
│   ├── Partneri.tsx               # Lista partnera
│   ├── OstaviCV.tsx               # CV upload forma
│   ├── Kontakt.tsx                # Kontakt za kompanije
│   ├── CompanyPage.tsx            # Javni profil kompanije
│   ├── Unsubscribe.tsx            # Email unsubscribe
│   ├── NotFound.tsx               # 404 stranica
│   └── dashboard/
│       ├── DashboardHome.tsx      # Početna sa pozdravom
│       ├── Events.tsx             # Lista evenata
│       ├── CreateEvent.tsx        # 3-step wizard za event
│       ├── EventDetail.tsx        # Detalj eventa + attendees
│       ├── Attendees.tsx          # Svi attendees
│       ├── NewsManager.tsx        # CRUD novosti
│       ├── JobAdsManager.tsx      # CRUD oglasa
│       ├── PartnersManager.tsx    # CRUD partnera
│       ├── TeamManager.tsx        # CRUD tima
│       ├── CVDatabase.tsx         # Pregled CV-ova
│       ├── CompanyInquiries.tsx   # Upiti kompanija
│       ├── Analytics.tsx          # Grafovi i statistike
│       ├── AuditLogs.tsx          # Praćenje promjena
│       ├── AccessRequests.tsx     # Odobravanje pristupa
│       ├── CompanyProfile.tsx     # Profil kompanije
│       ├── Integrations.tsx       # Integracije
│       └── SettingsPage.tsx       # Postavke profila
├── test/                          # Vitest testovi
├── App.tsx                        # Root routing
├── main.tsx                       # Entry point
└── index.css                      # Tailwind + custom CSS varijable

supabase/
├── config.toml                    # Supabase konfiguracija
├── migrations/                    # SQL migracije (read-only)
└── functions/
    ├── _shared/
    │   └── transactional-email-templates/
    │       ├── contact-inquiry-confirmation.tsx
    │       └── registry.ts
    ├── enhance-description/       # AI opis eventa
    ├── handle-email-suppression/  # Email bounce handling
    ├── handle-email-unsubscribe/  # Unsubscribe handling
    ├── preview-transactional-email/  # Email preview
    ├── process-email-queue/       # Queue processor
    ├── send-transactional-email/  # Email sender
    └── sync-instagram/            # Instagram sync
```

---

## Baza podataka

### Kompletna shema — sve tabele i kolone

#### 1. `profiles` — Korisnički profili

| Kolona | Tip | Nullable | Default | Opis |
|---|---|---|---|---|
| `id` | uuid | ❌ | — | PK, mapiran na auth.users.id |
| `full_name` | text | ✅ | null | Puno ime |
| `company` | text | ✅ | null | Naziv kompanije |
| `company_slug` | text | ✅ | null | URL slug za javni profil |
| `company_description` | text | ✅ | null | Opis kompanije |
| `website` | text | ✅ | null | Web stranica |
| `avatar_url` | text | ✅ | null | URL profilne slike |
| `social_links` | jsonb | ✅ | `[]` | Niz socijalnih mreža |
| `created_at` | timestamptz | ❌ | `now()` | Kreirano |
| `updated_at` | timestamptz | ❌ | `now()` | Ažurirano |

#### 2. `user_roles` — Korisničke uloge

| Kolona | Tip | Nullable | Default | Opis |
|---|---|---|---|---|
| `id` | uuid | ❌ | `gen_random_uuid()` | PK |
| `user_id` | uuid | ❌ | — | FK na auth.users |
| `role` | app_role enum | ❌ | — | admin / editor / viewer |

**Unique constraint**: `(user_id, role)`

#### 3. `events` — Eventi / aktivnosti

| Kolona | Tip | Nullable | Default | Opis |
|---|---|---|---|---|
| `id` | uuid | ❌ | `gen_random_uuid()` | PK |
| `user_id` | uuid | ❌ | — | Kreator eventa |
| `name` | text | ❌ | — | Naziv eventa |
| `slug` | text | ❌ | — | URL slug (auto-generiran) |
| `description` | text | ✅ | null | Opis |
| `status` | event_status enum | ❌ | `'draft'` | draft / live / past |
| `event_type` | text | ✅ | `'webinar'` | Tip aktivnosti |
| `template` | text | ✅ | `'minimal'` | Registracijski šablon |
| `primary_color` | text | ✅ | `'#7C3AED'` | Brand boja |
| `color_mode` | text | ✅ | `'light'` | Tema (light/dark) |
| `logo_url` | text | ✅ | null | Logo eventa |
| `background_image_url` | text | ✅ | null | Pozadinska slika / flyer |
| `timezone` | text | ✅ | `'America/New_York'` | Vremenska zona |
| `location_type` | text | ✅ | null | physical / virtual / hybrid |
| `location_value` | text | ✅ | null | Adresa ili link |
| `capacity` | integer | ✅ | null | Max kapacitet |
| `registration_limit` | integer | ✅ | null | Limit registracija |
| `registration_deadline` | timestamptz | ✅ | null | Rok za prijavu |
| `ticket_price` | numeric | ✅ | null | Cijena (0 = besplatno) |
| `requires_approval` | boolean | ✅ | `false` | Manual approval |
| `event_date` | timestamptz | ✅ | null | Početak |
| `event_end_date` | timestamptz | ✅ | null | Kraj |
| `created_at` | timestamptz | ❌ | `now()` | Kreirano |
| `updated_at` | timestamptz | ❌ | `now()` | Ažurirano |

**Event tipovi**: `webinar`, `workshop`, `presentation`, `panel`, `networking`, `speed_dating`, `open_space`, `eestechat`, `other`

**Registracijski šabloni**: `minimal`, `split`, `stacked`, `landing`, `cards`

#### 4. `form_fields` — Dinamička polja registracijske forme

| Kolona | Tip | Nullable | Default | Opis |
|---|---|---|---|---|
| `id` | uuid | ❌ | `gen_random_uuid()` | PK |
| `event_id` | uuid | ❌ | — | FK na events |
| `label` | text | ❌ | — | Naziv polja |
| `field_type` | text | ❌ | `'text'` | text / email / tel |
| `placeholder` | text | ✅ | null | Placeholder tekst |
| `position` | integer | ❌ | `0` | Redoslijed prikaza |
| `required` | boolean | ❌ | `true` | Obavezno polje |

**Default polja pri kreiranju eventa**: Ime i prezime, Email adresa, Fakultet, Godina studija, Broj telefona

#### 5. `registrations` — Prijave na evente

| Kolona | Tip | Nullable | Default | Opis |
|---|---|---|---|---|
| `id` | uuid | ❌ | `gen_random_uuid()` | PK |
| `event_id` | uuid | ❌ | — | FK na events |
| `data` | jsonb | ❌ | `'{}'` | Svi podaci forme |
| `status` | registration_status enum | ❌ | `'registered'` | registered / checked_in / cancelled |
| `created_at` | timestamptz | ❌ | `now()` | Vrijeme prijave |

#### 6. `partners` — Partneri sajma

| Kolona | Tip | Nullable | Default | Opis |
|---|---|---|---|---|
| `id` | uuid | ❌ | `gen_random_uuid()` | PK |
| `user_id` | uuid | ❌ | — | Kreator |
| `name` | text | ❌ | — | Naziv partnera |
| `logo_url` | text | ✅ | null | Logo URL |
| `website` | text | ✅ | null | Web stranica |
| `description` | text | ✅ | null | Opis |
| `category` | partner_category enum | ❌ | `'company'` | company / media / sponsor |
| `package` | partner_package enum | ✅ | `'standard'` | standard / silver / gold / promo |
| `display_order` | integer | ❌ | `0` | Redoslijed |
| `visible` | boolean | ❌ | `true` | Vidljivost na javnoj stranici |
| `created_at` | timestamptz | ❌ | `now()` | Kreirano |
| `updated_at` | timestamptz | ❌ | `now()` | Ažurirano |

#### 7. `team_members` — Članovi tima

| Kolona | Tip | Nullable | Default | Opis |
|---|---|---|---|---|
| `id` | uuid | ❌ | `gen_random_uuid()` | PK |
| `user_id` | uuid | ❌ | — | Kreator |
| `name` | text | ❌ | — | Ime člana |
| `role` | text | ❌ | `''` | Pozicija (npr. "Predsjednik") |
| `committee` | text | ❌ | `'Organizacioni odbor'` | Odbor |
| `email` | text | ✅ | null | Email |
| `phone` | text | ✅ | null | Telefon |
| `photo_url` | text | ✅ | null | Fotografija |
| `linkedin_url` | text | ✅ | null | LinkedIn profil |
| `display_order` | integer | ❌ | `0` | Redoslijed |
| `visible` | boolean | ❌ | `true` | Vidljivost |
| `created_at` | timestamptz | ❌ | `now()` | Kreirano |
| `updated_at` | timestamptz | ❌ | `now()` | Ažurirano |

#### 8. `news_posts` — Novosti / blog

| Kolona | Tip | Nullable | Default | Opis |
|---|---|---|---|---|
| `id` | uuid | ❌ | `gen_random_uuid()` | PK |
| `user_id` | uuid | ❌ | — | Autor |
| `title` | text | ❌ | — | Naslov |
| `content` | text | ✅ | null | Sadržaj (Markdown) |
| `summary` | text | ✅ | null | Kratki sažetak |
| `thumbnail_url` | text | ✅ | null | Thumbnail slika |
| `gallery_urls` | jsonb | ✅ | `[]` | Galerija slika |
| `published` | boolean | ❌ | `false` | Status objave |
| `published_at` | timestamptz | ✅ | null | Datum objave |
| `instagram_post_id` | text | ✅ | null | Instagram sync ID |
| `created_at` | timestamptz | ❌ | `now()` | Kreirano |
| `updated_at` | timestamptz | ❌ | `now()` | Ažurirano |

#### 9. `job_ads` — Oglasi za posao

| Kolona | Tip | Nullable | Default | Opis |
|---|---|---|---|---|
| `id` | uuid | ❌ | `gen_random_uuid()` | PK |
| `user_id` | uuid | ❌ | — | Kreator |
| `title` | text | ❌ | — | Naslov oglasa |
| `company_name` | text | ❌ | — | Naziv kompanije |
| `description` | text | ✅ | null | Opis pozicije |
| `image_url` | text | ✅ | null | Slika oglasa |
| `external_link` | text | ✅ | null | Link za prijavu |
| `deadline` | timestamptz | ✅ | null | Rok prijave |
| `published` | boolean | ❌ | `false` | Status objave |
| `created_at` | timestamptz | ❌ | `now()` | Kreirano |
| `updated_at` | timestamptz | ❌ | `now()` | Ažurirano |

#### 10. `cv_submissions` — CV baza

| Kolona | Tip | Nullable | Default | Opis |
|---|---|---|---|---|
| `id` | uuid | ❌ | `gen_random_uuid()` | PK |
| `full_name` | text | ❌ | — | Ime studenta |
| `email` | text | ❌ | — | Email |
| `faculty` | text | ✅ | null | Fakultet |
| `year_of_study` | text | ✅ | null | Godina studija |
| `phone` | text | ✅ | null | Telefon |
| `cv_url` | text | ❌ | — | Link na uploadani CV |
| `created_at` | timestamptz | ❌ | `now()` | Kreirano |

#### 11. `access_requests` — Zahtjevi za pristup

| Kolona | Tip | Nullable | Default | Opis |
|---|---|---|---|---|
| `id` | uuid | ❌ | `gen_random_uuid()` | PK |
| `full_name` | text | ❌ | — | Ime |
| `email` | text | ❌ | — | Email |
| `company_name` | text | ✅ | null | Kompanija |
| `company_domain` | text | ✅ | null | Web domena |
| `message` | text | ✅ | null | Poruka |
| `status` | text | ❌ | `'pending'` | pending / approved / rejected |
| `reviewed_by` | uuid | ✅ | null | Admin koji je pregledao |
| `created_at` | timestamptz | ❌ | `now()` | Kreirano |
| `updated_at` | timestamptz | ❌ | `now()` | Ažurirano |

#### 12. `audit_logs` — Revizijski zapisi

| Kolona | Tip | Nullable | Default | Opis |
|---|---|---|---|---|
| `id` | uuid | ❌ | `gen_random_uuid()` | PK |
| `actor_id` | uuid | ❌ | — | Ko je napravio akciju |
| `actor_email` | text | ✅ | null | Email aktera |
| `action` | text | ❌ | — | created / updated / deleted |
| `entity_type` | text | ❌ | — | Naziv tabele |
| `entity_id` | text | ✅ | null | ID entiteta |
| `metadata` | jsonb | ✅ | `'{}'` | Dodatni podaci (ime, etc.) |
| `created_at` | timestamptz | ❌ | `now()` | Vrijeme |

#### 13. `company_inquiries` — Upiti kompanija

| Kolona | Tip | Nullable | Default | Opis |
|---|---|---|---|---|
| `id` | uuid | ❌ | `gen_random_uuid()` | PK |
| `company_name` | text | ❌ | — | Naziv kompanije |
| `contact_person` | text | ❌ | — | Kontakt osoba |
| `email` | text | ❌ | — | Email |
| `phone` | text | ✅ | null | Telefon |
| `message` | text | ❌ | — | Poruka |
| `interest_type` | text | ✅ | `'participation'` | Tip interesa |
| `status` | text | ✅ | `'new'` | Status upita |
| `created_at` | timestamptz | ❌ | `now()` | Kreirano |

#### 14. `gallery_images` — Galerija

| Kolona | Tip | Nullable | Default | Opis |
|---|---|---|---|---|
| `id` | uuid | ❌ | `gen_random_uuid()` | PK |
| `user_id` | uuid | ❌ | — | Uploadao |
| `image_url` | text | ❌ | — | URL slike |
| `title` | text | ✅ | `''` | Naslov |
| `display_order` | integer | ❌ | `0` | Redoslijed |
| `visible` | boolean | ❌ | `true` | Vidljivost |
| `created_at` | timestamptz | ❌ | `now()` | Kreirano |

#### 15. `email_templates` — Email šabloni

| Kolona | Tip | Nullable | Default | Opis |
|---|---|---|---|---|
| `id` | uuid | ❌ | `gen_random_uuid()` | PK |
| `event_id` | uuid | ❌ | — | FK na events |
| `template_type` | email_template_type enum | ❌ | — | confirmation / reminder / followup |
| `subject` | text | ❌ | `''` | Subject line |
| `body` | text | ❌ | `''` | Body HTML |
| `enabled` | boolean | ❌ | `true` | Aktivno |

#### 16. `email_send_log` — Log slanja emailova

| Kolona | Tip | Nullable | Default | Opis |
|---|---|---|---|---|
| `id` | uuid | ❌ | `gen_random_uuid()` | PK |
| `recipient_email` | text | ❌ | — | Primatelj |
| `template_name` | text | ❌ | — | Šablon |
| `status` | text | ❌ | — | sent / failed / pending |
| `message_id` | text | ✅ | null | External message ID |
| `error_message` | text | ✅ | null | Greška |
| `metadata` | jsonb | ✅ | null | Dodatni podaci |
| `created_at` | timestamptz | ❌ | `now()` | Kreirano |

#### 17. `email_send_state` — Stanje email queue-a

| Kolona | Tip | Nullable | Default | Opis |
|---|---|---|---|---|
| `id` | integer | ❌ | `1` | Singleton PK |
| `batch_size` | integer | ❌ | `10` | Veličina batch-a |
| `send_delay_ms` | integer | ❌ | `200` | Delay između slanja |
| `retry_after_until` | timestamptz | ✅ | null | Rate limit do |
| `auth_email_ttl_minutes` | integer | ❌ | `15` | TTL auth emailova |
| `transactional_email_ttl_minutes` | integer | ❌ | `60` | TTL transakcijskih |
| `updated_at` | timestamptz | ❌ | `now()` | Ažurirano |

#### 18. `email_unsubscribe_tokens` — Tokeni za odjavu

| Kolona | Tip | Nullable | Default | Opis |
|---|---|---|---|---|
| `id` | uuid | ❌ | `gen_random_uuid()` | PK |
| `email` | text | ❌ | — | Email |
| `token` | text | ❌ | — | Unique token |
| `used_at` | timestamptz | ✅ | null | Korišten |
| `created_at` | timestamptz | ❌ | `now()` | Kreirano |

#### 19. `suppressed_emails` — Blokirani emailovi

| Kolona | Tip | Nullable | Default | Opis |
|---|---|---|---|---|
| `id` | uuid | ❌ | `gen_random_uuid()` | PK |
| `email` | text | ❌ | — | Email adresa |
| `reason` | text | ❌ | — | Razlog (bounce, complaint, unsubscribe) |
| `metadata` | jsonb | ✅ | null | Dodatni podaci |
| `created_at` | timestamptz | ❌ | `now()` | Kreirano |

---

## Autentikacija i autorizacija

### Auth flow

```
1. Korisnik dolazi na /auth
2. Opcija A: Google OAuth prijava (za odobrene korisnike)
   → Provjera user_roles tabele
   → Ako ima admin role → /dashboard/home
   → Ako nema → provjera is_email_approved()
   → Ako approved → /dashboard/home
   → Ako nije → sign out + error poruka

3. Opcija B: Zahtjev za pristup (za nove korisnike)
   → Popuni formu (ime, email, kompanija, poruka)
   → Insert u access_requests sa status='pending'
   → Admin pregleda u Dashboard → Zahtjevi
   → Approve/Reject
```

### Auto-admin whitelist

Sljedeći emailovi automatski dobijaju `admin` ulogu pri registraciji (trigger `auto_assign_admin_role`):

**EESTEC LC Sarajevo**:
- `it@eestec-sa.ba`, `chair@eestec-sa.ba`, `cp@eestec-sa.ba`
- `pr@eestec-sa.ba`, `fr@eestec-sa.ba`, `treasurer@eestec-sa.ba`, `hr@eestec-sa.ba`

**JobFAIR tim**:
- `head@jobfair.ba`, `cp@jobfair.ba`, `hr@jobfair.ba`
- `it@jobfair.ba`, `design@jobfair.ba`, `fr@jobfair.ba`, `pr@jobfair.ba`

### Role-based access

| Uloga | Pristup |
|---|---|
| **admin** | Puni pristup svim dashboard funkcijama |
| **viewer** (approved company) | Dashboard Home, Settings, CV Baza |
| **neautoriziran** | Samo javne stranice + access request |

### ProtectedRoute komponenta

```tsx
<ProtectedRoute>              // Zahtijeva login
<ProtectedRoute requireAdmin> // Zahtijeva admin ulogu
```

---

## Javne stranice

### Routing mapa

| Ruta | Komponenta | Opis |
|---|---|---|
| `/` | `Landing.tsx` | Glavna landing stranica sa hero, stats, aktivnostima, timom, galerijom |
| `/novosti` | `Novosti.tsx` | Lista objavljenih novosti |
| `/novost/:id` | `NovostDetail.tsx` | Detalj novosti sa galerijom |
| `/oglasi` | `Oglasi.tsx` | Lista aktivnih oglasa za posao |
| `/partneri` | `Partneri.tsx` | Partneri grupirani po kategorijama i paketima |
| `/ostavi-cv` | `OstaviCV.tsx` | Forma za upload CV-a |
| `/kontakt` | `Kontakt.tsx` | Kontakt forma za kompanije |
| `/aktivnosti` | `Aktivnosti.tsx` | Nadolazeće i prošle aktivnosti sa inline prijavom |
| `/register/:slug` | `Register.tsx` | Javna registracija na event (5 šablona) |
| `/company/:slug` | `CompanyPage.tsx` | Javni profil kompanije |
| `/auth` | `Auth.tsx` | Google login + access request |
| `/unsubscribe` | `Unsubscribe.tsx` | Email odjava |

### Landing stranica sekcije

1. **Hero** — Animirani naslov "Iskoristi svoju šansu!" sa shooting stars efektom
2. **Stats** — Animirani brojači (5000+ posjetitelja, 3000+ CV-ova, 100+ kompanija, 50+ medijskih partnera)
3. **Aktivnosti prije sajma** — Webinari, EESTEChat, Radionica poslovne komunikacije
4. **Aktivnosti tokom sajma** — Razgovor s kompanijama, Prezentacije, OST, Career Speed Dating, Panel diskusija
5. **Timeline** — Historija od 2008. do danas
6. **Galerija** — Slider fotografija iz prethodnih godina
7. **Tim** — Članovi tima grupirani po odborima
8. **Partneri** — Logo strip
9. **Mapa** — Lokacija sajma (Google Maps)
10. **Footer** — Kontakt, socijalne mreže, EESTEC info

---

## Dashboard (admin panel)

### Navigacija

Horizontalni top-bar sa pill-shaped linkovima. Na mobilnom — hamburger meni sa Sheet komponentom.

**Admin navigacija**: Početna, Eventi, Novosti, Oglasi, Partneri, Tim, CV Baza, Upiti, Analitika, Audit log, Zahtjevi

**Company navigacija**: Početna, Moj profil, CV Baza

### Dashboard stranice

| Ruta | Opis | Samo admin |
|---|---|---|
| `/dashboard/home` | Pozdravna stranica sa quick actions | ❌ |
| `/dashboard/events` | Lista svih evenata sa search | ✅ |
| `/dashboard/events/create` | 3-step wizard (Details → Branding → Form) | ✅ |
| `/dashboard/events/:id` | Detalj eventa, QR kod, attendees tabela | ✅ |
| `/dashboard/events/:id/edit` | Uređivanje eventa | ✅ |
| `/dashboard/attendees` | Svi attendees sa filterima po eventu | ✅ |
| `/dashboard/news` | CRUD novosti sa thumbnail uploadom | ✅ |
| `/dashboard/job-ads` | CRUD oglasa za posao | ✅ |
| `/dashboard/partners` | CRUD partnera sa logo uploadom | ✅ |
| `/dashboard/team` | CRUD članova tima sa photo uploadom | ✅ |
| `/dashboard/cv-database` | Pregled i preuzimanje CV-ova | ❌ |
| `/dashboard/company-inquiries` | Pregled upita kompanija | ✅ |
| `/dashboard/analytics` | Grafovi registracija i statistike | ✅ |
| `/dashboard/audit-logs` | Automatski log svih promjena | ✅ |
| `/dashboard/access-requests` | Approve/reject zahtjeva za pristup | ✅ |
| `/dashboard/company-profile` | Uređivanje profila kompanije | ❌ |
| `/dashboard/settings` | Postavke profila, tema, socijalne mreže | ❌ |
| `/dashboard/integrations` | Lista integracija (Instagram, etc.) | ✅ |

### Event Creation Wizard (3 koraka)

**Korak 1 — Details**:
- Naziv, opis, tip aktivnosti, datumi, lokacija, kapacitet

**Korak 2 — Branding**:
- Šablon registracije (Minimal/Split/Stacked/Landing/Cards)
- Brand boja, color mode (light/dark), logo upload, flyer upload

**Korak 3 — Registration Form**:
- Drag-and-drop polja forme
- Default polja: Ime i prezime, Email, Fakultet, Godina studija, Telefon
- Dodavanje custom polja

---

## Sistem registracije na evente

### Tok registracije

```
Javni korisnik → /register/:slug ili /aktivnosti
    ↓
Fetch event po slug-u (mora biti status = 'live')
    ↓
Fetch form_fields za event
    ↓
Korisnik popunjava formu + GDPR consent
    ↓
RPC: register_for_event(event_id, data)
    ↓
SECURITY DEFINER funkcija provjerava:
  ✓ Event postoji i live je
  ✓ Deadline nije prošao
  ✓ Kapacitet nije pun
  ✓ Registration limit nije dostignut
  ✓ Podaci nisu prazni (min 1 polje)
  ✓ Payload < 4KB
  ✓ Email nije registriran 2+ puta
    ↓
INSERT u registrations tabelu
    ↓
Trigger: log_table_change() → audit_logs
```

### Registracijski šabloni

| Šablon | Opis |
|---|---|
| **Minimal** | Centrirana kartica sa formom |
| **Split** | Lijevo flyer, desno forma (50/50) |
| **Stacked** | Flyer gore, forma ispod |
| **Landing** | Hero sa overlay, kartica ispod |
| **Cards** | Grid sa event details + forma karticama |

Svaki šablon podržava:
- Custom brand boju
- Light/dark mode
- Flyer sliku
- Custom logo
- Responsive dizajn

---

## Audit logging sistem

### Automatski trigeri

Database trigger `log_table_change()` automatski bilježi sve INSERT, UPDATE i DELETE operacije na sljedećim tabelama:

| Tabela | Tracked |
|---|---|
| `team_members` | ✅ Create, Update, Delete |
| `partners` | ✅ Create, Update, Delete |
| `events` | ✅ Create, Update, Delete |
| `news_posts` | ✅ Create, Update, Delete |
| `job_ads` | ✅ Create, Update, Delete |
| `access_requests` | ✅ Create, Update, Delete |

### Metadata

Trigger automatski izvlači `name` ili `title` iz entiteta i pohranjuje u metadata polje za lakši pregled.

### Dashboard prikaz

Audit log stranica prikazuje:
- Filtriranje po tipu entiteta
- Badge-evi za akcije (created = zeleni, updated = plavi, deleted = crveni)
- Relativno vrijeme (npr. "prije 5 minuta")
- Actor email
- Metadata (ime entiteta)

---

## Email sistem

### Komponente

1. **pgmq** — PostgreSQL message queue za pouzdano slanje
2. **process-email-queue** — Edge function koja procesira queue
3. **send-transactional-email** — Edge function za slanje
4. **Email šabloni** — React-based TSX šabloni (contact-inquiry-confirmation)
5. **Suppression lista** — Bounce/complaint/unsubscribe handling
6. **Unsubscribe flow** — Token-based one-click unsubscribe

### Queue flow

```
Event (npr. nova registracija)
  → enqueue_email(queue, payload)
  → pgmq queue
  → process-email-queue cron
  → read_email_batch()
  → send-transactional-email
  → Log u email_send_log
  → Ako failed: move_to_dlq (dead letter queue)
```

---

## Storage (skladištenje fajlova)

| Bucket | Public | Namjena |
|---|---|---|
| `event-assets` | ✅ | Flyer slike, logoi evenata |
| `news-images` | ✅ | Thumbnails i galerije novosti |
| `partner-logos` | ✅ | Logoi partnera |
| `team-photos` | ✅ | Fotografije članova tima |
| `gallery` | ✅ | Galerija slika sa sajma |
| `cv-uploads` | ❌ | CV dokumenti (privatno) |

---

## Edge Functions

| Funkcija | Opis |
|---|---|
| `enhance-description` | AI poboljšanje opisa eventa (Lovable AI Gateway) |
| `sync-instagram` | Sync Instagram postova sa novostima |
| `send-transactional-email` | Slanje email-a preko queue |
| `process-email-queue` | Batch procesor email queue-a |
| `preview-transactional-email` | Preview email šablona |
| `handle-email-suppression` | Handling bounce/complaint |
| `handle-email-unsubscribe` | One-click unsubscribe |

---

## Branding i dizajn sistem

### Boje

| Token | Vrijednost | Namjena |
|---|---|---|
| `--primary` | HSL 4 80% 50% | Crvena — glavna brand boja |
| `--background` | HSL 0 0% 100% (light) | Pozadina |
| `--foreground` | HSL 0 0% 3.9% (light) | Tekst |
| `--muted` | HSL 0 0% 96.1% | Suptilne pozadine |
| `--accent` | HSL 0 0% 96.1% | Accent elementi |
| `--destructive` | HSL 0 84.2% 60.2% | Error/delete akcije |
| `--success` | HSL 142 76% 36% | Uspjeh |

### Tipografija

| Element | Font | Klasa |
|---|---|---|
| Naslovi | Space Grotesk | `font-display` |
| Body | Inter | `font-body` |

### Tema

- **Default**: Light mode
- **Podrška**: Light + Dark (next-themes)
- **Storage key**: `app-theme`
- **Toggle**: Na landing navbar-u i u dashboard settings-u

---

## RLS politike (Row-Level Security)

### Rezime po tabeli

| Tabela | Anon SELECT | Auth SELECT | Auth INSERT | Auth UPDATE | Auth DELETE |
|---|---|---|---|---|---|
| `profiles` | Po slug-u | Vlastiti | Vlastiti | Vlastiti | ❌ |
| `user_roles` | ❌ | Vlastiti | ❌ | ❌ | ❌ |
| `events` | Live only | Vlastiti | Vlastiti | Vlastiti | Vlastiti |
| `form_fields` | Live events | Via event ownership | Via event ownership | Via event ownership | Via event ownership |
| `registrations` | ❌ | Via event ownership | Live events | Via event ownership | ❌ |
| `partners` | Visible only | Own + Admin all | Own | Own + Admin | Own + Admin |
| `team_members` | Visible only | Svi auth | Svi auth | Svi auth | Svi auth |
| `news_posts` | Published | Own | Own | Own | Own |
| `job_ads` | Published | Svi auth | Svi auth | Svi auth | Svi auth |
| `cv_submissions` | ❌ | Svi auth | Anon + auth | ❌ | Svi auth |
| `access_requests` | ❌ | Admin only | Anon + auth | Admin only | ❌ |
| `audit_logs` | ❌ | Admin only | Own actor_id | ❌ | ❌ |
| `company_inquiries` | ❌ | Svi auth | Anon + auth | Svi auth | ❌ |
| `gallery_images` | Visible | Svi auth | Svi auth | Svi auth | Svi auth |
| `email_*` | ❌ | Service role only | Service role only | Service role only | ❌ |
| `suppressed_emails` | ❌ | Service role only | Service role only | ❌ | ❌ |

---

## Enumi (tipovi podataka)

```sql
-- Korisničke uloge
CREATE TYPE app_role AS ENUM ('admin', 'editor', 'viewer');

-- Status eventa
CREATE TYPE event_status AS ENUM ('draft', 'live', 'past');

-- Status registracije
CREATE TYPE registration_status AS ENUM ('registered', 'checked_in', 'cancelled');

-- Kategorija partnera
CREATE TYPE partner_category AS ENUM ('company', 'media', 'sponsor');

-- Paket partnera
CREATE TYPE partner_package AS ENUM ('standard', 'silver', 'gold', 'promo');

-- Tip email šablona
CREATE TYPE email_template_type AS ENUM ('confirmation', 'reminder', 'followup');
```

---

## Database funkcije

| Funkcija | Tip | Opis |
|---|---|---|
| `register_for_event(event_id, data)` | SECURITY DEFINER | Sigurna registracija sa svim provjerama |
| `has_role(user_id, role)` | SECURITY DEFINER | Provjera uloge (koristi se u RLS) |
| `is_email_approved(email)` | SECURITY DEFINER | Provjera odobrenog pristupa |
| `get_registration_count(event_id)` | SECURITY DEFINER | Broj aktivnih registracija |
| `auto_assign_admin_role()` | TRIGGER | Auto-dodjela admin uloge za whitelisted emailove |
| `handle_new_user()` | TRIGGER | Kreiranje profila za novog korisnika |
| `update_updated_at_column()` | TRIGGER | Auto-update updated_at polja |
| `log_table_change()` | TRIGGER | Automatski audit log za CRUD operacije |
| `enqueue_email(queue, payload)` | SECURITY DEFINER | Dodavanje u email queue |
| `read_email_batch(queue, size, vt)` | SECURITY DEFINER | Čitanje batch-a iz queue |
| `delete_email(queue, msg_id)` | SECURITY DEFINER | Brisanje poruke iz queue |
| `move_to_dlq(source, dlq, msg_id, payload)` | SECURITY DEFINER | Premještanje u dead letter queue |

---

## Konstante aplikacije

```typescript
APP_NAME = "JobFAIR"
APP_YEAR = 2026
NEXT_EVENT_DATE = "03. i 04. novembar 2026."

// Landing stats
LANDING_STATS = [
  { value: "5000+", label: "Posjetitelja godišnje" },
  { value: "3000+", label: "Unosa u CV bazu" },
  { value: "100+", label: "Kompanija učesnica" },
  { value: "50+", label: "Medijskih partnera" },
]

// Timeline: 2008-2025
TIMELINE_YEARS = [2008, 2010, 2011, ..., 2025]

// EESTEC
EESTEC_WEBSITE = "https://www.eestec-sa.ba/"
EESTEC_ORG_NAME = "EESTEC LC Sarajevo"

// Default values
DEFAULT_BRAND_COLOR = "#7C3AED"
DEFAULT_TIMEZONE = "America/New_York"
DEFAULT_TEMPLATE = "split"
DEFAULT_PAGE_SIZE = 15

// Social platforms
SOCIAL_PLATFORMS = ["Twitter / X", "LinkedIn", "Instagram", "Facebook", "YouTube", "TikTok", "GitHub"]
```

---

## Lokalni razvoj

### Preduslovi

- Node.js 18+ i npm

### Pokretanje

```bash
# Kloniranje
git clone <REPO_URL>
cd <PROJECT_NAME>

# Instalacija
npm install

# Dev server
npm run dev

# Testovi
npm run test
```

### Testovi

Projekat koristi **Vitest** sa **Testing Library**. Testovi pokrivaju:

- `constants.test.ts` — Validacija svih konstanti
- `Logo.test.tsx` — Logo komponenta rendering
- `NavLink.test.tsx` — Navigacijski linkovi
- `ProtectedRoute.test.tsx` — Auth guard logika
- `PublicNavbar.test.tsx` — Javni navbar
- `PublicFooter.test.tsx` — Footer
- `PartnersStrip.test.tsx` — Partner logo strip
- `GallerySection.test.tsx` — Galerija
- `useScrollNav.test.ts` — Scroll-triggered navbar hook
- `utils.test.ts` — Utility funkcije

---

## Licenca

© 2026 JobFAIR / EESTEC LC Sarajevo. Sva prava zadržana.
