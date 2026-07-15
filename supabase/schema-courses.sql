-- itba.az — Phase 3: Course Directory
--
-- Run after supabase/schema-rbac.sql (needs `is_admin()`).
--
-- Simpler trust model than articles: admin is the only writer (no
-- author/review workflow — this is curated reference content, same
-- shape as admin_wordings), so a plain is_admin()-gated policy per
-- write action is enough; no with-check status-transition dance needed.
create table if not exists courses (
  id bigint generated always as identity primary key,
  title text not null,
  provider text not null,
  is_ours boolean not null default false,
  price text,
  format text not null check (format in ('online','offline','hybrid')),
  level text not null check (level in ('beginner','intermediate','advanced')),
  language text not null check (language in ('az','en','ru')),
  url text,
  description text,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table courses enable row level security;

-- Public read is limited to active rows — admin can soft-disable a
-- listing (e.g. a provider stopped offering it) without deleting the
-- row outright.
create policy "public read active" on courses for select using (active = true);
create policy "admin read all" on courses for select using (is_admin());
create policy "admin insert" on courses for insert with check (is_admin());
create policy "admin update" on courses for update using (is_admin());
create policy "admin delete" on courses for delete using (is_admin());
