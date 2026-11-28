/**
 * SPA subpages must end up with exactly one <h1> in the live DOM.
 * index.html ships a static #seo-document-h1 for crawlers; when React renders its own page <h1>
 * (e.g. /about, /plans, /brokers) the guard demotes the static one, and restores it if the app h1 leaves.
 *
 * Run: npx tsx scripts/document-h1.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { installDocumentH1Guard, reconcileDocumentH1 } from '../src/lib/documentH1.ts';
import { enrichHtmlWithMetadata } from '../src/server/semanticDatabase.ts';

const countH1 = (html: string) => (html.match(/<h1[\s>]/gi) || []).length;
const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');

assert.equal(countH1(indexHtml), 1, 'index.html must keep exactly one static <h1> for non-JS crawlers');
for (const route of ['/', '/about', '/plans', '/brokers', '/desk/fundamental', '/privacy']) {
  const html = enrichHtmlWithMetadata(indexHtml, route);
  assert.ok(countH1(html) >= 1, `SSR ${route} must keep a crawlable <h1>`);
  assert.equal(countH1(html), 1, `SSR ${route} must not ship more than one <h1> (got ${countH1(html)})`);
}

function makeDom() {
  const dom = new JSDOM(
    `<!doctype html><body>
      <header id="seo-document-header"><h1 id="seo-document-h1" class="seo">Static title</h1></header>
      <div id="root"></div>
    </body>`,
  );
  return dom;
}

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

async function main() {
  const dom = makeDom();
  const doc = dom.window.document;
  const root = doc.getElementById('root')!;
  const h1Count = () => doc.querySelectorAll('h1').length;

  assert.equal(h1Count(), 1);
  reconcileDocumentH1(doc);
  assert.equal(h1Count(), 1, 'no app heading yet: static h1 stays');

  const stop = installDocumentH1Guard(doc);

  root.innerHTML = '<main><h1>About ClearPath</h1></main>';
  await tick();
  assert.equal(h1Count(), 1, 'app-owned h1 present: static one must be demoted');
  assert.equal(doc.querySelector('h1')?.textContent, 'About ClearPath');
  const demoted = doc.getElementById('seo-document-h1')!;
  assert.equal(demoted.tagName, 'P');
  assert.equal(demoted.textContent, 'Static title');

  root.innerHTML = '<main><h2>No page heading</h2></main>';
  await tick();
  assert.equal(h1Count(), 1, 'app h1 removed: static one must come back');
  assert.equal(doc.getElementById('seo-document-h1')!.tagName, 'H1');

  root.innerHTML = '<section><h1>Plans</h1></section>';
  await tick();
  assert.equal(h1Count(), 1);
  root.innerHTML = '<section><h1>Brokers</h1></section>';
  await tick();
  assert.equal(h1Count(), 1);
  assert.equal(doc.querySelector('h1')?.textContent, 'Brokers');

  stop();
  root.innerHTML = '';
  await tick();
  assert.equal(doc.getElementById('seo-document-h1')!.tagName, 'P', 'guard is disconnected after stop()');

  const appSrc = fs.readFileSync(path.resolve('src/main.tsx'), 'utf8');
  assert.match(appSrc, /installDocumentH1Guard\(\)/, 'main.tsx must install the document h1 guard');

  const landing = fs.readFileSync(path.resolve('src/components/desks/FundamentalLandingPage.tsx'), 'utf8');
  assert.equal((landing.match(/<h1[\s>]/g) || []).length, 1, 'FundamentalLandingPage renders exactly one <h1>');

  console.log('document-h1.selftest: ok');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
