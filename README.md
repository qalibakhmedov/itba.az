# itba.az

Site and tooling for itba.az — IT Business Analysis Academy. Static HTML/CSS/JS,
no build step, deployed via GitHub Pages (see `CNAME`). Backend state (exam
progress, applications, analytics) lives in Supabase; there is no server of
this project's own.

## Pages

| File | What it is |
|---|---|
| `index.html`, `en/index.html`, `ru/index.html` | Community-first home in all 3 languages — hero + three teaser cards (career test / academy / corporate training). **Generated**, not hand-written — see "Trilingual support" below. |
| `academy/index.html` (+ `en/academy/`, `ru/academy/`) | The academy brochure — About/Who/Services/Benefits/Program/FAQ/Apply, including the real "Apply" lead form. **Generated**, not hand-written. |
| `exam.html` | Browser-only Oracle SQL exam simulator over the standard HR schema, backed by [sql.js](https://sql.js.org/) (SQLite compiled to WebAssembly) with a thin Oracle-compatibility layer (`TO_CHAR`, `NVL`, `DECODE`, Julian-day dates, etc.). Includes a teacher panel (client-side passcode) for reviewing student answers. Azerbaijani-only by design — internal tool, not part of the trilingual public site. |
| `admin.html` | Site admin dashboard (Supabase Auth email+password login): visit analytics, Apply-form submissions, and an in-panel wording editor covering `index.html`/`academy/index.html` in all 3 languages (AZ/EN/RU pills). Azerbaijani-only UI itself — internal tool. |
| `community/` | Phase 1 of the community platform: self-serve registration (career-changer / junior BA / working IT BA roles) and a gated career-compatibility test. Plain HTML/JS, same pattern as the rest of this repo — no framework, no build step (an earlier Next.js/Vercel version of this was built and abandoned in favor of keeping everything on GitHub Pages; see `git log` if curious). Entry point: `community/register.html`. Paths here are intentionally **not** renamed to clean URLs (e.g. `/auth/register/`) yet — doing so means also updating Supabase's Auth redirect allow-list, deferred until it's convenient rather than bundled into the site restructure below. |
| `js/site-common.js` | Supabase config and small helpers (`esc`, visitor-id tracking) shared by every page. |
| `js/community-common.js` | Supabase Auth client + `requireSession()` gate, shared by `community/*.html`. |
| `js/particle-bg.js` | The particle-network background (respects `prefers-reduced-motion`), shared by `index.html`, `academy/index.html`, and `community/*.html`. |
| `css/site.css` | Shared brand styling for `index.html` and `academy/index.html` — two pages needing the identical ~700-line brand block is worse than one shared file (same reasoning as `css/community.css` below, one level up in page count). |
| `css/community.css` | Shared brand styling for `community/*.html` — the one deviation from this repo's per-file-inline-`<style>` convention, justified by page count (9 pages would mean 9x duplication otherwise, worse than the 3x that motivated `js/site-common.js`). |
| `sitemap.xml` | **Generated**, not hand-edited — `scripts/build-articles.js` rewrites it every run, now listing all 3 language variants of every page (see "Trilingual support" below). `robots.txt` (still hand-maintained) points at it and disallows crawling `community/*.html`. |
| `articles/`, `en/articles/`, `ru/articles/` | The article platform's public output in all 3 languages — entirely **generated** by `scripts/build-articles.js`. Article body content is not translated (whatever language the author wrote); only the chrome (nav, footer, category names, search, empty states) is localized. Don't hand-edit anything under here; it's overwritten on the next build. |
| `community/write-article.html`, `community/my-articles.html` | Author-facing pages, gated to verified `ba_professional` accounts (same `requireSession()` pattern as the rest of `community/`) — write/edit a draft, submit for review, see your own articles' status. Azerbaijani/English UI only (not part of the trilingual public-page scope). |
| `courses/index.html` (+ `en/courses/`, `ru/courses/`) | Course directory in all 3 languages — admin-curated catalog of IT BA courses on the Azerbaijani market (ours and others). **Generated** shell for its own SEO; the list and filters (format/level/language/search) are client-rendered against Supabase (no per-course pages, no build step needed for the data itself). |
| `i18n/az.js`, `i18n/en.js`, `i18n/ru.js` | Translation dictionaries for every chrome/structural string on the public pages (nav, buttons, FAQ, program modules, filters, empty states). `az.js` is the source of truth for Azerbaijani; `en.js`/`ru.js` are draft translations — see "Trilingual support" below for what's draft-quality vs. verbatim-preserved. |
| `scripts/lib/shell.js` | Shared page-shell module (header/footer/hreflang/particle-bg markup) used by both `scripts/build-site.js` and `scripts/build-articles.js`, so this is written once, not duplicated per script. |
| `scripts/build-site.js` | Generates `index.html`, `academy/index.html`, `courses/index.html` (and their `en/`/`ru/` variants) from `i18n/*.js` + `admin_wordings`. |

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
as `admin_wordings`), managed from `admin.html`'s **Kurslar** tab. The
page shell is now generated by `scripts/build-site.js` (for hreflang/SEO
across all 3 languages, see below), but the course *list itself* still
has no build-time generation — it fetches active courses client-side
with the public anon key and filters them entirely in the browser
(format/level/language/search). No per-course pages; most rows just link
out to the provider's own site via `url`.

## Trilingual support (AZ/EN/RU)

`index.html`, `academy/index.html`, `courses/index.html`, and the whole
article platform are generated in 3 languages: `/` (Azerbaijani,
default), `/en/`, `/ru/` — real, separate, crawlable URLs (not a
client-side toggle), so each language variant is genuinely indexable on
its own. Every generated page carries `hreflang` alternates to its two
siblings plus `x-default` → the Azerbaijani version, and its own `lang`
attribute. There's no automatic redirect based on browser language —
Google treats that as an anti-pattern (it interferes with crawling and
can trap users on the wrong version) — the switcher in the header/mobile
nav is a set of plain `<a>` links, so it works with JS disabled.

**Article body content is not translated** — an article shows up
identically on `/articles/<slug>/`, `/en/articles/<slug>/`, and
`/ru/articles/<slug>/`; only the surrounding chrome is localized. Authors
write in whichever language they want; there's no per-article language
tagging yet.

`index.html`, `academy/index.html`, and `courses/index.html` are no
longer hand-edited — they're generated by `scripts/build-site.js` from
`i18n/<lang>.js` (structural/chrome text) merged with
`admin_wordings.wordings.<lang>` (the admin-editable subset — hero
copy, FAQ, etc.), the same way `articles/` has been generated by
`scripts/build-articles.js` since Phase 2. Future copy changes go
through `admin.html`'s Wording tab (now with an AZ/EN/RU pill selector)
or by editing `i18n/*.js` directly for chrome text — not by hand-editing
the HTML files these scripts write.

**A content correction made during this work**: `academy/index.html`'s
copy had actually been written in English the whole time, despite the
rest of the platform being Azerbaijani-first (flagged as a known
inconsistency in an earlier pass, deferred at the time). Building real
3-language support was the natural moment to fix it — `i18n/az.js`'s
academy section is a genuine new Azerbaijani translation, and the
original English text was preserved as-is in `i18n/en.js` rather than
lost.

**Translation quality**: `i18n/az.js` for home/courses/articles is the
original, already-live Azerbaijani copy (unchanged). Everything else —
the new Azerbaijani academy translation, and all of `i18n/en.js`'s
home/courses/articles and `i18n/ru.js` — is a first draft, meant to be
reviewed (ideally by a native speaker) before being treated as final,
publish-ready copy.

`admin_wordings.wordings` changed shape from a flat object
(`{heroTitle: "...", ...}`) to one nested per language (`{az: {...},
en: {...}, ru: {...}}`). Run `supabase/migrate-wordings-per-language.sql`
once (idempotent) to move any existing saved edits into the `az` slot
before the first trilingual build — the merge logic falls back to
`i18n/*.js`'s defaults for any language slot that isn't there yet, so
this doesn't need to happen before the code ships, just before you'd
expect previously-saved Azerbaijani edits to still show up.

## Local development

No build step to *serve* the site — just serve the directory and open a
page:

```
python3 -m http.server 8934
# then open http://localhost:8934/index.html (or exam.html / admin.html)
```

`index.html`/`academy/index.html`/`courses/index.html`/`articles/` are
generated files, though (see "Trilingual support" and "Article platform"
above) — to regenerate them after changing `i18n/*.js` or content in
Supabase:

```
npm ci
npm run build        # runs build:site then build:articles
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
