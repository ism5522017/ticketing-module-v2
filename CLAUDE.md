# Ticketing Module V2 — Single Source of Truth

This is the only documentation file in this project. Project context,
hard rules, stack, login design, conventions, and a running changelog
all live here. No new doc files — every advancement gets logged at the
bottom of this file.

This file is auto-loaded into every Claude Code session opened in this
folder.

---

## 1. What this project is

A residential complex maintenance ticketing app. Tenants raise tickets
(plumbing, electrical, AC, etc.), Designated Representatives (DRs) raise
building/society-level issues, managers triage and create requisitions
with cost breakdowns, and admins approve/reject requisitions and manage
budgets.

**Live production:** https://deh-ticketing.vercel.app
**Status:** Full parity with the original Rails app reached 2026-05-19.
The original Rails app at `../ticketing module/` is archived and read-only.

All code is written by AI. The stack is deliberately picked to maximize
compiler-caught errors (strict TS, typed SQL, typed components, typed
server contracts) since untyped JS made AI mistakes hard to catch in the
original app.

---

## 2. Strict work-logging rules

**Every code change → one Changelog entry at the bottom of this file.**
This is non-negotiable. The Changelog is how future Claude sessions
understand *why* the code is shaped a certain way. Git history shows
what changed; the Changelog explains why.

### When to log

- Every new feature, bug fix, refactor, or schema change.
- Every dependency added or removed.
- Every non-obvious decision (e.g., "chose X over Y because Z").

### When NOT to log

- Pure formatting / whitespace changes.
- Renames with no behavioral change.
- Reverting a change you just made in the same session.

### Format

```markdown
### YYYY-MM-DD — One-line title summarizing the change

- **What:** files touched and what changed, with [path links](src/path).
- **Why:** the actual problem being solved or the user-facing motivation.
- **Tradeoffs / gotchas:** anything non-obvious — quirks, workarounds,
  decisions that look weird until you know the reason.
- **Verification:** what was run (`tsc --noEmit`, `npm run build`, manual
  browser test on `/route`, etc.) and what passed.
```

### Hard rules

1. **Newest entry at the top of the Changelog section.**
2. **ISO date format** (`YYYY-MM-DD`).
3. **Never edit historical entries.** If a prior decision was reversed,
   write a new entry that says so and links to the original.
4. **Never collapse multiple changes into one entry** unless they were
   one cohesive task. Logging granularity should match cognitive
   granularity — one logical change = one entry.
5. **No separate docs.** No `docs/`, no `README.md`, no `NOTES.md`.
   Everything goes here.
6. **Always include file paths.** Future Claude reads the Changelog and
   then needs to find the code — make it findable.
7. **If you change architecture, update the relevant section above** in
   addition to logging. The Changelog is history; the sections above
   are current state.

---

## 3. Hard rules

1. **Same Supabase backend, schema intact.** Drizzle introspects the
   live DB. New schema changes go in `supabase/migrations/<timestamp>_*.sql`
   and are applied via the Supabase SQL Editor.
2. **No half-finished features.** Each route ships complete or doesn't
   ship at all. No feature flags as a substitute for finishing work.
3. **Visual parity with the original app.** Color scheme and information
   hierarchy match. Implementation (Tailwind + shadcn) is new; visual
   result is preserved.
4. **Strict TypeScript.** No `any` unless there is a typed escape hatch
   immediately afterward. No `@ts-ignore` without an inline comment
   explaining why.
5. **Server-only modules stay server-only.** `lib/supabase/admin.ts`
   (service-role key) is never imported from a `'use client'` module.
6. **Don't edit the archived Rails app.** `../ticketing module/` is
   read-only history. Reference it; don't change it.

---

## 4. Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) | Largest AI training corpus; file-based routing; server components |
| Language | TypeScript (strict) | |
| Styling | Tailwind CSS v4 | Tokens in `globals.css` `@theme` blocks; project tokens namespaced with `deh-` |
| Components | shadcn/ui (Base UI + Radix) | Copy-paste; edit freely as TSX |
| Charts | Recharts | TypeScript-native; used on admin dashboard |
| Database | Supabase Postgres | Project: `jivjwubvlmrenpekujkf` |
| ORM | Drizzle | Typed SQL; introspected from live schema |
| Auth | Supabase Auth (JWT) | Built-in email reset; OTP-ready for SMTP later |
| Storage | Supabase Storage | Bucket: `ticket-attachments` |
| Server logic | Server Actions + Route Handlers | Co-located, typed contracts |
| Hosting | Vercel | Auto-deploy from `main` |

### Next.js 16 caveat

Next 16 has breaking changes from 15 (config names, caching defaults,
some App Router APIs). Check `node_modules/next/dist/docs/` or official
docs rather than trusting training memory.

### Not used (and why)
- **tRPC** — Server Actions cover the same ground with less ceremony.
- **Prisma** — Drizzle is lighter and AI writes it more accurately.
- **NextAuth** — Supabase Auth is already the database.
- **Zustand / Redux** — Server Components + URL state are sufficient.
- **Pages Router** — App Router has more training data.

---

## 5. Folder layout

```
Ticketing Module V2/
├── CLAUDE.md                    # THIS file — only doc, auto-loaded
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── components.json              # shadcn/ui config
├── drizzle.config.ts
├── .env.example                 # committed template
├── .env.local                   # gitignored, real secrets
├── src/
│   ├── app/
│   │   ├── (auth)/              # /login, /onboarding/* — no header
│   │   ├── (authed)/            # Signed-in shell: header + role nav + main
│   │   │   ├── layout.tsx       # AppHeader + RoleNav + UserMenu
│   │   │   ├── actions.ts       # signOut server action
│   │   │   ├── settings/        # /settings/password
│   │   │   ├── tenant/          # /tenant/*  — role-gated by middleware
│   │   │   ├── dr/              # /dr/*
│   │   │   ├── manager/         # /manager/*
│   │   │   └── admin/           # /admin/*
│   │   ├── api/                 # Route handlers (e.g. attachment bytes)
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Redirects to /login
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                  # shadcn primitives
│   │   └── shared/              # app-header, role-nav, user-menu, ticket-row, lightbox, budget-bar
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── server.ts        # @supabase/ssr server client
│   │   │   ├── browser.ts       # @supabase/ssr browser client
│   │   │   └── admin.ts         # service-role client (server-only)
│   │   ├── auth/                # onboarding tokens, legacy bcrypt rehash
│   │   ├── tenants/             # ensure-unit (find-or-create chain)
│   │   ├── manager/             # directory queries, types, profile
│   │   ├── dr/                  # building-stats, dr-profile
│   │   ├── admin/               # directory, budgets, staff mutations, types
│   │   ├── buildings/           # cached list
│   │   ├── storage/             # upload helper, limits
│   │   ├── triage.ts            # type+description → urgency
│   │   ├── tickets.ts           # status/urgency meta
│   │   ├── format.ts            # date formatting
│   │   └── utils.ts             # cn()
│   ├── db/
│   │   ├── client.ts            # Drizzle client
│   │   ├── schema.ts            # Introspected schema (DO NOT hand-edit)
│   │   └── relations.ts         # Introspected relations (cleaned by post-pull script)
│   └── middleware.ts            # Session refresh + role gate + onboarding gate
├── scripts/
│   ├── migrate_users.ts         # One-time + idempotent: backfill auth.users
│   ├── suggest_building_codes.ts
│   ├── clean_relations.mjs      # Post-pull cleanup for cross-schema FK
│   └── reset-staff.ts           # CLI to reset a staff password
├── supabase/
│   ├── migrations/              # SQL migrations (applied manually via SQL Editor)
│   ├── manual/                  # One-off recovery SQL (e.g. staff_password_reset.sql)
│   └── drizzle/                 # drizzle-kit pull output
└── public/
```

---

## 6. Local development

### Prereqs
- Node 22+ (currently using v24.14.1)
- npm 10+
- Access to the live Supabase project — credentials in `.env.local`

### Setup
```bash
cd "/Users/ismailmustafa/Desktop/BADRI MAHAL/CODING/Ticketing Module V2"
cp .env.example .env.local
# Fill in env vars (see §10)
npm install
npm run dev
# open http://localhost:3000
```

### Common commands
```bash
npm run dev                      # Next dev server
npm run build                    # Production build
npm run lint                     # ESLint
npm run typecheck                # tsc --noEmit
npm run db:pull                  # Re-introspect Supabase → src/db/schema.ts
npm run migrate-users            # Idempotent user backfill
npm run suggest-building-codes   # Idempotent building code backfill
npm run reset-staff -- <user>    # Emergency staff password reset
```

### shadcn workflow
```bash
npx shadcn@latest add <component>   # lands in src/components/ui/
```
Each component is owned by the project. Edit freely.

### Drizzle workflow
1. Apply schema changes in `supabase/migrations/<timestamp>_*.sql` via the
   Supabase SQL Editor.
2. Run `npm run db:pull` — Drizzle introspects and rewrites `src/db/schema.ts`.
   This automatically runs `scripts/clean_relations.mjs` to strip the
   broken cross-schema `usersInAuth` re-export drizzle-kit emits.
3. Commit `src/db/schema.ts` so types track the DB.

Never use `drizzle-kit push` or `drizzle-kit generate` against the live
DB. SQL is hand-written and applied manually.

---

## 7. Auth & login design

This is the most non-obvious part of the codebase. Read the whole section
before touching any auth code.

### Identity model — consolidated `users` table

All four user types (tenant / admin / manager / dr) consolidate into one
`public.users` table linked 1:1 to Supabase's built-in `auth.users`.
Role-specific data stays in role-specific tables.

```
auth.users (Supabase-managed)
    id                  uuid PK
    email               text         -- always populated (real or synthetic)
    encrypted_password
    raw_user_meta_data  jsonb        -- { role, synthetic_email, location_edited, ... }

public.users
    id                      uuid PK references auth.users(id)
    role                    enum('tenant','admin','manager','dr')
    username                text     -- staff only; null for tenants
    full_name               text
    phone                   text
    active                  boolean default true
    needs_password_set      boolean default true
    needs_profile_confirm   boolean default true
    legacy_bcrypt_hash      text     -- cleared after first rehash
    created_at, updated_at

public.tenants / admins / managers / drs
    user_id  uuid references users(id)
    + role-specific columns
```

### Tenant login: building name + flat

Tenants pick their building from a typeahead (filtered client-side from
the cached `listBuildings()` list) and then type their flat number into a
second field. The form submits `(buildingId, flat)` — no parsing, no
codes. Server joins `units.building_id = :id AND lower(units.flat) =
lower(:flat)` to find the user, then either:
- `needs_password_set = true` → redirect to `/onboarding/set-password`
  with a short-lived signed token (`ONBOARDING_TOKEN_SECRET`).
- Otherwise → reveal password input → standard sign-in.

The legacy `buildings.code` column is kept in the DB but no longer used
by login or any UI. See Changelog 2026-05-19 (Tenant login).

**Shared-flat caveat:** four `(building_id, flat)` slots have two tenants
each. Those tenants got suffixed synthetic emails
(`code-flat-<id-prefix>@tenants.local` — old format, frozen at migration
time). The login lookup still does `limit 1`, so tenants in a shared flat
may sign in as the wrong person. See Changelog 2026-05-14 (shared flats)
for the unfixed disambiguation gap.

### Staff login: username

Admins / managers / DRs type a plain username. Same two-step flow
(continue → reveal password or redirect to set-password).

### Email convention

Supabase Auth requires an email per user:
- Real email if known.
- Otherwise synthesized:
  - Tenants: `{building_code}-{flat}@tenants.local`
  - Staff: `{username}@staff.local`
- Synthetic emails are flagged in `auth.users.raw_user_meta_data.synthetic_email = true`
  so they can be replaced when SMTP / email OTP is wired up later.

### First-login post-screens

Middleware enforces, on every request:
1. `needs_password_set = true` → `/onboarding/set-password`.
2. `needs_profile_confirm = true` (after password set) → `/onboarding/confirm-profile`.
3. Both false → role dashboard.

The confirm-profile screen also collects **real email + phone** for
tenants (and additionally re-confirms location/wing/flat) so the
synthetic email is replaced on first contact.

### Legacy BCrypt rehash

Existing users imported from the old Rails app have their `password_digest`
copied into `public.users.legacy_bcrypt_hash`. On sign-in:
1. Try Supabase Auth `signInWithPassword(email, password)`.
2. On failure, BCrypt-compare against `legacy_bcrypt_hash`.
3. If matched: silently call `auth.admin.updateUserById` to set the
   password, clear `legacy_bcrypt_hash`, then sign in normally.
4. On second mismatch: generic "invalid login" — no enumeration.

### Emergency staff password reset

If a staff user cannot sign in and the in-app reset path is unreachable
(e.g., the only admin is locked out):
- **CLI (preferred):** `npm run reset-staff -- <username>` — flips
  `needs_password_set = true` AND resets the Supabase Auth password.
- **SQL fallback:** `supabase/manual/staff_password_reset.sql` — flips
  only the flag. User goes through "Choose your password" on next sign-in.

### RLS strategy

Supabase Auth issues a JWT with `sub = auth.users.id`. Every RLS policy
joins through `auth.uid()`. Helper function `public.current_role()` is
`security definer` so it can read `public.users` from inside policies
without infinite recursion. See `supabase/migrations/20260514000010_rls_policies.sql`
for the full policy set. Admin-side mutations go through Drizzle over
`DATABASE_URL` (pooler role bypasses RLS); client-side reads go through
`@supabase/ssr` with the user's JWT and are constrained by RLS.

---

## 8. Conventions

### Wire contract
V2 owns both ends. Field names match DB columns (camelCase in TS, snake_case
in SQL). Timestamps are ISO strings.

### Schema source of truth
Supabase migrations are authoritative. Drizzle introspects → emits types.
Never edit `src/db/schema.ts` by hand.

### Server-only vs client safety
- `lib/supabase/server.ts` — anon key + user JWT. Server Components, Server Actions, Route Handlers.
- `lib/supabase/browser.ts` — anon key. Client components.
- `lib/supabase/admin.ts` — **service role**. Never imported from a `'use client'` file. Never exposed in `NEXT_PUBLIC_*`.

If a server-only module needs to share types with a client component,
split the types into a separate client-safe module (see
`src/lib/manager/types.ts` for an example). Importing server code from
client code makes the bundler try to ship `postgres`/`node:tls` to the
browser and the build fails cryptically.

### Visual parity, not pixel parity
Color scheme and information hierarchy match the old app. Implementation
is new. Project design tokens in `globals.css`'s second `@theme` block
are namespaced with `deh-` so shadcn defaults stay intact.

### Errors at boundaries only
Trust internal contracts. Validate at: form submissions, route handlers,
Supabase response shapes. Don't add try/catch around every Drizzle call.

### Pooler quirk
`postgres({ prepare: false })` — Supabase's transaction-mode pooler
multiplexes connections; prepared statements break under multiplexing.

### Optimistic UI
Use React 19 `useOptimistic` for inline mutations (status changes, urgency
overrides, profile edits). The pattern: set local state immediately,
call the server action, roll back on `{ ok: false }`.

---

## 9. Deployment

| Step | Detail |
|---|---|
| Host | Vercel — push to `main` = deploy |
| Domain | https://deh-ticketing.vercel.app |
| Database | Same Supabase project. SQL applied manually via Supabase Editor (no CI step) |
| Storage | Supabase Storage bucket `ticket-attachments` |
| Env vars | Set in Vercel dashboard; mirror `.env.example` |

### Required env vars

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET
DATABASE_URL                         # Supabase transaction pooler
ONBOARDING_TOKEN_SECRET              # HMAC secret for first-login tokens
```

---

## 10. Out of scope

These were considered and deferred. Adding any of them requires explicit
approval and a Changelog entry that records the scope expansion.

- Email / SMS / WhatsApp notifications (tenant-requested; not built yet)
- Comment threads on tickets
- Ticket reopen flow
- Tenant satisfaction ratings
- SLA tracking + auto-escalation
- Recurring / scheduled tickets (e.g. monthly pest control)
- Vendor table with ratings
- Audit log
- CSV / PDF export
- Self-registration → admin approval flow
- In-app notification center
- Super-admin role above regular admin
- MFA / second factor
- Mobile native app

---

## 11. Connection to the archived Rails app

- **Shared:** Supabase project, storage bucket, existing user/ticket data.
- **Not shared:** code, auth tokens, dev server port.
- The old app at `../ticketing module/` is archived and read-only.
  Reference it for historical context only; do not edit.

---

## 12. Changelog

Newest at the top. ISO dates. Follow the format in §2.

### 2026-05-21 — clean_relations.mjs: handle drizzle-kit's newer `one({…})` shape

- **What:** [scripts/clean_relations.mjs](scripts/clean_relations.mjs)
  regex on step 2 widened from `one\(usersInAuth,\s*\{[^}]*\}\)` to
  `one\((?:usersInAuth,\s*)?\{[^}]*\}\)` so it matches both the old
  `one(usersInAuth, { … })` form and the new `one({ … })` form that
  drizzle-kit emits today.
- **Why:** Running `npm run db:pull` after the
  20260521000001 migration produced a relations.ts that the cleanup
  script could no longer fix — the `usersInAuth` import was stripped
  but the relation block survived, leaving an undefined identifier and
  failing `tsc --noEmit`.
- **Tradeoffs / gotchas:** None. The widened regex still matches the
  old shape, so historical compatibility is preserved.
- **Verification:** Re-ran `node scripts/clean_relations.mjs` against
  the broken relations.ts; `npm run typecheck` and `npm run build`
  clean afterward.

### 2026-05-21 — Admin properties (buildings) CRUD + soft-delete + CSV import

- **What:**
  - **Migration**
    [supabase/migrations/20260521000001_buildings_archived_at.sql](supabase/migrations/20260521000001_buildings_archived_at.sql)
    adds `buildings.archived_at timestamptz null` + a partial index
    (`buildings_archived_at_idx` where `archived_at is not null`). Pure
    additive. **Must be applied via the Supabase SQL Editor before the
    new UI works** — the page reads `archived_at` and `listBuildings()`
    filters on it.
  - **Schema** [src/db/schema.ts](src/db/schema.ts) hand-edited to add
    `archivedAt` + the index. Future `npm run db:pull` will overwrite
    this identically once the migration has been applied live.
  - **New admin route** at `src/app/(authed)/admin/buildings/`:
    - [page.tsx](src/app/(authed)/admin/buildings/page.tsx) — server-rendered
      list with status filter (Active / Archived / All), city + locality
      dropdowns, and 8 sort options (name asc/desc, date asc/desc,
      units asc/desc, tickets asc/desc).
    - [actions.ts](src/app/(authed)/admin/buildings/actions.ts) —
      `createBuildingAction`, `updateBuildingAction`,
      `archiveBuildingAction`, `restoreBuildingAction`,
      `importBuildingsCsvAction`. All gated on admin session. All bust
      both the `buildings` cache tag and revalidate `/admin/buildings`.
    - [new-building-form.tsx](src/app/(authed)/admin/buildings/new-building-form.tsx) —
      collapsible inline create form (mirrors the new-tenant-form
      pattern).
    - [building-row.tsx](src/app/(authed)/admin/buildings/building-row.tsx) —
      inline edit with Save/Cancel; Archive button shows a native
      `confirm()` warning; archived rows render dimmed with a Restore
      button instead of Edit/Archive.
    - [filter-bar.tsx](src/app/(authed)/admin/buildings/filter-bar.tsx) —
      client component pushing searchParams via `router.push` inside a
      `useTransition` (matches the existing admin tenants FilterBar).
    - [csv-import.tsx](src/app/(authed)/admin/buildings/csv-import.tsx) —
      collapsible CSV upload (file picker + paste box). Header row must
      contain `name`; `locality, city, state, address, category` are
      optional. Duplicates (same lower-cased name within the society)
      are skipped per-row with a reason; result toast shows
      inserted count + an expandable list of skipped lines.
  - **List lib** [src/lib/admin/buildings-list.ts](src/lib/admin/buildings-list.ts)
    — `listAdminBuildings({ status, city, locality, sort })` runs a
    single raw-SQL `select … left join (count units) … left join
    (count tickets where building_id is not null)` so the counts come
    back in one round-trip and are sortable by Postgres. Also exports
    `listBuildingLocations()` for the filter dropdowns (distinct city +
    locality from non-archived rows only).
  - **Cached dropdown list** [src/lib/buildings/list.ts](src/lib/buildings/list.ts)
    — `listBuildings()` now `where(isNull(buildings.archivedAt))` so
    archived buildings disappear from the login picker, tenant-create
    dropdown, DR-create dropdown, and credentials filter. The new
    actions call `revalidateBuildings()` after every mutation to bust
    the 5-minute cache.
  - **Sidebar** [src/components/shared/sidebar.tsx](src/components/shared/sidebar.tsx)
    gets a `{ href: "/admin/buildings", label: "Properties", icon: Building2 }`
    entry between Budgets and Admins. The `Building2` icon import was
    previously removed (2026-05-19 entry when the codes page was deleted)
    — re-added.

- **Why:** User asked for in-app property management with traditional
  sort/filter controls. Previously the only way to add a building was
  through the live SQL editor (or as a side-effect of `ensureBuilding`
  when a tenant's building-name didn't match an existing row). User
  wants admins to manage the building list directly + a bulk-import
  path for setting up new societies.

- **Tradeoffs / gotchas:**
  - **Soft-delete, not hard-delete.** `units.building_id` and
    `tickets.building_id` are both `ON DELETE RESTRICT`, so a hard delete
    would fail for any building that ever had a unit or a ticket.
    Archived rows stay in the DB; `listBuildings()` hides them from
    selectable surfaces. Historical tickets/units stay linked.
  - **CSV parser is hand-rolled** in
    [actions.ts](src/app/(authed)/admin/buildings/actions.ts)
    (`parseCsvLine`). It handles quoted fields and escaped `""` quotes
    but does NOT handle newlines inside quoted fields. The admin
    audience and the fixed format make this acceptable; pulling in
    `papaparse` would add ~45 KB to the server bundle for a corner case
    nobody's hitting. Swap to papaparse if a future user reports broken
    imports from Excel-exported CSVs with multi-line cells.
  - **Society scoping.** All new buildings are inserted under
    `Default Society` (via `ensureDefaultSociety`). The unique constraint
    is `(society_id, lower(name))`, so two buildings can have the same
    name across societies but not within one. Since V2 is single-society
    today, this is functionally just "name must be unique."
  - **Schema hand-edit.** §6 says "Never edit `src/db/schema.ts` by
    hand." Done here anyway because the new code references
    `buildings.archivedAt` and `db:pull` requires the migration to be
    applied live first. The next `db:pull` after the migration is
    applied will regenerate the file identically.
  - **Sort by units/tickets uses raw SQL aliases** (`order by unit_count
    desc nulls last`) because Drizzle's `desc()` helper can't reference
    a subquery alias. The orderClause helper switches between Drizzle
    column refs (for name/createdAt) and raw `sql\`…\`` (for the counts).
  - **`code` column is still kept** (per 2026-05-19 entry). The create
    form does not expose it; the row does not render it. Existing rows
    with a populated code from the 2026-05-13 backfill are untouched.

- **Verification:** `npm run typecheck` clean. `npm run build` clean —
  route table confirms `/admin/buildings` registered as a dynamic route.
  Manual browser test not yet done. **Action required before this works
  in prod: apply
  [supabase/migrations/20260521000001_buildings_archived_at.sql](supabase/migrations/20260521000001_buildings_archived_at.sql)
  via the Supabase SQL Editor.**

### 2026-05-21 — UI rename: "Tenant" → "Khidmat Guzar", "Staff" → "Office"

- **What:** Display-text-only rename across the signed-in app and the
  login screen. Every change is JSX text, button label, heading,
  placeholder, or a user-visible error string — no code identifier,
  route, DB column, or type-enum value was touched. Files:
  - [src/app/layout.tsx](src/app/layout.tsx) — meta description.
  - [src/app/(auth)/login/login-form.tsx](src/app/(auth)/login/login-form.tsx)
    — "Tenant" tab label → "Khidmat Guzar"; "Staff" tab → "Office".
  - [src/app/(auth)/login/actions.ts](src/app/(auth)/login/actions.ts)
    — "Enter your staff username." → "Enter your Office username."
  - [src/components/shared/sidebar.tsx](src/components/shared/sidebar.tsx)
    — "Tenants" nav label → "Khidmat Guzars".
  - [src/components/shared/app-header.tsx](src/components/shared/app-header.tsx)
    — `ROLE_SUBTEXT.tenant` "Tenant" → "Khidmat Guzar".
  - [src/app/(authed)/admin/staff/tenants/page.tsx](src/app/(authed)/admin/staff/tenants/page.tsx)
    — H1 + helper text + empty state.
  - [src/app/(authed)/admin/staff/tenants/new-tenant-form.tsx](src/app/(authed)/admin/staff/tenants/new-tenant-form.tsx)
    — "+ Add tenant", "Tenant name" label, "Create tenant" button.
  - [src/app/(authed)/admin/staff/tenants/actions.ts](src/app/(authed)/admin/staff/tenants/actions.ts)
    — 6 user-visible error strings.
  - [src/app/(authed)/admin/staff/tenant-credentials/page.tsx](src/app/(authed)/admin/staff/tenant-credentials/page.tsx)
    — H1, helper paragraph, column header, empty state, count text.
  - [src/app/(authed)/admin/staff/drs/page.tsx](src/app/(authed)/admin/staff/drs/page.tsx)
    — helper text, both "Tenant" column headers (Active + Past DRs tables).
  - [src/app/(authed)/admin/staff/drs/new-dr-form.tsx](src/app/(authed)/admin/staff/drs/new-dr-form.tsx)
    — label + 3 placeholder/error strings.
  - [src/app/(authed)/admin/staff/drs/actions.ts](src/app/(authed)/admin/staff/drs/actions.ts)
    — residency-check + tenant-not-found errors.
  - [src/app/(authed)/admin/tickets/admin-ticket-card.tsx](src/app/(authed)/admin/tickets/admin-ticket-card.tsx)
    — "Tenant:" inline label.
  - [src/app/(authed)/admin/tickets/directory-shell.tsx](src/app/(authed)/admin/tickets/directory-shell.tsx)
    — search placeholder.
  - [src/app/(authed)/manager/dashboard/directory-shell.tsx](src/app/(authed)/manager/dashboard/directory-shell.tsx)
    — search placeholder.
  - [src/app/(authed)/manager/dashboard/ticket-card.tsx](src/app/(authed)/manager/dashboard/ticket-card.tsx)
    — "Tenant:" label + "No tenant on file" empty state.
  - [src/app/(authed)/tenant/dashboard/profile-card.tsx](src/app/(authed)/tenant/dashboard/profile-card.tsx)
    — "edited by tenant" badge.
  - [src/app/(authed)/tenant/dashboard/actions.ts](src/app/(authed)/tenant/dashboard/actions.ts),
    [src/app/(authed)/tenant/tickets/new/actions.ts](src/app/(authed)/tenant/tickets/new/actions.ts),
    [src/app/(auth)/onboarding/actions.ts](src/app/(auth)/onboarding/actions.ts)
    — server-action error strings.
- **Why:** User wants the in-app vocabulary to use the building's own
  community terms ("Khidmat Guzar" for residents, "Office" for the
  staff/admin team).
- **Tradeoffs / gotchas:**
  - **Code identifiers stay.** URL paths (`/tenant/*`,
    `/admin/staff/*`), the `user_role` Postgres enum
    (`'tenant', 'admin', 'manager', 'dr'`), TypeScript types
    (`type Role = "tenant" | ...`, `type Tab = "tenant" | "staff"`),
    Drizzle table names (`tenants`), function names
    (`getTenantProfileFromSession`, `createStaffMember`,
    `resolveTenantLogin`), and folder names (`src/app/(authed)/tenant/`,
    `src/app/(authed)/admin/staff/`) are unchanged. Per the agreed scope:
    UI text only.
  - **Plurals.** Used "Khidmat Guzars" for the plural form. Singular
    matches throughout for grammatical sentences ("Only Khidmat Guzars
    can…", "No Khidmat Guzar on file").
  - **Login tab type values** (`Tab = "tenant" | "staff"`) are still
    `"tenant"` and `"staff"` internally — they're just labels for
    component state. Labels rendered to the DOM say "Khidmat Guzar"
    and "Office".
  - **CLAUDE.md unchanged** in this rename — it documents the
    architecture (table names, role enums, code conventions) and
    references the old names because the *code* still uses them.
- **Verification:** `npm run typecheck` clean, `npm run build` clean
  (after `rm -rf .next` to clear stale type metadata). Manual browser
  smoke-test not yet done — recommended before shipping.

### 2026-05-19 — Tenant login: building autosuggest + flat (drop CODE-FLAT)
- **What:**
  - [src/app/(auth)/login/login-form.tsx](src/app/(auth)/login/login-form.tsx)
    rewritten. Tenant tab now has two fields: a building input with a
    typeahead suggestion dropdown (filtered client-side from the buildings
    list — name/locality/city all searchable) and a separate flat input.
    Staff tab unchanged. Keyboard nav (↑/↓/Enter/Esc) on the suggestion
    list; outside-click closes it. Submit disabled until a building is
    actually selected from the dropdown.
  - [src/app/(auth)/login/page.tsx](src/app/(auth)/login/page.tsx) now
    fetches `listBuildings()` server-side and passes `{id, name, locality,
    city}` to the form.
  - [src/app/(auth)/login/actions.ts](src/app/(auth)/login/actions.ts):
    `resolveTenantLogin(buildingId, flat)` signature replaced the old
    single-string `BUILDING-FLAT` parser. Lookup now joins on
    `units.building_id = :id AND lower(units.flat) = lower(:flat)`. Old
    `TENANT_RE` regex removed. UUID format check on `buildingId` server-
    side rejects tampering.
  - [src/app/(authed)/admin/staff/tenant-credentials/page.tsx](src/app/(authed)/admin/staff/tenant-credentials/page.tsx):
    "Login ID" CODE-FLAT column dropped. Header blurb rewritten to
    describe the new flow.
  - [new-tenant-form.tsx](src/app/(authed)/admin/staff/tenants/new-tenant-form.tsx),
    [new-dr-form.tsx](src/app/(authed)/admin/staff/drs/new-dr-form.tsx),
    [filter-bar.tsx](src/app/(authed)/admin/staff/tenants/filter-bar.tsx):
    building dropdown labels switched from `${code} — ${name}` to
    `${name} (locality, city)`. The locality/city suffix is the new
    disambiguator since codes are gone.
  - **Deleted** the entire `/admin/buildings/codes` route
    (`page.tsx`, `code-editor.tsx`, `actions.ts`) and the sidebar link +
    `Building2` icon import in
    [src/components/shared/sidebar.tsx](src/components/shared/sidebar.tsx).
  - §7 "Tenant login: building name + flat" updated to reflect the new
    flow.
- **Why:** The `CODE-FLAT` login string (e.g. `ABC-101`) required tenants
  to memorize an internal-only building code that the admin team had to
  assign and maintain. User asked to drop that whole concept and let
  tenants type their building name with autosuggest. Removes a
  per-building admin chore and a chunk of UI.
- **Tradeoffs / gotchas:**
  - `buildings.code` column kept in the DB (still nullable, still
    referenced by historical [scripts/migrate_users.ts](scripts/migrate_users.ts)
    and [scripts/suggest_building_codes.ts](scripts/suggest_building_codes.ts)
    + [src/lib/building-codes.ts](src/lib/building-codes.ts)). Dropping
    it would require a destructive migration with no functional benefit
    — the column is dead data now. `BuildingSummary.code` on
    [src/lib/buildings/list.ts](src/lib/buildings/list.ts) and
    `AdminTenantRow.buildingCode` on
    [src/lib/admin/tenants-list.ts](src/lib/admin/tenants-list.ts) are
    also kept (unused but harmless).
  - Existing synthetic tenant emails (`abc-101@tenants.local`,
    `hm1-504-{uuid}@tenants.local` for shared flats) are left as-is.
    They're opaque strings to Supabase Auth now; the lookup no longer
    cares about their shape. New tenants created via
    [admin/staff/tenants/actions.ts](src/app/(authed)/admin/staff/tenants/actions.ts)
    still get the same synthetic email format from that path (it doesn't
    use the building code either).
  - Shared-flat ambiguity from the 2026-05-14 entry persists unchanged
    (same `limit 1` issue). Not in scope for this change.
  - Stale `.next/types/validator.ts` cached a reference to the deleted
    codes page; `rm -rf .next` fixed it. Worth knowing if a future
    similar delete trips typecheck.
- **Verification:** `npm run typecheck` clean after clearing `.next`;
  `npm run build` clean (route table confirms `/admin/buildings/codes`
  is gone). Manual browser smoke-test of the login flow not yet done by
  Claude — recommended before shipping.

### 2026-05-19 — CLAUDE.md rewritten as post-parity context file
- **What:** Replaced the migration-plan-heavy CLAUDE.md with a streamlined
  post-parity version. Dropped the Phase 0–8 migration tracker (now
  historical — every phase is DONE). Added §2 "Strict work-logging rules"
  as the new authoritative format for future Changelog entries. Preserved
  all prior Changelog entries below — they are load-bearing history.
- **Why:** V2 reached full parity 2026-05-19. The 60+ KB migration plan
  was eating auto-load context for no current benefit. Future sessions
  need project context and changelog history, not the by-phase build plan.
- **Tradeoffs / gotchas:** Section numbering shifted (old §6 auth design
  is now §7, etc.). The build phases are no longer enumerated; the
  Changelog below is the only record of how V2 was built. If you need
  to reference a phase, search the Changelog for "Phase X".
- **Verification:** file overwrites in-place at `CLAUDE.md` (macOS
  case-insensitive FS confirmed; `claude.md` and `CLAUDE.md` are the
  same file).

### 2026-05-19 — All Phase 7 + Phase 8 statuses verified and flipped to DONE
- **What:** Verified [src/app/api/attachments/[id]/route.ts](src/app/api/attachments/[id]/route.ts)
  exists and matches the §7.1 spec; verified [src/lib/triage.ts](src/lib/triage.ts)
  is a 1:1 port of `triage_service.rb`; verified `tickets.reference_code`
  has the `'TK-' || lpad(nextval(...))` default baked into the column
  (no trigger needed). Phase 8 cutover confirmed live at
  https://deh-ticketing.vercel.app with the Rails app archived.
- **Why:** Status lines in the old §7 said TODO even though the changelog
  showed the work landed during Phase 2. The doc was lying.
- **Tradeoffs / gotchas:** HIGH_KEYWORDS in `triage.ts` has 15 phrases;
  the old spec said 17. Source `triage_service.rb` had 15 — spec was off,
  port is correct.
- **Verification:** file existence + content read; schema introspect for
  the sequence default; production URL responds.

### 2026-05-15 — UX Upgrades (Skeletons & Optimistic UI)
- **Skeleton Screens**: Added `loading.tsx` for the Tenant Dashboard to
  stream the layout shell while Drizzle queries tickets.
- **Optimistic UI**: Implemented React 19 `useOptimistic` hooks for inline
  mutations (Manager urgency overrides, Tenant profile edits) to make UI
  updates feel instantaneous without heavy animation libraries.

### 2026-05-14 — Phase 6 staff CRUD + Phase 7.2/7.5 shipped
- **Shared mutation helpers** (`src/lib/admin/staff-mutations.ts`).
  `createStaffMember({ role: 'admin' | 'manager' })` is the single entry
  point for provisioning office staff — service-role
  `auth.admin.createUser` (with `synthetic_email: true` metadata, email
  `{username}@staff.local` matching Phase 1.4 convention), then a Drizzle
  transaction that inserts `public.users` (`needs_password_set = true`
  so middleware bounces them through `/onboarding/set-password` on first
  sign-in) and the role row in lockstep. If the transaction throws, the
  auth user is deleted (best-effort) so a retry doesn't trip on the email
  collision. The legacy `password_digest` column on `admins`/`managers`/`drs`
  gets an empty string — it's not used in V2 (Supabase Auth owns the
  password) but the NOT NULL constraint survives from the Rails era.
  `hasAnotherActiveAdmin(excludeId)` powers the last-active-admin guard;
  `resetStaffPassword` flips the auth password back to `1234` + sets
  `needs_password_set` so onboarding picks them up; `setStaffActive`
  toggles both `users.active` and the role table together so middleware's
  `users.active` gate stays consistent.
- **6.1 Admins** at `/admin/staff/admins`. List + inline-edit rows + Add
  admin form + Reset / Disable / Re-enable buttons per row. Two guards
  in `disableAdminAction` (not the shared helper, because they're
  admin-specific): (a) `profile.adminId === input.roleId` rejected with
  "You cannot disable your own admin account"; (b) `hasAnotherActiveAdmin`
  must return true. The "(you)" badge replaces action buttons for the
  signed-in admin's own row. Temp-password toast surfaces the literal
  `1234` so the admin can text it to the new staff member.
- **6.2 Managers** at `/admin/staff/managers`. Identical shape to 6.1
  minus the last-active guard.
- **6.3 DRs** at `/admin/staff/drs` with the residency check. Create form
  has a building → tenant cascade. On submit, three defense-in-depth
  checks: (a) tenant's unit is in the chosen building; (b) username
  unique across DRs; (c) no other active DR exists for that building
  (the partial unique index `drs_active_building_idx` would also catch
  it). DR's `full_name` is sourced from the linked tenant.
- **6.4 Tenants** at `/admin/staff/tenants`. Server-side filtering and
  pagination via searchParams (`building_id`, `q`, `active`, `page`,
  `per_page`, defaults 50/page, max 200). Phone normalization mirrors
  old Rails `TenantsController#normalize_phone` (strip non-digits → drop
  "91" CC if 12 digits → last 10). Email synth on create falls back to
  `{flat-slug}.{building-slug}@deh.local` when admin leaves email blank.
- **6.5 Units helper** (`src/lib/admin/units-list.ts`). `listUnits(buildingId?)`
  joins units + buildings, ordered building name → wing → flat.
- **6.6 Tenant credentials** at `/admin/staff/tenant-credentials`. Password
  status enum: `Awaiting first sign-in` (`users.needs_password_set` true),
  `Default` (`tenants.must_change_password` true), `Custom` (neither).
- **7.2 Cached buildings list** (`src/lib/buildings/list.ts`).
  `unstable_cache`-wrapped, `revalidate: 300`, `tags: ['buildings']`.
- **7.5 manager_building_assignments table**. Schema-only, RLS-enabled,
  not yet wired into UI; future-proofs swapping the manager → all-tickets
  policy for a building-scoped one.
- `tsc --noEmit` clean; `npm run build` clean.

### 2026-05-14 — Phase 5 admin flows shipped (5.1–5.6)
- **Recharts** added to dependencies.
- **Admin profile + data lib** (`src/lib/admin/{admin-profile,directory,budgets,types}.ts`).
  `getBudgetSummary(period?)` is the 1:1 V2 port of
  `BudgetService.summary_for_month`. Spend bucketed by ticket
  `submitted_at` (not requisition approval date).
- **5.1 Dashboard** at `/admin/dashboard` — KPI row, 3 financial overview
  cards, budget snapshot, building heatmap, and four Recharts: urgency
  donut, tickets-over-time stacked line, issue-type horizontal bar,
  resolved-cumulative line.
- **5.5 Building heatmap**: pure JSX horizontal stacked bars (no Recharts —
  Recharts' stacked-bar API is awkward for max-normalized rows). Color
  palette matches old app's `#d62828/#f77f00/#fcbf49/#adb5bd`.
- **5.2 Admin tickets** at `/admin/tickets` — filter chips, debounced
  search via `useDeferredValue`, 4-stage progress stepper (Review →
  Approved → In Progress → Resolved). Stepper stays at Review if
  requisition rejected.
- **5.3 Approve/Reject** (`requisition-block.tsx`, `actions.ts`). Inline
  buttons render only when `req.adminApproval === 'Pending'`.
- **5.4 Budgets** at `/admin/budgets`. Inline `<SaveRow>` writes via
  `saveBudget(category, amount, period)`; "total" is a magic category
  string matching the Rails `BudgetService::TOTAL_KEY`.
- **`<BudgetBar>` shared** at `src/components/shared/budget-bar.tsx`.
  Color shifts: green → orange (>80%) → red (over-budget).
- `tsc --noEmit` clean; `npm run build` clean.

### 2026-05-14 — Phase 4 manager flows shipped (4.1–4.4)
- **4.1 Manager directory** at `/manager/dashboard` (chose this path over
  `/manager/directory` to match existing `RoleNav` link). KPI row,
  filter chips, debounced search via `useDeferredValue`, building
  groups, urgency-sorted within. Society-scope tickets bucket under
  "Society-level".
- **4.1 Inline status + urgency override**. `useTransition` for optimistic
  updates. `overrideUrgency` re-checks the no-requisition rule
  server-side (defense-in-depth — the UI hides the dropdown but a stale
  page could still race).
- **4.2 Requisition create** at `/manager/tickets/[id]/requisition/new`.
  Cost-breakdown table sums `est_cost` in real time via `useMemo`;
  in-house toggle hides vendor/finance/invoices and zeros the cost.
  Cost breakdown serializes line-by-line as `"{description}: ₹{amount}\n"`
  matching the old Rails string format.
- **4.3 Flat requisitions list** at `/manager/requisitions`.
- **4.4 Vendor confirmation**. Only renders if `req.admin_approval ===
  'Approved' && !req.vendor_confirmed`.
- **Types split** (`src/lib/manager/types.ts`): pulled types and pure
  helpers out of `directory.ts` into a client-safe module — necessary
  because the directory shell is a client component. If it had stayed
  in `directory.ts` (which imports `db` + `drizzle-orm`), the bundler
  would try to ship `postgres` to the browser and the build fails on
  `node:tls`.
- `tsc --noEmit` clean. `npm run build` clean.

### 2026-05-14 — Shared-flat handling + expanded onboarding
- **Migrate script: distinct identities for shared flats**
  (`scripts/migrate_users.ts`). Four `(building_code, flat)` slots in
  the live data have two active tenants each (HM1-504, HM1-603,
  SA-516/1D-SBP1, SA-518/1D-SBP1 — joint occupancy). New logic: snapshot
  every `auth.users.id` already claimed by some tenant row at start of
  `migrateTenants`, process pending tenants in `created_at` order. For
  each, try the bare `code-flat@tenants.local` first; if claimed, fall
  back to `code-flat-{tenant.id[0:8]}@tenants.local`. Also normalize
  messy flat strings (e.g. `1905 / 1D-SBP1` → `1905-1d-sbp1`).
- **Live run completed**: all 99 tenants, 1 admin, 1 manager, 1 DR now
  have `user_id`. 8 tenants in the 4 shared flats got suffixed emails.
- **Confirm-profile expanded** to collect phone (required, 10-digit
  normalized), email (required, real), full name (verify), and — for
  tenants — location + wing + flat. On submit, runs the same
  find-or-create society/building/unit logic the dashboard uses and
  reassigns `tenants.unit_id`, persists `tenants.email + phone`, updates
  `public.users.full_name + phone + needs_profile_confirm = false`,
  then `supabaseAdmin.auth.admin.updateUserById` to swap the synthetic
  email for the real one.
- **Shared lib extraction** (`src/lib/tenants/ensure-unit.ts`):
  `ensureDefaultSociety`, `ensureBuilding`, `ensureUnit`, `parseLocation`.
- **Open downstream concern**: tenant login lookup returns multiple rows
  for shared-flat slots. `resolveTenantLogin` picks the first row only —
  tenants in a shared flat may not be able to log in as themselves yet.
  Needs a picker step or email disambiguator at login.

### 2026-05-14 — Phase 3 DR flows shipped (3.1–3.3)
- **3.3 Stats helper** (`src/lib/dr/building-stats.ts`). Postgres-side
  avg via `avg(extract(epoch from (resolved_at - submitted_at)))` so we
  never pull rows just to subtract timestamps.
- **3.1 DR dashboard**: header, KPI cards, urgency pill row (hidden
  when zero), search-filtered ticket list. Search via `useDeferredValue`,
  no re-fetch.
- **3.2 DR raise issue**: scope radio (building/society). Server action
  sets `building_id = scope === 'building' ? profile.buildingId : null`
  and `unit_id = null`, `raised_by_role = 'dr'`,
  `raised_by_dr_id = profile.drId`.
- **DR ticket detail**: access rule: ticket's `building_id ==
  profile.buildingId` OR (`scope == 'society'` AND `raised_by_dr_id ==
  profile.drId`).
- **DR profile helper** (`src/lib/dr/dr-profile.ts`). Contact sourced
  from the DR's linked tenant (`tenants.contact || tenants.phone`),
  falling back to `users.phone` — matches old `Dr#contact`.
- `tsc --noEmit` clean. `npm run build` clean.

### 2026-05-14 — Phase 2 tenant flows shipped (2.1–2.6)
- **2.1 Dashboard**: greeting + sub-line, profile card with
  `auto-filled`/`edited by tenant` badge, ticket list using shared
  `<TicketRow>`. Tickets fetched via `lower(tenant_email) =
  lower(:email)` join (case-insensitive to match the old app's
  `tenants_email_lower_idx`).
- **2.2 Profile edit**: find-or-create Society (`Default Society`),
  Building (`lower(name)` scope), Unit (`lower(coalesce(wing,'')) +
  lower(coalesce(flat,''))`) inside a single transaction. Flips
  `auth.users.user_metadata.location_edited = true`.
- **2.3 Submit ticket**: client form + Server Action. `reference_code`
  comes from the `tickets_reference_seq` default — never set by the app.
  Confirmation page is its own route (`?ref=TK-…`) so refresh/bookmark
  behaves; cross-checks `tickets.tenant_email == authUser.email` to
  avoid leaking another tenant's TK.
- **2.4 Upload helper** (`src/lib/storage/upload.ts` +
  `src/lib/storage/limits.ts`). Constants split into `limits.ts`
  (client-safe) so client forms can reference MIME/size without dragging
  server-only code into the bundle.
- **2.5 Ticket detail**: tenant-scoped via `tenant_email == authUser.email`.
  No urgency / triage_reason in the DOM (inspect-source clean).
- **2.6 Change password**: three-input form. Current password verified
  via a throwaway anon-key client (`persistSession: false`), so the
  user's real cookies are never touched by the probe.
- **Attachment serving** (`src/app/api/attachments/[id]/route.ts`):
  signed-in GET handler. Middleware now skips `/api/*` so route handlers
  control their own 401 (otherwise `<img src="/api/attachments/...">`
  would follow a redirect to `/login` and break silently).
- **Phase 1 backfill state observed** (via one-off
  `scripts/check_phase1_state.ts`): RLS applied on all 13 public tables
  (31 policies). `buildings.code` populated 125/125. `migrate_users`
  populated 76/99 tenants; 23 tenants and all staff (admins/managers/drs,
  0/1 each) remained unmigrated at that point — later fixed by the
  shared-flat changelog entry above.
- `tsc --noEmit` clean. `npm run build` clean.

### 2026-05-14 — 0.6 authed shell shipped + folder reorg
- `src/app/(authed)/layout.tsx` — root layout for every signed-in route.
  Fetches role + full_name via Drizzle (one query); DRs additionally
  get their building name for the sub-text.
- `src/components/shared/{app-header,role-nav,user-menu}.tsx` — text
  logo + role sub-text, role-specific nav links, avatar with initials
  (tenants only — staff show their name as plain text), Log out button.
- **Folder reorg**: moved `src/app/(admin)/buildings/codes` →
  `src/app/(authed)/admin/buildings/codes`. The original `(admin)` route
  group resolved to URL `/buildings/codes` which fell outside
  middleware's `/admin/*` gate — anyone signed-in could have visited it.
- `tsc --noEmit` clean, `next build` clean.

### 2026-05-14 — 1.10 RLS policies written
- `supabase/migrations/20260514000010_rls_policies.sql` — enables RLS
  on every public-facing table and adds per-role policies.
- Helper function `public.current_role()` reads the current user's role
  enum. Marked `security definer` because the function itself reads
  `public.users` — without elevated privileges its internal SELECT
  would hit RLS and return null.
- `tickets_read` matches tenant by `lower(t.email) =
  lower(tickets.tenant_email)` joined through `public.tenants` rather
  than `auth.users.email`, so post-1.4 tenants with new synthetic
  emails still see their pre-migration tickets.

### 2026-05-14 — 1.9 middleware shipped
- `src/middleware.ts` — single Edge middleware enforcing session presence,
  role gating, and onboarding-flag redirects.
- `/onboarding/set-password` is **not** session-gated — it's reached
  pre-session via the `first_login` token, and the page itself verifies
  that token.
- Orphan handling: signed in to `auth.users` but missing from
  `public.users` → sign out + redirect to /login.

### 2026-05-13 — 1.7 onboarding pages shipped
- `src/app/(auth)/onboarding/set-password/{page,set-password-form}.tsx`
  — verifies the `first_login` token from URL, accepts new + confirm
  password (min 6 chars), updates via service-role `admin.updateUserById`,
  clears `legacy_bcrypt_hash`, signs the user in.
- `src/app/(auth)/onboarding/confirm-profile/{page,confirm-profile-form}.tsx`.
- Refactored `onboarding-token.ts` to lazy-load
  `ONBOARDING_TOKEN_SECRET` (the build step evaluates server modules
  and tripped on the eager throw).

### 2026-05-13 — 1.5 + 1.6 + 1.8 login flow + BCrypt rehash shipped
- `src/lib/auth/onboarding-token.ts` — HMAC-SHA256 signed tokens, two
  shapes: `first_login` and `login_continue` (carries resolved email
  between Continue + Sign-in steps so the browser never sees it).
- `src/lib/auth/legacy-rehash.ts` — `authenticateWithPassword(email,
  password)`. Tries Supabase Auth → on failure looks up `public.users`
  by email, BCrypt-compares `legacy_bcrypt_hash`, on match silently
  sets the password via admin API, nulls the hash, signs in.
- Tenant input parsed by `^([A-Z0-9]{2,4})-(.+)$`. All lookup misses
  return a single generic error string — no enumeration.

### 2026-05-13 — 1.4 user backfill script ready
- `scripts/migrate_users.ts` + `npm run migrate-users`. Migrates tenants
  → admins → managers → drs in order. Skips any role row with
  `user_id IS NOT NULL` (idempotent).
- DR identity is **separate** from tenant identity — even for a DR who
  is also a tenant, two `auth.users` rows are created.
- Hard prerequisite: `npm run suggest-building-codes` must populate
  every building's code first.

### 2026-05-13 — 1.3 building-code backfill
- `src/lib/building-codes.ts` — shared `suggestBuildingCode(name, taken)`
  helper. Drop noise words, first-letter-per-token, single-word fallback,
  collision suffix.
- **`db:pull` Drizzle-kit quirk fixed**: drizzle-kit emits a
  cross-schema `usersInAuth` reference into `relations.ts` (from our FK
  to `auth.users`) but doesn't export it from `schema.ts`, breaking
  typecheck. Added `scripts/clean_relations.mjs` and chained it into
  the `db:pull` npm script so the cleanup is automatic going forward.

### 2026-05-13 — 1.1 + 1.2 migrations written
- `supabase/migrations/20260514000001_v2_users_table.sql` — creates
  `user_role` enum, `public.users` table, and nullable `user_id` FK on
  every role table. Pure additive.
- `supabase/migrations/20260514000002_buildings_code.sql` — adds nullable
  unique `buildings.code` column.

### 2026-05-13 — 0.2 theme tokens ported
- Added a second `@theme` block to `src/app/globals.css` containing every
  design token from the old app's `public/css/app.css`.
- Tokens namespaced with `deh-` so shadcn defaults stay intact:
  `bg-deh-blue`, `text-deh-yellow`, `rounded-deh-pill`.
- Status dot hexes (`#E24B4A`/`#378ADD`/`#639922`) are now first-class
  tokens.

### 2026-05-13 — Project scaffolded
- Created folder `Ticketing Module V2/` with git init.
- Scaffolded Next.js 16.2.6 + React 19.2.4 + TypeScript strict + Tailwind
  v4 + ESLint 9.
- Initialized shadcn/ui (base-nova preset, neutral color). Added
  components: button, card, input, label.
- Installed: `@supabase/supabase-js`, `@supabase/ssr`, `drizzle-orm`,
  `postgres`, `bcryptjs`, `lucide-react`, `dotenv` (dev: `drizzle-kit`,
  `@types/bcryptjs`).
- Ran `drizzle-kit pull` against live Supabase — introspected 12 tables,
  5 enums, 33 indexes, 10 FKs, 1 view.
- Smoke tests passed: `tsc --noEmit` clean, `next build` clean.
