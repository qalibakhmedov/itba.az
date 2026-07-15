/*
 * itba.az — shared page shell for the trilingual static build.
 * Used by both scripts/build-site.js (home/academy/courses) and
 * scripts/build-articles.js (article platform), so header/footer/
 * hreflang/particle-bg markup is written once, not duplicated per script.
 */
const SITE_URL = "https://itba.az";
const LANGS = ["az", "en", "ru"];

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// pathPart has no leading slash, e.g. "" | "academy/" | "articles/category/ai/"
function urlFor(lang, pathPart) {
  const prefix = lang === "az" ? "" : `${lang}/`;
  return `/${prefix}${pathPart}`;
}

function hreflangTags(pathPart) {
  const alternates = LANGS.map(
    (l) => `<link rel="alternate" hreflang="${l}" href="${SITE_URL}${urlFor(l, pathPart)}">`
  ).join("\n");
  const xDefault = `<link rel="alternate" hreflang="x-default" href="${SITE_URL}${urlFor("az", pathPart)}">`;
  return `${alternates}\n${xDefault}`;
}

function renderLangSwitch(lang, pathPart) {
  return `<div class="lang-switch">${LANGS.map((l) => {
    const cls = l === lang ? "active" : "";
    return `<a href="${urlFor(l, pathPart)}" class="${cls}" hreflang="${l}">${l.toUpperCase()}</a>`;
  }).join("")}</div>`;
}

function renderHeader({ lang, pathPart, brand, logoTagline, navLinks, headerButtons, mobileExtra }) {
  const nav = navLinks.map((n) => `<a href="${n.href}">${esc(n.label)}</a>`).join("\n        ");
  const buttons = headerButtons.map((b) => `<a href="${b.href}" class="btn ${b.cls}">${esc(b.label)}</a>`).join("\n          ");
  const mobileLinks = [...(mobileExtra || []), ...navLinks, ...headerButtons]
    .map((n) => `<a href="${n.href}">${esc(n.label)}</a>`)
    .join("\n        ");
  return `<header>
  <div class="container">
    <div class="header-content">
      <a href="${urlFor(lang, "")}" class="logo-link">
        <div class="logo-section">
          <div class="logo-mark">BA</div>
          <div class="logo-text"><h1>${esc(brand)}</h1><p>${esc(logoTagline)}</p></div>
        </div>
      </a>
      <nav aria-label="Primary">
        ${nav}
      </nav>
      <div class="header-buttons">
        ${buttons}
        ${renderLangSwitch(lang, pathPart)}
      </div>
      <button class="mobile-menu-btn" id="mobileMenuBtn" aria-expanded="false" aria-controls="mobileNavPanel" aria-label="Menu">☰</button>
    </div>
    <nav class="mobile-nav-panel" id="mobileNavPanel" aria-label="Primary (mobile)">
      ${mobileLinks}
      ${renderLangSwitch(lang, pathPart)}
    </nav>
  </div>
</header>`;
}

function renderFooter({ common, footerLinks }) {
  const links = footerLinks.map((l) => `<a href="${l.href}">${esc(l.label)}</a>`).join("\n        ");
  return `<footer>
  <div class="container">
    <p>${esc(common.footerCopyright)}</p>
    <div style="margin-top: 10px;">
      ${links}
    </div>
  </div>
</footer>`;
}

function page({ lang, title, description, canonical, ogImage, jsonLd, pathPart, header, content, footer, type }) {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description || "")}">
<link rel="canonical" href="${canonical}">
${hreflangTags(pathPart)}
<meta property="og:type" content="${type || "website"}">
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
${header}
${content}
${footer}
<script src="/js/particle-bg.js"></script>
<script>
(function () {
  var mobileBtn = document.getElementById('mobileMenuBtn');
  var mobilePanel = document.getElementById('mobileNavPanel');
  mobileBtn.addEventListener('click', function () {
    var open = mobilePanel.classList.toggle('open');
    mobileBtn.setAttribute('aria-expanded', String(open));
  });
  Array.prototype.forEach.call(mobilePanel.querySelectorAll('a'), function (a) {
    a.addEventListener('click', function () {
      mobilePanel.classList.remove('open');
      mobileBtn.setAttribute('aria-expanded', 'false');
    });
  });
})();
</script>
</body>
</html>
`;
}

module.exports = { SITE_URL, LANGS, esc, urlFor, hreflangTags, renderLangSwitch, renderHeader, renderFooter, page };
