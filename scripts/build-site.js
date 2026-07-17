#!/usr/bin/env node
/*
 * itba.az — build-time static generator for the 3 public marketing pages
 * (home, academy, courses) in 3 languages (az/en/ru).
 *
 * These were the last hand-written HTML files in the repo; they're now
 * generated output, exactly like articles/ already was — see README for
 * why (maintaining 3 language variants of hand-written files doesn't
 * scale). Future copy changes go through admin.html's Wording tool (for
 * the admin-editable subset — hero/FAQ/etc.) or i18n/<lang>.js (for
 * structural/chrome text), not by hand-editing the files this writes.
 *
 * Safe to run locally: only reads the public anon key + admin_wordings
 * (public-read table), same pattern scripts/build-articles.js already
 * uses.
 */
const fs = require("fs");
const path = require("path");
const shell = require("./lib/shell");
const i18n = { az: require("../i18n/az"), en: require("../i18n/en"), ru: require("../i18n/ru") };

const SUPABASE_URL = "https://ndsdnsntpqbyktjrcjtq.supabase.co";
const SUPABASE_KEY = "sb_publishable_5Hv23JPUmQEIZXHyygkkUg_tWU7SuET";
const ROOT = path.join(__dirname, "..");
const { SITE_URL, LANGS, esc, urlFor, renderHeader, renderFooter, page } = shell;

function writeFile(relPath, contents) {
  const abs = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, contents);
}

async function fetchSavedWordings() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/admin_wordings?id=eq.1&select=wordings`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) return {};
    const rows = await res.json();
    return (rows[0] && rows[0].wordings) || {};
  } catch (e) {
    return {};
  }
}

// Merges i18n/<lang>.js's wording defaults with admin_wordings.wordings[lang]
// overrides (falling back cleanly if that language slot doesn't exist yet —
// e.g. right after the one-time migration, before an admin has edited en/ru).
function mergeWordings(dictWordings, saved, lang) {
  return Object.assign({}, dictWordings, (saved && saved[lang]) || {});
}

// ============================================================
// Home page
// ============================================================
function homePage(lang, saved) {
  const t = i18n[lang];
  const c = t.common;
  const h = t.home;
  const w = mergeWordings(h.wordings, saved, lang);
  const canonical = `${SITE_URL}${urlFor(lang, "")}`;

  const header = renderHeader({
    lang,
    pathPart: "",
    brand: c.brand,
    logoTagline: h.logoTagline,
    navLinks: [
      { href: urlFor(lang, "academy/"), label: c.navAcademy },
      { href: urlFor(lang, "articles/"), label: c.navArticles },
      { href: urlFor(lang, "courses/"), label: c.navCourses },
      { href: "/community/register.html", label: c.navCareerTest },
    ],
    headerButtons: [
      { href: "/community/login.html", cls: "btn-ghost", label: c.navLogin },
      { href: "/community/register.html", cls: "btn-primary", label: c.navRegister },
    ],
  });

  const footer = renderFooter({
    common: c,
    footerLinks: [
      { href: urlFor(lang, "academy/"), label: c.navAcademy },
      { href: "/community/register.html", label: c.navCareerTest },
      { href: urlFor(lang, "articles/"), label: c.navArticles },
      { href: urlFor(lang, "courses/"), label: c.navCourses },
      { href: "/exam.html", label: c.footerExamTool },
    ],
  });

  const content = `<section class="hero">
  <div class="container">
    <div class="hero-content">
      <div>
        <span class="badge" id="w-homeHeroBadge">${esc(w.homeHeroBadge)}</span>
        <h2 id="w-homeHeroTitle">${esc(w.homeHeroTitle)}</h2>
        <p class="subheadline" id="w-homeHeroSubtitle">${esc(w.homeHeroSubtitle)}</p>
        <div class="hero-buttons">
          <a href="/community/register.html" class="btn btn-primary">${esc(h.ctaTest)}</a>
          <a href="${urlFor(lang, "academy/")}" class="btn btn-secondary">${esc(h.ctaAcademy)}</a>
        </div>
      </div>
      <div>
        <div class="hero-card">
          <h3>${esc(h.communityCardTitle)}</h3>
          <div class="chips">
            <span class="chip">${esc(h.chipTest)}</span>
            <span class="chip">${esc(h.chipAcademy)}</span>
            <span class="chip">${esc(h.chipCorporate)}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section id="explore">
  <div class="container">
    <h3 class="section-title">${esc(h.exploreTitle)}</h3>
    <div class="cards-grid">
      <a href="/community/register.html" class="card">
        <span class="card-label">${esc(h.card1Label)}</span>
        <h3>${esc(h.card1Title)}</h3>
        <p>${esc(h.card1Desc)}</p>
      </a>
      <a href="${urlFor(lang, "academy/")}" class="card">
        <span class="card-label">${esc(h.card2Label)}</span>
        <h3>${esc(h.card2Title)}</h3>
        <p>${esc(h.card2Desc)}</p>
      </a>
      <a href="${urlFor(lang, "academy/")}#apply" class="card">
        <span class="card-label">${esc(h.card3Label)}</span>
        <h3>${esc(h.card3Title)}</h3>
        <p>${esc(h.card3Desc)}</p>
      </a>
    </div>
  </div>
</section>

<section id="latestArticles" style="display:none" aria-live="polite">
  <div class="container">
    <h3 class="section-title">${esc(h.latestArticlesTitle)}</h3>
    <div class="cards-grid" id="latestArticlesGrid"></div>
    <p style="text-align:center;margin-top:30px"><a href="${urlFor(lang, "articles/")}" class="btn btn-secondary">${esc(h.viewAllArticles)}</a></p>
  </div>
</section>`;

  const script = `<script src="/js/site-common.js"></script>
<script>
  trackVisit("index");
  var WORDING_LANG = "${lang}";

  (async () => {
    try {
      const res = await fetch(SUPABASE_URL + "/rest/v1/admin_wordings?id=eq.1&select=wordings", { cache: "no-store", headers: SB_HEADERS });
      if (!res.ok) return;
      const rows = await res.json();
      const wordings = ((rows[0] && rows[0].wordings) || {})[WORDING_LANG] || {};
      document.querySelectorAll('[id^="w-"]').forEach(el => {
        const key = el.id.slice(2);
        if (Object.prototype.hasOwnProperty.call(wordings, key)) el.textContent = wordings[key];
      });
    } catch (e) { /* keep the built-in copy */ }
  })();

  const CATEGORY_LABEL = ${JSON.stringify(t.articles.categoryLabel)};
  (async () => {
    try {
      const res = await fetch(SUPABASE_URL + "/rest/v1/articles?status=eq.published&select=slug,title,dek,category,reading_time_minutes&order=published_at.desc&limit=3", { cache: "no-store", headers: SB_HEADERS });
      if (!res.ok) return;
      const articles = await res.json();
      if (!articles.length) return;
      document.getElementById("latestArticlesGrid").innerHTML = articles.map(a =>
        '<a href="${urlFor(lang, "articles/")}' + a.slug + '/" class="card">' +
          '<span class="card-label">' + esc(CATEGORY_LABEL[a.category] || a.category) + '</span>' +
          '<h3>' + esc(a.title) + '</h3>' +
          '<p>' + esc(a.dek || "") + '</p>' +
        '</a>'
      ).join("");
      document.getElementById("latestArticles").style.display = "block";
    } catch (e) { /* no teaser if this fails */ }
  })();
</script>`;

  return page({
    lang,
    title: h.title,
    description: h.description,
    canonical,
    pathPart: "",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      name: "itba.az",
      url: canonical,
      description: "Azerbaijan's IT Business Analysis community platform: career test, training academy, and corporate programs.",
      address: { "@type": "PostalAddress", addressLocality: "Baku", addressCountry: "AZ" },
    },
    header,
    content: content + "\n" + script,
    footer,
    theme: "spec",
  });
}

// ============================================================
// Academy page
// ============================================================
function academyPage(lang, saved) {
  const t = i18n[lang];
  const c = t.common;
  const a = t.academy;
  const w = mergeWordings(a.wordings, saved, lang);
  const pathPart = "academy/";
  const canonical = `${SITE_URL}${urlFor(lang, pathPart)}`;

  const header = renderHeader({
    lang,
    pathPart,
    brand: c.brand,
    logoTagline: a.logoTagline,
    navLinks: [
      { href: urlFor(lang, "articles/"), label: c.navArticles },
      { href: urlFor(lang, "courses/"), label: c.navCourses },
      { href: "#program", label: c.navProgram },
      { href: "#faq", label: c.navFaq },
      { href: "#apply", label: c.navApply },
    ],
    headerButtons: [
      { href: "#apply", cls: "btn-ghost", label: c.navGetInfo },
      { href: "#apply", cls: "btn-primary", label: c.navApplyNow },
      { href: "/community/login.html", cls: "btn-secondary", label: c.navLogin },
    ],
    mobileExtra: [
      { href: urlFor(lang, ""), label: c.navHome },
      { href: "#about", label: "About" },
      { href: "#who", label: "Who is it for" },
      { href: "#services", label: "Services" },
    ],
  });

  const footer = renderFooter({
    common: c,
    footerLinks: [
      { href: urlFor(lang, ""), label: c.navHome },
      { href: "#apply", label: c.navApply },
    ],
  });

  const bulletsHtml = a.heroBullets.map((b) => `<li>${esc(b)}</li>`).join("\n            ");
  const chipsHtml = a.heroChips.map((ch) => `<span class="chip">${esc(ch)}</span>`).join("\n            ");
  const aboutCardsHtml = a.aboutCards.map((cd) => `<div class="card"><h3>${esc(cd.title)}</h3><p>${esc(cd.desc)}</p></div>`).join("\n        ");
  const whoCardsHtml = a.whoCards.map((cd) => `<div class="card"><h3>${esc(cd.title)}</h3><p>${esc(cd.desc)}</p></div>`).join("\n        ");
  const serviceCardsHtml = a.serviceCards
    .map((cd) => `<div class="card"><span class="card-label">${esc(cd.label)}</span><h3>${esc(cd.title)}</h3><p>${esc(cd.desc)}</p><div class="card-info">${esc(cd.info)}</div></div>`)
    .join("\n        ");
  const benefitTilesHtml = a.benefitTiles.map((b) => `<div class="benefit-tile"><h4>${esc(b.title)}</h4><p>${esc(b.desc)}</p></div>`).join("\n        ");
  const modulesHtml = a.modules
    .map((m) => `<div class="module-card"><h4>${esc(m.title)}</h4><ul>${m.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul></div>`)
    .join("\n        ");
  const faqItems = [1, 2, 3, 4, 5]
    .map(
      (i) => `<div class="faq-item">
          <button class="faq-question" id="faqBtn${i}" aria-expanded="false" aria-controls="faqPanel${i}">
            <h4 id="w-faqQ${i}">${esc(w[`faqQ${i}`])}</h4>
            <span class="faq-icon" aria-hidden="true">+</span>
          </button>
          <div class="faq-answer" id="faqPanel${i}" role="region" aria-labelledby="faqBtn${i}">
            <div class="faq-answer-content" id="w-faqA${i}">${esc(w[`faqA${i}`])}</div>
          </div>
        </div>`
    )
    .join("\n        ");
  const goalOptionsHtml = a.goalOptions.map((o) => `<option value="${esc(o.value)}">${esc(o.label)}</option>`).join("");
  const individualBulletsHtml = a.individualBullets.map((b) => `<li>${esc(b)}</li>`).join("");
  const corporateBulletsHtml = a.corporateBullets.map((b) => `<li>${esc(b)}</li>`).join("");

  const content = `<section class="hero">
  <div class="container">
    <div class="hero-content">
      <div>
        <span class="badge" id="w-heroBadge">${esc(w.heroBadge)}</span>
        <h2 id="w-heroTitle">${esc(w.heroTitle)}</h2>
        <p class="subheadline" id="w-heroSubtitle">${esc(w.heroSubtitle)}</p>
        <ul class="bullet-points">
            ${bulletsHtml}
        </ul>
        <div class="hero-buttons">
          <a href="#apply" class="btn btn-primary" id="w-heroBtnPrimary">${esc(w.heroBtnPrimary)}</a>
          <a href="#apply" class="btn btn-secondary" id="w-heroBtnSecondary">${esc(w.heroBtnSecondary)}</a>
        </div>
      </div>
      <div>
        <div class="hero-card">
          <h3 id="w-heroCardTitle">${esc(w.heroCardTitle)}</h3>
          <div class="hero-stats">
            <div class="stat-item"><strong>${esc(a.heroStat1Value)}</strong><span>${esc(a.heroStat1Label)}</span></div>
            <div class="stat-item"><strong>${esc(a.heroStat2Value)}</strong><span>${esc(a.heroStat2Label)}</span></div>
          </div>
          <div class="chips">
            ${chipsHtml}
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section id="about">
  <div class="container">
    <h3 class="section-title" id="w-aboutTitle">${esc(w.aboutTitle)}</h3>
    <p class="section-subtitle" id="w-aboutSubtitle">${esc(w.aboutSubtitle)}</p>
    <div class="cards-grid">
        ${aboutCardsHtml}
    </div>
  </div>
</section>

<section id="who">
  <div class="container">
    <h3 class="section-title" id="w-whoTitle">${esc(w.whoTitle)}</h3>
    <p class="section-subtitle" id="w-whoSubtitle">${esc(w.whoSubtitle)}</p>
    <div class="cards-grid">
        ${whoCardsHtml}
    </div>
  </div>
</section>

<section id="services">
  <div class="container">
    <h3 class="section-title" id="w-servicesTitle">${esc(w.servicesTitle)}</h3>
    <div class="cards-grid">
        ${serviceCardsHtml}
    </div>
  </div>
</section>

<section>
  <div class="container">
    <h3 class="section-title" id="w-benefitsTitle">${esc(w.benefitsTitle)}</h3>
    <div class="benefits-grid">
        ${benefitTilesHtml}
    </div>
  </div>
</section>

<section id="program">
  <div class="container">
    <h3 class="section-title" id="w-programTitle">${esc(w.programTitle)}</h3>
    <div class="modules-grid">
        ${modulesHtml}
    </div>
  </div>
</section>

<section id="faq">
  <div class="container">
    <h3 class="section-title" id="w-faqTitle">${esc(w.faqTitle)}</h3>
    <div class="faq-container">
        ${faqItems}
    </div>
  </div>
</section>

<section id="apply" class="apply-section">
  <div class="container">
    <h3 class="section-title" id="w-applyTitle">${esc(w.applyTitle)}</h3>
    <p class="section-subtitle" id="w-applySubtitle">${esc(w.applySubtitle)}</p>
    <div class="apply-content">
      <div>
        <form id="applyForm">
          <div class="form-group">
            <label for="appFullName">${esc(a.formFullName)}</label>
            <input type="text" id="appFullName" required placeholder="${esc(a.formFullNamePlaceholder)}">
          </div>
          <div class="form-group">
            <label for="appPhone">${esc(a.formPhone)}</label>
            <input type="tel" id="appPhone" required placeholder="${esc(a.formPhonePlaceholder)}">
          </div>
          <div class="form-group">
            <label for="appEmail">${esc(a.formEmail)}</label>
            <input type="email" id="appEmail" placeholder="${esc(a.formEmailPlaceholder)}">
          </div>
          <div class="form-group">
            <label for="appRole">${esc(a.formRole)}</label>
            <input type="text" id="appRole" placeholder="${esc(a.formRolePlaceholder)}">
          </div>
          <div class="form-group">
            <label for="appGoal">${esc(a.formGoal)}</label>
            <select id="appGoal" required>${goalOptionsHtml}</select>
          </div>
          <div class="form-group">
            <label for="appMessage">${esc(a.formMessage)}</label>
            <textarea id="appMessage" placeholder="${esc(a.formMessagePlaceholder)}"></textarea>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; padding: 15px;">${esc(a.submitButton)}</button>
          <div class="form-feedback" id="applyFeedback" role="alert"></div>
          <p class="consent-note">${esc(a.consentNote)}</p>
        </form>
      </div>
      <div>
        <div class="apply-info">
          <h4>${esc(a.whatYouGetTitle)}</h4>
          <div class="info-section">
            <h5>${esc(a.individualHeading)}</h5>
            <ul>${individualBulletsHtml}</ul>
          </div>
          <div class="info-section">
            <h5>${esc(a.corporateHeading)}</h5>
            <ul>${corporateBulletsHtml}</ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>`;

  const script = `<script src="/js/site-common.js"></script>
<script>
  trackVisit("academy");
  var WORDING_LANG = "${lang}";

  (async () => {
    try {
      const res = await fetch(SUPABASE_URL + "/rest/v1/admin_wordings?id=eq.1&select=wordings", { cache: "no-store", headers: SB_HEADERS });
      if (!res.ok) return;
      const rows = await res.json();
      const wordings = ((rows[0] && rows[0].wordings) || {})[WORDING_LANG] || {};
      document.querySelectorAll('[id^="w-"]').forEach(el => {
        const key = el.id.slice(2);
        if (Object.prototype.hasOwnProperty.call(wordings, key)) el.textContent = wordings[key];
      });
    } catch (e) { /* keep the built-in copy */ }
  })();

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });

  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const answer = item.querySelector('.faq-answer');
      const isActive = item.classList.contains('active');
      document.querySelectorAll('.faq-item').forEach(faq => {
        faq.classList.remove('active');
        faq.querySelector('.faq-answer').style.maxHeight = null;
        faq.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });
      if (!isActive) {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  document.getElementById('applyForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const form = this;
    const btn = form.querySelector('button[type="submit"]');
    const feedback = document.getElementById('applyFeedback');
    const originalText = btn.textContent;
    feedback.className = 'form-feedback';
    btn.disabled = true; btn.textContent = ${JSON.stringify(a.submittingButton)};
    const payload = {
      full_name: document.getElementById('appFullName').value.trim(),
      phone: document.getElementById('appPhone').value.trim(),
      email: document.getElementById('appEmail').value.trim(),
      role: document.getElementById('appRole').value.trim(),
      goal: document.getElementById('appGoal').value,
      message: document.getElementById('appMessage').value.trim()
    };
    try {
      const res = await fetch(SUPABASE_URL + "/rest/v1/applications", {
        method: "POST", cache: "no-store",
        headers: Object.assign({}, SB_HEADERS, { "Prefer": "return=minimal" }),
        body: JSON.stringify([payload])
      });
      if (!res.ok) throw new Error("submit failed: " + res.status);
      feedback.textContent = ${JSON.stringify(a.successMessage)};
      feedback.className = 'form-feedback show success';
      form.reset();
    } catch (err) {
      feedback.textContent = ${JSON.stringify(a.errorMessage)};
      feedback.className = 'form-feedback show error';
    }
    btn.disabled = false; btn.textContent = originalText;
  });
</script>`;

  return page({
    lang,
    title: a.title,
    description: a.description,
    canonical,
    pathPart,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Course",
      name: "IT Business Analyst Core Training Program",
      description: "6-module program covering business processes, requirements engineering, Agile, APIs and data, and a final portfolio project.",
      provider: { "@type": "Organization", name: "itba.az", sameAs: SITE_URL + "/" },
    },
    header,
    content: content + "\n" + script,
    footer,
    theme: "spec",
  });
}

// ============================================================
// Courses page
// ============================================================
function coursesPage(lang) {
  const t = i18n[lang];
  const c = t.common;
  const co = t.courses;
  const pathPart = "courses/";
  const canonical = `${SITE_URL}${urlFor(lang, pathPart)}`;

  const header = renderHeader({
    lang,
    pathPart,
    brand: c.brand,
    logoTagline: co.logoTagline,
    navLinks: [
      { href: urlFor(lang, "articles/"), label: c.navArticles },
      { href: urlFor(lang, "academy/"), label: c.navAcademy },
    ],
    headerButtons: [{ href: "/community/login.html", cls: "btn-ghost", label: c.navLogin }],
    mobileExtra: [{ href: urlFor(lang, ""), label: c.navHome }],
  });

  const footer = renderFooter({
    common: c,
    footerLinks: [
      { href: urlFor(lang, ""), label: c.navHome },
      { href: urlFor(lang, "academy/"), label: c.navAcademy },
      { href: urlFor(lang, "articles/"), label: c.navArticles },
    ],
  });

  const content = `<section class="content-page">
  <div class="container">
    <span class="badge">${esc(co.badge)}</span>
    <h2 class="section-title-left">${esc(co.pageTitle)}</h2>
    <p class="subhead" style="margin-bottom:30px">${esc(co.pageSubhead)}</p>

    <div class="filters-row">
      <input type="search" id="courseSearch" class="article-search filter-search" placeholder="${esc(co.searchPlaceholder)}" aria-label="${esc(co.searchAriaLabel)}" style="margin-bottom:0">
      <select id="filterFormat" class="filter-select" aria-label="${esc(co.filterFormatAriaLabel)}">
        <option value="">${esc(co.filterFormatAll)}</option>
        <option value="online">${esc(co.filterFormatOnline)}</option>
        <option value="offline">${esc(co.filterFormatOffline)}</option>
        <option value="hybrid">${esc(co.filterFormatHybrid)}</option>
      </select>
      <select id="filterLevel" class="filter-select" aria-label="${esc(co.filterLevelAriaLabel)}">
        <option value="">${esc(co.filterLevelAll)}</option>
        <option value="beginner">${esc(co.filterLevelBeginner)}</option>
        <option value="intermediate">${esc(co.filterLevelIntermediate)}</option>
        <option value="advanced">${esc(co.filterLevelAdvanced)}</option>
      </select>
      <select id="filterLanguage" class="filter-select" aria-label="${esc(co.filterLanguageAriaLabel)}">
        <option value="">${esc(co.filterLanguageAll)}</option>
        <option value="az">${esc(co.filterLanguageAz)}</option>
        <option value="en">${esc(co.filterLanguageEn)}</option>
        <option value="ru">${esc(co.filterLanguageRu)}</option>
      </select>
    </div>

    <div id="loadingNote" class="state-note" role="status" aria-live="polite">${esc(co.loadingText)}</div>
    <p id="resultsCount" class="subhead" style="display:none;margin-bottom:16px" aria-live="polite"></p>
    <div class="cards-grid" id="courseGrid"></div>
    <p id="emptyNote" class="state-note" style="display:none">${esc(co.emptyText)}</p>
  </div>
</section>`;

  const script = `<script src="/js/site-common.js"></script>
<script>
  trackVisit("courses");

  const FORMAT_LABEL = { online: ${JSON.stringify(co.filterFormatOnline)}, offline: ${JSON.stringify(co.filterFormatOffline)}, hybrid: ${JSON.stringify(co.filterFormatHybrid)} };
  const LEVEL_LABEL = { beginner: ${JSON.stringify(co.filterLevelBeginner)}, intermediate: ${JSON.stringify(co.filterLevelIntermediate)}, advanced: ${JSON.stringify(co.filterLevelAdvanced)} };
  const LANGUAGE_LABEL = { az: ${JSON.stringify(co.filterLanguageAz)}, en: ${JSON.stringify(co.filterLanguageEn)}, ru: ${JSON.stringify(co.filterLanguageRu)} };
  const RESULTS_SUFFIX = ${JSON.stringify(co.resultsCountSuffix)};

  let allCourses = [];

  function courseCardHtml(c) {
    const badge = c.is_ours ? '<span class="course-badge">' + ${JSON.stringify(co.ourProgramBadge)} + '</span>' : "";
    const infoBits = [FORMAT_LABEL[c.format] || c.format, LEVEL_LABEL[c.level] || c.level, LANGUAGE_LABEL[c.language] || c.language];
    if (c.price) infoBits.push(c.price);
    const linkAttrs = c.url ? ' href="' + esc(c.url) + '" target="_blank" rel="noopener noreferrer"' : ' href="#"';
    return '<a class="card"' + linkAttrs + '>' +
      '<span class="card-label">' + esc(c.provider) + '</span>' +
      '<h3>' + esc(c.title) + badge + '</h3>' +
      (c.description ? '<p>' + esc(c.description) + '</p>' : "") +
      '<div class="card-info">' + infoBits.map(esc).join(" • ") + '</div>' +
    '</a>';
  }

  function applyFilters() {
    const q = document.getElementById("courseSearch").value.trim().toLowerCase();
    const format = document.getElementById("filterFormat").value;
    const level = document.getElementById("filterLevel").value;
    const language = document.getElementById("filterLanguage").value;

    const filtered = allCourses.filter((c) => {
      if (format && c.format !== format) return false;
      if (level && c.level !== level) return false;
      if (language && c.language !== language) return false;
      if (q) {
        const haystack = (c.title + " " + c.provider + " " + (c.description || "")).toLowerCase();
        if (haystack.indexOf(q) === -1) return false;
      }
      return true;
    });

    const grid = document.getElementById("courseGrid");
    grid.innerHTML = filtered.map(courseCardHtml).join("");
    document.getElementById("emptyNote").style.display = filtered.length ? "none" : "block";
    const countEl = document.getElementById("resultsCount");
    countEl.style.display = allCourses.length ? "block" : "none";
    countEl.textContent = filtered.length + " / " + allCourses.length + " " + RESULTS_SUFFIX;
  }

  async function loadCourses() {
    const loadingNote = document.getElementById("loadingNote");
    loadingNote.className = "state-note";
    loadingNote.innerHTML = ${JSON.stringify(co.loadingText)};
    try {
      const res = await fetch(SUPABASE_URL + "/rest/v1/courses?active=eq.true&select=*&order=is_ours.desc,title.asc", { cache: "no-store", headers: SB_HEADERS });
      if (!res.ok) throw new Error("fetch failed: " + res.status);
      allCourses = await res.json();
      loadingNote.style.display = "none";
      applyFilters();
    } catch (e) {
      loadingNote.className = "state-note warn";
      loadingNote.innerHTML = ${JSON.stringify(co.errorText)} + ' <span class="retry-link" id="retryLoadCourses">' + ${JSON.stringify(co.retryText)} + '</span>';
      document.getElementById("retryLoadCourses").addEventListener("click", loadCourses);
    }
  }
  loadCourses();

  document.getElementById("courseSearch").addEventListener("input", applyFilters);
  document.getElementById("filterFormat").addEventListener("change", applyFilters);
  document.getElementById("filterLevel").addEventListener("change", applyFilters);
  document.getElementById("filterLanguage").addEventListener("change", applyFilters);
</script>`;

  return page({
    lang,
    title: co.title,
    description: co.description,
    canonical,
    pathPart,
    header,
    content: content + "\n" + script,
    footer,
    theme: "spec",
  });
}

async function main() {
  const saved = await fetchSavedWordings();

  for (const lang of LANGS) {
    writeFile(`${lang === "az" ? "" : lang + "/"}index.html`, homePage(lang, saved));
    writeFile(`${lang === "az" ? "" : lang + "/"}academy/index.html`, academyPage(lang, saved));
    writeFile(`${lang === "az" ? "" : lang + "/"}courses/index.html`, coursesPage(lang));
  }

  console.log(`Built home/academy/courses for ${LANGS.length} languages.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
