-- V2 Phase 1.2 — buildings.code
--
-- Adds a unique 2–3 letter abbreviation per building. Required for the
-- tenant BUILDING-FLAT login format (e.g. "ABC-101"). Nullable on
-- creation; populated by 1.3's backfill script + admin review UI, then
-- promoted to NOT NULL manually once every building has a confirmed code.

alter table public.buildings
  add column code text;

create unique index buildings_code_upper_idx
  on public.buildings (upper(code))
  where code is not null;
