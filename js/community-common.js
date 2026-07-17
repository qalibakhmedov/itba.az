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

/**
 * Faza 1 — identity()/caps() adapter qatı.
 *
 * Faza 1.5-dən (auth foundation) sonra `profiles.role` artıq birbaşa
 * SPEC-in formatındadır (potential/professional/moderator/admin — bax
 * supabase/schema-phase1.sql-də handle_new_user()) — tərcümə lazım deyil,
 * sadəcə `verified`-i flags obyektinə bükür. Ad tarixi səbəbdən qalır
 * (Faza 1-in ilkin, köhnə 6-rollu modeldən adaptasiya edən versiyasından).
 * Digər flag-lar (mentor_enabled və s.) hələ öz sütunlarına malik deyil —
 * defolt olaraq `undefined`/`false` qalır, sonrakı fazalarda əlavə olunacaq.
 */
function mapLegacyRole(role, verified) {
  return { role, flags: { verified: !!verified } };
}

function identity({ role, flags }) {
  if (role === "professional" && flags.mentor_enabled) return "Mentor";
  if (role === "professional" && !flags.verified) return "Professional BA · pending";
  if (role === "professional" && flags.verified) return "Professional BA ✓";
  if (role === "potential" && flags.classroom_enrolled) return "Potential BA · sinifdə";
  if (role === "potential") return "Potential BA";
  if (role === "moderator" || role === "admin") return role;
  return "Qonaq";
}

function caps({ role, flags }) {
  return {
    browse: true,
    comment: true,
    ask: true,
    answer: true,
    download: true, // Q&A/resurs modulları hələ yoxdur — bu bayraqları oxuyan kod yoxdur
    // `role` artıq DB-nin özündə canonical dəyərdir (Faza 1.5), RLS də eyni
    // dəyəri yoxlayır (supabase/schema-articles.sql: role='professional').
    // SPEC-in tam publish matrisi (staff/trusted_author → 'direct') Faza
    // 5-də, trusted_author sütunu DB-yə düşəndə aktivləşəcək.
    publish: (role === "professional" && flags.verified) ? "review" : false,
    mentor: !!flags.mentor_enabled,
    moderate: role === "admin" || role === "moderator", // SPEC §6: staff (moderator/admin)
    admin: role === "admin",
    cls_student: !!flags.classroom_enrolled,
    cls_owner: !!flags.classroom_owner,
    jobs_alert: role === "potential",
  };
}
