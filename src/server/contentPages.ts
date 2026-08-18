import { SEMANTIC_RECORDS, GENERAL_FAQS } from './semanticDatabase';
import { GUIDE_RECORDS, GLOSSARY_TERMS } from './contentData';
import { getSchool, getUnit } from '../education/curriculumData';
import { getLessonBody } from '../education/lessonContent';
import {
  REGIONAL_MARKETS,
  getRegionalMarket,
  getRegionalFxEnrichment,
  type RegionalCtaCopy,
} from './regionalSeo';
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
  featuredStocks,
  featuredCrypto,
  featuredForex,
  featuredCommodities,
  allIndicators,
  catalogCounts,
} from './crawlCatalog';
import { buildIndicators } from '../components/indicatorsData';
import { ENCYCLOPEDIA_KNOWLEDGE_BASE } from '../components/encyclopedia/KnowledgeBaseData';
import { CURRICULUM } from '../education/curriculumData';
import { LITERACY_TRACKS } from '../literacy/data/literacyCurriculum';
import { SEED_WIKI } from '../literacy/data/conceptSeed';

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
  { href: '/accessibility', label: 'Accessibility · WCAG' },
  { href: '/ui', label: 'Accessible UI' },
  { href: '/learn', label: 'Learn' },
  { href: '/guides', label: 'Guides' },
  { href: '/glossary', label: 'Glossary' },
  { href: '/faq', label: 'FAQ' },
  { href: '/regions', label: 'Regions' },
  { href: '/education', label: 'Education' },
  { href: '/encyclopedia', label: 'Encyclopedia' },
  { href: '/indicators', label: 'Indicators' },
  { href: '/tools/position-size', label: 'Tools' },
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
  aside.cta a, a.btn { display: inline-block; background: #00E5FF; color: #000; font-weight: 900; font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; padding: 0.65rem 1.2rem; border-radius: 8px; text-decoration: none; }
  a.btn.ghost { background: transparent; color: #00E5FF; border: 1px solid rgba(0,229,255,0.5); }
  .btn-row { display: flex; flex-wrap: wrap; gap: 0.75rem; margin: 1rem 0 1.5rem; }
  .tool-grid { display: grid; gap: 0.75rem; max-width: 28rem; }
  .tool-grid label { display: grid; gap: 0.25rem; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.55); }
  .tool-grid input, .tool-grid select { background: rgba(0,0,0,0.45); border: 1px solid rgba(255,255,255,0.18); border-radius: 8px; color: #fff; padding: 0.55rem 0.7rem; font-size: 0.95rem; }
  .tool-result { margin-top: 1.25rem; border: 1px solid rgba(0,229,255,0.35); border-radius: 12px; padding: 1rem 1.1rem; background: rgba(0,229,255,0.06); }
  .tool-result .big { font-size: 1.6rem; font-weight: 900; color: #00E5FF; }
  .alpha-block { margin: 1.5rem 0; }
  .alpha-block h3 { color: #fff; font-size: 1rem; margin: 0 0 0.5rem; }
  .alpha-block .chip-row { display: flex; flex-wrap: wrap; gap: 0.4rem; }
  .alpha-block a.chip { font-size: 0.78rem; color: #00D9FF; text-decoration: none; border: 1px solid rgba(255,255,255,0.12); border-radius: 999px; padding: 0.25rem 0.65rem; background: rgba(255,255,255,0.03); }
  .alpha-block a.chip:hover { border-color: rgba(0,229,255,0.5); }
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

function renderShell(
  currentPath: string,
  bodyHtml: string,
  htmlLang = 'en',
  cta?: RegionalCtaCopy | null,
  robots = 'index, follow, max-image-preview:large',
): string {
  const nav = NAV_LINKS.map(
    (l) =>
      `<a href="${l.href}"${l.href === currentPath ? ' aria-current="page"' : ''}>${l.label}</a>`
  ).join('\n        ');

  const c =
    cta === null
      ? null
      : cta || {
          chartTitle: 'Put this knowledge on a live chart',
          chartBody:
            'ClearPath Trader is a free market intelligence terminal: live charts, unlimited indicators, automatic pattern detection, and a beginner-to-advanced education path.',
          launchLabel: 'Launch the terminal',
          educationLabel: 'Start education',
          waitlistTitle: 'Private Login is your real access',
          waitlistBody:
            'Create an account with email + password on the terminal (Private Login). Optional: leave your email below for launch notes only — this is not a login password.',
          firstNameLabel: 'First name',
          emailLabel: 'Email (updates only)',
          countryLabel: 'Country',
          countryPlaceholder: 'United States',
          experienceLabel: 'Experience',
          submitLabel: 'Email me launch notes',
          submittingMsg: 'Submitting…',
          successMsg: 'Saved for launch notes. Create your Private Login on the terminal for real access.',
        };

  const ctaHtml = c
    ? `
      <aside class="cta">
        <h2>${escapeHtml(c.chartTitle)}</h2>
        <p>${escapeHtml(c.chartBody)}</p>
        <div class="cta-actions">
          <a class="btn" href="/">${escapeHtml(c.launchLabel)}</a>
          <a class="btn" href="/education" style="background:transparent;color:#00E5FF;border:1px solid rgba(0,229,255,0.5)">${escapeHtml(c.educationLabel)}</a>
        </div>
        <h2 style="margin-top:0.5rem">${escapeHtml(c.waitlistTitle)}</h2>
        <p>${escapeHtml(c.waitlistBody)}</p>
        <form class="waitlist" id="cpt-waitlist" novalidate>
          <label>${escapeHtml(c.firstNameLabel)}<input name="firstName" required maxlength="200" autocomplete="given-name" /></label>
          <label>${escapeHtml(c.emailLabel)}<input name="emailAddress" type="email" required maxlength="320" autocomplete="email" /></label>
          <label>${escapeHtml(c.countryLabel)}<input name="country" required maxlength="120" autocomplete="country-name" placeholder="${escapeHtml(c.countryPlaceholder)}" /></label>
          <label>${escapeHtml(c.experienceLabel)}
            <select name="experienceLevel">
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
              <option>Professional</option>
            </select>
          </label>
          <button type="submit">${escapeHtml(c.submitLabel)}</button>
          <div class="status" id="cpt-waitlist-status" aria-live="polite"></div>
        </form>
      </aside>`
    : '';

  const submitMsg = c?.submittingMsg || 'Submitting…';
  const successMsg = c?.successMsg || 'You are on the waitlist. Check your email for confirmation.';

  return `<!doctype html>
<html lang="${htmlLang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ClearPathTrader</title>
    <meta name="robots" content="${escapeHtml(robots)}" />
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
${ctaHtml}
    </main>
    <footer class="site">
      <div class="inner">
        <span>&copy; ClearPathTrader — analytics &amp; education, not a brokerage.</span>
        <a href="/accessibility"><strong>Accessibility · WCAG</strong></a>
        <a href="/ui">Accessible UI Modes</a>
        <a href="/learn">Learn</a>
        <a href="/guides">Guides</a>
        <a href="/glossary">Glossary</a>
        <a href="/regions">Regions</a>
        <a href="/encyclopedia">Encyclopedia</a>
        <a href="/indicators">Indicators</a>
        <a href="/education">Education</a>
        <a href="/tools/position-size">Position size</a>
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
        var submittingMsg = ${JSON.stringify(submitMsg)};
        var successMsg = ${JSON.stringify(successMsg)};
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          status.className = 'status';
          status.textContent = submittingMsg;
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
              status.textContent = successMsg;
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
  const pictureNote = body.visual
    ? `<p><em>Open this lesson in ClearPath Education to see the labeled chart picture (ramp vs wall).</em></p>`
    : '';
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
${pictureNote}
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

function liveDeskCta(path: string, label: string): string {
  return `<div class="btn-row">
  <a class="btn" href="${path}?live=1">${escapeHtml(label)}</a>
  <a class="btn ghost" href="/">Launch terminal</a>
</div>`;
}

function renderEncyclopediaHub(): string {
  const counts = catalogCounts();
  const economyCards = ECONOMY_TOPICS.map(
    (t) =>
      `<li><a class="card" href="/economy/${t.slug}"><h2>${escapeHtml(t.title)}</h2><p>${escapeHtml(t.summary)}</p></a></li>`
  ).join('\n');
  return `${breadcrumbHtml([{ name: 'Home', url: '/' }, { name: 'Encyclopedia' }])}
<h1>Financial Encyclopedia</h1>
<p class="lead">A crawlable knowledge base of equities, crypto, forex, commodities, and macro concepts — ${counts.stocks.toLocaleString()} stock profiles, ${counts.crypto.toLocaleString()} crypto assets, ${counts.forex.toLocaleString()} FX pairs, and more.</p>
${liveDeskCta('/encyclopedia', 'Open interactive encyclopedia')}
<article>
<h2>Browse by market</h2>
<ul class="card-list">
<li><a class="card" href="/stocks"><h2>Stocks</h2><p>${counts.stocks.toLocaleString()} equity profiles with sector context and study paths.</p></a></li>
<li><a class="card" href="/crypto"><h2>Crypto</h2><p>${counts.crypto.toLocaleString()} coins and protocols explained for literacy, not hype.</p></a></li>
<li><a class="card" href="/forex"><h2>Forex</h2><p>${counts.forex.toLocaleString()} currency pairs with macro drivers.</p></a></li>
<li><a class="card" href="/commodities"><h2>Commodities</h2><p>${counts.commodities} metals, energy, and agriculture profiles.</p></a></li>
<li><a class="card" href="/companies"><h2>Companies</h2><p>Issuer directory linked to equity encyclopedia entries.</p></a></li>
</ul>
<h2>Economy &amp; macro concepts</h2>
<ul class="card-list">${economyCards}</ul>
<h2>Keep learning</h2>
<ul>
<li><a href="/indicators">Encyclopedia of Indicators</a> — ${counts.indicators} visual explainers</li>
<li><a href="/education">ClearPath Education</a> — ${counts.education} school/unit/lesson pages</li>
<li><a href="/learn">Learn library</a> · <a href="/guides">Guides</a> · <a href="/glossary">Glossary</a></li>
</ul>
</article>`;
}

function renderStocksHub(): string {
  const featured = featuredStocks(12);
  const cards = featured
    .map(
      (s) =>
        `<li><a class="card" href="/stocks/${String(s.ticker).toLowerCase()}"><h2>${escapeHtml(String(s.ticker).toUpperCase())} — ${escapeHtml(s.company)}</h2><p>${escapeHtml(s.sector || '')}${s.industry ? ' · ' + escapeHtml(s.industry) : ''}</p></a></li>`
    )
    .join('\n');
  const counts = catalogCounts();
  return `${breadcrumbHtml([
    { name: 'Home', url: '/' },
    { name: 'Encyclopedia', url: '/encyclopedia' },
    { name: 'Stocks' },
  ])}
<h1>Stock Encyclopedia</h1>
<p class="lead">${counts.stocks.toLocaleString()} equity profiles for education — sector, industry, and what tends to move each name. Not brokerage quotes.</p>
${liveDeskCta('/encyclopedia', 'Open interactive encyclopedia')}
<article>
<h2>Featured equities</h2>
<ul class="card-list">${cards}</ul>
<p>Every ticker in the catalog has its own URL under <code>/stocks/{ticker}</code> and is listed in <a href="/sitemap-stocks.xml">sitemap-stocks.xml</a> for crawlers.</p>
<p><a href="/education/stocks">Stocks school</a> · <a href="/learn/valuation">Valuation primer</a> · <a href="/tools/position-size">Position size calculator</a></p>
</article>`;
}

function renderCryptoHub(): string {
  const featured = featuredCrypto(12);
  const cards = featured
    .map(
      (c) =>
        `<li><a class="card" href="/crypto/${String(c.symbol).toLowerCase()}"><h2>${escapeHtml(c.name)} (${escapeHtml(String(c.symbol).toUpperCase())})</h2><p>${escapeHtml(c.category || '')}</p></a></li>`
    )
    .join('\n');
  const counts = catalogCounts();
  return `${breadcrumbHtml([
    { name: 'Home', url: '/' },
    { name: 'Encyclopedia', url: '/encyclopedia' },
    { name: 'Crypto' },
  ])}
<h1>Crypto Encyclopedia</h1>
<p class="lead">${counts.crypto.toLocaleString()} digital-asset profiles — ledgers, DeFi, and protocol categories explained in plain language.</p>
${liveDeskCta('/encyclopedia', 'Open interactive encyclopedia')}
<article>
<ul class="card-list">${cards}</ul>
<p><a href="/education/crypto">Crypto school</a> · <a href="/guides/leverage-risk">Leverage &amp; risk</a> · <a href="/learn/microstructure">Microstructure</a></p>
</article>`;
}

function renderForexHub(): string {
  const featured = featuredForex(10);
  const cards = featured
    .map((f) => {
      const key = String(f.pair).toLowerCase().replace('/', '');
      return `<li><a class="card" href="/forex/${key}"><h2>${escapeHtml(f.pair)}</h2><p>${escapeHtml(f.type || 'FX')} · ${escapeHtml(f.description || '')}</p></a></li>`;
    })
    .join('\n');
  const counts = catalogCounts();
  return `${breadcrumbHtml([
    { name: 'Home', url: '/' },
    { name: 'Encyclopedia', url: '/encyclopedia' },
    { name: 'Forex' },
  ])}
<h1>Forex Encyclopedia</h1>
<p class="lead">${counts.forex.toLocaleString()} currency pairs with type, drivers, and study links into macro education.</p>
${liveDeskCta('/encyclopedia', 'Open interactive encyclopedia')}
<article>
<ul class="card-list">${cards}</ul>
<p><a href="/education/forex">Forex school</a> · <a href="/learn/correlations">Intermarket correlations</a> · <a href="/guides/macro-spreads">Macro spreads</a></p>
</article>`;
}

function renderCommoditiesHub(): string {
  const featured = featuredCommodities(12);
  const cards = featured
    .map(
      (c) =>
        `<li><a class="card" href="/commodities/${String(c.symbol).toLowerCase()}"><h2>${escapeHtml(c.name)} (${escapeHtml(String(c.symbol).toUpperCase())})</h2><p>${escapeHtml(c.category || '')}</p></a></li>`
    )
    .join('\n');
  return `${breadcrumbHtml([
    { name: 'Home', url: '/' },
    { name: 'Encyclopedia', url: '/encyclopedia' },
    { name: 'Commodities' },
  ])}
<h1>Commodities Encyclopedia</h1>
<p class="lead">Metals, energy, agriculture, and livestock — physical markets that still set the tone for inflation and risk appetite.</p>
${liveDeskCta('/encyclopedia', 'Open interactive encyclopedia')}
<article>
<ul class="card-list">${cards}</ul>
<p><a href="/education/commodities">Commodities school</a> · <a href="/economy/inflation">Inflation</a></p>
</article>`;
}

function renderCompaniesHub(): string {
  const featured = featuredStocks(16);
  const cards = featured
    .map(
      (s) =>
        `<li><a class="card" href="/stocks/${String(s.ticker).toLowerCase()}"><h2>${escapeHtml(s.company)}</h2><p>Ticker ${escapeHtml(String(s.ticker).toUpperCase())} · ${escapeHtml(s.sector || '')}</p></a></li>`
    )
    .join('\n');
  return `${breadcrumbHtml([
    { name: 'Home', url: '/' },
    { name: 'Encyclopedia', url: '/encyclopedia' },
    { name: 'Companies' },
  ])}
<h1>Company Directory</h1>
<p class="lead">Issuers behind ClearPath equity encyclopedia entries. Start here, then open the matching stock profile for market context.</p>
${liveDeskCta('/encyclopedia', 'Open interactive encyclopedia')}
<article>
<ul class="card-list">${cards}</ul>
<p><a href="/stocks">Stock encyclopedia</a> · <a href="/learn/valuation">Valuation</a></p>
</article>`;
}

function renderIndicatorsHub(): string {
  const indicators = allIndicators();
  const byLetter = new Map<string, { slug: string; name: string }[]>();
  for (const ind of indicators) {
    const letter = (ind.name[0] || '#').toUpperCase();
    const key = /[A-Z]/.test(letter) ? letter : '#';
    if (!byLetter.has(key)) byLetter.set(key, []);
    byLetter.get(key)!.push({ slug: ind.slug, name: ind.name });
  }
  const letters = [...byLetter.keys()].sort();
  const blocks = letters
    .map((letter) => {
      const chips = byLetter
        .get(letter)!
        .map((i) => `<a class="chip" href="/indicators/${i.slug}">${escapeHtml(i.name)}</a>`)
        .join('\n');
      return `<div class="alpha-block"><h3>${letter}</h3><div class="chip-row">${chips}</div></div>`;
    })
    .join('\n');
  return `${breadcrumbHtml([{ name: 'Home', url: '/' }, { name: 'Indicators' }])}
<h1>Encyclopedia of ${indicators.length}+ Trading Indicators</h1>
<p class="lead">Every indicator has its own crawlable page with category, complexity, and a visual explainer — RSI, MACD, Bollinger, Ichimoku, order-flow tools, and more.</p>
${liveDeskCta('/indicators', 'Open interactive indicator desk')}
<article>
<p>Use the interactive desk to filter by complexity and video demos. Use the A–Z index below when you want a stable permalink for study or sharing.</p>
${blocks}
<p><a href="/education">ClearPath Education</a> · <a href="/guides">Guides</a> · <a href="/tools/position-size">Position size calculator</a></p>
</article>`;
}

function renderEducationHub(): string {
  const cards = CURRICULUM.map((school) => {
    const lessons = school.units.reduce((n, u) => n + u.lessons.length, 0);
    return `<li><a class="card" href="/education/${school.id}"><h2>${escapeHtml(school.name)}</h2><p>${escapeHtml(school.tagline)} · ${school.units.length} units · ${lessons} lessons</p></a></li>`;
  }).join('\n');
  return `${breadcrumbHtml([{ name: 'Home', url: '/' }, { name: 'Education' }])}
<h1>ClearPath Education</h1>
<p class="lead">Start with Chart Shapes if wedges and triangles look the same — two ramps come to a point, one ramp hits a wall. Then pick any market school. Plain-language lessons and unit quizzes.</p>
${liveDeskCta('/education', 'Open interactive classroom')}
<article>
<ul class="card-list">${cards}</ul>
<p><a href="/literacy">Literacy OS</a> · <a href="/learn">Learn library</a> · <a href="/encyclopedia">Encyclopedia</a></p>
</article>`;
}

function renderLiteracyHub(): string {
  const tracks = LITERACY_TRACKS.map(
    (t) =>
      `<li><a class="card" href="/literacy?live=1"><h2>${escapeHtml(t.title)}</h2><p>${escapeHtml(t.summary)} · ${t.lessons.length} lessons</p></a></li>`
  ).join('\n');
  const wiki = SEED_WIKI.slice(0, 8)
    .map(
      (w) =>
        `<li><a class="card" href="/literacy?live=1"><h2>${escapeHtml(w.title)}</h2><p>${escapeHtml(w.summary)}</p></a></li>`
    )
    .join('\n');
  return `${breadcrumbHtml([{ name: 'Home', url: '/' }, { name: 'Literacy OS' }])}
<h1>Literacy OS</h1>
<p class="lead">A study system for reading markets with confidence — concept wiki, curriculum tracks, and sentinel sources without the brokerage pitch.</p>
${liveDeskCta('/literacy', 'Open Literacy OS')}
<article>
<h2>Curriculum tracks</h2>
<ul class="card-list">${tracks}</ul>
<h2>Concept wiki samples</h2>
<ul class="card-list">${wiki}</ul>
<p><a href="/education">ClearPath Education</a> · <a href="/glossary">Glossary</a></p>
</article>`;
}

function renderPositionSizeTool(): string {
  return `${breadcrumbHtml([
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools/position-size' },
    { name: 'Position size' },
  ])}
<h1>Position Size Calculator</h1>
<p class="lead">Size a trade from account equity, risk percent, and stop distance — the same fixed-fractional math professionals use before leverage becomes a lottery ticket.</p>
<article>
<div class="tool-grid" id="pos-tool">
  <label>Account equity ($)<input id="equity" type="number" min="0" step="any" value="10000" /></label>
  <label>Risk per trade (%)<input id="riskPct" type="number" min="0" max="100" step="any" value="1" /></label>
  <label>Entry price<input id="entry" type="number" min="0" step="any" value="100" /></label>
  <label>Stop-loss price<input id="stop" type="number" min="0" step="any" value="95" /></label>
  <label>Contract / share size (optional)<input id="contract" type="number" min="0" step="any" value="1" /></label>
</div>
<div class="tool-result">
  <div>Risk dollars: <strong id="riskDollars">—</strong></div>
  <div>Stop distance: <strong id="stopDist">—</strong></div>
  <div class="big" id="qty">—</div>
  <div id="qtyLabel">Recommended position size</div>
</div>
<h2>The formula</h2>
<p><strong>Position size = (Account equity × Risk %) ÷ (Entry − Stop) ÷ Contract size</strong></p>
<p>If you risk 1% of a $10,000 account ($100) with a $5 stop, you can hold 20 shares (or 20 units) before the stop hits your planned loss. Leverage is an <em>output</em> of this math — never the starting input.</p>
<h2>Why this matters</h2>
<ul>
<li>Ten losing trades at 1% risk leave you down about 10% — survivable. Ten losers at 10% risk can end the account.</li>
<li>Volatility changes stop distance; the calculator forces you to resize instead of hoping.</li>
<li>Read the full framework in <a href="/guides/leverage-risk">Leverage &amp; Risk</a>.</li>
</ul>
${faqSectionHtml([
  {
    question: 'What risk percent should I use?',
    answer:
      'Many educators suggest 0.5%–2% of equity per trade. Lower is safer during learning. The calculator does not recommend a percent — it only sizes to the percent you choose.',
  },
  {
    question: 'Does this include fees or slippage?',
    answer:
      'No. Treat fees and slippage as extra stop distance, or reduce size further. The tool is an educational sizing aid, not an order ticket.',
  },
  {
    question: 'Can I use this for forex or futures?',
    answer:
      'Yes if you express stop distance in account-currency terms per unit (pip value × pip distance, or tick value × ticks). Set contract size to match your instrument’s unit multiplier.',
  },
])}
<p><a href="/guides/leverage-risk">Leverage guide</a> · <a href="/education">Education</a> · <a href="/ui">UI modes</a></p>
</article>
<script>
(function(){
  function n(id){ var el=document.getElementById(id); return el ? parseFloat(el.value) : NaN; }
  function money(x){ return isFinite(x) ? x.toLocaleString(undefined,{style:'currency',currency:'USD',maximumFractionDigits:2}) : '—'; }
  function calc(){
    var equity=n('equity'), riskPct=n('riskPct'), entry=n('entry'), stop=n('stop'), contract=n('contract')||1;
    var riskDollars = equity * (riskPct/100);
    var stopDist = Math.abs(entry - stop);
    var qty = (stopDist > 0 && contract > 0) ? riskDollars / stopDist / contract : NaN;
    document.getElementById('riskDollars').textContent = money(riskDollars);
    document.getElementById('stopDist').textContent = isFinite(stopDist) ? stopDist.toFixed(4) : '—';
    document.getElementById('qty').textContent = isFinite(qty) ? qty.toLocaleString(undefined,{maximumFractionDigits:4}) : '—';
    document.getElementById('qtyLabel').textContent = 'Units / shares to hold (at your risk budget)';
  }
  ['equity','riskPct','entry','stop','contract'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.addEventListener('input', calc);
  });
  calc();
})();
</script>`;
}

function renderToolsIndex(): string {
  return `${breadcrumbHtml([{ name: 'Home', url: '/' }, { name: 'Tools' }])}
<h1>Free Trading Calculators</h1>
<p class="lead">Practical tools you can use without signing up — starting with position sizing, the math that keeps accounts alive.</p>
<article>
<ul class="card-list">
<li><a class="card" href="/tools/position-size"><h2>Position Size Calculator</h2><p>Equity × risk % ÷ stop distance. Fixed-fractional sizing in seconds.</p></a></li>
</ul>
<p><a href="/guides/leverage-risk">Read the leverage &amp; risk guide</a> before you size up.</p>
</article>`;
}

/**
 * Returns a complete crawlable HTML document for public content routes,
 * or null when the path is not a static content page (SPA handles it).
 * The result is passed through enrichHtmlWithMetadata for meta/JSON-LD.
 */
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
  const enrich = getRegionalFxEnrichment(pairKey);
  const pair = enrich?.pairLabel || String(fx.pair);
  const affected = enrich?.drivers?.length
    ? enrich.drivers
    : Array.isArray(fx.affectedBy)
      ? fx.affectedBy
      : [];
  const educationMoves = enrich?.watchList?.length
    ? enrich.watchList
    : fx.education?.whatMoves || fx.education?.whatMovesThis || [];
  const relatedAssets = enrich?.relatedAssets?.length
    ? enrich.relatedAssets
    : fx.education?.relatedAssets || [];
  const lead =
    enrich?.lead || fx.description || `${pair} currency pair profile.`;
  const typeLabel = enrich?.type || String(fx.type || '');
  const countries = enrich?.countries?.length
    ? enrich.countries
    : Array.isArray(fx.countries)
      ? fx.countries
      : [];
  const hub = enrich ? getRegionalMarket(enrich.hubId) : null;

  return `${breadcrumbHtml([
    { name: 'Home', url: '/' },
    { name: 'Encyclopedia', url: '/encyclopedia' },
    { name: 'Forex', url: '/forex' },
    { name: pair },
  ])}
<h1>${escapeHtml(pair)} Forex Pair</h1>
<p class="lead">${escapeHtml(lead)}</p>
${metaGrid([
  { k: 'Pair', v: pair },
  { k: 'Type', v: typeLabel },
  {
    k: 'Countries',
    v: countries.join(', '),
  },
])}
<article>
<h2>How to read ${escapeHtml(pair)}</h2>
<p>${escapeHtml(lead)} FX prices reflect relative interest rates, growth differentials, and risk sentiment between the two currencies — not a single “stock story.”</p>
${affected.length ? `<h2>Primary drivers</h2>${listHtml(affected)}` : ''}
${educationMoves.length ? `<h2>What students should watch</h2>${listHtml(educationMoves)}` : ''}
${relatedAssets.length ? `<h2>Related assets</h2>${listHtml(relatedAssets)}` : ''}
${enrich?.contextHtml || ''}
${enrich?.faqs?.length ? faqSectionHtml(enrich.faqs) : ''}
${
  hub
    ? `<p><a href="${hub.hubPath}">← ${escapeHtml(hub.label)} regional hub</a> · <a href="/regions">All regions</a> · <a href="/forex">All forex pairs</a></p>`
    : ''
}
<h2>Continue learning</h2>
<ul>
<li><a href="/learn/correlations">Intermarket correlations</a> — how FX, yields, and commodities connect</li>
<li><a href="/learn/inflation">Inflation</a> — purchasing-power pressure on currencies</li>
<li><a href="/education/forex">Forex school</a> — structured lessons</li>
<li><a href="/guides/macro-spreads">Macro spreads guide</a> — yield curves and credit</li>
</ul>
${hub ? '' : '<p><a href="/forex">← All forex pairs</a></p>'}
</article>`;
}

/** True when path is /regions/:id and :id is not a known hub (should 404, not SPA). */
export function isUnknownRegionPath(reqPath: string): boolean {
  const pathClean = reqPath.toLowerCase().split('?')[0].replace(/\/$/, '') || '/';
  const parts = pathClean.split('/').filter(Boolean);
  return parts[0] === 'regions' && parts.length === 2 && !getRegionalMarket(parts[1]);
}

/** Crawlable 404 for unknown /regions/:id (noindex). */
export function renderUnknownRegionNotFound(reqPath: string): string {
  const pathClean = reqPath.toLowerCase().split('?')[0].replace(/\/$/, '') || '/';
  const slug = pathClean.split('/').filter(Boolean)[1] || '';
  const cards = REGIONAL_MARKETS.map(
    (m) =>
      `<li><a href="${m.hubPath}"><strong>${escapeHtml(m.label)}</strong></a> — ${escapeHtml(m.lead.slice(0, 120))}…</li>`
  ).join('\n');
  const body = `${breadcrumbHtml([
    { name: 'Home', url: '/' },
    { name: 'Regions', url: '/regions' },
    { name: 'Not found' },
  ])}
<h1>Regional hub not found</h1>
<p class="lead">No ClearPath language hub matches <code>${escapeHtml(slug)}</code>. Live hubs today: Russia / CIS, China, Japan, and the Philippines.</p>
<ul class="card-list">
${cards}
</ul>
<p><a href="/regions">← All regions</a> · <a href="/encyclopedia">Encyclopedia</a> · <a href="/">Launch terminal</a></p>`;
  return renderShell(pathClean, body, 'en', null, 'noindex, follow');
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
function renderAccessibilityPage(): string {
  return `${breadcrumbHtml([{ name: 'Home', url: '/' }, { name: 'Accessibility' }])}
<h1>Accessibility Statement</h1>
<p class="lead">ClearPath Trader aims to make market education and charting usable for people with disabilities, including keyboard-only users, screen-reader users, and neurodivergent traders.</p>
<article>
<h2>Our commitment</h2>
<p>We design public pages and terminal UI modes to align with the spirit of <strong>WCAG 2.2 Level AA</strong>: perceivable content, operable controls, understandable language, and robust markup. Accessibility is an ongoing program, not a one-time badge.</p>
<h2>What we support today</h2>
<ul>
<li><strong>Skip links</strong> to jump past navigation into main content</li>
<li><strong>Landmarks</strong> — header, primary navigation, main, and footer</li>
<li><strong>Keyboard focus</strong> with visible focus rings on interactive controls</li>
<li><strong>Semantic structure</strong> — headings, lists, labeled form fields, and breadcrumb navigation</li>
<li><strong>Reduced motion</strong> — decorative animation respects <code>prefers-reduced-motion</code></li>
<li><strong>Neurodivergent UI modes</strong> — calm focus, reading support, ADHD, autism-predictable layouts, minimal motion, and more at <a href="/ui">/ui</a></li>
<li><strong>Contrast-aware content pages</strong> — body text and links tuned for readable contrast on dark backgrounds</li>
</ul>
<h2>Known limitations</h2>
<p>Live chart canvases and dense terminal workspaces are inherently visual. We provide alternate text for indicator illustrations, plain-language education pages, and UI modes that reduce motion and visual noise. Some third-party embeds may not meet the same standard as first-party pages.</p>
<h2>How to get help or report a barrier</h2>
<p>If you encounter an accessibility barrier on clearpathtrader.com, email <a href="mailto:accessibility@clearpathtrader.com">accessibility@clearpathtrader.com</a> with the page URL, what you were trying to do, and the assistive technology you use (if any). We prioritize fixes that block core tasks: reading education, browsing the encyclopedia, and signing in.</p>
<h2>Standards &amp; scope</h2>
<p>This statement covers the public marketing site, education content, encyclopedia pages, and the authenticated ClearPath terminal. Last reviewed: August 2026.</p>
<p><a href="/ui">Explore accessible UI modes →</a> · <a href="/faq">FAQ</a> · <a href="/">Launch terminal</a></p>
</article>`;
}

function renderRegionsIndex(): string {
  const cards = REGIONAL_MARKETS.map(
    (m) => `<li><a class="card" href="${m.hubPath}">
  <h2>${escapeHtml(m.label)}</h2>
  <p>${escapeHtml(m.headline)}</p>
  <p>${escapeHtml(m.engines.join(' · '))}</p>
</a></li>`
  ).join('\n');
  return `${breadcrumbHtml([{ name: 'Home', url: '/' }, { name: 'Regions' }])}
<h1>ClearPath worldwide regions</h1>
<p class="lead">Hubs for follower markets — Russia / CIS, China, Japan (Tokyo), and the Philippines — with language-first landings that search engines can crawl.</p>
<ul class="card-list">
${cards}
</ul>
<p><a href="/learn">Learn</a> · <a href="/encyclopedia">Encyclopedia</a> · <a href="/">Launch terminal</a></p>`;
}

function renderRegionalHub(idOrAlias: string): string | null {
  const market = getRegionalMarket(idOrAlias);
  if (!market) return null;
  return `${breadcrumbHtml([
    { name: 'Home', url: '/' },
    { name: 'Regions', url: '/regions' },
    { name: market.label },
  ])}
<h1>${escapeHtml(market.headline)}</h1>
<p class="lead">${escapeHtml(market.lead)}</p>
${market.bodyHtml}`;
}

/** True when the request is from a major search / SEO crawler (not human browsers). */
export function isSearchEngineBot(userAgent: string | undefined | null): boolean {
  if (!userAgent) return false;
  return /googlebot|bingbot|bingpreview|adidxbot|yandex(?:bot|images|accessibility)?|baiduspider|duckduckbot|slurp|applebot|semrushbot|ahrefsbot|dotbot|petalbot|bytespider|facebookexternalhit|twitterbot|linkedinbot/i.test(
    userAgent,
  );
}

function renderHomeForBots(): string {
  return `${breadcrumbHtml([{ name: 'Home' }])}
<h1>ClearPath Trader — Market Intelligence &amp; Education Terminal</h1>
<p class="lead">Free market intelligence terminal with live charts, unlimited indicators, automatic pattern context, and plain-language trading education. Analytics and learning only — not a brokerage.</p>
<p>Explore the <a href="/encyclopedia">Financial Encyclopedia</a>, <a href="/indicators">Indicator Encyclopedia</a>, <a href="/education">ClearPath Education</a>, <a href="/learn">Learn</a>, <a href="/guides">Guides</a>, and <a href="/regions">regional hubs</a> for Russia, China, Japan, and the Philippines.</p>
<p><a href="/?live=1">Open the interactive ClearPath Trader terminal</a> · <a href="/about">About</a> · <a href="/faq">FAQ</a></p>`;
}

/** Crawlable homepage HTML for search bots (humans still get the SPA shell). */
export function renderStaticHomeForBots(): string {
  return renderShell('/', renderHomeForBots(), 'en');
}

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
  else if (pathClean === '/accessibility') body = renderAccessibilityPage();
  else if (pathClean === '/regions') body = renderRegionsIndex();
  else if (parts[0] === 'regions' && parts.length === 2) body = renderRegionalHub(parts[1]);
  else if (pathClean === '/encyclopedia' || pathClean === '/financial-encyclopedia') body = renderEncyclopediaHub();
  else if (pathClean === '/stocks') body = renderStocksHub();
  else if (pathClean === '/crypto') body = renderCryptoHub();
  else if (pathClean === '/forex') body = renderForexHub();
  else if (pathClean === '/commodities') body = renderCommoditiesHub();
  else if (pathClean === '/companies') body = renderCompaniesHub();
  else if (pathClean === '/indicators' || pathClean === '/encyclopedia-of-indicators') body = renderIndicatorsHub();
  else if (parts[0] === 'indicators' && parts.length === 2) body = renderIndicatorDetail(parts[1]);
  else if (pathClean === '/education' || pathClean === '/clearpath-education') body = renderEducationHub();
  else if (parts[0] === 'education' && parts.length === 2) body = renderEducationSchool(parts[1]);
  else if (parts[0] === 'education' && parts.length === 3) body = renderEducationUnit(parts[1], parts[2]);
  else if (parts[0] === 'education' && parts.length === 4) {
    body = renderEducationLesson(parts[1], parts[2], parts[3]);
  } else if (pathClean === '/literacy' || pathClean === '/literacy-os') body = renderLiteracyHub();
  else if (pathClean === '/ui') body = renderUiIndex();
  else if (parts[0] === 'ui' && parts.length === 2) body = renderUiProfile(parts[1]);
  else if (pathClean === '/tools' || pathClean === '/tools/position-size') {
    body = pathClean === '/tools' ? renderToolsIndex() : renderPositionSizeTool();
  } else if (parts[0] === 'stocks' && parts.length === 2) body = renderStockProfile(parts[1]);
  else if (parts[0] === 'crypto' && parts.length === 2) body = renderCryptoProfile(parts[1]);
  else if (parts[0] === 'forex' && parts.length === 2) body = renderForexProfile(parts[1]);
  else if (parts[0] === 'commodities' && parts.length === 2) body = renderCommodityProfile(parts[1]);
  else if (parts[0] === 'economy' && parts.length === 2) body = renderEconomyTopic(parts[1]);

  if (body === null) return null;
  const market =
    parts[0] === 'regions' && parts.length === 2 ? getRegionalMarket(parts[1]) : null;
  const htmlLang = market?.lang?.split('-')[0] || 'en';
  return renderShell(pathClean, body, htmlLang, market?.cta);
}
