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

Each item below is self-contained. Sections include:
**What**, **Old app reference**, **V2 files to create/edit**, **Behavior**, **Acceptance criteria**.
Items marked DONE describe what was already built. Don't re-do them.

---

### Phase 0 — Foundations

#### 0.1 Next.js 16 + TS + Tailwind v4 scaffold — Status: DONE
**What:** Bootstrap the Next.js project with strict TypeScript, Tailwind v4, ESLint 9.
**Result:** Files in repo root (`package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`) and `src/app/` (App Router with `layout.tsx`, `page.tsx`, `globals.css`).
**How to verify:** `npm run build` succeeds; `npm run typecheck` clean.

#### 0.2 shadcn/ui init + base components — Status: DONE
**What:** Initialize shadcn/ui with the `base-nova` preset (Base UI + Radix) and add the foundational components: button, card, input, label. Port the old app's design tokens.
**Result:** `components.json`, `src/components/ui/{button,card,input,label}.tsx`, `src/lib/utils.ts` (`cn()` helper). `globals.css` contains two `@theme` blocks: the original shadcn block (neutral base) plus a second block of project tokens namespaced with `deh-` (brand colors, tints, urgency hues, status-dot colors, radii ladder, type ramp). Both Tailwind utilities and raw `var(--color-deh-*)` references resolve.
**Naming convention for project tokens:**
- Colors: `bg-deh-blue`, `text-deh-yellow`, `bg-urgency-critical`, `bg-status-open`, etc.
- Radii: `rounded-deh-sm` (6px) → `rounded-deh-pill` (100px).
- Type: `text-deh-xxs` (9px) → `text-deh-xl` (24px).
- shadcn defaults remain untouched (e.g., `text-sm` still resolves to Tailwind's default), so primitive components don't regress.
**Visual sanity check (pending):** full validation of the palette match happens on `/login` (1.5) and the (authed) shell (0.6).

#### 0.3 Drizzle schema introspection — Status: DONE
**What:** Pull the live Supabase schema into typed Drizzle definitions.
**Result:** `drizzle.config.ts`, `src/db/{client.ts, schema.ts, relations.ts}`. 12 tables, 5 enums (`requisition_approval`, `ticket_raiser`, `ticket_scope`, `ticket_status`, `ticket_urgency`), 33 indexes, 10 FKs, 1 view.
**Re-pulling:** After any schema change applied via Supabase SQL Editor, run `npm run db:pull`. This regenerates `schema.ts` and `relations.ts`; commit the diff.

#### 0.4 Supabase client setup — Status: DONE
**What:** Three typed clients for the three usage modes.
**Files:** `src/lib/supabase/server.ts` (cookie-based server client via `@supabase/ssr`), `src/lib/supabase/browser.ts` (client components), `src/lib/supabase/admin.ts` (service-role, server-only).
**Rules:** Never import `admin.ts` from any `'use client'` module. Never put `SUPABASE_SERVICE_ROLE_KEY` in a `NEXT_PUBLIC_*` env var.

#### 0.5 `.env.example` + `.env.local` — Status: DONE
**Required keys:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`, `DATABASE_URL`.
**Gitignore:** `.env*` blocked, `!.env.example` whitelisted. `.env.local` MUST NOT be committed.

#### 0.6 Base layout + navigation shell — Status: TODO
**What:** Build the global app chrome that wraps every authenticated page.
**Old app reference:** `../ticketing module/public/index.html` lines 1-100 (the top `<nav>` with logo + sub-text + avatar), `../ticketing module/public/css/app.css` (`.nav-bar`, `.body`).
**V2 files to create:**
- `src/app/layout.tsx` (root layout — already exists; keep it minimal, just `<html><body>{children}</body></html>` with metadata).
- `src/app/(authed)/layout.tsx` (authed wrapper — header + main + footer).
- `src/components/shared/app-header.tsx` (the persistent header bar).
- `src/components/shared/role-nav.tsx` (role-specific nav links).
- `src/components/shared/user-menu.tsx` (avatar + logout dropdown).
**Header structure:**
- Left: text logo "DEH Maintenance" (no image needed).
- Center: role-sub-text (e.g., "Tenant", "Admin View", "Manager View", "DR — Building Name").
- Right: avatar with user initials (tenants only — staff use plain text) + logout button.
**Acceptance criteria:**
- Header renders for every `(authed)` route, hidden on `/login` and `/onboarding/*`.
- Role-sub-text reflects current user role (read from JWT claims via server client).
- Logout button clears Supabase session, redirects to `/login`.
- Layout uses Tailwind tokens ported in 0.2; no hardcoded colors.

---

### Phase 1 — Auth & user model

> Read §6 (Login & auth design) first. The flow is unusual; pseudo-code there is authoritative.

#### 1.1 Schema: `users` consolidation table — Status: TODO
**What:** Add a single `public.users` table that mirrors `auth.users.id` and holds role + onboarding flags. Add `user_id` FK to each existing role table.
**SQL migration file:** `supabase/migrations/20260514000001_v2_users_table.sql` (timestamp: today's date in `YYYYMMDDHHMMSS`).
**Migration content:**
```sql
create type public.user_role as enum ('tenant','admin','manager','dr');

create table public.users (
  id                       uuid primary key references auth.users(id) on delete cascade,
  role                     public.user_role not null,
  username                 text,                                 -- staff only; null for tenants
  full_name                text not null,
  phone                    text,
  active                   boolean not null default true,
  needs_password_set       boolean not null default true,
  needs_profile_confirm    boolean not null default true,
  legacy_bcrypt_hash       text,                                 -- cleared after first rehash
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create unique index users_username_lower_idx
  on public.users (lower(username))
  where username is not null;
create index users_role_idx on public.users (role);
create index users_active_idx on public.users (active);

alter table public.tenants  add column user_id uuid references public.users(id) on delete set null;
alter table public.admins   add column user_id uuid references public.users(id) on delete set null;
alter table public.managers add column user_id uuid references public.users(id) on delete set null;
alter table public.drs      add column user_id uuid references public.users(id) on delete set null;

create unique index tenants_user_id_idx  on public.tenants  (user_id) where user_id is not null;
create unique index admins_user_id_idx   on public.admins   (user_id) where user_id is not null;
create unique index managers_user_id_idx on public.managers (user_id) where user_id is not null;
create unique index drs_user_id_idx      on public.drs      (user_id) where user_id is not null;
```
**Apply via:** Supabase Dashboard → SQL Editor → paste + Run. After success, `npm run db:pull` to regenerate `src/db/schema.ts`.
**Acceptance criteria:**
- `users` table exists, `user_role` enum created.
- All four role tables have nullable `user_id` columns.
- `npm run db:pull` no errors; `src/db/schema.ts` contains the new table.
- No data deletion or column drops — purely additive.

#### 1.2 Schema: `buildings.code` — Status: TODO
**What:** Add a unique 2-3 letter abbreviation per building (required for the tenant `BUILDING-FLAT` login).
**SQL migration file:** `supabase/migrations/20260514000002_buildings_code.sql`
**Migration content:**
```sql
alter table public.buildings
  add column code text;

create unique index buildings_code_upper_idx
  on public.buildings (upper(code))
  where code is not null;
```
**Acceptance criteria:**
- Column added, unique-when-not-null constraint in place.
- Nullable initially (1.3 backfills it).

#### 1.3 Backfill `buildings.code` (auto-gen + admin review) — Status: TODO
**What:** Generate suggested codes for every building, then surface them in an admin review UI for confirmation/edit before enforcing NOT NULL.
**V2 files to create:**
- `scripts/suggest_building_codes.ts` — node script that reads all buildings, computes suggested codes, writes them via service-role client (only if `code IS NULL` so it's idempotent).
- `src/app/(admin)/buildings/codes/page.tsx` — review UI (server component fetching all buildings, client component for the editable list).
- `src/app/(admin)/buildings/codes/actions.ts` — Server Action `updateBuildingCode(id, code)`.
**Code generation algorithm:**
1. Drop these words (case-insensitive): "Tower", "Apartment", "Apartments", "Building", "Complex", "Heights", "Residency", "Society", "The", "And", "Of".
2. Of the remaining tokens, take the first letter of each, uppercase, concat.
3. If only one token remains (single-word name): take first 3 characters of that token, uppercase.
4. If result < 2 chars or > 3 chars, fall back to first 3 chars of original `name`.
5. On collision with an existing code: append `1`, then `2`, etc. (e.g. `ABC` → `ABC1`).
**Review UI:**
- Table: Building Name | Locality | City | Suggested Code | Confirmed Code (editable input) | Save button.
- Save button calls the Server Action; updates `buildings.code` for that row.
- Admin can override any suggested code. Uniqueness checked on save; surface error inline if collision.
**After all buildings have a code:**
- Run a final SQL: `alter table public.buildings alter column code set not null;` (manual step via Supabase Editor, NOT in the migration since the column is initially nullable).
**Acceptance criteria:**
- Script populates every `code` field idempotently.
- Admin review page renders every building, shows suggested codes, allows edits.
- Uniqueness violations are caught and shown inline.
- After admin confirms all codes, NOT NULL constraint applies cleanly.

#### 1.4 Pre-create `auth.users` for every existing user — Status: TODO
**What:** Idempotent backfill script that creates a Supabase Auth user for each existing row across `tenants`, `admins`, `managers`, `drs`, plus a matching `public.users` row.
**V2 files to create:**
- `scripts/migrate_users.ts` — the one-time script.
**Email synthesis rules:**
- Tenants: prefer `tenants.email` if it's a real email and not in `*.local`/`*.test`; otherwise synthesize `{building.code}-{units.flat}@tenants.local`.
- Admins: `{admins.username}@staff.local`.
- Managers: `{managers.username}@staff.local`.
- DRs: `{drs.username}@staff.local`.
**Per-row work:**
1. Skip if `<role>_table.user_id IS NOT NULL` (idempotent).
2. Compute the email per the rules above.
3. If an `auth.users` row with this email already exists, reuse its id; else create via `auth.admin.createUser({ email, password: random(32 bytes), email_confirm: true, user_metadata: { role, synthetic_email: <bool> } })`.
4. Insert `public.users` with: `id = auth.users.id, role, username (staff only), full_name, phone, active, needs_password_set = true, needs_profile_confirm = true, legacy_bcrypt_hash = <role table>.password_digest`.
5. Update the role-specific table's `user_id` FK to point at the new `public.users` row.
**Run sequence:**
- DR is special: it has both `tenant_id` and `user_id`. Migrate tenants first so DRs can reference an already-existing `users` row.
- Wrap each user's three writes (auth.users create + users insert + role table update) in a Postgres transaction via the service-role client.
**Acceptance criteria:**
- Re-running the script is a no-op (every row has `user_id` after first run).
- `select count(*) from public.users where role = 'tenant'` matches `select count(*) from public.tenants`.
- Every `public.users.legacy_bcrypt_hash` matches the source `password_digest`.
- All `auth.users` rows have `email_confirm = true`.

#### 1.5 Login page — tenant variant (`BUILDING-FLAT`) — Status: TODO
**What:** Single-field login form for tenants; no dropdown.
**Old app reference:** `../ticketing module/public/js/auth.js` lines 46-84 (`doTenantLogin`), `../ticketing module/public/index.html` (`#login-pane-tenant`).
**V2 files to create:**
- `src/app/(auth)/login/page.tsx` — Server Component shell, renders the LoginForm.
- `src/app/(auth)/login/login-form.tsx` — Client Component with two tabs (Tenant, Staff) — see 1.6.
- `src/app/(auth)/login/actions.ts` — Server Actions: `resolveLoginIdentifier(input)` and `signIn(email, password)`.
**UI behavior:**
- Tab 1 "Tenant": single text input labeled "Building & Flat (e.g., ABC-101)". Below it, a Continue button. NO password field initially.
- On Continue: call `resolveLoginIdentifier`. Server parses input, looks up email, checks `users.needs_password_set`:
  - If TRUE: response = `{ status: 'first_login', token: <signed-short-lived-jwt> }`. Frontend redirects to `/onboarding/set-password?token=<token>`.
  - If FALSE: response = `{ status: 'has_password', email: <hashed-or-masked-hint> }`. Frontend reveals a password input + Sign In button.
- On Sign In: call `signIn(email, password)`. Server tries Supabase Auth `signInWithPassword`; on failure with `legacy_bcrypt_hash` present, attempts BCrypt match (see 1.8); on success, sets session cookie and redirects (server-side via middleware) per §6 first-login post-screens.
**Input parser (server-side):**
- Trim, uppercase the alpha portion.
- Split on `-`: left = building code (must be 2-3 uppercase letters), right = flat (case-insensitive text, may include digits + letters like "10A").
- If no `-` present, reject with "Enter your login as BUILDING-FLAT (e.g., ABC-101)".
- Lookup: `select id, email from public.users u join public.tenants t on t.user_id = u.id join public.units un on un.id = t.unit_id join public.buildings b on b.id = un.building_id where upper(b.code) = :code and lower(un.flat) = lower(:flat) and u.active`.
- If no row: generic "No tenant matches that building/flat".
**Acceptance criteria:**
- Submitting `ABC-101` resolves to the right tenant when data exists.
- First-time tenant (needs_password_set=true) skips password input entirely.
- Returning tenant sees password input + signs in successfully.
- All error messages are generic ("invalid login") — no enumeration of valid building codes.

#### 1.6 Login page — staff variant (username) — Status: TODO
**What:** Second tab on the login form for admin/manager/DR; the field accepts a plain username.
**Old app reference:** `../ticketing module/public/js/auth.js` lines 86-127 (`doLogin`), `Staff::*` username lookup pattern.
**V2 files:** Same files as 1.5, just the second tab.
**UI behavior:**
- Tab 2 "Staff": single text input labeled "Username".
- Same two-step flow as tenant: Continue → either redirect to set-password or reveal password field.
- Server-side: `resolveLoginIdentifier` checks `public.users` by lowercased username for `role IN ('admin','manager','dr')`.
**Acceptance criteria:**
- `admin` (or `manager`, `dr`) resolves to the right user.
- Same first-login redirect logic as tenant.
- Same generic error messages.

#### 1.7 First-login flow — Status: TODO
**What:** After a user successfully proves identity (either via password or first-login token), route through any pending onboarding steps before reaching their dashboard.
**Old app reference:** `../ticketing module/public/js/auth.js` lines 187-262 (`promptChangePassword`, `submitChangePassword`).
**V2 files to create:**
- `src/middleware.ts` — Next.js middleware enforcing the gate (see 1.9).
- `src/app/(auth)/onboarding/set-password/page.tsx` + form.
- `src/app/(auth)/onboarding/confirm-profile/page.tsx` + form.
- `src/app/(auth)/onboarding/actions.ts` — Server Actions `setPassword(token, newPassword)`, `confirmProfile(phone, addressFields)`.
**Set-password page:**
- Title: "Choose your password".
- Sub-text: "First-time sign-in — choose a password only you know. The default password won't work after this."
- Inputs: New password (min 6 chars), Confirm password.
- Submit: validates match + length, calls `setPassword`. Server uses `supabaseAdmin.auth.admin.updateUserById(userId, { password })`, sets `users.needs_password_set = false`, signs the user in (sets session cookie), redirects to `/onboarding/confirm-profile` if `needs_profile_confirm = true`, else to role dashboard.
**Confirm-profile page:**
- Title: "Confirm your details".
- Tenant fields: full name (prefilled, editable), phone (prefilled, editable), building (read-only display), flat (read-only display), address note (free text, optional, populates a notes column or stays in user_metadata — TBD per data hygiene).
- Staff fields: full name, phone (only).
- Submit: calls `confirmProfile`, sets `users.needs_profile_confirm = false`, redirects to role dashboard.
**Acceptance criteria:**
- A backfilled tenant lands on set-password directly from /login (no password input shown).
- After set-password, they see confirm-profile.
- After confirm-profile, they land on their role's dashboard.
- Both onboarding flags are flipped exactly once per user.

#### 1.8 Transparent BCrypt → Supabase Auth rehash — Status: TODO
**What:** Existing users with BCrypt password digests should be able to sign in with their old password on V2 — without seeing a forced reset.
**Old app reference:** `../ticketing module/app/services/auth_service.rb`, `password_digest` columns on all four role tables.
**V2 files to create:**
- `src/lib/auth/legacy-rehash.ts` — utility that takes `(email, plaintextPassword)` and either rehashes-and-signs-in or returns failure.
**Algorithm (called from `signIn` Server Action in 1.5):**
1. Call Supabase Auth `signInWithPassword({ email, password })`.
2. If it succeeds → done.
3. If it fails with `invalid_credentials`:
   a. Look up `public.users` by email; if no row or `legacy_bcrypt_hash IS NULL`, return failure.
   b. Compare plaintext to `legacy_bcrypt_hash` using `bcryptjs.compareSync`.
   c. If match: call `supabaseAdmin.auth.admin.updateUserById(userId, { password: plaintextPassword })`, then `update public.users set legacy_bcrypt_hash = null where id = userId`.
   d. Re-call `signInWithPassword({ email, password })` to actually establish the session.
   e. Return success.
   f. If no match: return failure (generic "invalid login").
**Security notes:**
- Step c silently rehashes — user is unaware.
- BCrypt comparison is constant-time; bcryptjs already handles that.
- The rehash is best-effort: if step c fails (DB write error), still return failure to caller so they retry.
**Acceptance criteria:**
- Old tenant logs in with their pre-migration password on V2 → success.
- After that login, their `legacy_bcrypt_hash` is NULL.
- Subsequent logins use only Supabase Auth (no BCrypt fallback path).
- Wrong password → generic failure, no info leak.

#### 1.9 Middleware: session refresh + role gate + first-login gate — Status: TODO
**What:** A single Next.js middleware that runs on every request and enforces: session validity, role-based route protection, and first-login redirects.
**V2 files to create:**
- `src/middleware.ts`.
**Logic:**
1. Read session cookies via `@supabase/ssr` `createServerClient` with cookie helpers.
2. Refresh JWT if near expiry.
3. Route prefixes:
   - `/login`, `/`, `/api/auth/*` → public, no checks.
   - `/onboarding/*` → require session, no role check, no first-login redirect (this IS the onboarding).
   - `/tenant/*` → require session AND `users.role = 'tenant'` AND both onboarding flags false.
   - `/dr/*` → require session AND `users.role = 'dr'` AND both flags false.
   - `/manager/*` → require session AND `users.role = 'manager'` AND both flags false.
   - `/admin/*` → require session AND `users.role = 'admin'` AND both flags false.
4. Unauthorized session → redirect to `/login`.
5. Wrong role → redirect to user's own dashboard root.
6. `needs_password_set = true` → redirect to `/onboarding/set-password`.
7. `needs_profile_confirm = true` (and password set) → redirect to `/onboarding/confirm-profile`.
**Performance:**
- Cache `users` row lookup per request via Next.js `cache()` helper to avoid double-hit.
- Match the middleware config to only run on relevant prefixes (skip `_next/static`, `_next/image`, `favicon.ico`).
**Acceptance criteria:**
- A tenant trying to visit `/admin/dashboard` is redirected to `/tenant/dashboard`.
- An unauthenticated user hitting any protected route is redirected to `/login`.
- A user with `needs_password_set = true` cannot reach any dashboard until they complete onboarding.

#### 1.10 RLS policies — Status: TODO
**What:** Postgres Row-Level Security policies on every public table so the DB itself enforces who can read/write what — even if our Next.js code has a bug.
**SQL migration file:** `supabase/migrations/20260514000010_rls_policies.sql` (after 1.1-1.4 are applied).
**Policy enable:**
```sql
alter table public.users      enable row level security;
alter table public.tenants    enable row level security;
alter table public.admins     enable row level security;
alter table public.managers   enable row level security;
alter table public.drs        enable row level security;
alter table public.tickets    enable row level security;
alter table public.requisitions    enable row level security;
alter table public.monthly_budgets enable row level security;
alter table public.units      enable row level security;
alter table public.buildings  enable row level security;
alter table public.societies  enable row level security;
```
**Helper function:**
```sql
create or replace function public.current_role()
returns public.user_role
language sql stable
as $$ select role from public.users where id = auth.uid() $$;
```
**Policies (one set per table — see §6 for the matrix). Examples:**
```sql
-- users: only see your own row; admins see all.
create policy users_self_read on public.users for select
  using (id = auth.uid() or public.current_role() = 'admin');
create policy users_admin_write on public.users for update
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- tickets: tenants see own; DRs see their building + their society tickets; managers/admins see all.
create policy tickets_tenant_read on public.tickets for select using (
  case public.current_role()
    when 'tenant' then tenant_email = (select email from auth.users where id = auth.uid())
    when 'dr' then (
      building_id = (select building_id from public.drs where user_id = auth.uid())
      or (scope = 'society' and raised_by_dr_id = (select id from public.drs where user_id = auth.uid()))
    )
    when 'manager' then true
    when 'admin'   then true
  end
);
create policy tickets_tenant_insert on public.tickets for insert with check (
  public.current_role() in ('tenant','dr')
);
create policy tickets_manager_update on public.tickets for update using (
  public.current_role() in ('manager','admin')
);
```
(Full policy set is generated alongside this migration — pattern repeats for every table.)
**Acceptance criteria:**
- Every table has RLS enabled.
- A tenant signed in with anon-key client can `select * from tickets` and only see their own.
- A DR sees their building's tickets + society tickets they raised.
- A manager sees everything.
- An admin sees and writes everything.
- The service-role client bypasses RLS (it always does — verify by running admin scripts).

---

### Phase 2 — Tenant flows

#### 2.1 Tenant dashboard — Status: TODO
**What:** Landing page after tenant login. Shows greeting, profile card, ticket list.
**Old app reference:** `../ticketing module/public/js/dashboard.js`, `../ticketing module/public/js/tickets.js` (renderMyTickets), `../ticketing module/public/index.html` (`#page-dashboard`).
**V2 files to create:**
- `src/app/(authed)/tenant/dashboard/page.tsx` — Server Component fetching tenant profile + their tickets.
- `src/app/(authed)/tenant/dashboard/profile-card.tsx` — Client Component (has edit toggle).
- `src/app/(authed)/tenant/dashboard/my-tickets.tsx` — Server Component rendering the list.
- `src/components/shared/ticket-row.tsx` — reusable ticket row (used by tenant + DR).
**Profile card structure:**
- Greeting: "Good morning/afternoon/evening, {full_name}" (compute from `new Date().getHours()`).
- Sub-line: "{building.name} — Wing {unit.wing}, Flat {unit.flat}".
- Card body: 4 rows — Name, Location (= building display name + address), Wing, Flat, Contact.
- Badge: `auto-filled` or `edited by tenant` (boolean on the user's onboarding state or per a session flag).
- "Edit details" button toggles inline editing on Location/Wing/Flat fields (Save/Cancel actions).
**Ticket list:**
- Fetch tickets via Drizzle: `select * from tickets where tenant_email = :email order by submitted_at desc`.
- Render each row using `<TicketRow>` shared component (see Phase 7).
- Each row shows: status dot (color = open/progress/resolved), type, attachment count badge, ticket id, submitted time, status pill.
- Tenants see NO urgency, NO triage reason.
- Empty state: "No tickets yet." with link to "Raise a ticket".
**Acceptance criteria:**
- Loads in <1s on a warm cache.
- Profile data matches what's in `public.users` + `public.tenants` + `public.units` + `public.buildings`.
- Ticket list shows correct chronological order.
- No triage data in DOM (urgency/triage_reason absent).

#### 2.2 Edit tenant profile — Status: TODO
**What:** Inline edit of location/wing/flat from the dashboard profile card. Server reassigns the tenant to a different unit (find-or-create) if those fields change.
**Old app reference:** `../ticketing module/app/services/tenant_service.rb` (`update_tenant_fields`), `../ticketing module/app/models/unit.rb` (`find_or_create_for`), `../ticketing module/public/js/dashboard.js` (`saveEdit`).
**V2 files:**
- `src/app/(authed)/tenant/dashboard/actions.ts` — Server Action `updateTenantProfile(updates: { location?, wing?, flat? })`.
**Algorithm (server-side):**
1. Validate the current user is a tenant (`users.role = 'tenant'`).
2. Compute desired (location, wing, flat) — falling back to current values for any unchanged field.
3. If desired matches current → no-op, return current profile.
4. Otherwise: `Unit.find_or_create_for(location, wing, flat)`:
   - Parse location text "{name}[, {address}]".
   - Look up society by 'Default Society' (only one society in MVP).
   - `findOrCreate` building by `lower(name) = ?`.
   - `findOrCreate` unit by `building_id + lower(wing) + lower(flat)`.
5. Update `public.tenants.unit_id` to the new unit.
6. Set a flag in `user_metadata` so the dashboard badge can show "edited by tenant".
7. Return the new profile shape.
**Acceptance criteria:**
- Editing flat from 101 to 102 reassigns the tenant; old unit row remains (referential integrity).
- Editing to a completely new building creates a new building under the default society.
- All four columns stay readable in `public.tenants` and join correctly.
- The card refreshes with the new values without a hard reload.

#### 2.3 Submit new ticket — Status: TODO
**What:** Form that lets a tenant raise a new ticket. Runs triage server-side, persists with attachments, shows confirmation.
**Old app reference:** `../ticketing module/app/controllers/tickets_controller.rb#create`, `../ticketing module/app/services/ticket_service.rb#create_from_tenant`, `../ticketing module/public/js/tickets.js#submitTicket`.
**V2 files to create:**
- `src/app/(authed)/tenant/tickets/new/page.tsx` — form page.
- `src/app/(authed)/tenant/tickets/new/ticket-form.tsx` — client form (uses FormData for file uploads).
- `src/app/(authed)/tenant/tickets/new/actions.ts` — Server Action `createTicket(formData)`.
- `src/app/(authed)/tenant/tickets/new/confirm/page.tsx` — post-submit confirmation screen.
- `src/lib/triage.ts` — ported triage service (see Phase 7.3).
- `src/lib/storage/upload.ts` — Supabase Storage upload helper (see Phase 7.1).
**Form fields:**
- Tenant info display (read-only): Name, Location, Unit.
- Issue type: select with the 15 categories (see `BUDGET_CATEGORIES` in `../ticketing module/public/js/admin_budgets.js`).
- Description: textarea, required, min 5 chars.
- Attachments: drag-drop zone + file input, max 5 files, jpg/png/gif/webp/pdf, 10MB each.
**Server Action steps:**
1. Validate caller is a tenant (role check + middleware).
2. Validate required fields.
3. Upload each attachment to Supabase Storage at `{YYYY/MM}/{uuid}.{ext}` via service-role client.
4. Call `triage(type, description)` → `{ level, reason }`.
5. Insert into `tickets`:
   - `type, description, urgency = level, triage_reason = reason, submitted_at = now()`
   - `tenant_email = current user email, tenant_name = user.full_name, contact = user.phone`
   - `location_edited = <flag from user_metadata>`
   - `attachments = jsonb([{ id: "sup_<path>", name, mimeType }, ...])`
   - `scope = 'unit', raised_by_role = 'tenant'`
   - `society_id, building_id, unit_id` from the joined hierarchy.
6. `tickets.reference_code` populates via Postgres sequence default (see Phase 7.4).
7. Return the inserted row's reference_code, type, location string, attachment count, formatted time.
**Confirmation screen:**
- "Ticket {TK-00###} submitted" — shows id, issue type, location, "{n} file(s)", time.
- Button to return to dashboard.
**Acceptance criteria:**
- Submitting a ticket with attachments persists everything atomically.
- Triage runs server-side; the tenant never sees urgency on the confirmation.
- Invalid file types are rejected with a clear error.
- The new ticket appears on the dashboard immediately.

#### 2.4 Attachment upload to Supabase Storage — Status: TODO
**What:** Reusable upload helper used by 2.3, requisition invoices (4.2), proof photos (4.4).
**Old app reference:** `../ticketing module/app/services/attachment_upload_service.rb`, `../ticketing module/app/services/storage_service.rb`.
**V2 file to create:**
- `src/lib/storage/upload.ts`.
**Constants:**
```ts
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_MIME = [
  'image/jpeg','image/png','image/gif','image/webp','application/pdf'
] as const;
export const ALLOWED_EXT = ['.jpg','.jpeg','.png','.gif','.webp','.pdf'] as const;
```
**API:**
```ts
export async function uploadAttachment(file: File): Promise<{ id: string, name: string, mimeType: string }>;
```
**Algorithm:**
1. Validate file.type ∈ ALLOWED_MIME and extension ∈ ALLOWED_EXT and size ≤ MAX_FILE_SIZE.
2. Generate path: `{YYYY}/{MM}/{crypto.randomUUID()}{ext}`.
3. Upload to bucket `ticket-attachments` (env: `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`) via service-role client `.storage.from(bucket).upload(path, file, { contentType, upsert: true })`.
4. Return `{ id: 'sup_' + path, name: file.name, mimeType: file.type }`.
**Acceptance criteria:**
- Disallowed file types throw a typed error (not just a generic 500).
- Path collisions don't happen due to UUID.
- The returned `id` is what Phase 7.1 uses to serve the bytes back.

#### 2.5 Ticket detail view (tenant) — Status: TODO
**What:** Click-through page from a ticket row showing the full ticket data — without any triage/urgency info.
**V2 files:**
- `src/app/(authed)/tenant/tickets/[id]/page.tsx`.
**Visible fields:** reference_code, type, description, status, submitted time, attachments (clickable thumbnails → lightbox).
**Hidden fields:** urgency, triage_reason, urgency_overridden, raised_by_role internals.
**Lightbox:**
- Reusable component `src/components/shared/lightbox.tsx` — clicking an attachment opens a modal with full-size image (or PDF via `<embed>`).
**Acceptance criteria:**
- URL pattern `/tenant/tickets/TK-00123` resolves to the right ticket.
- RLS blocks a tenant from viewing another tenant's ticket detail.
- No urgency in the DOM (inspect-source check).

#### 2.6 Change password page — Status: TODO
**What:** Lets a signed-in user change their password from the user menu.
**Old app reference:** `../ticketing module/app/controllers/auth_controller.rb#change_password`, `../ticketing module/public/js/auth.js` (`submitChangePassword`).
**V2 files:**
- `src/app/(authed)/settings/password/page.tsx`.
- `src/app/(authed)/settings/password/actions.ts` — Server Action `changePassword(current, next)`.
**UI:** three inputs — current password, new password (≥6 chars), confirm new password.
**Server Action:**
1. Verify current password by attempting `signInWithPassword(currentEmail, currentPassword)` and checking success. (Don't actually replace the session.)
2. Call `supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword })`.
3. Show success toast, redirect back to dashboard.
**Acceptance criteria:**
- Wrong current password → generic "Current password is incorrect".
- New password < 6 chars → inline validation.
- Successful change keeps the user signed in (no session disruption).

---

### Phase 3 — DR flows

#### 3.1 DR dashboard — Status: TODO
**What:** Building overview for the DR — KPI stats + urgency breakdown + searchable ticket list (own building's tickets plus society-scope tickets the DR raised).
**Old app reference:** `../ticketing module/app/controllers/drs_controller.rb#tickets, #stats`, `../ticketing module/app/services/ticket_service.rb` (`read_tickets_for_dr`, `stats_for_building`), `../ticketing module/public/js/dr.js`.
**V2 files to create:**
- `src/app/(authed)/dr/dashboard/page.tsx`.
- `src/app/(authed)/dr/dashboard/stats-row.tsx` — Open/In Progress/Resolved/Total/Avg Hours KPIs.
- `src/app/(authed)/dr/dashboard/urgency-breakdown.tsx` — pill row showing counts per urgency level.
- `src/app/(authed)/dr/dashboard/ticket-list.tsx` — client component with search input + filtered list.
**Header:** "{building.name} — Overview", sub-text "Signed in as {full_name}".
**KPI row (5 cards):** Total tickets, Open, In Progress, Resolved, Avg resolution time (in hours).
**Urgency breakdown:** four pills: Critical/High/Medium/Low with counts, hidden if zero.
**Ticket list:**
- Each row uses the shared `<TicketRow>` (Phase 7) with extras: scope tag (society/building/unit), location, description excerpt.
- Search input filters client-side on (type | description | reference_code), debounced 150ms.
- Tickets fetched server-side via Drizzle query mirroring `TicketService.read_tickets_for_dr`:
  `where building_id = :b OR (scope = 'society' AND raised_by_dr_id = :d) order by submitted_at desc`.
- Strip attachments from rows (DRs never see attachment thumbnails in lists).
**Acceptance criteria:**
- All KPIs match the source data.
- Search filters client-side without re-fetch.
- Society tickets the DR raised appear at the top alongside building tickets.

#### 3.2 DR raise issue — Status: TODO
**What:** Form for a DR to raise a new ticket. Scope selector: building or society.
**Old app reference:** `../ticketing module/app/controllers/drs_controller.rb#raise_ticket`, `../ticketing module/app/services/ticket_service.rb#create_from_dr`, `../ticketing module/public/js/dr.js` (`submitDrTicket`).
**V2 files to create:**
- `src/app/(authed)/dr/tickets/new/page.tsx`.
- `src/app/(authed)/dr/tickets/new/dr-ticket-form.tsx`.
- `src/app/(authed)/dr/tickets/new/actions.ts` — Server Action `createDrTicket(formData)`.
- `src/app/(authed)/dr/tickets/new/confirm/page.tsx`.
**Form fields:**
- Scope: radio buttons — "Building (common area)" / "Society (multi-building issue)". Default: Building.
- Issue type, description, attachments — same as 2.3 (use the same components).
**Server Action steps:**
1. Validate caller is a DR (`users.role = 'dr'`).
2. Look up `public.drs` row for this user.
3. Validate scope ∈ `{'building', 'society'}`.
4. Upload attachments (same helper as 2.4).
5. Run triage.
6. Insert ticket with:
   - `scope = <chosen>, raised_by_role = 'dr', raised_by_dr_id = drs.id`
   - `building_id = scope === 'building' ? drs.building_id : null`
   - `unit_id = null`
   - `society_id = drs.building.society_id`
   - `contact = dr.tenant.contact` (DR's identity comes from their linked tenant)
   - All other ticket fields per 2.3.
**Confirmation:** TK-id, scope label ("Building-level issue" or "Society-level query"), issue type, urgency (DR is allowed to see urgency on their own submissions), time.
**Acceptance criteria:**
- Building-scope ticket has `unit_id = null` and the DR's `building_id` set.
- Society-scope ticket has both `unit_id = null` and `building_id = null` (but `society_id` set).
- Attachments uploaded successfully.

#### 3.3 DR stats endpoint logic — Status: TODO
**What:** The server-side computation behind 3.1's KPI row. Treat as a reusable helper.
**Old app reference:** `../ticketing module/app/services/ticket_service.rb#stats_for_building`.
**V2 file:**
- `src/lib/dr/building-stats.ts`.
**Output shape:**
```ts
type DrStats = {
  open: number;
  progress: number;
  resolved: number;
  total: number;
  by_urgency: { critical: number; high: number; medium: number; low: number };
  avg_resolution_hours: number; // 0 if no resolved tickets
  recent: Ticket[]; // top 10 most recent, attachments stripped
};
```
**SQL approach (Drizzle):**
- Status counts: `select status, count(*) from tickets where building_id = :b group by status`.
- Urgency counts: same with `urgency`.
- Avg resolution hours (Postgres-side): `select avg(extract(epoch from (resolved_at - submitted_at))) / 3600 from tickets where building_id = :b and resolved_at is not null`.
- Recent: `select ... order by submitted_at desc limit 10`, drop `attachments`.
**Acceptance criteria:**
- Matches the old `stats_for_building` byte-for-byte (verify against a fixed building's data).

---

### Phase 4 — Manager flows

#### 4.1 Manager directory — Status: TODO
**What:** All-tickets directory grouped by building, with status filters, search, in-row status/urgency controls, and inline requisition cards.
**Old app reference:** `../ticketing module/public/js/manager.js` (`renderManagerTickets`, `applyFilterAndRender`, `renderManagerTicketCard`).
**V2 files to create:**
- `src/app/(authed)/manager/directory/page.tsx` — Server Component fetching tickets + requisitions.
- `src/app/(authed)/manager/directory/directory-shell.tsx` — Client Component (filters, search, ticket cards).
- `src/app/(authed)/manager/directory/ticket-card.tsx` — per-ticket card with controls.
- `src/app/(authed)/manager/directory/actions.ts` — Server Actions: `updateTicketStatus(id, status)`, `overrideUrgency(id, urgency)`.
**KPI header (4 stats):** Pending (no requisition), Awaiting Admin (requisition Pending), Approved, Rejected.
**Filter chips:** "All" / "Pending" / "Awaiting Admin" / "Approved" / "Rejected" — controls which tickets render.
**Search input:** filters client-side by (tenant_name | location | type | reference_code).
**Grouping:** group filtered tickets by building name (split `location` on first comma). Sort tickets within each building by urgency (Critical first, then High, Medium, Low).
**Per-ticket card:**
- Header: reference_code · time, type. Right side: status dropdown (Open / In Progress / Resolved), urgency badge, "manually set" tag if `urgency_overridden`, urgency override dropdown (only if no requisition exists).
- Body: tenant name, unit (Wing/Flat), description.
- Requisition section (if exists): est cost, vendor / in-house badge, cost breakdown, admin remarks, invoice attachment strip, vendor confirmation badge or upload form (see 4.4).
- "Create Requisition" button (only if no requisition exists).
**Optimistic updates:**
- Status change updates the row instantly, then calls the server. If server fails, revert + alert.
- Urgency override: same pattern; track via `window.__managerPendingOverrides[id]` (in V2, use a useState/useOptimistic).
**Server Actions:**
- `updateTicketStatus(reference_code, status)` — verifies caller is manager/admin, updates `tickets.status` and `resolved_at` (per the model's before_save logic).
- `overrideUrgency(reference_code, urgency)` — verifies no requisition exists for this ticket; sets `urgency = :u, urgency_overridden = true`.
**Acceptance criteria:**
- KPI counts match the underlying data.
- Filter chips toggle visibility without re-fetching.
- Optimistic updates feel instant.
- Override is blocked (with alert) if a requisition already exists.

#### 4.2 Requisition create form — Status: TODO
**What:** A multi-section form a manager submits for a chosen ticket. Calculates est_cost from line items in real time.
**Old app reference:** `../ticketing module/app/controllers/requisitions_controller.rb#create`, `../ticketing module/app/services/requisition_service.rb#create_requisition`, `../ticketing module/public/js/manager.js` (`openRequisition`, `addFinanceRow`, `calcFinanceTable`, `submitRequisition`).
**V2 files to create:**
- `src/app/(authed)/manager/tickets/[id]/requisition/new/page.tsx`.
- `src/app/(authed)/manager/tickets/[id]/requisition/new/requisition-form.tsx`.
- `src/app/(authed)/manager/tickets/[id]/requisition/new/actions.ts` — Server Action `createRequisition(formData)`.
**Form sections:**
1. Ticket summary (read-only): TK-id, issue type, location.
2. "Surveyed?": yes/no.
3. "In-house fix?": yes/no. If yes, hide the rest of the form (vendor section + finance table) and force est_cost = 0.
4. Vendor section: vendor name (required if not in-house).
5. Cost breakdown table: rows of (line item description, amount). Add Row / Remove Row buttons. Auto-sums into `est_cost` (read-only, derived).
6. Invoices: file attachments (same upload helper as 2.4).
**Server Action steps:**
1. Validate caller is a manager.
2. Resolve `ticket_id` (reference_code) → ticket row.
3. If in-house: `est_cost = 0`, `vendor_name = null`, `cost_breakdown = null`, `invoices = []`.
4. Otherwise: validate vendor_name + est_cost > 0 + cost_breakdown non-empty.
5. Upload invoices.
6. Insert into `requisitions`: `issue_id = ticket.id, surveyed, in_house_fix, vendor_name, est_cost, cost_breakdown, invoices, admin_approval = 'Pending', submitted_at = now()`.
**Acceptance criteria:**
- "In-house fix" hides vendor + finance sections, zeros est_cost.
- Adding a finance row updates the est_cost total in real time.
- One requisition per ticket (unique constraint on `requisitions.issue_id` already enforced).
- Returning to the directory shows the new requisition card.

#### 4.3 Requisition list (own created) — Status: TODO
**What:** A simple page showing requisitions the manager has submitted, filterable by admin approval status.
**Note:** This is mostly covered by 4.1's directory (manager sees all tickets with their requisition cards inline). If a standalone "Requisitions only" page is desired, list them in a flat sortable table with columns: ticket_id, est_cost, admin_approval, submitted_at, vendor_name. Linking each row back to the directory ticket card is sufficient — no separate detail page needed.
**V2 files (optional):**
- `src/app/(authed)/manager/requisitions/page.tsx`.
**Acceptance criteria:** Each row links back to its ticket card in the directory.

#### 4.4 Vendor confirmation step — Status: TODO
**What:** After admin approves a requisition, the manager uploads a proof photo and marks the vendor work as confirmed. This unlocks ticket closure.
**Old app reference:** `../ticketing module/app/controllers/requisitions_controller.rb#confirm_vendor`, `../ticketing module/app/services/requisition_service.rb#confirm_vendor`, `../ticketing module/public/js/manager.js` (`vendorConfirmHtml`, `handleProofFile`, `confirmVendor`).
**V2 files:**
- `src/app/(authed)/manager/directory/vendor-confirm-block.tsx` — embedded in the requisition card.
- `src/app/(authed)/manager/directory/actions.ts` — Server Action `confirmVendor(reference_code, formData)`.
**UI:**
- Only renders if `req.admin_approval === 'Approved' && !req.vendor_confirmed`.
- Title: "Mark Vendor Complete".
- File input (image only). On select, show preview and enable the Confirm button.
- Confirm button calls Server Action.
- After confirmation: card shows a green "Vendor Confirmed" badge with the manager's name + timestamp + a thumbnail of the proof.
**Server Action steps:**
1. Validate caller is a manager.
2. Validate proof photo present.
3. Validate requisition exists for this reference_code AND `admin_approval = 'Approved'`.
4. Upload proof to storage.
5. Update requisition: `vendor_confirmed = true, vendor_confirmed_at = now(), vendor_confirmed_by = current user.full_name, vendor_proof = jsonb([proofAttachment])`.
**Acceptance criteria:**
- Proof photo is required (button disabled until file selected).
- After confirmation, the green banner shows the right name + timestamp.
- Re-clicking on an already-confirmed requisition is a no-op (idempotent or rejected).

---

### Phase 5 — Admin flows

#### 5.1 Admin dashboard — Status: TODO
**What:** High-level KPIs + four charts + financial overview + budget snapshot + building heatmap.
**Old app reference:** `../ticketing module/public/js/admin.js`, `../ticketing module/public/js/admin_charts.js` (all of it).
**V2 files to create:**
- `src/app/(authed)/admin/dashboard/page.tsx` — Server Component fetching tickets + requisitions + budget summary.
- `src/app/(authed)/admin/dashboard/financial-overview.tsx` — 3 KPI cards: Total Approved, This Month, Pending Cost.
- `src/app/(authed)/admin/dashboard/budget-snapshot.tsx` — current month's budget bars (reused from Phase 5.4 component).
- `src/app/(authed)/admin/dashboard/urgency-chart.tsx` — Recharts donut (Critical/High/Medium/Low for active tickets only).
- `src/app/(authed)/admin/dashboard/status-chart.tsx` — Recharts stacked line over time (Open / In Progress / Resolved per date).
- `src/app/(authed)/admin/dashboard/issue-type-chart.tsx` — Recharts horizontal bar.
- `src/app/(authed)/admin/dashboard/resolved-chart.tsx` — Recharts cumulative line.
- `src/app/(authed)/admin/dashboard/building-heatmap.tsx` — see 5.5.
**Charts use Recharts** (not Chart.js — TypeScript-native, better React integration).
**Data shape:** all charts read from the same `allTickets + allRequisitions` arrays passed from the page (no per-chart fetches).
**Financial overview:**
- Total Approved: sum of `est_cost` where `admin_approval = 'Approved'`.
- This Month: same, filtered to `created_at` within current month.
- Pending Cost: sum where `admin_approval = 'Pending'`.
**Acceptance criteria:**
- All four charts render with real data.
- Numbers in financial overview match a manual SQL sum.
- Heatmap shows buildings sorted by ticket count desc.

#### 5.2 Admin ticket directory — Status: TODO
**What:** Admin's view of every ticket with a 4-stage progress stepper, requisition section, approve/reject controls.
**Old app reference:** `../ticketing module/public/js/admin_tickets.js` (`renderAdminTickets`, `renderAdminTicketCard`).
**V2 files to create:**
- `src/app/(authed)/admin/tickets/page.tsx`.
- `src/app/(authed)/admin/tickets/admin-ticket-card.tsx`.
- `src/app/(authed)/admin/tickets/progress-stepper.tsx`.
**Filter chips:** All / Open / In Progress / Resolved / Req Pending / Req Approved.
**Search:** same algorithm as 4.1.
**Grouping:** same — by building name, urgency-sorted within.
**Progress stepper (4 stages):**
- Stage 0: "Review" — active when status=open AND (no req OR req!=Approved).
- Stage 1: "Approved" — active when status=open AND req=Approved.
- Stage 2: "In Progress" — active when status=progress.
- Stage 3: "Resolved" — active when status=resolved.
- If req=Rejected: stays at Stage 0.
- Render as 4 dots + connectors, completed stages get a green checkmark.
**Per-card content:**
- Header: reference_code, time, type, urgency badge, "edited" badge if `location_edited`.
- Stepper.
- Tenant + Location row.
- Description.
- Requisition block: see 5.3.
**Acceptance criteria:**
- Stepper accurately reflects status for every ticket.
- Filter chips work correctly.
- Cards visually match the old app's layout.

#### 5.3 Admin requisition approve/reject — Status: TODO
**What:** Inline approval controls inside each pending requisition card on the admin ticket directory.
**Old app reference:** `../ticketing module/app/controllers/requisitions_controller.rb#approve, #reject`, `../ticketing module/public/js/admin_tickets.js` (`approveRequisition`, `rejectRequisition`).
**V2 files:**
- `src/app/(authed)/admin/tickets/requisition-block.tsx`.
- `src/app/(authed)/admin/tickets/actions.ts` — Server Actions `approveRequisition(reference_code, remarks)`, `rejectRequisition(reference_code, remarks)`.
**UI (Pending state):**
- Textarea: "Add remarks (optional)" — placeholder.
- Two buttons: "Approve Requisition" (blue) and "Reject" (red).
**UI (Approved/Rejected state):**
- Status badge (green Approved / red Rejected).
- Admin remarks (italic, left-bordered).
- Vendor confirmation block if approved (see 4.4).
**Server Actions:**
1. Validate caller is admin.
2. Look up requisition by reference_code.
3. Update `admin_approval = 'Approved'/'Rejected'` + `admin_remarks = <text>`.
4. Return updated requisition.
**Acceptance criteria:**
- Approve/Reject buttons only visible when `admin_approval = 'Pending'`.
- Remarks persist and display correctly afterward.
- Approved requisitions unlock vendor confirmation for the manager (4.4).

#### 5.4 Monthly budgets editor — Status: TODO
**What:** Admin sets per-category and total monthly budgets. Shows real-time spend vs budget bars.
**Old app reference:** `../ticketing module/app/controllers/budgets_controller.rb`, `../ticketing module/app/services/budget_service.rb`, `../ticketing module/public/js/admin_budgets.js` (all of it).
**V2 files to create:**
- `src/app/(authed)/admin/budgets/page.tsx`.
- `src/app/(authed)/admin/budgets/budget-editor.tsx`.
- `src/app/(authed)/admin/budgets/budget-bar.tsx` — reusable progress bar (color-shifts: green/orange/red).
- `src/app/(authed)/admin/budgets/actions.ts` — Server Actions `upsertBudget(category, amount, period?)`, `getBudgetSummary(period?)`.
**Categories (must match):**
```
Water leak, Electricity problem, AC not working, Broken door / window,
Plumbing issue, Elevator issue, Pest / insects, Sewage / flooding,
Fire or safety hazard, Gas leak, Broken window / latch,
Common area maintenance, Security / access, Society query, Other
```
**Budget summary shape (server returns):**
```ts
{
  period_start: 'YYYY-MM-DD',
  period_label: 'May 2026',
  total: { budget: number, spend: number, remaining: number },
  categories: { category: string, budget: number, spend: number, remaining: number }[]
}
```
**Spend calculation:**
- Sum `est_cost` of approved requisitions whose ticket's `submitted_at` falls in the period.
- Group by `tickets.type` (the repair category), lowercased.
**Editor table:**
- Header: "{Month Year}".
- Row per category: Name | Editable input (budget) | Spend (read-only) | Remaining (red if negative) | Save button.
- Top: Total budget input + Save button.
**Snapshot card (also used on admin dashboard 5.1):**
- Total bar (red if over-budget).
- Top 6 categories by spend, each as a budget bar.
**Acceptance criteria:**
- Setting a budget persists to `monthly_budgets`.
- Spend reflects approved requisitions accurately.
- Over-budget categories show red.

#### 5.5 Building heatmap — Status: TODO
**What:** Horizontal stacked-bar chart, one row per building, segmented by urgency.
**Old app reference:** `../ticketing module/public/js/admin_charts.js` (`renderBuildingHeatmap`).
**V2 file:**
- `src/app/(authed)/admin/dashboard/building-heatmap.tsx`.
**Algorithm:**
1. Group all tickets by building name (extract from `location.split(',')[0]`).
2. For each building: count by urgency (critical/high/medium/low) and total.
3. Sort buildings by total desc.
4. Max-normalize: the longest bar fills the row; others scale proportionally.
**Render:**
- Legend at top: 4 color dots (Critical red, High orange, Medium yellow, Low gray).
- Each row: building name | stacked-segment bar | total count.
- Segments wider than 12% show the count inside.
**Acceptance criteria:**
- Buildings sorted correctly.
- Color mapping matches the old app's palette.
- Tooltip on hover (Recharts default) or a "show details" affordance is optional.

#### 5.6 Financial overview cards — Status: TODO
**What:** Already specified in 5.1 — 3 KPI cards.
**Notes for implementer:** Format Indian rupees with `.toLocaleString('en-IN')`. Place these three cards above the charts on the dashboard.

---

### Phase 6 — Staff CRUD (admin-only)

> Every page in this phase requires `users.role = 'admin'`. Middleware enforces this; Server Actions also re-check defensively.

#### 6.1 Admins management — Status: TODO
**What:** CRUD for admin accounts. Soft-disable on delete (no hard delete). Guards: can't disable self; must keep ≥1 active admin.
**Old app reference:** `../ticketing module/app/controllers/staff/admins_controller.rb`, `../ticketing module/app/controllers/staff/base_controller.rb` (`guard_last_active_admin!`).
**V2 files to create:**
- `src/app/(authed)/admin/staff/admins/page.tsx` — list view.
- `src/app/(authed)/admin/staff/admins/admin-row.tsx` — inline-editable row.
- `src/app/(authed)/admin/staff/admins/new-admin-dialog.tsx` — Add Admin modal.
- `src/app/(authed)/admin/staff/admins/actions.ts` — Server Actions: `createAdmin`, `updateAdmin`, `disableAdmin`, `resetAdminPassword`.
**List columns:** Name | Username | Active toggle | Created | Actions (Edit, Reset Password, Disable).
**Create form:** Name, Username (lowercased on save), Password (optional — defaults to `1234` + `must_change_password = true`).
**Reset Password action:** updates the password (or defaults), flips `users.needs_password_set = true`. Returns the temp password to display in a toast.
**Disable action:**
- Check: target.id != current_admin.id (else 422 "You cannot disable your own admin account").
- Check: at least one OTHER active admin exists (else 422 "At least one active admin must remain").
- Soft-disable: `users.active = false`.
**Acceptance criteria:**
- Self-disable blocked.
- Last-active-admin guard works.
- After password reset, that admin lands on /onboarding/set-password at next login.

#### 6.2 Managers management — Status: TODO
**What:** Same shape as 6.1 but without the last-active guard (managers don't have that constraint).
**Old app reference:** `../ticketing module/app/controllers/staff/managers_controller.rb`.
**V2 files:** mirror 6.1 under `src/app/(authed)/admin/staff/managers/`.
**Notes:** Same default password / must_change_password pattern. No special guards.

#### 6.3 DRs management (residency check) — Status: TODO
**What:** Create DR by selecting a tenant + the building they're a resident of. Model-level check ensures the tenant's unit is in that building.
**Old app reference:** `../ticketing module/app/controllers/staff/drs_controller.rb`, `../ticketing module/app/models/dr.rb` (`tenant_lives_in_building`).
**V2 files to create:**
- `src/app/(authed)/admin/staff/drs/page.tsx` — list of current + retired DRs.
- `src/app/(authed)/admin/staff/drs/new-dr-dialog.tsx`.
- `src/app/(authed)/admin/staff/drs/actions.ts`.
**Create flow:**
1. Admin selects a building from a dropdown.
2. Tenant dropdown populates with ONLY tenants of that building (filter via `tenants.unit_id → units.building_id`).
3. Admin enters DR username + optional password.
4. Server Action `createDr`:
   - Validates the tenant's unit is in the building (defense-in-depth even though UI enforces it).
   - Validates no other ACTIVE DR exists for this building (partial unique index on `drs(building_id) where active = true`).
   - Creates `drs` row with `started_at = now()`.
   - Creates linked `auth.users` + `public.users` (role = 'dr') per 1.4 logic.
**Retire DR:** soft-disable — `drs.active = false, ended_at = now()`. Linked `users.active = false`.
**Acceptance criteria:**
- Tenant dropdown updates when building changes.
- Residency violation rejected with a clear error.
- Retired DRs visible in a "Past DRs" section but not in active rotation.

#### 6.4 Tenants management — Status: TODO
**What:** Most complex CRUD page. Server-side filtering (by building), search (by name/email/flat), pagination (50/page, max 200).
**Old app reference:** `../ticketing module/app/controllers/staff/tenants_controller.rb` (full file).
**V2 files to create:**
- `src/app/(authed)/admin/staff/tenants/page.tsx` — Server Component reading `searchParams`.
- `src/app/(authed)/admin/staff/tenants/filter-bar.tsx` — building dropdown, search input, page size.
- `src/app/(authed)/admin/staff/tenants/tenant-row.tsx` — inline-editable row.
- `src/app/(authed)/admin/staff/tenants/new-tenant-dialog.tsx`.
- `src/app/(authed)/admin/staff/tenants/actions.ts`.
**Query params:** `?building_id=&q=&active=true&page=1&per_page=50`.
**List columns:** Name | Email | Wing | Flat | Building | Phone | Active | Actions.
**Pagination footer:** "Showing 1-50 of 480" + Prev/Next.
**Create form:**
- Building (required) → Unit dropdown (filtered).
- Name (required), Email (optional — if blank, server synthesizes `{flat-slug}.{building-slug}@deh.local`), Phone (normalized to 10 digits — strip non-digits, strip India +91 / leading 0), Contact (free-text legacy field).
- Password optional, defaults to `1234`.
**Phone normalization (server):** match `tenants_controller.rb#normalize_phone` exactly.
**Update:** all of the above editable. Changing unit_id reassigns the tenant.
**Disable:** soft (`tenants.active = false` + `users.active = false`).
**Reset password:** sets default, flips `needs_password_set`.
**Acceptance criteria:**
- Search by partial flat number returns results.
- Filter by building narrows the list.
- Pagination is correct (total count matches; offset/limit applied).
- All actions persist correctly.

#### 6.5 Units read-only list — Status: TODO
**What:** Lookup utility for admin forms — used by tenant create (for the unit dropdown) and DR create (to confirm residency).
**Old app reference:** `../ticketing module/app/controllers/staff/units_controller.rb`.
**V2 files:**
- `src/app/(authed)/admin/staff/units/page.tsx` — page is optional; the main use is in `actions.ts` exposing `listUnits(buildingId?)`.
**Output per unit:** id, wing, flat, floor, unit_type, resident_name, building_id, building_name.
**Order:** `building.name ASC, units.wing ASC NULLS FIRST, units.flat ASC`.
**Acceptance criteria:** filter by `building_id` works.

#### 6.6 Tenant credentials lookup view — Status: TODO
**What:** Admin-only view to look up a tenant's BUILDING-FLAT login id and whether they've changed their password.
**Old app reference:** `../ticketing module/supabase/migrations/20260512000002_tenant_credentials_view.sql` (the SQL view).
**V2 files:**
- `src/app/(authed)/admin/staff/tenant-credentials/page.tsx`.
**Query:** `select * from tenant_credentials where ...` with the same filters as 6.4 (building, search).
**Display columns:** Tenant Name | Login ID (building_code-flat) | Email | Password Status (Default / Custom) | Last Login (if tracked).
**Important:** this view is admin-only — RLS must block tenants and managers and DRs.
**Acceptance criteria:**
- View accessible only to admin.
- Login ID column shows `{code}-{flat}` for every tenant (relies on Phase 1.2/1.3 backfill).

---

### Phase 7 — Cross-cutting

#### 7.1 Attachment signed-URL serving — Status: TODO
**What:** Endpoint that serves attachment bytes given an `sup_<path>` id. Images get inline disposition; everything else forced to attachment to block stored-XSS.
**Old app reference:** `../ticketing module/app/controllers/attachments_controller.rb`, `../ticketing module/app/services/storage_service.rb`.
**V2 file:**
- `src/app/api/attachments/[id]/route.ts` — Route Handler `GET`.
**Algorithm:**
1. Extract id from `params.id`.
2. If `!id.startsWith('sup_')` → 400.
3. Path = id.slice(4).
4. Use service-role client: `supabaseAdmin.storage.from(bucket).download(path)`.
5. Build response with the file's content-type.
6. If content-type starts with `image/` → `Content-Disposition: inline`.
7. Else → `Content-Disposition: attachment; filename="<derived from path>"`.
8. Set `Cache-Control: private, max-age=300`.
**Auth:** RLS protects which attachments a user can SEE in the database, but the bytes endpoint is gated by the session middleware — only authenticated users can hit it.
**Acceptance criteria:**
- Tenant fetches an image of their own ticket → renders inline in lightbox.
- Anyone fetching a non-image (e.g., PDF invoice) gets forced-download.
- Unauthenticated request → 401 (via middleware).
- Wrong/missing path → 404.

#### 7.2 Buildings list endpoint (cached) — Status: TODO
**What:** Cached buildings list for any UI dropdown (admin forms, etc.). The login flow no longer needs it since tenants type a code directly.
**Old app reference:** `../ticketing module/app/controllers/buildings_controller.rb`.
**V2 files:**
- `src/lib/buildings/list.ts` — `unstable_cache`-wrapped fetcher returning `[{ id, name, code, locality, city }]`.
- Use this in admin Server Components directly; no need for a dedicated API route since RSC fetches don't hit HTTP.
**Cache:** 5-minute revalidation via `revalidate: 300` (matches old app's HTTP cache).
**Acceptance criteria:**
- First call hits DB, subsequent (within 5 min) return cached.
- Admin property edits trigger `revalidateTag('buildings')` to bust the cache (Server Action helper).

#### 7.3 Triage service — Status: TODO
**What:** Pure function that takes (type, description) and returns `{ level, reason }`.
**Old app reference:** `../ticketing module/app/services/triage_service.rb` (full file).
**V2 file:**
- `src/lib/triage.ts`.
**Constants to port verbatim:**
- `URGENCY_CATEGORIES` map (4 levels, 12 categories).
- `URGENCY_RANK` (`critical: 4, high: 3, medium: 2, low: 1`).
- `CRITICAL_KEYWORDS` (16 phrases).
- `HIGH_KEYWORDS` (17 phrases).
**Algorithm:**
1. `base = URGENCY_CATEGORIES[type] ?? 'low'`.
2. `desc_lower = description.toLowerCase()`.
3. Find critical keyword hits and high keyword hits.
4. If critical hits AND rank(base) < rank(critical) → escalate to critical, append `"| ⚠️ Escalated by keywords: <joined>"`.
5. Else if high hits AND rank(base) < rank(high) → escalate to high, append `"| ↑ Boosted by keywords: <joined>"`.
6. Return `{ level, reason }`.
**Acceptance criteria:**
- Port behavior 1:1 — write a unit test with at least 6 cases covering all branches.
- Returns identical results for identical inputs as the Ruby version.

#### 7.4 Reference code generation — Status: TODO
**What:** Tickets get a human-readable `TK-00###` code via a Postgres sequence default. Nothing to write in app code — verify the sequence exists.
**Old app reference:** `../ticketing module/supabase/migrations/*_initial_schema.sql` (defines `tickets_reference_seq`).
**Verification:** the sequence is already in the live DB (visible in `src/db/schema.ts` after introspect: `ticketsReferenceSeq`).
**Use in queries:** when inserting a new ticket, omit `reference_code` from the INSERT — the column default fires it via the sequence. Format: a trigger-generated string like `TK-00101`, `TK-00102`, etc.
**Action:** verify the trigger that formats the sequence value into the `TK-00###` string exists. If not, write a trigger:
```sql
create or replace function public.set_ticket_reference_code()
returns trigger language plpgsql as $$
begin
  if new.reference_code is null then
    new.reference_code := 'TK-' || lpad(nextval('tickets_reference_seq')::text, 5, '0');
  end if;
  return new;
end $$;

create trigger tickets_set_reference_code
before insert on public.tickets
for each row execute function public.set_ticket_reference_code();
```
**Acceptance criteria:** insert a test ticket without specifying `reference_code` → row comes back with `TK-XXXXX`.

#### 7.5 Manager-building assignments table — Status: TODO
**What:** Schema-only table that future-proofs multi-society scoping for managers. Not wired into any UI in MVP — managers see all tickets per `tickets_manager_update` RLS policy.
**SQL migration file:** `supabase/migrations/20260514000020_manager_building_assignments.sql`.
**Migration content:**
```sql
create table public.manager_building_assignments (
  id          uuid primary key default gen_random_uuid(),
  manager_id  uuid not null references public.managers(id) on delete cascade,
  building_id uuid not null references public.buildings(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.users(id),
  unique (manager_id, building_id)
);
alter table public.manager_building_assignments enable row level security;
create policy mba_admin_full on public.manager_building_assignments for all
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');
create policy mba_manager_read on public.manager_building_assignments for select
  using (manager_id = (select id from public.managers where user_id = auth.uid()));
```
**Acceptance criteria:** table exists, RLS enabled. No UI yet.

---

### Phase 8 — Cutover

#### 8.1 End-to-end smoke test — Status: TODO
**What:** Manually exercise every flow on V2 against the live Supabase before flipping production DNS.
**Test plan (each verified in a browser):**
1. Tenant login (existing user with BCrypt password) → first-time rehash → dashboard.
2. Tenant login (fresh backfilled user) → set-password → confirm-profile → dashboard.
3. Tenant raises a ticket with attachments → confirmation screen → ticket appears in dashboard list.
4. Tenant edits location/wing/flat → unit reassignment persists.
5. Staff login (admin / manager / DR) — each role, both fresh and existing.
6. DR raises a building-scope ticket and a society-scope ticket.
7. Manager updates ticket status, overrides urgency (allowed only without requisition), creates a requisition (vendor + in-house), uploads invoices.
8. Admin approves a requisition with remarks, rejects another.
9. Manager uploads vendor confirmation photo, marks complete.
10. Admin views dashboard — heatmap, financial overview, charts all render.
11. Admin sets monthly budget — snapshot card reflects.
12. Admin Staff CRUD — create/update/disable/reset for each role table.
13. Tenant credentials view shows correct BUILDING-FLAT login IDs.
14. Attachment serving — images inline, PDFs forced-download.
15. Logout from each role.
**Acceptance criteria:** every step works without console errors, network 4xx/5xx, or visual regressions.

#### 8.2 Post-rewrite data migration — Status: TODO
**What:** Both apps share the same Supabase project. Tickets created in the old app during the V2 build period appear in V2 automatically (same DB). The only thing to migrate is users: ensure 1.4's backfill is re-run before cutover to catch any users created in the old app's Staff CRUD between initial migration and switch.
**Steps:**
1. Day before cutover: re-run `scripts/migrate_users.ts` (idempotent — only acts on new rows).
2. Day of cutover: freeze writes on the old app (read-only mode), one final run of `migrate_users.ts`.
**Acceptance criteria:** all users have `user_id` set; user counts match across role tables and `public.users`.

#### 8.3 DNS / hosting switch from Render to Vercel — Status: TODO
**What:** Move production traffic from the old Rails app on Render to V2 on Vercel.
**Steps:**
1. Deploy V2 to Vercel — connect the GitHub repo `ism5522017/ticketing-module-v2`.
2. Set all env vars in Vercel matching `.env.local`.
3. Test the Vercel preview URL end-to-end (8.1 plan).
4. Add the production custom domain to the Vercel project.
5. Update DNS A/CNAME record to point at Vercel.
6. Wait for DNS propagation.
7. Verify production URL hits V2.
8. Decommission Render service (keep paused, don't delete, in case rollback needed).
**Acceptance criteria:**
- Custom domain serves V2.
- Old Render service is paused (recoverable).
- Supabase project untouched throughout.

#### 8.4 Archive old Rails app — Status: TODO
**What:** Mark the old Rails project as historical; keep for reference.
**Steps:**
1. Tag the old repo's last commit as `v1-final`.
2. Add a top-of-`README.md` banner in the old repo: "Archived. Replaced by `ticketing-module-v2` on YYYY-MM-DD."
3. Make the old GitHub repo read-only (archive via GitHub UI).
4. Move `../ticketing module/` to `../ticketing module - archive/` on local disk (optional).
**Acceptance criteria:** archived banner visible, repo flagged "Archived" on GitHub.

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

### 2026-05-13 — 1.1 + 1.2 migration files written (pending application)
- `supabase/migrations/20260514000001_v2_users_table.sql` — creates `user_role` enum, `public.users` table (with `legacy_bcrypt_hash`, both onboarding flags), and nullable `user_id` FK on every role table. Pure additive.
- `supabase/migrations/20260514000002_buildings_code.sql` — adds nullable unique `buildings.code` column for tenant `BUILDING-FLAT` login.
- Created `supabase/migrations/` folder (didn't exist in V2 before this).
- **Next step requires user action**: paste both into Supabase SQL Editor → Run, in order. Then `npm run db:pull` to regenerate `src/db/schema.ts`. Phases 1.3+ depend on the introspected types existing.

### 2026-05-13 — 0.2 theme tokens ported
- Added a second `@theme` block to `src/app/globals.css` containing every design token from the old app's `public/css/app.css` (brand, tints, neutrals, urgency hues, status-dot colors, radii, type ramp).
- Tokens namespaced with `deh-` so shadcn defaults stay intact: `bg-deh-blue`, `text-deh-yellow`, `rounded-deh-pill`, `text-deh-base`, etc.
- Status dot hexes (`#E24B4A`/`#378ADD`/`#639922`) — previously hardcoded in old app's JS — are now first-class tokens (`bg-status-open`, `bg-status-progress`, `bg-status-resolved`).
- `tsc --noEmit` clean, `next build` clean.
- Phase 0 is now fully DONE except for 0.6 (auth shell, TODO).

### 2026-05-13 — Migration plan expanded with per-item detail
- Rewrote §7 (Migration plan) from a table-of-todos to fully-detailed per-item specs.
- Each of the ~50 items now includes: What, Old app reference (file paths from `../ticketing module/`), V2 files to create, Behavior/contract (function signatures, SQL, request/response shapes), Acceptance criteria.
- Grounded every spec by reading the old app's actual code: all controllers (`app/controllers/*.rb`), all services (`app/services/*.rb`), key models (`ticket`, `tenant`, `requisition`, `dr`, `unit`, `building`, `monthly_budget`), and the critical frontend modules (`auth.js`, `lib.js`, `dashboard.js`, `tickets.js`, `dr.js`, `manager.js`, `admin_tickets.js`, `admin_charts.js`, `admin_budgets.js`, `attachments.js`).
- Replaced single-doc references to deleted `docs/` files with section anchors in this file (e.g. AUTH_DESIGN → §6).
- Doc size grew from ~24 KB to ~60 KB. Trade-off: bigger auto-load context, but any AI can act on Phase 1+ without needing to read the old app first.

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
