# DEH Maintenance — Project Spec Sheet

> A quick reference of every feature in the V2 ticketing app, grouped by who uses it. For technical detail, see `CLAUDE.md`.

---

## At a glance

| | |
|---|---|
| **What it is** | A web app where tenants raise maintenance tickets and the management team (admin, manager, building representative) routes, costs, approves, and closes them. |
| **Who logs in** | Tenants, District Representatives (DRs), Managers, Admins. |
| **Where it runs** | https://deh-ticketing.vercel.app (and any custom domain you add later). |
| **Where data lives** | One Supabase project (Postgres + Auth + file storage) shared with the old Rails app during cutover. |
| **What replaces** | The old Rails ticketing app at `../ticketing module/`. |

---

## Roles — at a glance

| Role | Sign-in identifier | What they primarily do |
|---|---|---|
| **Tenant** | `BUILDING-FLAT` (e.g. `ABC-101`) | Raise tickets for their flat, watch progress. |
| **DR** (District Rep) | Their username | Raise tickets for the whole building or society. |
| **Manager** | Their username | Triage every ticket, create requisitions, mark vendor work complete. |
| **Admin** | Their username | Oversee everything, approve costs, set budgets, manage staff. |

---

## 1. Authentication & onboarding

| Feature | Who | How it works |
|---|---|---|
| **Single login page** | Everyone | One screen with two tabs: "Tenant" and "Staff". |
| **Tenant identifier** | Tenant | Types `BUILDING-FLAT` (e.g. `BM-401` for Badri Mahal flat 401). |
| **Staff identifier** | DR / Manager / Admin | Types their username (e.g. `admin`). |
| **First-time login** | All new users | Skips the password prompt, sends them to "Choose your password" instead. |
| **Set password** | First-time users | Pick a password ≥ 6 chars, confirm it, continue. |
| **Confirm profile** | First-time users | Verify phone, real email, and (for tenants) address/wing/flat. |
| **Returning login** | All users | Enter their identifier → password field appears → sign in. |
| **Forgot password** | Tenants & staff | Call the office on **+91 810 721 6176**. Admin clicks "Reset" in the staff CRUD UI; user gets a temporary password and is forced to choose a new one on next login. |
| **Change password** | All signed-in users | Top-right menu → "Password". Three inputs: current, new, confirm. |
| **Auto sign-out** | All users | Sessions live ~1 hour by default. Re-login required after that. |
| **Role gate** | All authed routes | Middleware blocks tenants from `/admin/*`, etc., and bounces signed-in users from `/login` to their dashboard. |

---

## 2. Tenant features

| Feature | Where (URL) | What it does |
|---|---|---|
| **Dashboard** | `/tenant/dashboard` | Greeting, profile card, ticket list. |
| **Profile card** | Dashboard | Shows your name, contact, building, wing, flat. "Edit details" button to update location/wing/flat inline (reassigns you to a different unit if needed). |
| **My tickets list** | Dashboard | All tickets you've raised, newest first. Each row shows type, status, attachment count, time, and ticket ID. |
| **Raise a ticket** | `/tenant/tickets/new` | Pick an issue type, write a description, attach up to 5 photos/PDFs (10 MB each), submit. Automatic triage runs server-side. |
| **Attachment preview** | Raise-ticket page | Selected images show as 4:3 thumbnails before submission. PDFs get an icon. Hover to remove. |
| **Ticket confirmation** | `/tenant/tickets/new/confirm` | After submit, you see a confirmation page with your ticket number (e.g. `TK-00123`), issue type, location, attachment count, time. |
| **Ticket detail** | `/tenant/tickets/[id]` | Click any ticket row to see the full detail — status, description, attachments (clickable lightbox), submitted time. Urgency is hidden from tenants. |
| **Change password** | `/settings/password` | From the top-right menu. |
| **Log out** | Top-right menu | Clears session, returns to login. |

---

## 3. District Representative (DR) features

| Feature | Where (URL) | What it does |
|---|---|---|
| **DR dashboard** | `/dr/dashboard` | Building overview header, 5 KPI cards (Total / Open / In Progress / Resolved / Avg resolution hours), urgency breakdown pills, searchable ticket list. |
| **Search tickets** | Dashboard | Client-side filter across type, description, ticket ID. |
| **Raise issue** | `/dr/tickets/new` | Choose scope ("Building" or "Society"), then same form as tenant raise (issue type, description, attachments). |
| **Confirmation screen** | `/dr/tickets/new/confirm` | Shows the new ticket's ID, scope label, issue type, urgency. DRs are allowed to see urgency on their own submissions. |
| **Ticket detail** | `/dr/tickets/[id]` | Full ticket view, scoped to DR's building or their society-scope submissions. |
| **Change password** | `/settings/password` | Same as everyone. |

---

## 4. Manager features

| Feature | Where (URL) | What it does |
|---|---|---|
| **Tickets directory** | `/manager/dashboard` | KPI strip (Pending / Awaiting Admin / Approved / Rejected). Filter chips, debounced search, tickets grouped by building, sorted by urgency. |
| **Status control** | Each ticket card | Dropdown to flip status (Open / In Progress / Resolved). Optimistic UI. |
| **Urgency override** | Each ticket card (no requisition yet) | Dropdown to manually set urgency. Disabled once a requisition exists. |
| **Create requisition** | `/manager/tickets/[id]/requisition/new` | Form with: surveyed (yes/no), in-house fix (yes/no), vendor name, real-time cost breakdown table that sums to `est_cost`, invoice upload. |
| **Requisitions list** | `/manager/requisitions` | Flat table of all requisitions the manager has touched — links back to the ticket card. |
| **Vendor confirmation** | Requisition card on directory | Once admin approves, upload a proof photo and mark vendor work complete. Locks in `vendor_confirmed_by`/`at`/`proof`. |

---

## 5. Admin features

### Dashboards & analytics

| Feature | Where (URL) | What it does |
|---|---|---|
| **Admin dashboard** | `/admin/dashboard` | KPI row (Total / Open / In Progress / Resolved), 3 financial cards, budget snapshot, building heatmap, 4 charts. |
| **Financial overview** | Dashboard cards | Total approved, this month, pending cost. Indian-rupee formatted. |
| **Budget snapshot** | Dashboard | Top 6 spending categories with budget bars (green → orange → red as over-budget). |
| **Building heatmap** | Dashboard | Horizontal stacked bar per building, segments colored by urgency. Sorted by total ticket count. |
| **Charts** | Dashboard | Urgency donut, status-over-time stacked line, issue-type horizontal bar, resolved-cumulative line. |

### Ticket oversight

| Feature | Where (URL) | What it does |
|---|---|---|
| **Tickets directory** | `/admin/tickets` | Every ticket with a 4-stage progress stepper (Review → Approved → In Progress → Resolved). Filter chips, search, grouped by building. |
| **Approve requisition** | Ticket card on directory | Pending requisition → "Approve" button + optional remarks textarea. Unlocks vendor confirmation for the manager. |
| **Reject requisition** | Ticket card on directory | Same but rejects. Stays at "Review" stage on the stepper. |

### Budgets

| Feature | Where (URL) | What it does |
|---|---|---|
| **Monthly budgets editor** | `/admin/budgets` | Editable table: per-category budget vs spend vs remaining. Total budget row at the top. Color-shifting progress bars. |

### Staff management (admin-only)

| Feature | Where (URL) | What it does |
|---|---|---|
| **Admins CRUD** | `/admin/staff/admins` | Add, inline-edit, reset password, disable/enable. Guards: cannot disable self; at least one active admin must remain. |
| **Managers CRUD** | `/admin/staff/managers` | Add, edit, reset password, disable/enable. No invariants. |
| **DRs CRUD** | `/admin/staff/drs` | Add (cascading: pick building → pick tenant → enter username), reset password, retire. Residency check ensures DR's tenant lives in the chosen building. |
| **Tenants CRUD** | `/admin/staff/tenants` | Server-side filtering by building, search by name/email/flat, pagination (50/page, max 200). Add, edit, reset password, disable/enable. Phone normalization. Email synthesis if blank. |
| **Tenant credentials lookup** | `/admin/staff/tenant-credentials` | View every tenant's login ID (`CODE-FLAT`), real or synthetic email, password state (Awaiting first sign-in / Default `1234` / Custom). |
| **Building codes** | `/admin/buildings/codes` | Suggested 2–3 letter abbreviations per building (e.g. `BM` for Badri Mahal). Inline-editable. Uniqueness enforced. Backs the tenant `BUILDING-FLAT` login. |

---

## 6. Cross-cutting / background functions

| Function | What it does |
|---|---|
| **Smart triage** | When a ticket is raised, server-side logic looks at the issue type plus keywords in the description and assigns an urgency (Critical / High / Medium / Low). Tenants don't see this. |
| **Reference codes** | Every ticket gets a sequential code like `TK-00101`, `TK-00102`, generated by a Postgres sequence. Tenant-friendly. |
| **Attachment storage** | All files (photos, PDFs, vendor proof) live in a Supabase Storage bucket called `ticket-attachments`. Path format: `YYYY/MM/<random-uuid>.<ext>`. |
| **Attachment serving** | `/api/attachments/[id]` route — images render inline, PDFs and other files force-download. Auth-gated. |
| **Buildings cache** | The buildings list (for admin dropdowns) is cached for 5 minutes to keep the staff-CRUD pages fast. |
| **RLS (row-level security)** | The database itself enforces who can read what. A tenant queries with their JWT and the DB returns only their own tickets. |
| **Session refresh** | The proxy/middleware silently refreshes JWTs near expiry so users stay signed in for the cookie lifetime. |
| **Role gate** | Middleware bounces wrong-role visits (e.g. a tenant trying `/admin/dashboard`) back to their own dashboard. |
| **First-login gate** | Anyone with unfinished onboarding (set password, confirm profile) is held at `/onboarding/*` until done. |

---

## 7. Tech building blocks

| Layer | What we use |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, Server Actions) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui components |
| Charts | Recharts |
| Database | Supabase Postgres |
| ORM | Drizzle (introspected from live schema) |
| Auth | Supabase Auth (JWT, bcrypt-hashed passwords) |
| File storage | Supabase Storage |
| Hosting | Vercel (functions pinned to Mumbai region) |
| Email (planned) | Resend (when ticket-confirmation emails are wired up) |

---

## 8. What the app deliberately does NOT do

Listed here so nobody adds them by accident. Each was considered and excluded:

- Self-registration (admin creates accounts)
- In-app notification center
- SMS or email notifications (deferred — Resend planned)
- CSV / PDF export
- Comments / chat threads on tickets
- Bulk requisition approvals
- A separate mobile app (the website is mobile-friendly)
- Hardcoded issue types (free-text categories list lives in `src/lib/triage.ts`)
- Super-admin role above regular admin
- Multi-factor authentication (Supabase Auth supports it; can be enabled later)

---

## 9. Maintenance commands (run by Ismail locally)

| Command | What it does |
|---|---|
| `npm run dev` | Start the local dev server at http://localhost:3000 |
| `npm run build` | Build for production |
| `npm run typecheck` | TypeScript check, no compile |
| `npm run lint` | ESLint |
| `npm run db:pull` | Re-introspect the live Supabase schema → regenerate `src/db/schema.ts` |
| `npm run suggest-building-codes` | Generate 2–3 letter codes for any building that doesn't have one |
| `npm run migrate-users` | Idempotent backfill of `auth.users` + `public.users` from the legacy role tables |
| `npm run dump-directory` | Generate `building-directory.md` — a local-only PII-bearing snapshot |

---

*Last updated: 2026-05-18.*
