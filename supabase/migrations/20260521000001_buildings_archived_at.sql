-- Soft-delete column for buildings. Admins archive instead of deleting so
-- historical tickets/units that reference the building stay intact (the FKs
-- are ON DELETE RESTRICT for units, so a hard delete would fail anyway).
-- listBuildings() filters out archived rows so they disappear from
-- dropdowns (tenant create, DR create, login picker, credentials filter).

alter table public.buildings
  add column if not exists archived_at timestamptz;

create index if not exists buildings_archived_at_idx
  on public.buildings (archived_at)
  where archived_at is not null;
