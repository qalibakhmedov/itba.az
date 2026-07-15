#!/usr/bin/env node
/*
 * itba.az — dev-only test data seeder. NOT part of the build pipeline,
 * NOT run in CI, NOT something to schedule. Run this yourself, once,
 * against your own Supabase project, whenever you want a fresh set of
 * test accounts + sample content to click through the app with.
 *
 * Requires the service_role key (bypasses RLS entirely — this is the
 * one place in this project that's expected/needed, since we're
 * deliberately creating accounts and roles a normal signup can't reach,
 * e.g. admin/teacher/enrolled_student). NEVER commit this key, never
 * put it in a GitHub Actions secret for this script, never paste it
 * into chat — set it as a local env var only:
 *
 *   SUPABASE_SERVICE_ROLE_KEY="..." node scripts/seed-dev-data.js
 *
 * Get the key from Supabase dashboard -> Project Settings -> API ->
 * service_role (the *secret* one, not the publishable/anon key already
 * committed in js/site-common.js).
 *
 * All six test accounts use Gmail "+" aliasing so they all land in the
 * same real inbox (qalib.akhmedov@gmail.com) while being distinct,
 * valid, unique addresses as far as Supabase Auth is concerned -- you
 * cannot register multiple accounts under the literal same email.
 */
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://ndsdnsntpqbyktjrcjtq.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY env var. See the comment at the top of this file.");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Password per role, as asked: memorable, matches the role name.
const TEST_USERS = [
  {
    key: "admin",
    email: "qalib.akhmedov+admin@gmail.com",
    password: "Admin123!",
    // No role in metadata -- handle_new_user() would default this to
    // potential_ba anyway (admin is never reachable via metadata, by
    // design). We fix the role directly below instead.
    metadata: { full_name: "Admin Test" },
    finalRole: "admin",
  },
  {
    key: "teacher",
    email: "qalib.akhmedov+teacher@gmail.com",
    password: "Teacher123!",
    metadata: { full_name: "Teacher Test" },
    finalRole: "teacher",
  },
  {
    key: "student",
    email: "qalib.akhmedov+student@gmail.com",
    password: "Student123!",
    metadata: { full_name: "Enrolled Student Test" },
    finalRole: "enrolled_student",
  },
  {
    key: "potential",
    email: "qalib.akhmedov+potential@gmail.com",
    password: "Potential123!",
    // These three go through the real whitelist in handle_new_user(),
    // same as a real registration form -- role-detail tables get
    // populated by the trigger, not by this script.
    metadata: {
      role: "potential_ba",
      full_name: "Potential BA Test",
      current_occupation: "Customer support",
      motivation: "Exploring a move into IT Business Analysis.",
      timeline: "within_6_months",
    },
    finalRole: "potential_ba",
  },
  {
    key: "junior",
    email: "qalib.akhmedov+junior@gmail.com",
    password: "Junior123!",
    metadata: {
      role: "junior_ba",
      full_name: "Junior BA Test",
      education_level: "bachelors",
      experience_months: "8",
      interests: "APIs, Agile, data analysis",
    },
    finalRole: "junior_ba",
  },
  {
    key: "article",
    email: "qalib.akhmedov+article@gmail.com",
    password: "Article123!",
    metadata: {
      role: "ba_professional",
      full_name: "IT BA Professional Test",
      current_title: "IT Business Analyst",
      years_experience: "5",
      industry: "Banking",
      linkedin_url: "https://linkedin.com/in/example",
    },
    finalRole: "ba_professional",
  },
];

async function upsertUser(u) {
  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true, // skip the confirmation-email step for test accounts
    user_metadata: u.metadata,
  });

  if (error) {
    if (String(error.message || "").toLowerCase().includes("already")) {
      console.log(`(skip) ${u.email} already exists.`);
      const { data: list } = await admin.auth.admin.listUsers();
      const existing = list.users.find((x) => x.email === u.email);
      return existing ? existing.id : null;
    }
    console.error(`Failed to create ${u.email}:`, error.message);
    return null;
  }
  console.log(`Created ${u.email} (${u.key})`);
  return data.user.id;
}

async function fixUpRole(id, u) {
  if (u.finalRole === "potential_ba" || u.finalRole === "junior_ba" || u.finalRole === "ba_professional") {
    // These already got the right role + detail row from the trigger.
    if (u.finalRole === "ba_professional") {
      // Verified, so this account can actually author/submit articles --
      // real registrations start unverified; this is a deliberate
      // shortcut for a *test* account only.
      await admin.from("profiles").update({ verified: true }).eq("id", id);
    }
    return;
  }
  // admin / teacher / enrolled_student: the trigger defaulted this row
  // to role='potential_ba' and created a stray potential_ba_profiles
  // row (metadata had no whitelisted role, by design). Fix both up.
  await admin.from("profiles").update({ role: u.finalRole }).eq("id", id);
  await admin.from("potential_ba_profiles").delete().eq("id", id);
}

async function seedArticles(authorId) {
  const rows = [
    {
      slug: "requirements-gathering-real-world-case",
      title: "Requirements Gathering: A Real-World Banking Case",
      dek: "How a vague stakeholder request turned into a clear, testable requirement set.",
      body_html: "<p>This is seed content for local testing.</p><h2>Background</h2><p>A walkthrough of a real requirements-gathering exercise from a banking project.</p>",
      category: "case_studies",
      tags: ["requirements", "banking"],
      author_id: authorId,
      status: "published",
      reading_time_minutes: 4,
    },
    {
      slug: "using-ai-tools-in-daily-ba-work",
      title: "Using AI Tools in Daily BA Work",
      dek: "Where AI genuinely speeds up a Business Analyst's day-to-day, and where it doesn't.",
      body_html: "<p>Seed content for local testing.</p><ul><li>Drafting user stories</li><li>Summarizing meeting notes</li><li>Where it still gets things wrong</li></ul>",
      category: "ai",
      tags: ["ai", "productivity"],
      author_id: authorId,
      status: "pending_review",
      reading_time_minutes: 3,
    },
    {
      slug: "jira-vs-azure-devops-for-ba-teams",
      title: "Jira vs Azure DevOps for BA Teams",
      dek: "A practical comparison, not a feature-list dump.",
      body_html: "<p>Seed content for local testing.</p>",
      category: "tools",
      tags: ["jira", "azure-devops"],
      author_id: authorId,
      status: "rejected",
      rejection_note: "Needs more concrete examples before this can publish.",
      reading_time_minutes: 2,
    },
  ];
  for (const row of rows) {
    const { error } = await admin.from("articles").upsert(row, { onConflict: "slug" });
    if (error) console.error(`Article "${row.slug}" failed:`, error.message);
    else console.log(`Article seeded: ${row.title} (${row.status})`);
  }
}

async function seedCourses() {
  const rows = [
    { title: "IT BA Core Program", provider: "itba.az", is_ours: true, price: "Sorğu üzrə", format: "hybrid", level: "beginner", language: "az", url: "https://itba.az/academy/", description: "itba.az's own 6-module core program." },
    { title: "Business Analysis Fundamentals", provider: "Coursera", is_ours: false, price: "Free", format: "online", level: "beginner", language: "en", url: "https://coursera.org", description: "Intro-level MOOC covering BA basics." },
    { title: "Certified Business Analysis Professional Prep", provider: "Local training center", is_ours: false, price: "1200 AZN", format: "offline", level: "advanced", language: "ru", url: "https://example.com", description: "CBAP exam prep, in-person in Baku." },
  ];
  for (const row of rows) {
    const { error } = await admin.from("courses").insert(row);
    if (error) console.error(`Course "${row.title}" failed:`, error.message);
    else console.log(`Course seeded: ${row.title}`);
  }
}

async function main() {
  const ids = {};
  for (const u of TEST_USERS) {
    const id = await upsertUser(u);
    if (!id) continue;
    ids[u.key] = id;
    await fixUpRole(id, u);
  }

  if (ids.article) await seedArticles(ids.article);
  await seedCourses();

  console.log("\nDone. Test logins:");
  for (const u of TEST_USERS) {
    console.log(`  ${u.finalRole.padEnd(16)} ${u.email}  /  ${u.password}`);
  }
  console.log("\nNote: test_questions must already be seeded separately");
  console.log("(supabase/seed-test-questions.sql) for the career test to work.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
