-- ============================================================================
-- Emergency staff password reset (admin / manager / DR)
-- ============================================================================
--
-- Use this when a staff user CANNOT log in and you cannot reach the in-app
-- reset button (the catch-22 case — admin can't sign in to /admin/staff/admins
-- to reset themselves).
--
-- HOW TO RUN:
--   1. Open https://supabase.com → log in → select your project.
--   2. Left sidebar → "SQL Editor" → click "+ New query".
--   3. Paste the section you need (Step 1 then Step 2).
--   4. Click "Run" (or press Cmd/Ctrl + Enter).
--
-- WHAT THIS DOES:
--   Flips `needs_password_set = true` so the next time the user types their
--   username on the Staff login tab and clicks Continue, they're sent
--   straight to "Choose your password" — NO password prompt appears.
--
-- ALTERNATIVE (CLI):
--   From the project folder on your laptop:
--     npm run reset-staff -- <username>
--   …does the same thing plus also resets the underlying Supabase Auth
--   password. Use whichever is more convenient.
--
-- ============================================================================


-- ─── STEP 1 — See which staff users you have ────────────────────────────────
-- Run this first to find the right username. Look at the `username` column.

select role, username, full_name, needs_password_set, needs_profile_confirm, active
from public.users
where role in ('admin','manager','dr')
order by role, username;


-- ─── STEP 2 — Reset the staff user(s) ───────────────────────────────────────
-- Replace the usernames inside the IN(...) list with what you saw in Step 1.
-- You can pass one, two, or all three at once.

update public.users
set needs_password_set = true,
    needs_profile_confirm = true,
    legacy_bcrypt_hash = null
where role in ('admin','manager','dr')
  and lower(username) in (
    'admin'
    -- ,'dehmanager'
    -- ,'dehdr'
  );


-- ─── STEP 3 — Verify the flip worked ────────────────────────────────────────

select username, role, needs_password_set, needs_profile_confirm
from public.users
where role in ('admin','manager','dr');


-- ============================================================================
-- After running Step 2:
--   - Tell the user to go to https://deh-ticketing.vercel.app
--   - Click the "Staff" tab
--   - Type their username (e.g. "admin")
--   - Click Continue
--   - They'll be sent to "Choose your password" automatically
--   - Pick new password → confirm details → done
-- ============================================================================
