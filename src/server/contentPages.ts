import { SEMANTIC_RECORDS, GENERAL_FAQS } from './semanticDatabase';
import { GUIDE_RECORDS, GLOSSARY_TERMS } from './contentData';
import { getSchool, getUnit } from '../education/curriculumData';
import { getLessonBody } from '../education/lessonContent';
import { PROFILE_SEO, lookupIndicator } from './crawlCatalog';
import { buildIndicators } from '../components/indicatorsData';

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
  { href: '/accessibility', label: 'Accessibility' },
];

const PAGE_CSS = `
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #050505; color: #e8e8e8; font-family: ui-sans-serif, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.7; }
  .skip-link { position: absolute; left: -9999px; top: 0; z-index: 1000; background: #00E5FF; color: #000; font-weight: 800; padding: 0.75rem 1.25rem; text-decoration: none; border-radius: 0 0 8px 0; }
  .skip-link:focus { left: 0; outline: 3px solid #fff; outline-offset: 2px; }
  a:focus-visible, button:focus-visible, summary:focus-visible, select:focus-visible, input:focus-visible {
    outline: 3px solid #00E5FF; outline-offset: 2px;
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
  }
  header.site { position: sticky; top: 0; z-index: 50; background: rgba(0,0,0,0.92); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.12); }
  header.site .inner { max-width: 60rem; margin: 0 auto; padding: 0.75rem 1rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; }
  header.site .brand { color: #00E5FF; font-weight: 900; font-size: 0.8rem; letter-spacing: 0.2em; text-transform: uppercase; text-decoration: none; min-height: 44px; display: inline-flex; align-items: center; }
  header.site nav { display: flex; gap: 0.85rem; flex-wrap: wrap; }
  header.site nav a { color: #c4c4c4; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; text-decoration: none; min-height: 44px; display: inline-flex; align-items: center; }
  header.site nav a:hover, header.site nav a[aria-current="page"] { color: #00E5FF; }
  main { max-width: 48rem; margin: 0 auto; padding: 2.5rem 1.25rem 4rem; }
  nav.breadcrumb { font-size: 0.8rem; color: #b0b0b0; margin-bottom: 1.5rem; }
  nav.breadcrumb ol { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 0.35rem; align-items: center; }
  nav.breadcrumb li { display: inline-flex; align-items: center; gap: 0.35rem; }
  nav.breadcrumb li:not(:last-child)::after { content: '›'; color: #8a8a8a; }
  nav.breadcrumb a { color: #5EEBFF; text-decoration: underline; text-underline-offset: 2px; }
  h1 { font-size: 1.9rem; line-height: 1.25; color: #fff; margin: 0 0 0.75rem; }
  p.lead { color: #d0d0d0; font-size: 1.05rem; margin: 0 0 2rem; }
  article h2 { font-size: 1.35rem; color: #00E5FF; margin: 2.25rem 0 0.75rem; }
  article h3 { font-size: 1.1rem; color: #fff; margin: 1.75rem 0 0.5rem; }
  article p { margin: 0 0 1rem; color: #d6d6d6; }
  article ul, article ol { margin: 0 0 1.25rem; padding-left: 1.4rem; color: #d6d6d6; }
  article li { margin-bottom: 0.4rem; }
  article a { color: #5EEBFF; text-decoration: underline; text-underline-offset: 2px; font-weight: 600; }
  article a:hover { color: #9FF5FF; }
  pre.math { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0.9rem 1rem; overflow-x: auto; font-size: 0.85rem; color: #9fe8ff; }
  .card-list { display: grid; gap: 1rem; margin: 0; padding: 0; list-style: none; }
  .card-list a.card { display: block; border: 1px solid rgba(255,255,255,0.18); border-radius: 12px; padding: 1.1rem 1.25rem; text-decoration: none; background: rgba(255,255,255,0.03); transition: border-color 0.15s; }
  .card-list a.card:hover { border-color: rgba(0,229,255,0.5); }
  .card-list .card h2 { margin: 0 0 0.35rem; font-size: 1.05rem; color: #00E5FF; }
  .card-list .card p { margin: 0; font-size: 0.85rem; color: #c8c8c8; }
  dl.glossary dt { color: #00E5FF; font-weight: 800; font-size: 1rem; margin-top: 1.4rem; }
  dl.glossary dd { margin: 0.25rem 0 0; color: #d0d0d0; }
  section.faqs { margin-top: 2.5rem; border-top: 1px solid rgba(255,255,255,0.12); padding-top: 1.5rem; }
  section.faqs h2 { font-size: 1.3rem; color: #fff; }
  section.faqs details { border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 0.85rem 1rem; margin: 0.75rem 0; background: rgba(255,255,255,0.02); }
  section.faqs summary { color: #00E5FF; font-size: 1rem; font-weight: 700; cursor: pointer; min-height: 44px; display: flex; align-items: center; }
  section.faqs details p { color: #d0d0d0; margin: 0.75rem 0 0; }
  aside.cta { margin-top: 3rem; border: 1px solid rgba(0,229,255,0.35); background: rgba(0,229,255,0.06); border-radius: 14px; padding: 1.4rem 1.5rem; }
  aside.cta h2 { margin: 0 0 0.4rem; font-size: 1.1rem; color: #fff; }
  aside.cta p { margin: 0 0 0.9rem; font-size: 0.9rem; color: #d0d0d0; }
  aside.cta a { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; background: #00E5FF; color: #000; font-weight: 900; font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; padding: 0.65rem 1.2rem; border-radius: 8px; text-decoration: none; }
  footer.site { border-top: 1px solid rgba(255,255,255,0.1); margin-top: 2rem; }
  footer.site .inner { max-width: 60rem; margin: 0 auto; padding: 1.5rem 1rem; display: flex; flex-wrap: wrap; gap: 1rem; font-size: 0.8rem; color: #b0b0b0; }
  footer.site a { color: #c8c8c8; text-decoration: underline; text-underline-offset: 2px; min-height: 44px; display: inline-flex; align-items: center; }
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
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
    <meta name="theme-color" content="#0b0e11" />
    <style>${PAGE_CSS}</style>
  </head>
  <body>
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <header class="site">
      <div class="inner">
        <a class="brand" href="/">ClearPath Trader</a>
        <nav aria-label="Primary">
        ${nav}
        </nav>
      </div>
    </header>
    <main id="main-content" tabindex="-1">
${bodyHtml}
      <aside class="cta" aria-label="Open the trading terminal">
        <h2>Put this knowledge on a live chart</h2>
        <p>ClearPath Trader is a free market intelligence terminal: live charts, unlimited indicators, automatic pattern detection, and a beginner-to-advanced education path.</p>
        <a href="/">Launch the terminal</a>
      </aside>
    </main>
    <footer class="site">
      <div class="inner">
        <span>&copy; ClearPathTrader — analytics &amp; education, not a brokerage.</span>
        <a href="/about">About</a>
        <a href="/accessibility">Accessibility</a>
        <a href="/terms.html">Terms</a>
        <a href="/privacy.html">Privacy</a>
        <a href="/disclaimer.html">Disclaimer</a>
      </div>
    </footer>
  </body>
</html>`;
}

function breadcrumbHtml(items: { name: string; url?: string }[]): string {
  const parts = items.map((item, idx) => {
    const isLast = idx === items.length - 1;
    const inner = item.url && !isLast
      ? `<a href="${item.url}">${escapeHtml(item.name)}</a>`
      : `<span aria-current="page">${escapeHtml(item.name)}</span>`;
    return `<li>${inner}</li>`;
  });
  return `<nav class="breadcrumb" aria-label="Breadcrumb"><ol>${parts.join('')}</ol></nav>`;
}

function faqSectionHtml(faqs: { question: string; answer: string }[]): string {
  if (!faqs.length) return '';
  const items = faqs
    .map(
      (f) =>
        `<details>\n<summary>${escapeHtml(f.question)}</summary>\n<p>${escapeHtml(f.answer)}</p>\n</details>`
    )
    .join('\n');
  return `<section class="faqs" aria-labelledby="faq-heading">\n<h2 id="faq-heading">Frequently asked questions</h2>\n${items}\n</section>`;
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
<p>This statement covers the public marketing site, education content, encyclopedia pages, and the authenticated ClearPath terminal. Last reviewed: July 2026.</p>
<p><a href="/ui">Explore accessible UI modes →</a> · <a href="/faq">FAQ</a> · <a href="/">Launch terminal</a></p>
</article>`;
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
  else if (pathClean === '/accessibility') body = renderAccessibilityPage();
  else if (parts[0] === 'indicators' && parts.length === 2) body = renderIndicatorDetail(parts[1]);
  else if (parts[0] === 'education' && parts.length === 2) body = renderEducationSchool(parts[1]);
  else if (parts[0] === 'education' && parts.length === 3) body = renderEducationUnit(parts[1], parts[2]);
  else if (parts[0] === 'education' && parts.length === 4) {
    body = renderEducationLesson(parts[1], parts[2], parts[3]);
  } else if (pathClean === '/ui') body = renderUiIndex();
  else if (parts[0] === 'ui' && parts.length === 2) body = renderUiProfile(parts[1]);

  if (body === null) return null;
  return renderShell(pathClean, body);
}
