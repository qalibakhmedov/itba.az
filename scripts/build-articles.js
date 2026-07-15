#!/usr/bin/env node
/*
 * itba.az — build-time static generator for the article platform.
 *
 * No framework: this is a plain Node script that reads *published* rows
 * from Supabase's REST API (the public anon key — same one already
 * committed in js/site-common.js; reads of published articles are meant
 * to be public) and writes real static HTML into articles/, so article
 * pages are crawlable/shareable without a live server. Runs on a
 * schedule via .github/workflows/build-articles.yml; also safe to run
 * locally — it only ever reads `status=eq.published` rows.
 *
 * This is the enforced sanitization boundary for what actually ends up
 * baked into permanently public pages — see README for the full
 * Trix (editor) -> DOMPurify (client, defense in depth) -> sanitize-html
 * (here, the real boundary) chain.
 */
const fs = require("fs");
const path = require("path");
const sanitizeHtml = require("sanitize-html");

const SUPABASE_URL = "https://ndsdnsntpqbyktjrcjtq.supabase.co";
const SUPABASE_KEY = "sb_publishable_5Hv23JPUmQEIZXHyygkkUg_tWU7SuET";
const SITE_URL = "https://itba.az";
const ROOT = path.join(__dirname, "..");

const CATEGORY_LABEL = {
  ai: "Süni İntellekt (AI)",
  tools: "IT BA Alətləri",
  case_studies: "Praktik Keys / Real Hadisələr",
  news: "Sənaye Xəbərləri",
};
const CATEGORIES = Object.keys(CATEGORY_LABEL);

const SANITIZE_OPTIONS = {
  allowedTags: ["h1", "h2", "h3", "h4", "p", "br", "strong", "b", "em", "i", "u", "a", "ul", "ol", "li", "blockquote", "pre", "code", "div"],
  allowedAttributes: { a: ["href", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
  },
};

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("az-AZ", { year: "numeric", month: "long", day: "numeric" });
}

async function fetchPublishedArticles() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/articles?status=eq.published&select=*,author:profiles(full_name)&order=published_at.desc`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  if (!res.ok) throw new Error(`Supabase fetch failed: ${res.status} ${await res.text()}`);
  return res.json();
}

function layout({ title, description, canonical, ogImage, jsonLd, content }) {
  return `<!DOCTYPE html>
<html lang="az">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description || "")}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description || "")}">
<meta property="og:url" content="${canonical}">
${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">\n` : ""}<meta name="twitter:card" content="${ogImage ? "summary_large_image" : "summary"}">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description || "")}">
<link rel="stylesheet" href="/css/site.css">
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n` : ""}</head>
<body>
<div class="animated-bg"><canvas id="particle-bg" aria-hidden="true"></canvas></div>
<header>
  <div class="container">
    <div class="header-content">
      <a href="/" class="logo-link">
        <div class="logo-section">
          <div class="logo-mark">BA</div>
          <div class="logo-text"><h1>itba.az</h1><p>Məqalələr</p></div>
        </div>
      </a>
      <nav aria-label="Primary">
        <a href="/articles/">Məqalələr</a>
        <a href="/courses/">Kurslar</a>
        <a href="/academy/">Akademiya</a>
      </nav>
      <div class="header-buttons">
        <a href="/community/login.html" class="btn btn-ghost">Daxil ol</a>
      </div>
    </div>
  </div>
</header>
${content}
<footer>
  <div class="container">
    <p>© 2025 itba.az – IT Business Analysis Academy</p>
    <div style="margin-top: 10px;">
      <a href="/">Ana səhifə</a>
      <a href="/articles/">Məqalələr</a>
      <a href="/courses/">Kurslar</a>
      <a href="/academy/">Akademiya</a>
    </div>
  </div>
</footer>
<script src="/js/particle-bg.js"></script>
</body>
</html>
`;
}

function categoryPillsHtml(activeCategory) {
  const all = `<a href="/articles/" class="cat-pill${!activeCategory ? " active" : ""}">Hamısı</a>`;
  const rest = CATEGORIES.map(
    (cat) => `<a href="/articles/category/${cat}/" class="cat-pill${activeCategory === cat ? " active" : ""}">${esc(CATEGORY_LABEL[cat])}</a>`
  ).join("\n      ");
  return `${all}\n      ${rest}`;
}

function articleCardHtml(a) {
  return `<a class="card article-card" href="/articles/${a.slug}/">
  <span class="card-label">${esc(CATEGORY_LABEL[a.category] || a.category)}</span>
  <h3>${esc(a.title)}</h3>
  <p>${esc(a.dek || "")}</p>
  <div class="card-info">${a.reading_time_minutes ? a.reading_time_minutes + " dəq oxu • " : ""}${formatDate(a.published_at)}</div>
</a>`;
}

function feedPage({ activeCategory, articles }) {
  const title = activeCategory
    ? `${CATEGORY_LABEL[activeCategory]} — itba.az Məqalələr`
    : "Məqalələr — itba.az";
  const description = activeCategory
    ? `itba.az icması tərəfindən yazılmış "${CATEGORY_LABEL[activeCategory]}" kateqoriyasında məqalələr.`
    : "IT Biznes Analitikası üzrə icma tərəfindən yazılmış məqalələr: AI, alətlər, praktik keyslər və sənaye xəbərləri.";
  const canonical = activeCategory ? `${SITE_URL}/articles/category/${activeCategory}/` : `${SITE_URL}/articles/`;

  const content = `<section class="content-page">
  <div class="container">
    <span class="badge">Məqalələr</span>
    <h2 class="section-title" style="text-align:left;font-size:34px;margin-bottom:20px">${esc(activeCategory ? CATEGORY_LABEL[activeCategory] : "Bütün məqalələr")}</h2>
    <div class="category-pills">
      ${categoryPillsHtml(activeCategory)}
    </div>
    <input type="search" id="articleSearch" class="article-search" placeholder="Məqalələr arasında axtar…" aria-label="Məqalələr arasında axtar">
    <div class="article-grid" id="articleGrid">
      ${articles.length ? articles.map(articleCardHtml).join("\n      ") : '<p class="subhead">Bu kateqoriyada hələ məqalə yoxdur.</p>'}
    </div>
  </div>
</section>
<script>
(function () {
  var input = document.getElementById("articleSearch");
  var cards = Array.prototype.slice.call(document.querySelectorAll("#articleGrid .article-card"));
  input.addEventListener("input", function () {
    var q = input.value.trim().toLowerCase();
    cards.forEach(function (card) {
      var text = card.textContent.toLowerCase();
      card.style.display = !q || text.indexOf(q) !== -1 ? "" : "none";
    });
  });
})();
</script>`;

  return layout({ title, description, canonical, content });
}

function articlePage(a) {
  const canonical = `${SITE_URL}/articles/${a.slug}/`;
  const authorName = (a.author && a.author.full_name) || "itba.az icması";
  const safeBody = sanitizeHtml(a.body_html || "", SANITIZE_OPTIONS);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.dek || undefined,
    author: { "@type": "Person", name: authorName },
    datePublished: a.published_at || undefined,
    dateModified: a.updated_at || undefined,
    image: a.cover_image_url || undefined,
  };

  const content = `<article class="content-page article-detail">
  <div class="container" style="max-width:760px">
    <span class="badge">${esc(CATEGORY_LABEL[a.category] || a.category)}</span>
    <h1>${esc(a.title)}</h1>
    ${a.dek ? `<p class="subhead">${esc(a.dek)}</p>\n    ` : ""}<div class="article-meta">${esc(authorName)} • ${a.reading_time_minutes ? a.reading_time_minutes + " dəq oxu • " : ""}${formatDate(a.published_at)}</div>
    ${a.cover_image_url ? `<img class="article-cover" src="${esc(a.cover_image_url)}" alt="${esc(a.title)}">\n    ` : ""}<div class="article-body">${safeBody}</div>
    <p style="margin-top:40px"><a href="/articles/" class="btn btn-ghost">← Bütün məqalələr</a></p>
  </div>
</article>`;

  return layout({
    title: `${a.title} — itba.az`,
    description: a.dek || a.title,
    canonical,
    ogImage: a.cover_image_url,
    jsonLd,
    content,
  });
}

function placeholderPage() {
  return layout({
    title: "Məqalələr — itba.az",
    description: "IT Biznes Analitikası üzrə icma tərəfindən yazılmış məqalələr tezliklə burada olacaq.",
    canonical: `${SITE_URL}/articles/`,
    content: `<section class="content-page">
  <div class="container">
    <span class="badge">Məqalələr</span>
    <h2 class="section-title" style="text-align:left;font-size:34px;margin-bottom:20px">Hələ heç bir məqalə dərc olunmayıb</h2>
    <p class="subhead" style="margin:0">İlk məqalələr icma üzvləri tərəfindən yazılıb, admin tərəfindən yoxlanılıb dərc ediləndə burada görünəcək.</p>
  </div>
</section>`,
  });
}

function writeFile(relPath, contents) {
  const abs = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, contents);
}

function buildSitemap(articles) {
  const staticUrls = [
    { loc: `${SITE_URL}/`, changefreq: "weekly", priority: "1.0" },
    { loc: `${SITE_URL}/academy/`, changefreq: "monthly", priority: "0.8" },
    { loc: `${SITE_URL}/courses/`, changefreq: "weekly", priority: "0.8" },
    { loc: `${SITE_URL}/articles/`, changefreq: "daily", priority: "0.9" },
    ...CATEGORIES.map((cat) => ({ loc: `${SITE_URL}/articles/category/${cat}/`, changefreq: "daily", priority: "0.7" })),
    ...articles.map((a) => ({ loc: `${SITE_URL}/articles/${a.slug}/`, changefreq: "monthly", priority: "0.6" })),
  ];
  const body = staticUrls
    .map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

async function main() {
  const articles = await fetchPublishedArticles();

  if (articles.length === 0) {
    writeFile("articles/index.html", placeholderPage());
  } else {
    writeFile("articles/index.html", feedPage({ activeCategory: null, articles }));
  }

  for (const cat of CATEGORIES) {
    const inCategory = articles.filter((a) => a.category === cat);
    writeFile(`articles/category/${cat}/index.html`, feedPage({ activeCategory: cat, articles: inCategory }));
  }

  for (const a of articles) {
    writeFile(`articles/${a.slug}/index.html`, articlePage(a));
  }

  writeFile(
    "articles/index.json",
    JSON.stringify(
      articles.map((a) => ({
        slug: a.slug,
        title: a.title,
        dek: a.dek,
        category: a.category,
        tags: a.tags,
        published_at: a.published_at,
      })),
      null,
      2
    )
  );

  writeFile("sitemap.xml", buildSitemap(articles));

  console.log(`Built ${articles.length} article page(s) across ${CATEGORIES.length} categories.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
