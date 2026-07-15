/*
 * Shared helpers for the community platform pages (community/*.html):
 * registration, login, dashboard, career test. Load order matters:
 *
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
 *   <script src="/js/site-common.js"></script>
 *   <script src="/js/community-common.js"></script>
 *
 * site-common.js supplies SUPABASE_URL/SUPABASE_KEY/esc(); this file
 * creates the actual Auth-capable client (a plain browser client, same
 * as admin.html's sbAuth — no server/SSR involved anywhere in this app).
 */
const sbAuth = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Redirects to login.html (preserving where to return to) if there's no
 * active session. Call at the top of any page that requires login
 * (dashboard, test, test-results). This is a client-side convenience only
 * — the real access boundary is Postgres RLS (see supabase/schema-phase1.sql),
 * exactly like every other page in this project.
 */
async function requireSession() {
  const { data: { session } } = await sbAuth.auth.getSession();
  if (!session) {
    const here = location.pathname.split("/").pop();
    location.href = "login.html?next=" + encodeURIComponent(here);
    return null;
  }
  return session;
}

const ROLE_LABEL = {
  admin: "Admin",
  ba_professional: "IT BA professional",
  potential_ba: "Exploring a career change",
  junior_ba: "Junior BA / student",
  teacher: "Teacher",
  enrolled_student: "Enrolled student",
};
