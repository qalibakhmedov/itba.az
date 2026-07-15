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
| `sitemap.xml` | **Generated**, not hand-edited — `scripts/build-articles.js` rewrites it every run (see "Article platform" below). `robots.txt` (still hand-maintained) points at it and disallows crawling `community/*.html`. |
| `articles/` | The article platform's public output — entirely **generated** by `scripts/build-articles.js`, committed to the repo so GitHub Pages can serve it as plain static files. Don't hand-edit anything under here; it's overwritten on the next build. |
| `community/write-article.html`, `community/my-articles.html` | Author-facing pages, gated to verified `ba_professional` accounts (same `requireSession()` pattern as the rest of `community/`) — write/edit a draft, submit for review, see your own articles' status. |
| `courses/index.html` | Course directory — admin-curated catalog of IT BA courses on the Azerbaijani market (ours and others). Static shell for its own SEO; the list and filters (format/level/language/search) are client-rendered against Supabase, same pattern as the rest of the public site's live data (no per-course pages, no build step needed here — see "Course directory" below). |

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

## Article platform (Phase 2)

A blog-style platform — four categories (AI, IT BA Tools, Practical Case
Studies / Real Events, Industry News), written by **verified**
`ba_professional` accounts, gated behind **mandatory admin review**
before anything reaches the public site. That guarantee is enforced by
`supabase/schema-articles.sql`'s RLS policies, not just hidden by the
UI — an author's own `UPDATE`/`INSERT` policies only ever allow a row to
land in `draft` or `pending_review`; only an admin's `is_admin()`-gated
policy can move a row to `published` or `rejected`. See that file's
comments for the exact mechanics.

Since this is still a fully static, serverless site (see above), article
pages can't be server-rendered — instead, `scripts/build-articles.js` is
a small Node script that reads *published* articles from Supabase's REST
API and writes real static HTML into `articles/` (a full feed, one page
per category, one page per article, a search manifest, and — since it
now needs to include per-article URLs — `sitemap.xml` too). It has no
dependency besides `sanitize-html` (see below), runs via
`.github/workflows/build-articles.yml` on a 15-minute schedule and on
manual `workflow_dispatch`, and commits its output only when it actually
changes. Run it locally with `npm ci && npm run build:articles`.

**Content is untrusted rich HTML, not Markdown — sanitize accordingly.**
Authors write in a [Trix](https://trix-editor.org/) editor (loaded from
a CDN, same pattern as `supabase-js`), which stores real HTML in
`articles.body_html`. Since the anon key is public by design, a crafted
direct API call could write anything into that column regardless of
what the editor itself would ever produce — so it's sanitized twice, not
once: [DOMPurify](https://github.com/cure53/DOMPurify) (CDN) on the
client wherever article HTML is rendered before publication (critically,
in `admin.html`'s Moderation tab — an admin's real session reviewing a
pending article is the highest-value target for a stored-XSS payload),
and [`sanitize-html`](https://www.npmjs.com/package/sanitize-html) (npm,
build-time only) in `scripts/build-articles.js` with an explicit tag/
attribute allowlist — this second pass is the actual enforced boundary
for what ends up in a permanently public page. Neither sanitizer is
hand-rolled; regex-based HTML sanitization is a known anti-pattern.

`admin.html`'s **Moderation** tab lists pending/published/rejected
articles (same dropdown-filter idiom as `exam.html`'s question
selector) with approve/reject actions — like the Wording tab, these go
through `sbAuth.from(...)` (not raw `fetch`) so the request carries the
admin's session token, which `is_admin()` checks.

## Course directory (Phase 3)

An admin-curated catalog of IT BA courses on the Azerbaijani market —
itba.az's own program plus other providers. Unlike articles, there's no
author/review workflow here: admin is the only writer (same trust model
as `admin_wordings`), managed from `admin.html`'s **Kurslar** tab. Unlike
articles, there's also no build-time static generation — `courses/
index.html` is a static shell (for its own SEO) that fetches active
courses client-side with the public anon key and filters them entirely
in the browser (format/level/language/search), the same pattern
`index.html`'s latest-articles teaser already uses. No per-course pages;
most rows just link out to the provider's own site via `url`.

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
   across `schema.sql`/`schema-phase1.sql`. Run this before step 4 — it
   depends on `profiles` from step 1, and requires the admin account's
   `profiles` row to already have `role = 'admin'`.
4. `supabase/schema-articles.sql` — the `articles` table + the RLS
   policies that make admin review actually mandatory (not just a UI
   convention). Depends on `profiles` (step 1) and `is_admin()` (step 3).
5. `supabase/schema-courses.sql` — the `courses` table. Simpler trust
   model than articles (admin is the only writer). Depends on
   `is_admin()` (step 3).

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
- `community/`'s `ba_professional` role still has no admin-verification
  *UI* — flip `verified` manually via the Table Editor. This now
  actually gates something real (Phase 2's article-writing access, via
  `articles`' `author insert` RLS policy), so it's a more consequential
  manual step than when this tradeoff was first written — a proper
  verification queue is a reasonable fast-follow if manual flipping
  becomes a real bottleneck, not bundled into Phase 2's scope.
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
