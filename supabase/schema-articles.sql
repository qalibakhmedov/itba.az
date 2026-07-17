-- itba.az — Phase 2: Article / Content Platform
--
-- Run after supabase/schema-phase1.sql (needs `profiles`) and
-- supabase/schema-rbac.sql (needs `is_admin()`).
--
-- Core guarantee: publishing can never be self-granted. `body_html` is
-- untrusted rich-text-editor output (see README) — the client only ever
-- writes it into draft/pending_review rows; only an admin's own UPDATE
-- (gated by is_admin()) can move a row to 'published' or 'rejected'.
create table if not exists articles (
  id bigint generated always as identity primary key,
  slug text unique not null,
  title text not null,
  dek text,
  body_html text not null,
  category text not null check (category in ('ai','tools','case_studies','news')),
  tags text[] not null default '{}',
  author_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','pending_review','published','rejected')),
  rejection_note text,
  cover_image_url text,
  reading_time_minutes int,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table articles enable row level security;

create policy "public read published" on articles for select using (status = 'published');
create policy "own read" on articles for select using (auth.uid() = author_id);
create policy "admin read" on articles for select using (is_admin());

-- INSERT: only verified professional authors, and only ever as a
-- draft — nothing can be inserted pre-published.
create policy "author insert" on articles for insert
  with check (
    auth.uid() = author_id and status = 'draft'
    and exists (select 1 from profiles where id = auth.uid() and role = 'professional' and verified = true)
  );

-- UPDATE (own): `using` covers the OLD row (author may touch their own
-- draft/pending/rejected rows — rejected is included so they can revise
-- and resubmit), `with check` re-validates the NEW row and only allows
-- it to land back in draft or pending_review. This is what actually
-- makes self-publishing impossible: even a hand-crafted REST call
-- setting status='published' fails the with-check, regardless of what
-- the UI ever exposes.
create policy "author update" on articles for update
  using (auth.uid() = author_id and status in ('draft','pending_review','rejected'))
  with check (auth.uid() = author_id and status in ('draft','pending_review'));

create policy "author delete draft" on articles for delete
  using (auth.uid() = author_id and status = 'draft');

create policy "admin update" on articles for update using (is_admin());
create policy "admin delete" on articles for delete using (is_admin());

-- Keeps published_at (and updated_at) correct regardless of whether
-- admin.html's client code remembers to set them — same instinct as
-- score_test_attempt(): don't trust the client to compute what the
-- database can compute itself.
create or replace function public.set_article_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' and old.status is distinct from 'published' then
    new.published_at := now();
  end if;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists on_article_update on articles;
create trigger on_article_update before update on articles
  for each row execute procedure public.set_article_published_at();
