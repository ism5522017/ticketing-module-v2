-- V2 Phase 1.1 — users consolidation table
--
-- Adds a single public.users row per auth.users row, with role + onboarding
-- flags + a legacy_bcrypt_hash slot used during the transparent rehash on
-- first sign-in (see CLAUDE.md §6).
--
-- Purely additive: no data deletion, no column drops on existing role tables.
-- The four role tables (tenants/admins/managers/drs) get a nullable user_id
-- FK that 1.4's backfill script will populate.

create type public.user_role as enum ('tenant','admin','manager','dr');

create table public.users (
  id                       uuid primary key references auth.users(id) on delete cascade,
  role                     public.user_role not null,
  username                 text,
  full_name                text not null,
  phone                    text,
  active                   boolean not null default true,
  needs_password_set       boolean not null default true,
  needs_profile_confirm    boolean not null default true,
  legacy_bcrypt_hash       text,
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
