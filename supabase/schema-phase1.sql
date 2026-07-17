-- community/ — Auth foundation (Faza 1.5): registration, roles, career test.
--
-- Adds new tables to the same Supabase project schema.sql (in this same
-- folder) already uses for exam_progress, applications, page_visits,
-- admin_wordings, exam_emails — none of that is touched here.
--
-- Run this file, then supabase/seed-test-questions.sql, in the Supabase
-- SQL Editor before testing community/*.html.
--
-- Role model: potential/professional/moderator/admin (docs/ITBA-SPEC.md
-- §3). The original build used a 6-role model (admin/ba_professional/
-- potential_ba/junior_ba/teacher/enrolled_student); migrated to the SPEC
-- model in Faza 1.5 (MIGRATION-PLAN.md) — `profiles` was empty at
-- migration time, so no data backfill was needed.

-- ============================================================
-- profiles — one row per authenticated user, created ONLY by the
-- handle_new_user() trigger below, never directly by the client.
-- ============================================================
-- No INSERT policy for normal users, on purpose: if authenticated users
-- could insert/update their own profiles row, they could set role='admin'
-- or verified=true themselves. The trigger runs as security definer and
-- bypasses RLS entirely, so it doesn't need a policy to do its job.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('potential','professional','moderator','admin')),
  full_name text,
  verified boolean not null default false,
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "own read" on profiles for select using (auth.uid() = id);
create policy "admin read" on profiles for select
  using (auth.jwt() ->> 'email' = 'qalib.akhmedov@gmail.com');
create policy "admin update" on profiles for update
  using (auth.jwt() ->> 'email' = 'qalib.akhmedov@gmail.com');
-- admin update covers manually flipping `verified` for professional
-- accounts via the Table Editor until a real verification queue UI
-- exists (see this repo's README, "Known, accepted tradeoffs").

-- ============================================================
-- potential_profiles / professional_profiles
-- ============================================================
-- Same shape of reasoning for both: rows are created only by the
-- trigger (security definer, bypasses RLS) — no INSERT policy on
-- purpose. Read is own-row + admin only; no self-edit UI yet.
--
-- potential_profiles merges the original potential_ba_profiles and
-- junior_ba_profiles shapes (both legacy roles map to `potential` —
-- DECISIONS.md Qərar 1): every column is optional, populated by
-- whichever registration form the user actually filled in.
create table if not exists potential_profiles (
  id uuid primary key references profiles(id) on delete cascade,
  current_occupation text,
  motivation text,
  timeline text,
  education_level text,
  experience_months int,
  interests text
);
alter table potential_profiles enable row level security;
create policy "own read" on potential_profiles for select using (auth.uid() = id);
create policy "admin read" on potential_profiles for select
  using (auth.jwt() ->> 'email' = 'qalib.akhmedov@gmail.com');

create table if not exists professional_profiles (
  id uuid primary key references profiles(id) on delete cascade,
  current_title text,
  years_experience int,
  industry text,
  linkedin_url text
);
alter table professional_profiles enable row level security;
create policy "own read" on professional_profiles for select using (auth.uid() = id);
create policy "admin read" on professional_profiles for select
  using (auth.jwt() ->> 'email' = 'qalib.akhmedov@gmail.com');

-- ============================================================
-- handle_new_user() — populates profiles + the one matching role-detail
-- table whenever a new auth.users row is created.
-- ============================================================
-- Registration forms pass role + role-specific fields as signUp()
-- metadata (auth.users.raw_user_meta_data), not as a separate insert
-- after signup, so a closed tab mid-registration can never leave an
-- orphaned auth.users row with no profile.
--
-- SECURITY: chosen_role is whitelisted to exactly the two self-serve
-- roles, unconditionally — never trust raw_user_meta_data->>'role'
-- directly. A user can call Supabase's public signUp() API directly
-- (the anon key is public by design) with arbitrary metadata, including
-- role:"admin". Restricting the UI to 2 choices only stops the UI path;
-- this whitelist is what actually closes the escalation path, regardless
-- of how signUp() was called. admin/moderator are never self-serve —
-- assigned only via the Table Editor.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta jsonb := new.raw_user_meta_data;
  chosen_role text := case
    when meta->>'role' in ('potential','professional') then meta->>'role'
    else 'potential'
  end;
  is_verified boolean := (chosen_role <> 'professional');
begin
  insert into public.profiles (id, email, role, full_name, verified, created_at)
  values (new.id, new.email, chosen_role, meta->>'full_name', is_verified, now());

  if chosen_role = 'potential' then
    insert into public.potential_profiles (
      id, current_occupation, motivation, timeline,
      education_level, experience_months, interests
    )
    values (
      new.id,
      meta->>'current_occupation', meta->>'motivation', meta->>'timeline',
      meta->>'education_level', nullif(meta->>'experience_months', '')::int, meta->>'interests'
    );
  elsif chosen_role = 'professional' then
    insert into public.professional_profiles (
      id, current_title, years_experience, industry, linkedin_url
    )
    values (
      new.id,
      meta->>'current_title', nullif(meta->>'years_experience', '')::int,
      meta->>'industry', meta->>'linkedin_url'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- test_questions — the career-test question bank (seeded via SQL,
-- no CRUD UI in Phase 1 — see seed-test-questions.sql)
-- ============================================================
-- SELECT is restricted to authenticated users, not fully public: the
-- test is meant to be "gated" behind registration, and this enforces
-- that at the database level too, not just via proxy.ts.
create table if not exists test_questions (
  id int generated always as identity primary key,
  category text not null check (category in ('analytical','communication','tooling')),
  question_text text not null,
  options jsonb not null,   -- [{ "text": "...", "score": 0-3 }, ...]
  order_index int not null,
  active boolean not null default true
);
alter table test_questions enable row level security;
create policy "authenticated read" on test_questions for select
  using (auth.role() = 'authenticated');

-- ============================================================
-- test_attempts — one row per test taken. Client may only ever create
-- an attempt and write `answers` — never the score fields directly.
-- ============================================================
create table if not exists test_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  started_at timestamptz default now(),
  completed_at timestamptz,
  answers jsonb,             -- { "<question_id>": <chosen option index>, ... }
  category_scores jsonb,     -- { "analytical": 0-100, "communication": 0-100, "tooling": 0-100 }
  overall_score int,         -- 0-100
  report_band text           -- 'early' | 'promising' | 'strong'
);
alter table test_attempts enable row level security;
create policy "own read" on test_attempts for select using (auth.uid() = user_id);
create policy "own insert" on test_attempts for insert with check (auth.uid() = user_id);
create policy "own update answers" on test_attempts for update using (auth.uid() = user_id);
-- No column-level restriction exists in Postgres RLS (policies are
-- row-level, not column-level) — a user COULD attempt to UPDATE
-- overall_score directly via the REST API on their own row. The actual
-- protection is that the app's client code never writes those columns;
-- score_test_attempt() below is the only path that ever computes and
-- writes them, and it independently reads real answers to do so. See
-- README for why a column-level lockdown wasn't layered on top of this.
create policy "admin read" on test_attempts for select
  using (auth.jwt() ->> 'email' = 'qalib.akhmedov@gmail.com');

-- ============================================================
-- score_test_attempt(p_attempt_id) — computes and writes the score
-- server-side. The client writes ONLY `answers`; it never computes or
-- submits a score value, so there is nothing for a tampered request to
-- overwrite even though Postgres RLS can't restrict individual columns.
-- ============================================================
-- Weighted analytical 40% / communication 35% / tooling 25% — tooling is
-- the most teachable dimension (that's what the training program exists
-- to fix), while analytical aptitude and communication style are harder
-- to instill and more predictive of fit. Easy to retune later — this is
-- draft v1, meant to be revisited.
create or replace function public.score_test_attempt(p_attempt_id bigint)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid;
  v_analytical numeric;
  v_communication numeric;
  v_tooling numeric;
  v_overall int;
  v_band text;
begin
  select user_id into v_user_id from test_attempts where id = p_attempt_id;
  if v_user_id is null or v_user_id <> auth.uid() then
    raise exception 'not your attempt';
  end if;

  select
    coalesce(round(100.0 * sum(case when q.category = 'analytical' then (q.options->((a.value)::int)->>'score')::int else 0 end)
      / nullif(sum(case when q.category = 'analytical' then 3 else 0 end), 0), 0),
    coalesce(round(100.0 * sum(case when q.category = 'communication' then (q.options->((a.value)::int)->>'score')::int else 0 end)
      / nullif(sum(case when q.category = 'communication' then 3 else 0 end), 0), 0),
    coalesce(round(100.0 * sum(case when q.category = 'tooling' then (q.options->((a.value)::int)->>'score')::int else 0 end)
      / nullif(sum(case when q.category = 'tooling' then 3 else 0 end), 0), 0)
  into v_analytical, v_communication, v_tooling
  from test_attempts t, jsonb_each(t.answers) a
  join test_questions q on q.id = a.key::int
  where t.id = p_attempt_id;

  v_overall := round(v_analytical * 0.40 + v_communication * 0.35 + v_tooling * 0.25);
  v_band := case
    when v_overall <= 40 then 'early'
    when v_overall <= 70 then 'promising'
    else 'strong'
  end;

  update test_attempts set
    category_scores = jsonb_build_object(
      'analytical', v_analytical,
      'communication', v_communication,
      'tooling', v_tooling
    ),
    overall_score = v_overall,
    report_band = v_band,
    completed_at = now()
  where id = p_attempt_id;
end;
$$;
