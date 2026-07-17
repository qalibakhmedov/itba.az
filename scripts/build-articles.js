#!/usr/bin/env node
/*
 * itba.az — build-time static generator for the article platform, in 3
 * languages (az/en/ru).
 *
 * No framework: this is a plain Node script that reads *published* rows
 * from Supabase's REST API (the public anon key — same one already
 * committed in js/site-common.js; reads of published articles are meant
 * to be public) and writes real static HTML into articles/ (and en/articles/,
 * ru/articles/), so article pages are crawlable/shareable without a live
 * server. Runs on a schedule via .github/workflows/build-articles.yml;
 * also safe to run locally — it only ever reads `status=eq.published` rows.
 *
 * Article BODY content is NOT translated — it's whatever language the
 * author wrote it in. Only the surrounding chrome (nav, footer, category
 * names, search, empty states) is localized per language variant.
 *
 * This is the enforced sanitization boundary for what actually ends up
 * baked into permanently public pages — see README for the full
 * Trix (editor) -> DOMPurify (client, defense in depth) -> sanitize-html
 * (here, the real boundary) chain.
 */
const fs = require("fs");
const path = require("path");
const sanitizeHtml = require("sanitize-html");
const shell = require("./lib/shell");
const i18n = { az: require("../i18n/az"), en: require("../i18n/en"), ru: require("../i18n/ru") };

const SUPABASE_URL = "https://ndsdnsntpqbyktjrcjtq.supabase.co";
const SUPABASE_KEY = "sb_publishable_5Hv23JPUmQEIZXHyygkkUg_tWU7SuET";
const ROOT = path.join(__dirname, "..");
const { SITE_URL, LANGS, esc, urlFor, renderHeader, renderFooter, page } = shell;

const CATEGORIES = Object.keys(i18n.az.articles.categoryLabel);

const SANITIZE_OPTIONS = {
  allowedTags: ["h1", "h2", "h3", "h4", "p", "br", "strong", "b", "em", "i", "u", "a", "ul", "ol", "li", "blockquote", "pre", "code", "div"],
  allowedAttributes: { a: ["href", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
  },
};

function formatDate(iso, lang) {
  if (!iso) return "";
  const locale = { az: "az-AZ", en: "en-US", ru: "ru-RU" }[lang];
  const d = new Date(iso);
  return d.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });
}

async function fetchPublishedArticles() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/articles?status=eq.published&select=*,author:profiles(full_name)&order=published_at.desc`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  if (!res.ok) throw new Error(`Supabase fetch failed: ${res.status} ${await res.text()}`);
  return res.json();
}

function chromeHeader(lang) {
  const c = i18n[lang].common;
  const ar = i18n[lang].articles;
  return renderHeader({
    lang,
    pathPart: "articles/",
    brand: c.brand,
    logoTagline: ar.logoTagline,
    navLinks: [
      { href: urlFor(lang, "articles/"), label: c.navArticles },
      { href: urlFor(lang, "courses/"), label: c.navCourses },
      { href: urlFor(lang, "academy/"), label: c.navAcademy },
    ],
    headerButtons: [{ href: "/community/login.html", cls: "btn-ghost", label: c.navLogin }],
  });
}

function chromeFooter(lang) {
  const c = i18n[lang].common;
  return renderFooter({
    common: c,
    footerLinks: [
      { href: urlFor(lang, ""), label: c.navHome },
      { href: urlFor(lang, "articles/"), label: c.navArticles },
      { href: urlFor(lang, "courses/"), label: c.navCourses },
      { href: urlFor(lang, "academy/"), label: c.navAcademy },
    ],
  });
}

function categoryPillsHtml(lang, activeCategory) {
  const ar = i18n[lang].articles;
  const all = `<a href="${urlFor(lang, "articles/")}" class="cat-pill${!activeCategory ? " active" : ""}">${esc(ar.allPill)}</a>`;
  const rest = CATEGORIES.map(
    (cat) => `<a href="${urlFor(lang, `articles/category/${cat}/`)}" class="cat-pill${activeCategory === cat ? " active" : ""}">${esc(ar.categoryLabel[cat])}</a>`
  ).join("\n      ");
  return `${all}\n      ${rest}`;
}

function articleCardHtml(lang, a) {
  const ar = i18n[lang].articles;
  return `<a class="card article-card" href="${urlFor(lang, `articles/${a.slug}/`)}">
  <span class="card-label">${esc(ar.categoryLabel[a.category] || a.category)}</span>
  <h3>${esc(a.title)}</h3>
  <p>${esc(a.dek || "")}</p>
  <div class="card-info">${a.reading_time_minutes ? a.reading_time_minutes + " " + esc(ar.readingTimeSuffix) + " • " : ""}${formatDate(a.published_at, lang)}</div>
</a>`;
}

function feedPage(lang, { activeCategory, articles }) {
  const ar = i18n[lang].articles;
  const catLabel = activeCategory ? ar.categoryLabel[activeCategory] : null;
  const title = activeCategory ? ar.feedTitleCategory(catLabel) : ar.feedTitleAll;
  const description = activeCategory ? ar.feedDescriptionCategory(catLabel) : ar.feedDescriptionAll;
  const pathPart = activeCategory ? `articles/category/${activeCategory}/` : "articles/";
  const canonical = `${SITE_URL}${urlFor(lang, pathPart)}`;

  const content = `<section class="content-page">
  <div class="container">
    <span class="badge">${esc(ar.badge)}</span>
    <h2 class="section-title-left">${esc(activeCategory ? catLabel : ar.allTitle)}</h2>
    <div class="category-pills">
      ${categoryPillsHtml(lang, activeCategory)}
    </div>
    <input type="search" id="articleSearch" class="article-search" placeholder="${esc(ar.searchPlaceholder)}" aria-label="${esc(ar.searchPlaceholder)}">
    <p id="articleResultsCount" class="subhead" style="display:none;margin-bottom:16px" aria-live="polite"></p>
    <div class="article-grid" id="articleGrid">
      ${articles.length ? articles.map((a) => articleCardHtml(lang, a)).join("\n      ") : `<p class="state-note" role="status">${esc(ar.emptyCategoryText)}</p>`}
    </div>
  </div>
</section>
<script>
(function () {
  var input = document.getElementById("articleSearch");
  var countEl = document.getElementById("articleResultsCount");
  var cards = Array.prototype.slice.call(document.querySelectorAll("#articleGrid .article-card"));
  if (!cards.length) return;
  var suffix = ${JSON.stringify(ar.resultsCountSuffix)};
  function updateCount() {
    var visible = cards.filter(function (c) { return c.style.display !== "none"; }).length;
    countEl.style.display = "block";
    countEl.textContent = visible + " / " + cards.length + " " + suffix;
  }
  input.addEventListener("input", function () {
    var q = input.value.trim().toLowerCase();
    cards.forEach(function (card) {
      var text = card.textContent.toLowerCase();
      card.style.display = !q || text.indexOf(q) !== -1 ? "" : "none";
    });
    updateCount();
  });
  updateCount();
})();
</script>`;

  return page({ lang, title, description, canonical, pathPart, header: chromeHeader(lang), content, footer: chromeFooter(lang), theme: "spec" });
}

function articlePage(lang, a) {
  const ar = i18n[lang].articles;
  const pathPart = `articles/${a.slug}/`;
  const canonical = `${SITE_URL}${urlFor(lang, pathPart)}`;
  const authorName = (a.author && a.author.full_name) || ar.byAuthorFallback;
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
    <span class="badge">${esc(ar.categoryLabel[a.category] || a.category)}</span>
    <h1>${esc(a.title)}</h1>
    ${a.dek ? `<p class="subhead">${esc(a.dek)}</p>\n    ` : ""}<div class="article-meta">${esc(authorName)} • ${a.reading_time_minutes ? a.reading_time_minutes + " " + esc(ar.readingTimeSuffix) + " • " : ""}${formatDate(a.published_at, lang)}</div>
    ${a.cover_image_url ? `<img class="article-cover" src="${esc(a.cover_image_url)}" alt="${esc(a.title)}">\n    ` : ""}<div class="article-body">${safeBody}</div>
    <p style="margin-top:40px"><a href="${urlFor(lang, "articles/")}" class="btn btn-ghost">${esc(ar.backToArticles)}</a></p>
  </div>
</article>`;

  return page({
    lang,
    title: `${a.title}${ar.articleTitleSuffix}`,
    description: a.dek || a.title,
    canonical,
    pathPart,
    ogImage: a.cover_image_url,
    jsonLd,
    header: chromeHeader(lang),
    content,
    footer: chromeFooter(lang),
    type: "article",
    theme: "spec",
  });
}

function placeholderPage(lang) {
  const ar = i18n[lang].articles;
  const pathPart = "articles/";
  const content = `<section class="content-page">
  <div class="container">
    <span class="badge">${esc(ar.badge)}</span>
    <h2 class="section-title-left">${esc(ar.noArticlesYetTitle)}</h2>
    <p class="state-note" role="status">${esc(ar.noArticlesYetText)}</p>
  </div>
</section>`;
  return page({
    lang,
    title: ar.feedTitleAll,
    description: ar.placeholderDescription,
    canonical: `${SITE_URL}${urlFor(lang, pathPart)}`,
    pathPart,
    header: chromeHeader(lang),
    content,
    footer: chromeFooter(lang),
    theme: "spec",
  });
}

function writeFile(relPath, contents) {
  const abs = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, contents);
}

function buildSitemap(articles) {
  const staticPaths = ["", "academy/", "courses/", "articles/", ...CATEGORIES.map((cat) => `articles/category/${cat}/`), ...articles.map((a) => `articles/${a.slug}/`)];
  const urls = [];
  for (const p of staticPaths) {
    for (const lang of LANGS) {
      urls.push({ loc: `${SITE_URL}${urlFor(lang, p)}`, changefreq: p.startsWith("articles/") ? "daily" : "weekly", priority: p === "" ? "1.0" : "0.7" });
    }
  }
  const body = urls
    .map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

async function main() {
  const articles = await fetchPublishedArticles();

  for (const lang of LANGS) {
    const prefix = lang === "az" ? "" : `${lang}/`;

    if (articles.length === 0) {
      writeFile(`${prefix}articles/index.html`, placeholderPage(lang));
    } else {
      writeFile(`${prefix}articles/index.html`, feedPage(lang, { activeCategory: null, articles }));
    }

    for (const cat of CATEGORIES) {
      const inCategory = articles.filter((a) => a.category === cat);
      writeFile(`${prefix}articles/category/${cat}/index.html`, feedPage(lang, { activeCategory: cat, articles: inCategory }));
    }

    for (const a of articles) {
      writeFile(`${prefix}articles/${a.slug}/index.html`, articlePage(lang, a));
    }
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

  console.log(`Built ${articles.length} article page(s) across ${CATEGORIES.length} categories × ${LANGS.length} languages.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
