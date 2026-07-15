-- itba.az — Supabase schema
--
-- This is the source of truth for the project's database. It exists nowhere
-- else — if this Supabase project were ever lost or a second environment is
-- needed, this file is what rebuilds it. Run top to bottom in the Supabase
-- SQL Editor on a fresh project.
--
-- Auth: one admin account is expected to exist (email/password created via
-- the Supabase Auth API — see README.md). All "admin only" policies below
-- check that account's email specifically, not just "any authenticated
-- user", because this project leaves public sign-up enabled by default.
-- Consider disabling sign-up in Authentication → Settings if it isn't
-- needed for anything else.

-- ============================================================
-- exam_progress — a student's live progress through exam.html
-- ============================================================
-- Written continuously by the student's own browser as they work (no real
-- login — just an email typed into a gate list), and read by the teacher
-- panel in exam.html (gated by a client-side passcode, not Supabase Auth).
-- Left publicly readable/writable: neither side of this feature has a real
-- authenticated identity to scope a policy to, and the data (practice SQL
-- answers) is low-sensitivity. Tightening this would require redesigning
-- student identity around real accounts — out of scope for now, tracked as
-- a known, accepted tradeoff.
create table if not exists exam_progress (
  email text primary key,
  started_at bigint,
  current int,
  score int,
  answers jsonb,
  finished_at bigint,
  updated_at timestamptz default now()
);
alter table exam_progress enable row level security;
create policy "public read" on exam_progress for select using (true);
create policy "public upsert" on exam_progress for insert with check (true);
create policy "public update" on exam_progress for update using (true);

-- ============================================================
-- exam_emails — student emails added from the teacher panel
-- ============================================================
-- Extends the hardcoded EMAILS allowlist in exam.html. Same tradeoff as
-- exam_progress above: the "teacher" gate is a client-side passcode, not a
-- real account, so there's no authenticated identity to scope this to.
create table if not exists exam_emails (
  email text primary key,
  added_at timestamptz default now()
);
alter table exam_emails enable row level security;
create policy "public read" on exam_emails for select using (true);
create policy "public insert" on exam_emails for insert with check (true);

-- ============================================================
-- page_visits — lightweight analytics, written by every page load
-- ============================================================
-- INSERT must stay public: anonymous site visitors write this with no
-- login. SELECT is admin-only — visit/referrer data should only be
-- readable from the authenticated admin dashboard, not by anyone holding
-- the public API key.
create table if not exists page_visits (
  id bigint generated always as identity primary key,
  page text not null,
  visitor_id text,
  referrer text,
  visited_at timestamptz default now()
);
alter table page_visits enable row level security;
create policy "public insert" on page_visits for insert with check (true);
create policy "admin read" on page_visits for select
  using (auth.jwt() ->> 'email' = 'qalib.akhmedov@gmail.com');

-- ============================================================
-- applications — Apply-form submissions (contains PII: name/phone/email)
-- ============================================================
-- INSERT must stay public: the public Apply form writes this with no
-- login. SELECT is admin-only — this is personal contact information and
-- must not be readable by anyone holding the public API key.
create table if not exists applications (
  id bigint generated always as identity primary key,
  full_name text,
  phone text,
  email text,
  role text,
  goal text,
  message text,
  submitted_at timestamptz default now()
);
alter table applications enable row level security;
create policy "public insert" on applications for insert with check (true);
create policy "admin read" on applications for select
  using (auth.jwt() ->> 'email' = 'qalib.akhmedov@gmail.com');

-- ============================================================
-- admin_wordings — editable copy for index.html, edited from admin.html
-- (single JSONB row keyed by the wording's id, e.g. "heroTitle")
-- ============================================================
-- SELECT must stay public: index.html is a public page and reads this row
-- on every load to apply any saved overrides. INSERT/UPDATE are admin-only
-- — only the logged-in admin may change what the site says.
create table if not exists admin_wordings (
  id int primary key default 1,
  wordings jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);
alter table admin_wordings enable row level security;
create policy "public read" on admin_wordings for select using (true);
create policy "admin insert" on admin_wordings for insert
  with check (auth.jwt() ->> 'email' = 'qalib.akhmedov@gmail.com');
create policy "admin update" on admin_wordings for update
  using (auth.jwt() ->> 'email' = 'qalib.akhmedov@gmail.com');
