// One-off crawl-readiness audit: fetches every sitemap URL from the local
// dev server and validates status, canonical, title uniqueness, meta
// description, JSON-LD validity, and visible content.
const BASE = process.env.AUDIT_BASE || 'http://localhost:3000';
const PROD = 'https://clearpathtrader.com';

const xml = async (path) => (await fetch(BASE + path)).text();

const locs = (body) => [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

const index = await xml('/sitemap.xml');
const sitemaps = locs(index).map((u) => u.replace(PROD, ''));
let urls = [];
for (const sm of sitemaps) {
  urls = urls.concat(locs(await xml(sm)).map((u) => u.replace(PROD, '') || '/'));
}

console.log(`Sitemap index -> ${sitemaps.length} sitemaps -> ${urls.length} URLs\n`);

const titles = new Map();
let failures = 0;

for (const path of urls) {
  const res = await fetch(BASE + path, { redirect: 'manual' });
  const html = await res.text();
  const problems = [];

  if (res.status !== 200) problems.push(`status ${res.status}`);

  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  if (!title) problems.push('missing <title>');
  if (titles.has(title)) problems.push(`duplicate title of ${titles.get(title)}`);
  titles.set(title, path);

  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  if (!desc) problems.push('missing meta description');

  const canonical = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || '';
  const expected = PROD + (path === '/' ? '' : path);
  if (canonical !== expected) problems.push(`canonical ${canonical || '(none)'} != ${expected}`);

  const ogImage = (html.match(/property="og:image" content="([^"]*)"/) || [])[1] || '';
  if (!ogImage) problems.push('missing og:image');

  const ldBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (ldBlocks.length === 0) problems.push('no JSON-LD');
  for (const [, block] of ldBlocks) {
    try { JSON.parse(block); } catch { problems.push('invalid JSON-LD'); }
  }

  // Content check: page body must contain real text, not just the SPA loader
  const bodyText = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const isContentRoute = /^\/(learn|guides|glossary|faq)/.test(path);
  if (isContentRoute && bodyText.length < 1500) problems.push(`thin server-rendered content (${bodyText.length} chars)`);

  const status = problems.length ? 'FAIL' : 'ok';
  if (problems.length) failures++;
  console.log(`${status.padEnd(4)} ${path.padEnd(38)} title="${title.slice(0, 60)}" ld=${ldBlocks.length} text=${bodyText.length}${problems.length ? '\n     -> ' + problems.join('; ') : ''}`);
}

// robots.txt sanity
const robots = await (await fetch(BASE + '/robots.txt')).text();
console.log(`\nrobots.txt: ${robots.includes('Sitemap:') ? 'has sitemap' : 'MISSING SITEMAP'}, crawl-delay ${robots.toLowerCase().includes('crawl-delay') ? 'PRESENT (bad)' : 'absent (good)'}`);

// og image sanity
const og = await fetch(BASE + '/og-image.png');
const ogBytes = (await og.arrayBuffer()).byteLength;
console.log(`og-image.png: ${og.status}, ${ogBytes} bytes ${ogBytes > 10000 ? '(real image)' : '(PIXEL — bad)'}`);
const logo = await fetch(BASE + '/logo.png');
const logoBytes = (await logo.arrayBuffer()).byteLength;
console.log(`logo.png: ${logo.status}, ${logoBytes} bytes ${logoBytes > 10000 ? '(real image)' : '(PIXEL — bad)'}`);

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' URL(S) FAILED'}`);
process.exit(failures === 0 ? 0 : 1);
