# itba.az

Site and tooling for itba.az — IT Business Analysis Academy. Static HTML/CSS/JS,
no build step, deployed via GitHub Pages (see `CNAME`). Backend state (exam
progress, applications, analytics) lives in Supabase; there is no server of
this project's own.

## Pages

| File | What it is |
|---|---|
| `index.html` | Community-first home: hero + three teaser cards (career test / academy / corporate training). Redesigned off a single-page brochure — see "Site restructure" below. |
| `academy/index.html` | The academy brochure itself — About/Who/Services/Benefits/Program/FAQ/Apply, migrated close to verbatim from the old `index.html`, including the real "Apply" lead form. |
| `exam.html` | Browser-only Oracle SQL exam simulator over the standard HR schema, backed by [sql.js](https://sql.js.org/) (SQLite compiled to WebAssembly) with a thin Oracle-compatibility layer (`TO_CHAR`, `NVL`, `DECODE`, Julian-day dates, etc.). Includes a teacher panel (client-side passcode) for reviewing student answers. |
| `admin.html` | Site admin dashboard (Supabase Auth email+password login): visit analytics, Apply-form submissions, and an in-panel wording editor covering both `index.html` and `academy/index.html`. |
| `community/` | Phase 1 of the community platform: self-serve registration (career-changer / junior BA / working IT BA roles) and a gated career-compatibility test. Plain HTML/JS, same pattern as the rest of this repo — no framework, no build step (an earlier Next.js/Vercel version of this was built and abandoned in favor of keeping everything on GitHub Pages; see `git log` if curious). Entry point: `community/register.html`. Paths here are intentionally **not** renamed to clean URLs (e.g. `/auth/register/`) yet — doing so means also updating Supabase's Auth redirect allow-list, deferred until it's convenient rather than bundled into the site restructure below. |
| `js/site-common.js` | Supabase config and small helpers (`esc`, visitor-id tracking) shared by every page. |
| `js/community-common.js` | Supabase Auth client + `requireSession()` gate, shared by `community/*.html`. |
| `js/particle-bg.js` | The particle-network background (respects `prefers-reduced-motion`), shared by `index.html`, `academy/index.html`, and `community/*.html`. |
| `css/site.css` | Shared brand styling for `index.html` and `academy/index.html` — two pages needing the identical ~700-line brand block is worse than one shared file (same reasoning as `css/community.css` below, one level up in page count). |
| `css/community.css` | Shared brand styling for `community/*.html` — the one deviation from this repo's per-file-inline-`<style>` convention, justified by page count (9 pages would mean 9x duplication otherwise, worse than the 3x that motivated `js/site-common.js`). |
| `sitemap.xml`, `robots.txt` | List the two indexable public pages (`/`, `/academy/`) and disallow crawling `community/*.html` (those are `noindex` anyway — see below). |

## Site restructure (community platform, Phase 1 of the redesign)

`index.html` used to be the entire site — a single-page brochure with
anchor sections (`#about #who #services #program #faq #apply`). It's now
split: `index.html` is a new community-first home, and everything that
used to live there moved to `academy/index.html` close to verbatim
(content unchanged, English, pending a possible full Azerbaijani rewrite
— tracked below). Old anchor links like `itba.az/#program` are handled by
a small inline redirect script at the top of `index.html`'s `<head>` that
checks `location.hash` against the moved section IDs and forwards to
`academy/index.html` + the same hash — there's no server-side redirect
config on GitHub Pages, so this is the static equivalent.

Both pages, and every "gated" page in `community/`/`exam.html`/
`admin.html`, now carry real SEO/robots metadata: `index.html` and
`academy/index.html` get a `meta description`, OG/Twitter tags, a
canonical link, and one JSON-LD block each (`EducationalOrganization` /
`Course`); everything else gets `<meta name="robots" content="noindex">`
since those pages were never meant to be found by search engines.

## Local development

No build step — just serve the directory and open a page:

```
python3 -m http.server 8934
# then open http://localhost:8934/index.html (or exam.html / admin.html)
```

## Backend (Supabase)

`supabase/schema.sql` is the source of truth for the main site's tables
(exam/admin) and RLS policies — run it top to bottom in the Supabase SQL
Editor to provision a fresh project. It also documents, in comments, *why*
each table's policies are shaped the way they are (which tables are
intentionally public-write, which are admin-only-read, and why).

`community/` (Phase 1 of the community platform) adds its own tables on
top of that same project — run, in order:

1. `supabase/schema-phase1.sql` — `profiles` + role-detail tables, the
   `handle_new_user()` signup trigger (whitelists the client-supplied role
   server-side — closes a privilege-escalation path a raw `signUp()` API
   call could otherwise reach, not just the registration UI), the career
   test tables, and `score_test_attempt()` (computes the score server-side
   so a client can never write a fabricated one).
2. `supabase/seed-test-questions.sql` — the 13 career-test questions
   (draft v1 content, meant to be edited later directly in the database;
   there's no question-editing UI in this phase).
3. `supabase/schema-rbac.sql` — adds an `is_admin()` helper (checks
   `profiles.role = 'admin'` for the calling user) and re-points every
   existing admin-only RLS policy at it instead of the hardcoded
   `auth.jwt() ->> 'email' = 'qalib.akhmedov@gmail.com'` check repeated
   across `schema.sql`/`schema-phase1.sql`. Run this last — it depends on
   `profiles` from step 1, and requires the admin account's `profiles`
   row to already have `role = 'admin'`.

The Supabase URL and publishable (anon) key are intentionally committed in
`js/site-common.js` — this is expected for a client-only app; real access
control lives in the database's row-level security policies, not in that
key. Anything sensitive (student answers, applicant PII, admin wording
overrides) is gated by RLS policies scoped to the specific admin account,
not by the key being secret.

The admin account (`admin.html`) is a normal Supabase Auth user — create it
via the Auth REST API or the Supabase dashboard, not by editing this repo.

## Known, accepted tradeoffs

- `exam_progress` and `exam_emails` are fully open (public read/write) at
  the database level. Neither the student flow (email typed into a gate
  list) nor the teacher flow (a client-side passcode in `exam.html`) has a
  real Supabase Auth identity to scope a policy to. Tightening this would
  mean redesigning student/teacher identity around real accounts — a larger
  change than the practice-exam data currently justifies.
- Public sign-up is enabled on the Supabase project by default (needed so
  the admin account could be created via the API). If it isn't needed for
  anything else, consider disabling it in Authentication → Settings as
  defense in depth.
- `community/`'s `ba_professional` role has no admin-verification *UI* yet
  — registration ships with `verified = false`, but nothing in Phase 1
  actually checks that flag (there's no article-publishing feature yet to
  gate). Flip it manually via the Table Editor once Phase 2 exists.
- `test_attempts`' score columns have no column-level RLS lock (Postgres
  RLS is row-level, not column-level) — the actual protection is that the
  app's client code only ever writes `answers`; `score_test_attempt()` is
  the only path that computes and writes the score, reading real answers
  server-side. Acceptable for a self-assessment quiz with no real stakes.
- `academy/index.html`'s migrated brochure content is still English. The
  new `index.html` home's hero is Azerbaijani (new copy, not a migration
  call), but rewriting the ~40 existing academy strings is a real
  translation project, not bundled into the site restructure — do it
  as its own pass whenever it's prioritized.
