-- Phase 7.5 — manager ↔ building assignments.
--
-- Schema-only table that future-proofs multi-society scoping for managers.
-- Not wired into any V2 UI in MVP: managers see every ticket via the existing
-- tickets_manager_update RLS policy. Adding rows here later will let us swap
-- the policy to scope-by-building without another migration.

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
