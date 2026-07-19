import { SEMANTIC_RECORDS, GENERAL_FAQS } from './semanticDatabase';
import { GUIDE_RECORDS, GLOSSARY_TERMS } from './contentData';
import { getSchool, getUnit } from '../education/curriculumData';
import { getLessonBody } from '../education/lessonContent';
import {
  PROFILE_SEO,
  ECONOMY_TOPICS,
  lookupIndicator,
  lookupStock,
  lookupCrypto,
  lookupForex,
  lookupCommodity,
  lookupEconomy,
  relatedStocksBySector,
  relatedCryptoByCategory,
} from './crawlCatalog';
import { buildIndicators } from '../components/indicatorsData';
import { ENCYCLOPEDIA_KNOWLEDGE_BASE } from '../components/encyclopedia/KnowledgeBaseData';

// ==========================================
// STATIC CONTENT PAGE RENDERER (SERVER-SIDE)
// Produces fully crawlable HTML documents for the public content routes
// (/learn, /guides, /glossary, /faq). These routes are not part of the
// logged-in SPA, so serving real server-rendered articles means both
// visitors and crawlers see actual content instead of the login screen.
// ==========================================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Inline markdown: **bold** only (the corpus uses nothing else inline). */
function inlineMd(text: string): string {
  return escapeHtml(text).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

/**
 * Minimal markdown-to-HTML converter covering the constructs used by
 * SEMANTIC_RECORDS and GUIDE_RECORDS: ###/#### headings, unordered and
 * ordered lists, $$ math blocks, and paragraphs.
 */
export function markdownToHtml(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let listMode: 'ul' | 'ol' | null = null;
  let inMath = false;
  const mathBuffer: string[] = [];

  const closeList = () => {
    if (listMode) {
      out.push(listMode === 'ul' ? '</ul>' : '</ol>');
      listMode = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith('$$')) {
      closeList();
      if (!inMath) {
        inMath = true;
        const rest = line.slice(2).replace(/\$\$$/, '');
        if (rest) mathBuffer.push(rest);
        if (line.length > 2 && line.endsWith('$$')) {
          out.push(`<pre class="math">${escapeHtml(mathBuffer.join('\n'))}</pre>`);
          mathBuffer.length = 0;
          inMath = false;
        }
      } else {
        out.push(`<pre class="math">${escapeHtml(mathBuffer.join('\n'))}</pre>`);
        mathBuffer.length = 0;
        inMath = false;
      }
      continue;
    }
    if (inMath) {
      mathBuffer.push(line);
      continue;
    }

    if (!line) {
      closeList();
      continue;
    }
    if (line.startsWith('#### ')) {
      closeList();
      out.push(`<h3>${inlineMd(line.slice(5))}</h3>`);
    } else if (line.startsWith('### ')) {
      closeList();
      out.push(`<h2>${inlineMd(line.slice(4))}</h2>`);
    } else if (/^\*\s+/.test(line)) {
      if (listMode !== 'ul') {
        closeList();
        out.push('<ul>');
        listMode = 'ul';
      }
      out.push(`<li>${inlineMd(line.replace(/^\*\s+/, ''))}</li>`);
    } else if (/^\d+\.\s+/.test(line)) {
      if (listMode !== 'ol') {
        closeList();
        out.push('<ol>');
        listMode = 'ol';
      }
      out.push(`<li>${inlineMd(line.replace(/^\d+\.\s+/, ''))}</li>`);
    } else {
      closeList();
      out.push(`<p>${inlineMd(line)}</p>`);
    }
  }
  closeList();
  return out.join('\n');
}

const NAV_LINKS = [
  { href: '/', label: 'Terminal' },
  { href: '/learn', label: 'Learn' },
  { href: '/guides', label: 'Guides' },
  { href: '/glossary', label: 'Glossary' },
  { href: '/faq', label: 'FAQ' },
  { href: '/education', label: 'Education' },
  { href: '/encyclopedia', label: 'Encyclopedia' },
  { href: '/indicators', label: 'Indicators' },
  { href: '/ui', label: 'UI Modes' },
];

const PAGE_CSS = `
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #050505; color: #e5e5e5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.7; }
  header.site { position: sticky; top: 0; z-index: 50; background: rgba(0,0,0,0.92); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.1); }
  header.site .inner { max-width: 60rem; margin: 0 auto; padding: 0.75rem 1rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; }
  header.site .brand { color: #00E5FF; font-weight: 900; font-size: 0.8rem; letter-spacing: 0.2em; text-transform: uppercase; text-decoration: none; }
  header.site nav { display: flex; gap: 0.85rem; flex-wrap: wrap; }
  header.site nav a { color: rgba(255,255,255,0.65); font-size: 0.7rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; text-decoration: none; }
  header.site nav a:hover, header.site nav a[aria-current="page"] { color: #00E5FF; }
  main { max-width: 48rem; margin: 0 auto; padding: 2.5rem 1.25rem 4rem; }
  nav.breadcrumb { font-size: 0.75rem; color: rgba(255,255,255,0.45); margin-bottom: 1.5rem; }
  nav.breadcrumb a { color: rgba(0,229,255,0.8); text-decoration: none; }
  h1 { font-size: 1.9rem; line-height: 1.25; color: #fff; margin: 0 0 0.75rem; }
  p.lead { color: rgba(255,255,255,0.7); font-size: 1.05rem; margin: 0 0 2rem; }
  article h2 { font-size: 1.35rem; color: #00E5FF; margin: 2.25rem 0 0.75rem; }
  article h3 { font-size: 1.1rem; color: #fff; margin: 1.75rem 0 0.5rem; }
  article p { margin: 0 0 1rem; color: rgba(255,255,255,0.82); }
  article ul, article ol { margin: 0 0 1.25rem; padding-left: 1.4rem; color: rgba(255,255,255,0.82); }
  article li { margin-bottom: 0.4rem; }
  article a { color: #00D9FF; text-decoration: none; font-weight: 600; }
  article a:hover { text-decoration: underline; }
  pre.math { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0.9rem 1rem; overflow-x: auto; font-size: 0.85rem; color: #9fe8ff; }
  .card-list { display: grid; gap: 1rem; margin: 0; padding: 0; list-style: none; }
  .card-list a.card { display: block; border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 1.1rem 1.25rem; text-decoration: none; background: rgba(255,255,255,0.03); transition: border-color 0.15s; }
  .card-list a.card:hover { border-color: rgba(0,229,255,0.5); }
  .card-list .card h2 { margin: 0 0 0.35rem; font-size: 1.05rem; color: #00E5FF; }
  .card-list .card p { margin: 0; font-size: 0.85rem; color: rgba(255,255,255,0.65); }
  dl.glossary dt { color: #00E5FF; font-weight: 800; font-size: 1rem; margin-top: 1.4rem; }
  dl.glossary dd { margin: 0.25rem 0 0; color: rgba(255,255,255,0.78); }
  section.faqs { margin-top: 2.5rem; border-top: 1px solid rgba(255,255,255,0.12); padding-top: 1.5rem; }
  section.faqs h2 { font-size: 1.3rem; color: #fff; }
  section.faqs h3 { color: #00E5FF; font-size: 1rem; margin: 1.4rem 0 0.35rem; }
  section.faqs p { color: rgba(255,255,255,0.78); margin: 0 0 0.75rem; }
  aside.cta { margin-top: 3rem; border: 1px solid rgba(0,229,255,0.35); background: rgba(0,229,255,0.06); border-radius: 14px; padding: 1.4rem 1.5rem; }
  aside.cta h2 { margin: 0 0 0.4rem; font-size: 1.1rem; color: #fff; }
  aside.cta p { margin: 0 0 0.9rem; font-size: 0.9rem; color: rgba(255,255,255,0.7); }
  aside.cta a.btn { display: inline-block; background: #00E5FF; color: #000; font-weight: 900; font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; padding: 0.65rem 1.2rem; border-radius: 8px; text-decoration: none; }
  aside.cta .cta-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; margin-bottom: 1.25rem; }
  aside.cta form.waitlist { display: grid; gap: 0.65rem; max-width: 28rem; }
  aside.cta form.waitlist label { display: grid; gap: 0.25rem; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.55); }
  aside.cta form.waitlist input, aside.cta form.waitlist select { background: rgba(0,0,0,0.45); border: 1px solid rgba(255,255,255,0.18); border-radius: 8px; color: #fff; padding: 0.55rem 0.7rem; font-size: 0.9rem; }
  aside.cta form.waitlist button { background: #00E5FF; color: #000; font-weight: 900; font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; padding: 0.7rem 1.1rem; border: 0; border-radius: 8px; cursor: pointer; }
  aside.cta form.waitlist .status { font-size: 0.85rem; min-height: 1.2em; color: #00E5FF; }
  aside.cta form.waitlist .status.err { color: #ff6b8a; }
  .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); gap: 0.75rem; margin: 0 0 1.5rem; }
  .meta-grid div { border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 0.75rem 0.9rem; background: rgba(255,255,255,0.03); }
  .meta-grid .k { display: block; font-size: 0.65rem; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.45); margin-bottom: 0.25rem; }
  .meta-grid .v { color: #fff; font-weight: 700; font-size: 0.95rem; }
  footer.site { border-top: 1px solid rgba(255,255,255,0.1); margin-top: 2rem; }
  footer.site .inner { max-width: 60rem; margin: 0 auto; padding: 1.5rem 1rem; display: flex; flex-wrap: wrap; gap: 1rem; font-size: 0.72rem; color: rgba(255,255,255,0.45); }
  footer.site a { color: rgba(255,255,255,0.55); text-decoration: none; }
  footer.site a:hover { color: #00E5FF; }
`;

function renderShell(currentPath: string, bodyHtml: string): string {
  const nav = NAV_LINKS.map(
    (l) =>
      `<a href="${l.href}"${l.href === currentPath ? ' aria-current="page"' : ''}>${l.label}</a>`
  ).join('\n        ');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ClearPathTrader</title>
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <style>${PAGE_CSS}</style>
  </head>
  <body>
    <header class="site">
      <div class="inner">
        <a class="brand" href="/">ClearPath Trader</a>
        <nav>
        ${nav}
        </nav>
      </div>
    </header>
    <main>
${bodyHtml}
      <aside class="cta">
        <h2>Put this knowledge on a live chart</h2>
        <p>ClearPath Trader is a free market intelligence terminal: live charts, unlimited indicators, automatic pattern detection, and a beginner-to-advanced education path.</p>
        <div class="cta-actions">
          <a class="btn" href="/">Launch the terminal</a>
          <a class="btn" href="/education" style="background:transparent;color:#00E5FF;border:1px solid rgba(0,229,255,0.5)">Start education</a>
        </div>
        <h2 style="margin-top:0.5rem">Join the soft-launch waitlist</h2>
        <p>Get activation updates when new desks and features open. No spam — education and launch notes only.</p>
        <form class="waitlist" id="cpt-waitlist" novalidate>
          <label>First name<input name="firstName" required maxlength="200" autocomplete="given-name" /></label>
          <label>Email<input name="emailAddress" type="email" required maxlength="320" autocomplete="email" /></label>
          <label>Country<input name="country" required maxlength="120" autocomplete="country-name" placeholder="United States" /></label>
          <label>Experience
            <select name="experienceLevel">
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
              <option>Professional</option>
            </select>
          </label>
          <button type="submit">Join waitlist</button>
          <div class="status" id="cpt-waitlist-status" aria-live="polite"></div>
        </form>
      </aside>
    </main>
    <footer class="site">
      <div class="inner">
        <span>&copy; ClearPathTrader — analytics &amp; education, not a brokerage.</span>
        <a href="/learn">Learn</a>
        <a href="/guides">Guides</a>
        <a href="/glossary">Glossary</a>
        <a href="/ui">UI Modes</a>
        <a href="/about">About</a>
        <a href="/terms.html">Terms</a>
        <a href="/privacy.html">Privacy</a>
        <a href="/disclaimer.html">Disclaimer</a>
      </div>
    </footer>
    <script>
      (function () {
        var form = document.getElementById('cpt-waitlist');
        if (!form) return;
        var status = document.getElementById('cpt-waitlist-status');
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          status.className = 'status';
          status.textContent = 'Submitting…';
          var data = new FormData(form);
          var body = {
            firstName: String(data.get('firstName') || ''),
            emailAddress: String(data.get('emailAddress') || ''),
            country: String(data.get('country') || ''),
            experienceLevel: String(data.get('experienceLevel') || 'Beginner')
          };
          fetch('/api/registrations/waitlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          }).then(function (res) {
            return res.json().then(function (j) { return { ok: res.ok, j: j }; });
          }).then(function (r) {
            if (r.ok) {
              status.className = 'status';
              status.textContent = 'You are on the waitlist. Check your email for confirmation.';
              form.reset();
            } else {
              status.className = 'status err';
              status.textContent = (r.j && (r.j.message || r.j.error)) || 'Could not join waitlist.';
            }
          }).catch(function () {
            status.className = 'status err';
            status.textContent = 'Network error — try again in a moment.';
          });
        });
      })();
    </script>
  </body>
</html>`;
}

function breadcrumbHtml(items: { name: string; url?: string }[]): string {
  const parts = items.map((item) =>
    item.url ? `<a href="${item.url}">${escapeHtml(item.name)}</a>` : escapeHtml(item.name)
  );
  return `<nav class="breadcrumb" aria-label="Breadcrumb">${parts.join(' › ')}</nav>`;
}

function faqSectionHtml(faqs: { question: string; answer: string }[]): string {
  if (!faqs.length) return '';
  const items = faqs
    .map((f) => `<h3>${escapeHtml(f.question)}</h3>\n<p>${escapeHtml(f.answer)}</p>`)
    .join('\n');
  return `<section class="faqs">\n<h2>Frequently asked questions</h2>\n${items}\n</section>`;
}

function renderLearnIndex(): string {
  const cards = Object.values(SEMANTIC_RECORDS)
    .map(
      (r) =>
        `<li><a class="card" href="/learn/${r.id}"><h2>${escapeHtml(r.title)}</h2><p>${escapeHtml(r.summary)}</p></a></li>`
    )
    .join('\n');
  return `${breadcrumbHtml([{ name: 'Home', url: '/' }, { name: 'Learn' }])}
<h1>Financial Education Library</h1>
<p class="lead">Institutional-grade explainers on the forces that move markets — inflation, liquidity, valuation, microstructure, and intermarket correlations — written in plain language.</p>
<article><ul class="card-list">${cards}</ul></article>`;
}

function renderLearnTopic(topicId: string): string | null {
  const record = SEMANTIC_RECORDS[topicId];
  if (!record) return null;
  return `${breadcrumbHtml([{ name: 'Home', url: '/' }, { name: 'Learn', url: '/learn' }, { name: record.title.split('?')[0] }])}
<h1>${escapeHtml(record.title)}</h1>
<p class="lead">${escapeHtml(record.summary)}</p>
<article>${markdownToHtml(record.content)}</article>
${faqSectionHtml(record.faqs)}`;
}

function renderGuidesIndex(): string {
  const cards = Object.values(GUIDE_RECORDS)
    .map(
      (g) =>
        `<li><a class="card" href="/guides/${g.id}"><h2>${escapeHtml(g.title)}</h2><p>${escapeHtml(g.summary)}</p></a></li>`
    )
    .join('\n');
  return `${breadcrumbHtml([{ name: 'Home', url: '/' }, { name: 'Guides' }])}
<h1>Strategic Trading Guides</h1>
<p class="lead">Deep, practical guides to the mechanics professionals actually use: macro spreads, arbitrage, and leverage risk management.</p>
<article>
<p>Most trading content explains <em>what</em> an indicator shows. These guides explain <strong>how the machinery underneath actually works</strong> — how the yield curve and credit spreads price risk before equity indices react, how convergence trades earn (and lose) money, and how position sizing math decides whether a strategy survives its losing streaks.</p>
<p>Each guide stands alone, ends with a practitioner FAQ, and links to the related <a href="/learn">Learn library</a> topics and <a href="/glossary">glossary</a> terms so you can go deeper on any concept.</p>
<ul class="card-list">${cards}</ul>
</article>`;
}

function renderGuide(slug: string): string | null {
  const guide = GUIDE_RECORDS[slug];
  if (!guide) return null;
  return `${breadcrumbHtml([{ name: 'Home', url: '/' }, { name: 'Guides', url: '/guides' }, { name: guide.title.split(':')[0] }])}
<h1>${escapeHtml(guide.title)}</h1>
<p class="lead">${escapeHtml(guide.summary)}</p>
<article>${markdownToHtml(guide.content)}</article>
${faqSectionHtml(guide.faqs)}`;
}

function renderGlossary(): string {
  const entries = GLOSSARY_TERMS.map(
    (t) => `<dt>${escapeHtml(t.term)}</dt>\n<dd>${escapeHtml(t.definition)}</dd>`
  ).join('\n');
  return `${breadcrumbHtml([{ name: 'Home', url: '/' }, { name: 'Glossary' }])}
<h1>Financial Glossary</h1>
<p class="lead">Precise, plain-language definitions of the trading and market-structure vocabulary used across ClearPath Trader.</p>
<article><dl class="glossary">${entries}</dl></article>`;
}

function renderFaqPage(): string {
  return `${breadcrumbHtml([{ name: 'Home', url: '/' }, { name: 'FAQ' }])}
<h1>Frequently Asked Questions</h1>
<p class="lead">What ClearPathTrader is, what it is not, and how the platform's analytics and education systems work.</p>
${faqSectionHtml(GENERAL_FAQS)}`;
}

function renderIndicatorDetail(slug: string): string | null {
  const ind = lookupIndicator(slug);
  if (!ind) return null;
  const stars = '★'.repeat(ind.complexity) + '☆'.repeat(Math.max(0, 5 - ind.complexity));
  return `${breadcrumbHtml([
    { name: 'Home', url: '/' },
    { name: 'Indicators', url: '/indicators' },
    { name: ind.name },
  ])}
<h1>${escapeHtml(ind.name)}</h1>
<p class="lead">${escapeHtml(ind.description)}</p>
<article>
<p><strong>Category:</strong> ${escapeHtml(ind.category)} · <strong>Complexity:</strong> ${stars} (${ind.complexity}/5)</p>
<p><strong>Tags:</strong> ${ind.tags.map((t: string) => escapeHtml(t)).join(', ')}</p>
<p><img src="${escapeHtml(ind.img)}" alt="${escapeHtml(ind.name)} chart illustration" width="640" height="360" style="max-width:100%;height:auto;border:1px solid rgba(255,255,255,0.12);border-radius:12px;margin:1rem 0;background:#0a0a0a" /></p>
<p>${escapeHtml(ind.name)} is part of the ClearPath Encyclopedia of Indicators — ${buildIndicators().length}+ technical and fundamental models explained with visuals, so you can study an indicator before you put it on a live chart.</p>
<p><a href="/indicators">Browse the full indicator directory →</a></p>
</article>`;
}

function renderEducationSchool(schoolId: string): string | null {
  const school = getSchool(schoolId);
  if (!school) return null;
  const units = school.units
    .map(
      (u) =>
        `<li><a class="card" href="/education/${school.id}/${u.id}"><h2>${escapeHtml(u.title)}</h2><p>${u.lessons.length} lessons</p></a></li>`
    )
    .join('\n');
  return `${breadcrumbHtml([
    { name: 'Home', url: '/' },
    { name: 'Education', url: '/education' },
    { name: school.name },
  ])}
<h1>${escapeHtml(school.name)} School</h1>
<p class="lead">${escapeHtml(school.tagline)}</p>
<article><ul class="card-list">${units}</ul></article>`;
}

function renderEducationUnit(schoolId: string, unitId: string): string | null {
  const school = getSchool(schoolId);
  const unit = getUnit(schoolId, unitId);
  if (!school || !unit) return null;
  const lessons = unit.lessons
    .map(
      (l) =>
        `<li><a class="card" href="/education/${school.id}/${unit.id}/${l.id}"><h2>${escapeHtml(l.title)}</h2></a></li>`
    )
    .join('\n');
  return `${breadcrumbHtml([
    { name: 'Home', url: '/' },
    { name: 'Education', url: '/education' },
    { name: school.name, url: `/education/${school.id}` },
    { name: unit.title },
  ])}
<h1>${escapeHtml(unit.title)}</h1>
<p class="lead">${escapeHtml(school.name)} · ${unit.lessons.length} lessons in this unit.</p>
<article><ul class="card-list">${lessons}</ul></article>`;
}

function renderEducationLesson(schoolId: string, unitId: string, lessonId: string): string | null {
  const school = getSchool(schoolId);
  const unit = getUnit(schoolId, unitId);
  const lesson = unit?.lessons.find((l) => l.id === lessonId);
  if (!school || !unit || !lesson) return null;
  const body = getLessonBody(lesson.id, lesson.title, school.name, unit.title);
  const sections = body.sections
    .map(
      (s) =>
        `<h2>${escapeHtml(s.heading)}</h2>\n${s.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n')}`
    )
    .join('\n');
  const takeaways = body.takeaways.map((t) => `<li>${escapeHtml(t)}</li>`).join('\n');
  return `${breadcrumbHtml([
    { name: 'Home', url: '/' },
    { name: 'Education', url: '/education' },
    { name: school.name, url: `/education/${school.id}` },
    { name: unit.title.split('—')[0].trim(), url: `/education/${school.id}/${unit.id}` },
    { name: lesson.title },
  ])}
<h1>${escapeHtml(lesson.title)}</h1>
<p class="lead">${escapeHtml(body.summary)}</p>
<article>
${sections}
<h2>Key takeaways</h2>
<ul>${takeaways}</ul>
<p><a href="/education/${school.id}/${unit.id}">← Back to ${escapeHtml(unit.title)}</a> · <a href="/education">All schools</a></p>
</article>`;
}

function renderUiIndex(): string {
  const cards = PROFILE_SEO.map(
    (p) =>
      `<li><a class="card" href="/ui/${p.slug}"><h2>${escapeHtml(p.name)}</h2><p>${escapeHtml(p.summary)}</p></a></li>`
  ).join('\n');
  return `${breadcrumbHtml([{ name: 'Home', url: '/' }, { name: 'UI Modes' }])}
<h1>Neurodivergent &amp; Accessible Trading Interfaces</h1>
<p class="lead">ClearPath Trader ships ${PROFILE_SEO.length} purpose-built UI modes — from calm focus and reading support to ADHD hyperfocus, autism-predictable layouts, and minimal-motion desks. Pick the interface that fits how you process markets.</p>
<article><ul class="card-list">${cards}</ul></article>`;
}

function renderUiProfile(slug: string): string | null {
  const profile = PROFILE_SEO.find((p) => p.slug === slug);
  if (!profile) return null;
  const benefits = profile.benefits.map((b) => `<li>${escapeHtml(b)}</li>`).join('\n');
  return `${breadcrumbHtml([
    { name: 'Home', url: '/' },
    { name: 'UI Modes', url: '/ui' },
    { name: profile.name },
  ])}
<h1>${escapeHtml(profile.name)}</h1>
<p class="lead">${escapeHtml(profile.headline)}</p>
<article>
<p>${escapeHtml(profile.summary)}</p>
<h2>What this mode optimizes for</h2>
<ul>${benefits}</ul>
<p>Open the ClearPath terminal with this interface pre-selected:</p>
<p><a href="/?profile=${encodeURIComponent(profile.id)}" style="display:inline-block;background:#00E5FF;color:#000;font-weight:900;font-size:0.75rem;letter-spacing:0.12em;text-transform:uppercase;padding:0.65rem 1.2rem;border-radius:8px;text-decoration:none;margin-top:0.5rem">Launch ${escapeHtml(profile.name)}</a></p>
<p style="margin-top:1.5rem"><a href="/ui">← All UI modes</a></p>
</article>`;
}

function listHtml(items: string[]): string {
  if (!items.length) return '';
  return `<ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('\n')}</ul>`;
}

function metaGrid(rows: { k: string; v: string }[]): string {
  return `<div class="meta-grid">${rows
    .filter((r) => r.v)
    .map((r) => `<div><span class="k">${escapeHtml(r.k)}</span><span class="v">${escapeHtml(r.v)}</span></div>`)
    .join('')}</div>`;
}

function relatedLinksSection(title: string, links: { href: string; label: string; blurb?: string }[]): string {
  if (!links.length) return '';
  const cards = links
    .map(
      (l) =>
        `<li><a class="card" href="${l.href}"><h2>${escapeHtml(l.label)}</h2>${
          l.blurb ? `<p>${escapeHtml(l.blurb)}</p>` : ''
        }</a></li>`
    )
    .join('\n');
  return `<h2>${escapeHtml(title)}</h2>\n<ul class="card-list">${cards}</ul>`;
}

function renderStockProfile(symbol: string): string | null {
  const stock = lookupStock(symbol);
  if (!stock) return null;
  const ticker = String(stock.ticker).toUpperCase();
  const peers = relatedStocksBySector(stock.sector || '', ticker, 4);
  const whatMoves = Array.isArray(stock.whatMoves) ? stock.whatMoves : [];
  const tags = Array.isArray(stock.tags) ? stock.tags : [];
  const relatedMarkets = Array.isArray(stock.relatedMarkets) ? stock.relatedMarkets : [];

  return `${breadcrumbHtml([
    { name: 'Home', url: '/' },
    { name: 'Encyclopedia', url: '/encyclopedia' },
    { name: 'Stocks', url: '/stocks' },
    { name: ticker },
  ])}
<h1>${escapeHtml(ticker)} — ${escapeHtml(stock.company || ticker)}</h1>
<p class="lead">${escapeHtml(stock.description || `${stock.company} equity profile in the ClearPath financial encyclopedia.`)}</p>
${metaGrid([
  { k: 'Exchange', v: String(stock.exchange || '') },
  { k: 'Sector', v: String(stock.sector || '') },
  { k: 'Industry', v: String(stock.industry || '') },
  { k: 'Market cap', v: String(stock.marketCap || '') },
  { k: 'Founded', v: stock.founded != null ? String(stock.founded) : '' },
  { k: 'Headquarters', v: String(stock.headquarters || '') },
])}
<article>
<h2>What ${escapeHtml(ticker)} is</h2>
<p>${escapeHtml(stock.company || ticker)} (${escapeHtml(ticker)}) is listed on ${escapeHtml(
    stock.exchange || 'a major exchange'
  )} in the ${escapeHtml(stock.sector || 'equity')} sector${
    stock.industry ? `, specifically ${escapeHtml(stock.industry)}` : ''
  }. ClearPath profiles equities for education — this page is not a brokerage quote or trade recommendation.</p>
${
  whatMoves.length
    ? `<h2>What tends to move the stock</h2>
<p>Traders and analysts commonly watch these drivers when studying ${escapeHtml(ticker)}:</p>
${listHtml(whatMoves)}`
    : ''
}
${tags.length ? `<h2>Theme tags</h2>${listHtml(tags)}` : ''}
${
  relatedMarkets.length
    ? `<h2>Related market themes</h2>
<p>Macro and sector themes often discussed alongside ${escapeHtml(ticker)}:</p>
${listHtml(relatedMarkets)}`
    : ''
}
<h2>How to study ${escapeHtml(ticker)} on ClearPath</h2>
<ol>
<li>Open the <a href="/encyclopedia">Financial Encyclopedia</a> for interactive charts and knowledge panels.</li>
<li>Review valuation mechanics in <a href="/learn/valuation">Discounted Cash Flow &amp; CAPM</a>.</li>
<li>Walk the <a href="/education/stocks">Stocks school</a> in ClearPath Education for a structured path.</li>
<li>Add context indicators from the <a href="/indicators">Indicator Encyclopedia</a> before drawing conclusions.</li>
<li>Launch the <a href="/">live terminal</a> to put ${escapeHtml(ticker)} on a chart with your preferred <a href="/ui">UI mode</a>.</li>
</ol>
${relatedLinksSection(
  'Related equity profiles',
  peers.map((p) => ({
    href: `/stocks/${String(p.ticker).toLowerCase()}`,
    label: `${String(p.ticker).toUpperCase()} — ${p.company}`,
    blurb: p.industry || p.sector,
  }))
)}
<p><a href="/stocks">← All stocks</a> · <a href="/encyclopedia">Encyclopedia hub</a> · <a href="/learn/liquidity">Liquidity primer</a></p>
</article>`;
}

function renderCryptoProfile(symbol: string): string | null {
  const coin = lookupCrypto(symbol);
  if (!coin) return null;
  const sym = String(coin.symbol).toUpperCase();
  const peers = relatedCryptoByCategory(coin.category || '', sym, 4);
  const whatMoves = Array.isArray(coin.whatMoves) ? coin.whatMoves : [];
  const related = Array.isArray(coin.relatedTopics) ? coin.relatedTopics : [];

  return `${breadcrumbHtml([
    { name: 'Home', url: '/' },
    { name: 'Encyclopedia', url: '/encyclopedia' },
    { name: 'Crypto', url: '/crypto' },
    { name: sym },
  ])}
<h1>${escapeHtml(coin.name || sym)} (${escapeHtml(sym)})</h1>
<p class="lead">${escapeHtml(coin.description || `${coin.name} cryptocurrency profile.`)}</p>
${metaGrid([
  { k: 'Symbol', v: sym },
  { k: 'Category', v: String(coin.category || '') },
  { k: 'Founded', v: coin.founded != null ? String(coin.founded) : '' },
  { k: 'Creator / origin', v: String(coin.creator || '') },
])}
<article>
<h2>Educational overview</h2>
<p>${escapeHtml(coin.description || '')}</p>
<p>${escapeHtml(coin.name || sym)} is documented here for literacy — ClearPath does not custody crypto, execute trades, or promise returns.</p>
${
  whatMoves.length
    ? `<h2>Common price drivers</h2>${listHtml(whatMoves)}`
    : ''
}
${related.length ? `<h2>Related concepts</h2>${listHtml(related)}` : ''}
<h2>Study path</h2>
<ol>
<li>Start with <a href="/education/crypto">Crypto school</a> if you are new to ledgers and wallets.</li>
<li>Read <a href="/learn/microstructure">market microstructure</a> to understand order books and spreads.</li>
<li>Browse related coins below, then open charts in the <a href="/">terminal</a>.</li>
</ol>
${relatedLinksSection(
  'Related crypto profiles',
  peers.map((c) => ({
    href: `/crypto/${String(c.symbol).toLowerCase()}`,
    label: `${c.name} (${String(c.symbol).toUpperCase()})`,
    blurb: c.category,
  }))
)}
<p><a href="/crypto">← All crypto</a> · <a href="/guides/leverage-risk">Leverage &amp; risk guide</a></p>
</article>`;
}

function renderForexProfile(pairKey: string): string | null {
  const fx = lookupForex(pairKey);
  if (!fx) return null;
  const pair = String(fx.pair);
  const affected = Array.isArray(fx.affectedBy) ? fx.affectedBy : [];
  const educationMoves = fx.education?.whatMoves || [];
  const relatedAssets = fx.education?.relatedAssets || [];

  return `${breadcrumbHtml([
    { name: 'Home', url: '/' },
    { name: 'Encyclopedia', url: '/encyclopedia' },
    { name: 'Forex', url: '/forex' },
    { name: pair },
  ])}
<h1>${escapeHtml(pair)} Forex Pair</h1>
<p class="lead">${escapeHtml(fx.description || `${pair} currency pair profile.`)}</p>
${metaGrid([
  { k: 'Pair', v: pair },
  { k: 'Type', v: String(fx.type || '') },
  {
    k: 'Countries',
    v: Array.isArray(fx.countries) ? fx.countries.join(', ') : '',
  },
])}
<article>
<h2>How to read ${escapeHtml(pair)}</h2>
<p>${escapeHtml(fx.description || '')} FX prices reflect relative interest rates, growth differentials, and risk sentiment between the two currencies — not a single “stock story.”</p>
${affected.length ? `<h2>Primary drivers</h2>${listHtml(affected)}` : ''}
${educationMoves.length ? `<h2>What students should watch</h2>${listHtml(educationMoves)}` : ''}
${relatedAssets.length ? `<h2>Related assets</h2>${listHtml(relatedAssets)}` : ''}
<h2>Continue learning</h2>
<ul>
<li><a href="/learn/correlations">Intermarket correlations</a> — how FX, yields, and commodities connect</li>
<li><a href="/learn/inflation">Inflation</a> — purchasing-power pressure on currencies</li>
<li><a href="/education/forex">Forex school</a> — structured lessons</li>
<li><a href="/guides/macro-spreads">Macro spreads guide</a> — yield curves and credit</li>
</ul>
<p><a href="/forex">← All forex pairs</a></p>
</article>`;
}

function renderCommodityProfile(symbol: string): string | null {
  const c = lookupCommodity(symbol);
  if (!c) return null;
  const sym = String(c.symbol).toUpperCase();
  const affected = Array.isArray(c.affectedBy) ? c.affectedBy : [];

  return `${breadcrumbHtml([
    { name: 'Home', url: '/' },
    { name: 'Encyclopedia', url: '/encyclopedia' },
    { name: 'Commodities', url: '/commodities' },
    { name: c.name || sym },
  ])}
<h1>${escapeHtml(c.name || sym)} (${escapeHtml(sym)})</h1>
<p class="lead">${escapeHtml(c.description || `${c.name} commodity profile.`)}</p>
${metaGrid([
  { k: 'Symbol', v: sym },
  { k: 'Category', v: String(c.category || '') },
])}
<article>
<h2>Market context</h2>
<p>${escapeHtml(c.description || '')}</p>
<p>Commodity prices are driven by physical supply, inventories, shipping, and the dollar’s path — study those forces before treating any chart pattern as a signal.</p>
${affected.length ? `<h2>Common drivers</h2>${listHtml(affected)}` : ''}
<h2>Related study</h2>
<ul>
<li><a href="/learn/correlations">Gold, yields, and intermarket links</a></li>
<li><a href="/education/commodities">Commodities school</a></li>
<li><a href="/guides/macro-spreads">Macro spreads</a></li>
<li><a href="/indicators">Indicator encyclopedia</a></li>
</ul>
<p><a href="/commodities">← All commodities</a></p>
</article>`;
}

function renderEconomyTopic(slug: string): string | null {
  const topic = lookupEconomy(slug);
  const kb = ENCYCLOPEDIA_KNOWLEDGE_BASE[`encyclopedia/economy/${slug}.html`];
  if (!topic && !kb) return null;

  const title = kb?.title || topic?.title || slug;
  const lead = kb?.definition || topic?.summary || '';
  const otherTopics = ECONOMY_TOPICS.filter((t) => t.slug !== slug).slice(0, 5);

  let body = '';
  if (kb) {
    body = `
<p><em>${escapeHtml(kb.tagline)}</em></p>
<p>${escapeHtml(kb.simplifiedExplanation)}</p>
<h2>Academic framing</h2>
<p>${escapeHtml(kb.academicDeconstruction)}</p>
<h2>Causal chain</h2>
<ol>
${kb.relationshipDiagram.map((r) => `<li><strong>${escapeHtml(r.label)}:</strong> ${escapeHtml(r.explanation)}</li>`).join('\n')}
</ol>
<h2>Historical markers</h2>
<ul>
${kb.timeline.map((t) => `<li><strong>${escapeHtml(t.year)} — ${escapeHtml(t.title)}:</strong> ${escapeHtml(t.desc)}</li>`).join('\n')}
</ul>
<p><strong>Key takeaway:</strong> ${escapeHtml(kb.keyTakeaway)}</p>
${faqSectionHtml(kb.detailsDisclosures.map((d) => ({ question: d.q, answer: d.a })))}
`;
  } else if (topic) {
    body = `<p>${escapeHtml(topic.summary)}</p>
<p>Read the related primers in <a href="/learn">Learn</a> and the <a href="/guides/macro-spreads">macro spreads guide</a> to connect this concept to live market structure.</p>`;
  }

  return `${breadcrumbHtml([
    { name: 'Home', url: '/' },
    { name: 'Encyclopedia', url: '/encyclopedia' },
    { name: title },
  ])}
<h1>${escapeHtml(title)}</h1>
<p class="lead">${escapeHtml(lead)}</p>
<article>
${body}
${relatedLinksSection(
  'More economy topics',
  otherTopics.map((t) => ({
    href: `/economy/${t.slug}`,
    label: t.title,
    blurb: t.summary,
  }))
)}
<p><a href="/learn/inflation">Inflation lesson</a> · <a href="/education/econ">Economics school</a> · <a href="/encyclopedia">Encyclopedia</a></p>
</article>`;
}

/**
 * Returns a complete crawlable HTML document for public content routes,
 * or null when the path is not a static content page (SPA handles it).
 * The result is passed through enrichHtmlWithMetadata for meta/JSON-LD.
 */
export function renderStaticContentPage(reqPath: string): string | null {
  const pathClean = reqPath.toLowerCase().split('?')[0].replace(/\/$/, '') || '/';
  const parts = pathClean.split('/').filter(Boolean);

  let body: string | null = null;
  if (pathClean === '/learn') body = renderLearnIndex();
  else if (pathClean.startsWith('/learn/')) body = renderLearnTopic(pathClean.slice('/learn/'.length));
  else if (pathClean === '/guides') body = renderGuidesIndex();
  else if (pathClean.startsWith('/guides/')) body = renderGuide(pathClean.slice('/guides/'.length));
  else if (pathClean === '/glossary') body = renderGlossary();
  else if (pathClean === '/faq') body = renderFaqPage();
  else if (parts[0] === 'indicators' && parts.length === 2) body = renderIndicatorDetail(parts[1]);
  else if (parts[0] === 'education' && parts.length === 2) body = renderEducationSchool(parts[1]);
  else if (parts[0] === 'education' && parts.length === 3) body = renderEducationUnit(parts[1], parts[2]);
  else if (parts[0] === 'education' && parts.length === 4) {
    body = renderEducationLesson(parts[1], parts[2], parts[3]);
  } else if (pathClean === '/ui') body = renderUiIndex();
  else if (parts[0] === 'ui' && parts.length === 2) body = renderUiProfile(parts[1]);
  else if (parts[0] === 'stocks' && parts.length === 2) body = renderStockProfile(parts[1]);
  else if (parts[0] === 'crypto' && parts.length === 2) body = renderCryptoProfile(parts[1]);
  else if (parts[0] === 'forex' && parts.length === 2) body = renderForexProfile(parts[1]);
  else if (parts[0] === 'commodities' && parts.length === 2) body = renderCommodityProfile(parts[1]);
  else if (parts[0] === 'economy' && parts.length === 2) body = renderEconomyTopic(parts[1]);

  if (body === null) return null;
  return renderShell(pathClean, body);
}
