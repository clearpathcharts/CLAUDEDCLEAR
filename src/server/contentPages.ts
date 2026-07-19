import { SEMANTIC_RECORDS, GENERAL_FAQS } from './semanticDatabase';
import { GUIDE_RECORDS, GLOSSARY_TERMS } from './contentData';

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
  aside.cta a { display: inline-block; background: #00E5FF; color: #000; font-weight: 900; font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; padding: 0.65rem 1.2rem; border-radius: 8px; text-decoration: none; }
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
        <a href="/">Launch the terminal</a>
      </aside>
    </main>
    <footer class="site">
      <div class="inner">
        <span>&copy; ClearPathTrader — analytics &amp; education, not a brokerage.</span>
        <a href="/about">About</a>
        <a href="/terms.html">Terms</a>
        <a href="/privacy.html">Privacy</a>
        <a href="/disclaimer.html">Disclaimer</a>
      </div>
    </footer>
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

/**
 * Returns a complete crawlable HTML document for public content routes,
 * or null when the path is not a static content page (SPA handles it).
 * The result is passed through enrichHtmlWithMetadata for meta/JSON-LD.
 */
export function renderStaticContentPage(reqPath: string): string | null {
  const pathClean = reqPath.toLowerCase().split('?')[0].replace(/\/$/, '') || '/';

  let body: string | null = null;
  if (pathClean === '/learn') body = renderLearnIndex();
  else if (pathClean.startsWith('/learn/')) body = renderLearnTopic(pathClean.slice('/learn/'.length));
  else if (pathClean === '/guides') body = renderGuidesIndex();
  else if (pathClean.startsWith('/guides/')) body = renderGuide(pathClean.slice('/guides/'.length));
  else if (pathClean === '/glossary') body = renderGlossary();
  else if (pathClean === '/faq') body = renderFaqPage();

  if (body === null) return null;
  return renderShell(pathClean, body);
}
