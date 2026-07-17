-- itba.az — RBAC helper: is_admin()
--
-- Every "admin only" RLS policy across schema.sql and schema-phase1.sql
-- repeats the same raw check: auth.jwt() ->> 'email' =
-- 'qalib.akhmedov@gmail.com'. That was fine for one admin and one new
-- role. It stops scaling once teacher/classroom-scoped policies start
-- getting added (Phase 4) — this migration moves the admin check onto a
-- single reusable function so every future admin policy reads
-- `using (is_admin())` instead of repeating the hardcoded email.
--
-- Depends on the `profiles` table from supabase/schema-phase1.sql — run
-- this file AFTER that one. Requires your existing admin account's
-- `profiles` row to have role = 'admin' (check this before running, or
-- the admin panel will lose access to its own data).

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ---- schema.sql: page_visits, applications, admin_wordings ----

drop policy if exists "admin read" on page_visits;
create policy "admin read" on page_visits for select
  using (is_admin());

drop policy if exists "admin read" on applications;
create policy "admin read" on applications for select
  using (is_admin());

drop policy if exists "admin insert" on admin_wordings;
create policy "admin insert" on admin_wordings for insert
  with check (is_admin());

drop policy if exists "admin update" on admin_wordings;
create policy "admin update" on admin_wordings for update
  using (is_admin());

-- ---- schema-phase1.sql: profiles + the two role-detail tables, test_attempts ----
-- potential_ba_profiles/junior_ba_profiles/ba_professional_profiles were
-- renamed/merged into potential_profiles/professional_profiles in Faza 1.5
-- (MIGRATION-PLAN.md). Postgres carries a table's policies through a
-- RENAME, so the "admin read" policies created here before Faza 1.5 are
-- still live on the new table names — no live DB action was needed for
-- this file update. This block is updated so a from-scratch run of this
-- file (disaster recovery, a second environment) doesn't fail by
-- referencing tables that no longer exist.

drop policy if exists "admin read" on profiles;
create policy "admin read" on profiles for select
  using (is_admin());

drop policy if exists "admin update" on profiles;
create policy "admin update" on profiles for update
  using (is_admin());

drop policy if exists "admin read" on potential_profiles;
create policy "admin read" on potential_profiles for select
  using (is_admin());

drop policy if exists "admin read" on professional_profiles;
create policy "admin read" on professional_profiles for select
  using (is_admin());

drop policy if exists "admin read" on test_attempts;
create policy "admin read" on test_attempts for select
  using (is_admin());
