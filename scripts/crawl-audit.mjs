// Crawl-readiness audit: validates sitemap index, samples every child sitemap,
// and deeply checks content hubs + a representative set of entity pages.
const BASE = process.env.AUDIT_BASE || 'http://localhost:3000';
const PROD = 'https://clearpathtrader.com';

const xml = async (path) => (await fetch(BASE + path)).text();
const locs = (body) => [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

const index = await xml('/sitemap.xml');
const sitemaps = locs(index).map((u) => u.replace(PROD, ''));
console.log(`Sitemap index → ${sitemaps.length} child sitemaps\n`);

let totalUrls = 0;
const samples = [];
const counts = {};

for (const sm of sitemaps) {
  const body = await xml(sm);
  const urls = locs(body).map((u) => u.replace(PROD, '') || '/');
  counts[sm] = urls.length;
  totalUrls += urls.length;
  // Sample first, middle, last from each sitemap
  if (urls.length) {
    samples.push(urls[0]);
    if (urls.length > 2) samples.push(urls[Math.floor(urls.length / 2)]);
    if (urls.length > 1) samples.push(urls[urls.length - 1]);
  }
  console.log(`  ${sm.padEnd(32)} ${urls.length} URLs`);
}

// Always deep-check these critical pages
const mustCheck = [
  '/',
  '/encyclopedia',
  '/indicators',
  '/indicators/relative-strength-index-rsi',
  '/indicators/macd',
  '/education',
  '/education/crypto',
  '/education/crypto/crypto-u1',
  '/education/crypto/crypto-u1/crypto-u1-l1',
  '/literacy',
  '/stocks',
  '/crypto',
  '/forex',
  '/commodities',
  '/companies',
  '/tools',
  '/tools/position-size',
  '/ui',
  '/ui/calm_focus',
  '/ui/autism_predictable',
  '/stocks/aapl',
  '/crypto/btc',
  '/forex/eurusd',
  '/commodities/xauusd',
  '/economy/inflation',
  '/learn/inflation',
  '/guides/macro-spreads',
  '/glossary',
  '/faq',
  '/accessibility',
];

const toCheck = [...new Set([...mustCheck, ...samples])];
console.log(`\nDeep-checking ${toCheck.length} URLs (total catalog: ${totalUrls})\n`);

const titles = new Map();
let failures = 0;

for (const path of toCheck) {
  const res = await fetch(BASE + path, { redirect: 'manual' });
  const html = await res.text();
  const problems = [];

  if (res.status !== 200) problems.push(`status ${res.status}`);

  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  if (!title) problems.push('missing <title>');
  if (titles.has(title) && titles.get(title) !== path) {
    // Allow only if one is a known alias — otherwise flag
    problems.push(`duplicate title of ${titles.get(title)}`);
  }
  titles.set(title, path);

  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  if (!desc) problems.push('missing meta description');

  const canonical = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || '';
  const expected = PROD + (path === '/' ? '' : path);
  if (canonical !== expected) problems.push(`canonical ${canonical || '(none)'} != ${expected}`);

  const ldBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (ldBlocks.length === 0) problems.push('no JSON-LD');
  for (const [, block] of ldBlocks) {
    try { JSON.parse(block); } catch { problems.push('invalid JSON-LD'); }
  }

  const bodyText = html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');

  // Hubs + authored content + entity SSR pages must be thick.
  const isThickStatic =
    /^\/(learn|guides|glossary|faq|accessibility)(\/|$)/.test(path) ||
    /^\/(encyclopedia|literacy|companies|tools)(\/|$)/.test(path) ||
    /^\/(indicators|education|ui)(\/|$)/.test(path) ||
    ['/stocks', '/crypto', '/forex', '/commodities'].includes(path) ||
    /^\/(stocks|crypto|forex|commodities|economy)\//.test(path);
  if (isThickStatic && bodyText.length < 800) {
    problems.push(`thin server-rendered content (${bodyText.length} chars)`);
  }
  if (path === '/tools/position-size' && !html.includes('pos-tool')) {
    problems.push('position size calculator missing');
  }
  if (['/encyclopedia', '/indicators', '/education'].includes(path) && !html.includes('live=1')) {
    problems.push('missing interactive ?live=1 CTA');
  }

  // Entity pages must not use the default homepage title
  if (/^\/(stocks|crypto|forex|commodities|economy)\//.test(path)) {
    if (/Four Trader Desks on One Site|Market Intelligence & Education Terminal|Financial Intelligence Platform/.test(title) && !/Stock Profile|Crypto Profile|Forex|Commodity|Economy|—|Accessibility/.test(title)) {
      problems.push('entity page still has default title');
    }
    if (!html.includes('/?login=1') && !html.includes('Private Login')) {
      problems.push('missing Private Login CTA');
    }
  }

  const status = problems.length ? 'FAIL' : 'ok';
  if (problems.length) failures++;
  console.log(
    `${status.padEnd(4)} ${path.padEnd(48)} ld=${ldBlocks.length} text=${bodyText.length}` +
      (problems.length ? `\n     -> ${problems.join('; ')}` : '')
  );
}

const countsRes = await fetch(BASE + '/api/seo/catalog-counts');
const catalog = await countsRes.json();
console.log('\nCatalog counts API:', catalog);

console.log(`\nTotal sitemap URLs: ${totalUrls}`);
console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} URL(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
