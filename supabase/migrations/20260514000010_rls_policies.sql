-- V2 Phase 1.10 — Row-Level Security on every public-facing table.
--
-- Defense-in-depth: even if Server Action code has a bug, the database
-- itself rejects cross-role access. Service-role (used by Drizzle with
-- the DATABASE_URL connection and by admin scripts) bypasses RLS — only
-- the anon-key client + user JWT path is gated.
--
-- Prereqs: migrations 1.1 (public.users) and 1.4 (user_id populated on
-- every role row) must already have run.

-- ============================================================
-- Helper: current user's role enum value.
-- ============================================================
-- security definer because the function reads public.users — without
-- it, the function's own SELECT on public.users would be gated by RLS,
-- and we'd hit a circular evaluation.

create or replace function public.current_role()
returns public.user_role
language sql stable security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid()
$$;

revoke all on function public.current_role() from public;
grant execute on function public.current_role() to authenticated;

-- ============================================================
-- Enable RLS.
-- ============================================================

alter table public.users           enable row level security;
alter table public.tenants         enable row level security;
alter table public.admins          enable row level security;
alter table public.managers        enable row level security;
alter table public.drs             enable row level security;
alter table public.tickets         enable row level security;
alter table public.requisitions    enable row level security;
alter table public.monthly_budgets enable row level security;
alter table public.units           enable row level security;
alter table public.buildings       enable row level security;
alter table public.societies       enable row level security;

-- ============================================================
-- users — self read/update; admin reads/writes all.
-- ============================================================

create policy users_self_read on public.users for select
  using (id = auth.uid() or public.current_role() = 'admin');

create policy users_self_update on public.users for update
  using (id = auth.uid() or public.current_role() = 'admin')
  with check (id = auth.uid() or public.current_role() = 'admin');

create policy users_admin_insert on public.users for insert
  with check (public.current_role() = 'admin');

create policy users_admin_delete on public.users for delete
  using (public.current_role() = 'admin');

-- ============================================================
-- tenants — tenant sees own; DRs see their building; manager/admin all.
-- ============================================================

create policy tenants_read on public.tenants for select
  using (
    case public.current_role()
      when 'tenant'  then user_id = auth.uid()
      when 'dr'      then exists (
        select 1
        from public.drs d
        join public.units u on u.id = tenants.unit_id
        where d.user_id = auth.uid() and d.active and d.building_id = u.building_id
      )
      when 'manager' then true
      when 'admin'   then true
    end
  );

create policy tenants_update on public.tenants for update
  using (
    case public.current_role()
      when 'tenant' then user_id = auth.uid()
      when 'admin'  then true
      else false
    end
  )
  with check (
    case public.current_role()
      when 'tenant' then user_id = auth.uid()
      when 'admin'  then true
      else false
    end
  );

create policy tenants_admin_insert on public.tenants for insert
  with check (public.current_role() = 'admin');
create policy tenants_admin_delete on public.tenants for delete
  using (public.current_role() = 'admin');

-- ============================================================
-- admins / managers — self read + admin all-write.
-- ============================================================

create policy admins_read on public.admins for select
  using (user_id = auth.uid() or public.current_role() = 'admin');
create policy admins_admin_write on public.admins for all
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

create policy managers_read on public.managers for select
  using (user_id = auth.uid() or public.current_role() in ('admin', 'manager'));
create policy managers_admin_write on public.managers for all
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- ============================================================
-- drs — readable by self, the DR's building's tenant, managers, admins.
-- ============================================================

create policy drs_read on public.drs for select
  using (
    user_id = auth.uid()
    or public.current_role() in ('admin', 'manager')
    or (
      public.current_role() = 'tenant'
      and building_id in (
        select u.building_id from public.tenants t
        join public.units u on u.id = t.unit_id
        where t.user_id = auth.uid()
      )
    )
    or (
      public.current_role() = 'dr'
      and building_id in (
        select building_id from public.drs where user_id = auth.uid() and active
      )
    )
  );
create policy drs_admin_write on public.drs for all
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- ============================================================
-- tickets — most complex policy set.
-- ============================================================

create policy tickets_read on public.tickets for select
  using (
    case public.current_role()
      when 'tenant'  then exists (
        select 1 from public.tenants t
        where t.user_id = auth.uid()
          and lower(t.email) = lower(tickets.tenant_email)
      )
      when 'dr' then (
        (
          tickets.building_id is not null
          and tickets.building_id in (
            select building_id from public.drs where user_id = auth.uid() and active
          )
        )
        or (
          tickets.scope = 'society'
          and tickets.raised_by_dr_id in (
            select id from public.drs where user_id = auth.uid()
          )
        )
      )
      when 'manager' then true
      when 'admin'   then true
    end
  );

create policy tickets_tenant_insert on public.tickets for insert
  with check (
    public.current_role() = 'tenant'
    and raised_by_role = 'tenant'
    and exists (
      select 1 from public.tenants t
      where t.user_id = auth.uid()
        and lower(t.email) = lower(tickets.tenant_email)
    )
  );

create policy tickets_dr_insert on public.tickets for insert
  with check (
    public.current_role() = 'dr'
    and raised_by_role = 'dr'
    and raised_by_dr_id in (
      select id from public.drs where user_id = auth.uid() and active
    )
  );

-- Manager/admin perform the operational updates (status, urgency, assignment).
create policy tickets_manager_update on public.tickets for update
  using (public.current_role() in ('manager', 'admin'))
  with check (public.current_role() in ('manager', 'admin'));

create policy tickets_admin_delete on public.tickets for delete
  using (public.current_role() = 'admin');

-- ============================================================
-- requisitions — manager + admin only.
-- ============================================================

create policy requisitions_read on public.requisitions for select
  using (public.current_role() in ('manager', 'admin'));
create policy requisitions_manager_write on public.requisitions for all
  using (public.current_role() in ('manager', 'admin'))
  with check (public.current_role() in ('manager', 'admin'));

-- ============================================================
-- monthly_budgets — manager reads; admin reads + writes.
-- ============================================================

create policy monthly_budgets_read on public.monthly_budgets for select
  using (public.current_role() in ('manager', 'admin'));
create policy monthly_budgets_admin_insert on public.monthly_budgets for insert
  with check (public.current_role() = 'admin');
create policy monthly_budgets_admin_update on public.monthly_budgets for update
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');
create policy monthly_budgets_admin_delete on public.monthly_budgets for delete
  using (public.current_role() = 'admin');

-- ============================================================
-- units / buildings / societies — any signed-in user reads; admin writes.
-- ============================================================

create policy units_read on public.units for select
  using (auth.uid() is not null);
create policy units_admin_write on public.units for all
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

create policy buildings_read on public.buildings for select
  using (auth.uid() is not null);
create policy buildings_admin_write on public.buildings for all
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

create policy societies_read on public.societies for select
  using (auth.uid() is not null);
create policy societies_admin_write on public.societies for all
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');
