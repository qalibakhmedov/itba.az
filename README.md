# itba.az

Site and tooling for itba.az — IT Business Analysis Academy. Static HTML/CSS/JS,
no build step, deployed via GitHub Pages (see `CNAME`). Backend state (exam
progress, applications, analytics) lives in Supabase; there is no server of
this project's own.

## Pages

| File | What it is |
|---|---|
| `index.html` | Public marketing site — program info and the "Apply" lead form. |
| `exam.html` | Browser-only Oracle SQL exam simulator over the standard HR schema, backed by [sql.js](https://sql.js.org/) (SQLite compiled to WebAssembly) with a thin Oracle-compatibility layer (`TO_CHAR`, `NVL`, `DECODE`, Julian-day dates, etc.). Includes a teacher panel (client-side passcode) for reviewing student answers. |
| `admin.html` | Site admin dashboard (Supabase Auth email+password login): visit analytics, Apply-form submissions, a development log, and an in-panel wording editor. |
| `js/site-common.js` | Supabase config and small helpers (`esc`, visitor-id tracking) shared by all three pages. |

## Local development

No build step — just serve the directory and open a page:

```
python3 -m http.server 8934
# then open http://localhost:8934/index.html (or exam.html / admin.html)
```

## Backend (Supabase)

`supabase/schema.sql` is the source of truth for every table and RLS policy —
run it top to bottom in the Supabase SQL Editor to provision a fresh project.
It also documents, in comments, *why* each table's policies are shaped the
way they are (which tables are intentionally public-write, which are
admin-only-read, and why).

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
