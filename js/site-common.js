/*
 * Shared config and helpers for index.html, exam.html, and admin.html.
 * Loaded via <script src="js/site-common.js"> — classic script, no build step,
 * so everything here lands on window and is used directly by each page's inline script.
 *
 * SUPABASE_KEY is the Supabase "publishable" (anon) key — it is meant to be
 * public and ships in every page's source. Real access control lives in the
 * database's row-level security policies (see supabase/schema.sql), not in
 * this key.
 */
const SUPABASE_URL = "https://ndsdnsntpqbyktjrcjtq.supabase.co";
const SUPABASE_KEY = "sb_publishable_5Hv23JPUmQEIZXHyygkkUg_tWU7SuET";
const SB_HEADERS = { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY, "Content-Type": "application/json" };

function esc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

function getVisitorId() {
  try {
    let id = localStorage.getItem("itba_visitor_id");
    if (!id) {
      id = "v_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
      localStorage.setItem("itba_visitor_id", id);
    }
    return id;
  } catch (e) {
    return "anon";
  }
}

/** Fire-and-forget page-visit log. `page` is a short label ("index", "exam"). */
function trackVisit(page) {
  fetch(SUPABASE_URL + "/rest/v1/page_visits", {
    method: "POST",
    cache: "no-store",
    headers: Object.assign({}, SB_HEADERS, { "Prefer": "return=minimal" }),
    body: JSON.stringify([{ page, visitor_id: getVisitorId(), referrer: document.referrer || null }])
  }).catch(() => {});
}
