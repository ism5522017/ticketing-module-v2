# Ticketing Module V2 — Single Source of Truth

This is the only documentation file in this project. Everything lives here:
project context, hard rules, stack, login flow, migration plan, conventions,
and a running changelog at the bottom. All future advancements get logged
in the changelog — do not create new docs.

This file is auto-loaded into every Claude Code session opened in this folder.

---

## 1. What this project is

A from-scratch rewrite of the Rails + vanilla-JS ticketing app located at
`../ticketing module/`. Same Supabase backend, same users, same data, same
visual design. Different stack.

**Reason for the rewrite:** all coding is done by AI. The old stack
(untyped vanilla JS, frozen camelCase wire contract, hand-rolled Zeitwerk
namespacing, schema split across Rails and Supabase) maximizes AI mistakes.
The new stack maximizes compiler-caught errors.

---

## 2. Hard rules

1. **The old Rails project is untouched.** It stays running until V2 reaches
   parity. Do not edit anything under `../ticketing module/`.
2. **Same Supabase project, schema intact.** Drizzle introspects the live
   DB. New schema changes go in `supabase/migrations/<timestamp>_*.sql` and
   are applied via the Supabase SQL Editor — same workflow as the old app.
3. **Feature parity = the current Rails app's feature set, no more.** Do
   not add features from prior design docs unless explicitly asked.
4. **No half-finished pages.** Each route ships at full parity with the
   old app's equivalent or doesn't ship at all.
5. **Same look and positions as old app.** Color scheme and information
   hierarchy must match. Implementation (Tailwind + shadcn) is new; visual
   result is preserved.
6. **All code by AI.** Conventions are picked to maximize compiler-caught
   mistakes: strict TS, Drizzle (typed SQL), shadcn (typed components),
   Server Actions (typed contracts).
7. **Document advancements in the Changelog at the bottom of THIS file.**
   No separate docs.

---

## 3. Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 16 (App Router) | Largest AI training corpus; file-based routing; server components |
| Language | TypeScript (strict) | Compiler catches AI's #1 failure: wrong field names |
| Styling | Tailwind CSS v4 | Deterministic; AI never invents bad CSS architecture |
| Components | shadcn/ui (Base UI + Radix) | Copy-paste components owned by the project; AI edits as TSX |
| Charts | Recharts (planned, when admin dashboard lands) | TypeScript-native |
| Database | Supabase Postgres | Same project as old app: `jivjwubvlmrenpekujkf` |
| ORM | Drizzle | Typed SQL; introspected from live schema so types match reality |
| Auth | Supabase Auth (JWT) | Built-in email reset; OTP-ready for SMTP later |
| Storage | Supabase Storage | Same bucket `ticket-attachments` as old app |
| Server logic | Server Actions + Route Handlers | Co-located, typed contracts |
| Hosting | Vercel (planned) | Natural Next.js fit; free tier covers this app |

### Important: Next.js 16 is recent

Next.js 16 ships breaking changes from 15 — config flag names, caching
defaults, and some App Router APIs. Before writing Next-specific code,
check `node_modules/next/dist/docs/` or the official docs rather than
relying on training memory.

### Not used (and why)
- **tRPC** — Server Actions cover the same ground with less ceremony.
- **Prisma** — Drizzle is lighter and AI writes it more accurately.
- **NextAuth** — Supabase Auth is already the database; second auth provider would split state.
- **Zustand / Redux** — Server Components + URL state cover this app's needs.
- **Pages Router** — App Router has more training data and is the long-term path.

---

## 4. Folder layout

```
Ticketing Module V2/
├── CLAUDE.md                    # THIS file — only doc, auto-loaded
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.* (none — Tailwind v4 uses globals.css directives)
├── postcss.config.mjs
├── eslint.config.mjs
├── components.json              # shadcn/ui config
├── drizzle.config.ts
├── .env.example                 # template, committed
├── .env.local                   # gitignored, real secrets
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── (auth)/              # Login, set-password, onboarding (planned)
│   │   ├── (tenant)/            # Tenant dashboard, tickets (planned)
│   │   ├── (dr)/                # DR dashboard, raise issue (planned)
│   │   ├── (manager)/           # Manager directory, requisitions (planned)
│   │   ├── (admin)/             # Admin dashboard, tickets, budgets, staff (planned)
│   │   ├── api/                 # Route handlers (file uploads, webhooks)
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Redirects to /login
│   │   └── globals.css
│   ├── components/
│   │   └── ui/                  # shadcn primitives (button, card, input, label)
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── server.ts        # @supabase/ssr server client
│   │   │   ├── browser.ts       # @supabase/ssr browser client
│   │   │   └── admin.ts         # service-role client (server-only)
│   │   └── utils.ts             # cn(), formatting helpers
│   ├── db/
│   │   ├── client.ts            # Drizzle client instance
│   │   ├── schema.ts            # Drizzle schema (introspected, hand-edited)
│   │   └── relations.ts         # Drizzle relations
│   └── middleware.ts            # Auth + role + first-login redirects (planned)
├── supabase/
│   ├── migrations/              # New SQL migrations (applied via Supabase Editor)
│   └── drizzle/                 # drizzle-kit pull output (gitignored except meta)
└── public/                      # Static assets
```

---

## 5. Local development

### Prereqs
- Node 22+ (currently using v24.14.1)
- npm 10+
- Access to the live Supabase project — credentials in `.env.local`

### Setup
```bash
cd "/Users/ismailmustafa/Desktop/BADRI MAHAL/CODING/Ticketing Module V2"
cp .env.example .env.local
# Fill in: NEXT_PUBLIC_SUPABASE_ANON_KEY, DATABASE_URL, SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev
# open http://localhost:3000
```

### Common commands
```bash
npm run dev              # Next dev server
npm run build            # Production build
npm run lint             # ESLint
npm run typecheck        # tsc --noEmit
npm run db:pull          # Re-introspect live Supabase schema → src/db/schema.ts
```

### shadcn workflow
```bash
npx shadcn@latest add <component>   # files land in src/components/ui/
# Each component is yours — edit freely.
```

### Drizzle workflow
1. Apply schema changes in `supabase/migrations/<timestamp>_*.sql` via the Supabase SQL Editor.
2. Run `npm run db:pull` — Drizzle introspects and rewrites `src/db/schema.ts`.
3. Commit `src/db/schema.ts` so the types track the DB.

Never use `drizzle-kit push` or `drizzle-kit generate` against the live DB —
SQL is hand-written and applied manually, same workflow as the old app.

---

## 6. Login & auth design

The login flow is the single most non-obvious part of V2. Read this fully
before touching any auth code.

### Goals
1. **Tenants type `BUILDING_CODE-FLAT` to log in** (e.g. `ABC-101`). No dropdown.
2. **Staff (admin/manager/DR) types a username.** Unchanged from the old app.
3. **First-time users never see a password field.** They go straight to set-password → confirm profile → dashboard.
4. **Existing users with BCrypt passwords keep working.** No forced reset, no lockout.
5. **Supabase Auth is the underlying provider.** Unlocks email OTP, SMTP, password reset for later.

### Identity model — consolidated `users` table

All four user types (tenant / admin / manager / dr) consolidate into one
`users` table linked 1:1 to Supabase's built-in `auth.users`. Role-specific
data lives in role-specific tables.

```
auth.users (Supabase-managed)
    id                  uuid PK
    email               text         -- always populated (real or synthetic)
    encrypted_password
    raw_user_meta_data  jsonb

public.users (our consolidation table)
    id                      uuid PK references auth.users(id)
    role                    enum('tenant','admin','manager','dr')
    username                text     -- staff only; null for tenants
    full_name               text
    phone                   text
    active                  boolean default true
    needs_password_set      boolean default true
    needs_profile_confirm   boolean default true
    legacy_bcrypt_hash      text     -- set during migration; cleared after rehash
    created_at, updated_at

public.tenants (role-specific)
    user_id   uuid PK references users(id)
    unit_id   uuid references units(id)
    -- legacy fields preserved from old app

public.admins / public.managers / public.drs
    user_id   uuid PK references users(id)
    -- role-specific fields
```

### Email convention

Supabase Auth requires every user to have an email. Real emails are nice
but not mandatory for login.

- **Real email on file:** use it.
- **Otherwise:** synthesize. Format: `{building_code}-{flat}@tenants.local` for tenants, `{username}@staff.local` for staff.
- Synthetic emails are flagged in metadata so the user can replace them when we wire up email OTP / SMTP.

### Tenant login flow

```
1. User types "ABC-101"
2. Server parses: building_code=ABC, flat=101 (hyphen is the separator)
3. Server looks up building by code → unit by (building_id, flat) → tenant
4. Server reads user.needs_password_set:
   - TRUE  → return "first_login" → frontend routes to /set-password
            (passes a short-lived signed token, not the user_id)
   - FALSE → frontend shows password input → /api/auth/sign-in
5. On password submit:
   a. Try Supabase Auth signInWithPassword(email, password)
   b. If success: done.
   c. If fails AND user.legacy_bcrypt_hash IS NOT NULL: try BCrypt-compare
      - On match: silently call Supabase Auth admin updateUserById to set
        the password, clear legacy_bcrypt_hash, then sign in normally.
      - On mismatch: return generic "invalid login" error.
```

### Staff login flow

Username instead of building-code-flat. Same first-login + rehash logic.

### First-login post-screens

After password is set (or first successful sign-in), middleware checks:

1. **`needs_password_set` is true:** route to `/onboarding/set-password`.
2. **`needs_profile_confirm` is true:** route to `/onboarding/confirm-profile` — confirm or edit **phone** and **address/location**.
3. **Both false:** route to `/{role}/dashboard`.

These checks run in Next.js middleware so they apply on every request.

### Building code backfill

Buildings need a 2-3 letter unique `code` column before tenant login works.

1. Add `buildings.code` column (text, unique, indexed).
2. Generate suggested codes from `buildings.name`:
   - Drop common words: "Tower", "Apartment", "Building", "Complex", "Heights"
   - First letter of each remaining word, uppercase
   - If only one word, take first 3 letters
3. Admin reviews via one-time tool: `/admin/buildings/codes` — every building with its suggested code, inline-editable.
4. Save → DB constraint enforces uniqueness.

### One-time user backfill

Before any tenant can log in, run `scripts/migrate_users.ts` (idempotent):

```
For each existing user across tenants/admins/managers/drs tables:
  1. Synthesize email (or use user.email if real)
  2. Create auth.users entry via Supabase admin API:
     - email_confirm: true
     - password: random 32 bytes (user never uses it)
     - user_metadata: { needs_password_set: true, role }
  3. Create public.users row mirroring auth.users.id with:
     - legacy_bcrypt_hash = the old BCrypt password_digest
     - needs_password_set = true
     - needs_profile_confirm = true
  4. Create role-specific row (public.tenants/admins/managers/drs)
     linking user_id → unit_id / etc.
```

### RLS strategy

Supabase Auth issues a JWT containing `sub` = `auth.users.id`. Every RLS
policy joins through that.

Pattern:
```sql
create policy "tenants see own tickets"
  on tickets for select
  using (
    exists (
      select 1 from tenants
      where tenants.user_id = auth.uid()
        and tickets.tenant_user_id = auth.uid()
    )
  );
```

DR adds a building-membership check. Manager and admin use the role enum.

### What this solves vs. doesn't

**Solves:**
- The old app's client-trust hole (§8 of old handover) — Supabase Auth verifies signed JWTs server-side.
- Cross-role privilege escalation — RLS at the DB, not the controller. A Next.js bug can't bypass it.
- Brute force — Supabase Auth has built-in rate limiting on `signInWithPassword`.
- Stolen BCrypt hashes — `legacy_bcrypt_hash` is read-protected via RLS (service-role only). After rehash, set to NULL.

**Does not yet solve:**
- MFA / second factor — not in scope for parity. Easy to add via Supabase Auth later.
- Instant session revocation — Supabase JWT lifetime is configurable (default 1h).
- Audit trail of logins — Supabase logs them; not surfaced in the app yet.

---

## 7. Migration plan — feature parity tracker

Rule: every feature on this list exists in the current Rails app and must
reach parity in V2. Adding anything not on this list needs explicit user
approval and a new line.

### Status legend
- `TODO` — not started
- `WIP` — in progress
- `DONE` — feature reaches parity with old app, manually verified in browser
- `BLOCKED` — needs user input or external dependency

### Phase 0 — Foundations
| # | Item | Status | Notes |
|---|---|---|---|
| 0.1 | Next.js 16 + TS + Tailwind v4 scaffold | DONE | App Router, strict TS, src dir |
| 0.2 | shadcn/ui init + base components (button, card, input, label) | DONE | Neutral base; theme tokens to be ported in Phase 2 |
| 0.3 | Drizzle schema introspection from live Supabase | DONE | 12 tables, 5 enums, 33 indexes, 10 FKs typed |
| 0.4 | Supabase client setup (server + browser + admin) | DONE | `@supabase/ssr` + service-role helper |
| 0.5 | `.env.example` + `.env.local` with real credentials | DONE | Anon key, service role, DATABASE_URL all in place |
| 0.6 | Base layout + navigation shell | TODO | Match old app's layout structure |

### Phase 1 — Auth & user model
| # | Item | Status | Notes |
|---|---|---|---|
| 1.1 | Schema: `users` consolidating tenants/admins/managers/drs | TODO | Role enum, links to role-specific tables |
| 1.2 | Schema: `buildings.code` (2-3 letter unique) | TODO | Required for tenant login |
| 1.3 | Backfill `buildings.code` for every existing building | TODO | Auto-generate + admin review UI |
| 1.4 | Pre-create `auth.users` rows for every existing tenant/admin/manager/DR | TODO | Random temp password, `metadata.needs_password_set = true` |
| 1.5 | Login page — tenant variant (`BUILDING_CODE-FLAT`) | TODO | No dropdown |
| 1.6 | Login page — staff variant (username) | TODO | Admin/manager/DR |
| 1.7 | First-login redirect: set-password → confirm phone → confirm location → dashboard | TODO | Middleware-driven |
| 1.8 | Transparent BCrypt → Supabase Auth rehash | TODO | Verify old hash → set new password → clear legacy |
| 1.9 | Logout + session refresh middleware | TODO | Next.js middleware, JWT |
| 1.10 | RLS policies on every table for the new user model | TODO | Per role, per ownership |

### Phase 2 — Tenant flows
| # | Item | Status | Notes |
|---|---|---|---|
| 2.1 | Tenant dashboard (profile card + ticket list) | TODO | Match `public/js/dashboard.js` + `tickets.js` |
| 2.2 | Edit profile (name, phone, etc.) | TODO | Match `PUT /api/tenant/:email` |
| 2.3 | Submit new ticket (free-text type, description, attachments) | TODO | Match `tickets#create` + `triage_service` |
| 2.4 | Attachment upload to Supabase Storage | TODO | Same bucket, same MIME/size limits |
| 2.5 | Ticket detail view (no triage shown to tenant) | TODO | Match old app |
| 2.6 | Change password page | TODO | Match `change_password` |

### Phase 3 — DR flows
| # | Item | Status | Notes |
|---|---|---|---|
| 3.1 | DR dashboard (own tickets + building-scope tickets) | TODO | Match `drs#tickets` |
| 3.2 | DR raise issue (unit or society/building scope) | TODO | Match `drs#raise_ticket` |
| 3.3 | DR building stats widget | TODO | Match `drs#stats` |

### Phase 4 — Manager flows
| # | Item | Status | Notes |
|---|---|---|---|
| 4.1 | Manager directory (list all tickets, filters) | TODO | Match `public/js/manager.js` |
| 4.2 | Requisition create form (cost breakdown line items) | TODO | Match `requisitions#create` |
| 4.3 | Requisition list (own created) | TODO | |
| 4.4 | Vendor confirmation step | TODO | Match `requisitions#confirm_vendor` |

### Phase 5 — Admin flows
| # | Item | Status | Notes |
|---|---|---|---|
| 5.1 | Admin dashboard (KPI cards + charts) | TODO | Match `public/js/admin_charts.js` |
| 5.2 | Admin ticket directory + approve/reject urgency override | TODO | Match `public/js/admin_tickets.js` |
| 5.3 | Admin requisition approve/reject | TODO | Match `requisitions#approve` / `#reject` |
| 5.4 | Monthly budgets editor | TODO | Match `public/js/admin_budgets.js`, `budgets_controller` |
| 5.5 | Building heatmap | TODO | Match old app's heatmap |
| 5.6 | Financial overview chart | TODO | Match old app |

### Phase 6 — Staff CRUD (admin-only)
| # | Item | Status | Notes |
|---|---|---|---|
| 6.1 | Admins management (list, create, edit, deactivate, reset pwd) | TODO | Match `Staff::AdminsController` |
| 6.2 | Managers management | TODO | Match `Staff::ManagersController` |
| 6.3 | DRs management (with residency check) | TODO | DR must be a tenant of their building |
| 6.4 | Tenants management (paginated) | TODO | Match `Staff::TenantsController` |
| 6.5 | Units read-only list | TODO | Match `Staff::UnitsController` |
| 6.6 | Tenant credentials lookup view | TODO | Match `tenant_credentials` view |

### Phase 7 — Cross-cutting
| # | Item | Status | Notes |
|---|---|---|---|
| 7.1 | Attachment signed-URL serving | TODO | Same prefix scheme: `sup_<path>` |
| 7.2 | Buildings list endpoint (cached) | TODO | Match `buildings#index` |
| 7.3 | Triage service (urgency keyword scorer) | TODO | Port `app/services/triage_service.rb` |
| 7.4 | Reference code generation for tickets (`TK-00###`) | TODO | Postgres sequence already exists |
| 7.5 | Manager-building assignments table (schema only) | TODO | Future-proofs multi-society |

### Phase 8 — Cutover
| # | Item | Status | Notes |
|---|---|---|---|
| 8.1 | End-to-end smoke test all flows against live Supabase | TODO | Use staging first |
| 8.2 | Migrate any post-rewrite data (tickets created in old app during build) | TODO | Single source of truth: Supabase |
| 8.3 | DNS / hosting switch from Render to Vercel | TODO | |
| 8.4 | Archive old Rails app | TODO | Read-only, kept for reference |

---

## 8. Conventions

### 8.1 Wire contract is no longer frozen
The old app's `urgencyOverridden`, `desc`, `time`-as-formatted-string was
preserved for the SPA's sake. V2 owns both ends — use proper names and ISO
timestamps. Match field names to DB columns where possible.

### 8.2 Schema source of truth is Supabase, not Drizzle
Same as the old app: schema lives in `supabase/migrations/*.sql` applied
via the Supabase SQL Editor. Drizzle **introspects** the result and emits
`src/db/schema.ts`. Never run `drizzle-kit push` or `drizzle-kit generate`
against the live DB.

### 8.3 Server-only vs client safety
- `lib/supabase/server.ts` — anon key + user JWT. Server Components, Server Actions, Route Handlers.
- `lib/supabase/browser.ts` — anon key. Safe for client components.
- `lib/supabase/admin.ts` — **service role**. Never imported from a `'use client'` file. Never sent to the browser.

### 8.4 Same look as the old app
Pixel-parity is not required; **color scheme and information hierarchy
are**. Old design tokens (`--c-gray-200`, urgency pill colors, status meta)
get ported into `globals.css` `@theme` block. shadcn's defaults underneath;
project tokens override where they collide.

### 8.5 No half-finished features
A page is either at parity with the old app's equivalent or not shipped.
Branches stay open; nothing goes behind a feature flag.

### 8.6 Errors at boundaries only
Trust internal contracts. Validate at: form submissions, API route
handlers, Supabase response shapes. Don't add try/catch around every
Drizzle call.

### 8.7 Pooler quirk preserved
`postgres({ prepare: false })` because Supabase's transaction-mode pooler
multiplexes connections; prepared statements are per-connection state and
break under multiplexing. Same as old app's `prepared_statements: false`.

---

## 9. Connection to old app

**Shared:**
- The Supabase project (`jivjwubvlmrenpekujkf`). Both apps read and write
  the same DB during the parallel-run period.
- The storage bucket (`ticket-attachments`).
- Existing users in all 4 user tables — migration wraps them in a unified
  `users` table without dropping anything.

**Not shared:**
- Code (no symlinks, no imports).
- Auth tokens (old: client-trust IDs; V2: Supabase JWTs).
- Dev server port (both default to 3000 — run one at a time locally).

---

## 10. Deployment (planned)

| Step | Detail |
|---|---|
| Host | Vercel — push to main = deploy |
| Env vars | Same set as `.env.example`, set in Vercel dashboard |
| Database | Same Supabase project. No migration step in CI; SQL applied manually via Supabase Editor |
| Storage | Same Supabase Storage bucket |
| Custom domain | TBD when cutover happens |
| Old app | Stays on Render until V2 reaches Phase 8 parity, then archived |

---

## 11. Out of scope (explicitly rejected)

These were considered during planning and explicitly excluded. Adding any
requires user approval and a Changelog entry.

- Self-registration → admin approval flow
- Location change requests
- System-wide or per-ticket visible audit log
- In-app notification center
- Excel import UI (keep CLI scripts in old project)
- Super-admin role above regular admin
- Hardcoded issue type enum (keep free text)
- Email / SMS notifications (deferred — Supabase SMTP for OTP later)
- Bulk requisition approvals
- CSV / PDF export
- Comment threads on tickets
- Mobile native app

---

## 12. Changelog

Append every meaningful advancement here. Newest at the top. Date format:
ISO `YYYY-MM-DD`. Keep entries factual and short — link to commits when relevant.

### 2026-05-13 — Project scaffolded
- Created folder `Ticketing Module V2/` with git init.
- Wrote consolidated single-doc CLAUDE.md (this file).
- Scaffolded Next.js 16.2.6 + React 19.2.4 + TypeScript strict + Tailwind v4 + ESLint 9.
- Initialized shadcn/ui (base-nova preset, neutral color). Added components: button, card, input, label.
- Installed: `@supabase/supabase-js`, `@supabase/ssr`, `drizzle-orm`, `postgres`, `bcryptjs`, `lucide-react`, `dotenv` (dev: `drizzle-kit`, `@types/bcryptjs`).
- Wrote Supabase client helpers: `src/lib/supabase/{server,browser,admin}.ts`.
- Wrote Drizzle config + client. Ran `drizzle-kit pull` against live Supabase — introspected 12 tables, 5 enums, 33 indexes, 10 FKs, 1 view into `src/db/schema.ts` + `src/db/relations.ts`.
- Added npm scripts: `typecheck`, `db:pull`.
- Configured `.env.local` with real Supabase URL, anon key, service role key, DATABASE_URL, storage bucket.
- Smoke tests passed: `tsc --noEmit` clean, `next build` clean (~1.6s).
- Saved two memory entries (visible to old-project Claude sessions): V2 migration underway, V2 login design.
