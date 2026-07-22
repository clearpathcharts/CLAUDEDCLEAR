/**
 * Ensures homepage SSR HTML includes a crawlable <h1> (Bing URL Inspection).
 *
 * Run: npx tsx scripts/homepage-h1.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { enrichHtmlWithMetadata } from '../src/server/semanticDatabase.ts';

const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');
assert.match(
  indexHtml,
  /<h1 id="seo-document-h1"[^>]*>ClearPath Trader — Market Intelligence &amp; Education Terminal<\/h1>/,
  'index.html must ship a body <h1> Bing can see without waiting for React',
);

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
  'homepage enrichHtmlWithMetadata must expose an H1 in the body source',
);
assert.match(home, /id="loader-text"/, 'boot loader should remain for SPA boot');
assert.match(home, /<noscript>[\s\S]*<h1>/, 'noscript fallback should also include H1');

const about = enrichHtmlWithMetadata(shell, '/about');
assert.equal(
  (about.match(/<h1[\s>]/g) || []).length,
  0,
  'non-home SPA shell should not inject the homepage H1 via enrich',
);

console.log('homepage-h1.selftest: ok');
