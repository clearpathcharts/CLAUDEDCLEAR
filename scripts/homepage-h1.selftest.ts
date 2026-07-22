/**
 * Ensures homepage SSR HTML includes a crawlable <h1> (Bing URL Inspection).
 *
 * Run: npx tsx scripts/homepage-h1.selftest.ts
 */
import assert from 'node:assert/strict';
import { enrichHtmlWithMetadata } from '../src/server/semanticDatabase.ts';

const shell = `<!doctype html>
<html lang="en">
  <head><title>t</title></head>
  <body>
    <div id="root">
      <div role="status">
        <div id="loader-text">Loading New Architecture...</div>
      </div>
    </div>
  </body>
</html>`;

const home = enrichHtmlWithMetadata(shell, '/');
assert.match(
  home,
  /<h1[^>]*>ClearPath Trader — Market Intelligence &amp; Education Terminal<\/h1>/,
  'homepage must expose an H1 in the body source for Bing/crawlers',
);
assert.match(home, /id="loader-text"/, 'boot loader should remain for SPA boot');
assert.match(home, /<noscript>[\s\S]*<h1>/, 'noscript fallback should also include H1');

const about = enrichHtmlWithMetadata(shell, '/about');
assert.equal(
  (about.match(/<h1[\s>]/g) || []).length,
  0,
  'non-home SPA shell should not inject the homepage H1',
);

console.log('homepage-h1.selftest: ok');
