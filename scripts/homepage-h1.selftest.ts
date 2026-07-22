/**
 * Ensures homepage SSR HTML includes a crawlable visible <h1> (Bing URL Inspection).
 *
 * Run: npx tsx scripts/homepage-h1.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { enrichHtmlWithMetadata } from '../src/server/semanticDatabase.ts';
import {
  isSearchEngineBot,
  renderStaticHomeForBots,
} from '../src/server/contentPages.ts';
import {
  DEFAULT_PUBLIC_INDEXNOW_KEY,
  resolveIndexNowKey,
} from '../src/server/indexNow.ts';

const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');
assert.match(
  indexHtml,
  /<h1 id="seo-document-h1"[^>]*>ClearPath Trader — Market Intelligence &amp; Education Terminal<\/h1>/,
  'index.html must ship a visible body <h1> for Bing',
);
assert.doesNotMatch(
  indexHtml,
  /seo-document-h1"[^>]*clip:rect/,
  'homepage H1 must not use clip/hidden cloaking Bing ignores',
);

const keyFile = path.resolve('public', `${DEFAULT_PUBLIC_INDEXNOW_KEY}.txt`);
assert.equal(
  fs.readFileSync(keyFile, 'utf8').trim(),
  DEFAULT_PUBLIC_INDEXNOW_KEY,
  'IndexNow ownership key file must match DEFAULT_PUBLIC_INDEXNOW_KEY',
);

process.env.INDEXNOW_KEY = '';
process.env.SESSION_SECRET = '';
process.env.CATALOG_ADMIN_SECRET = '';
assert.equal(resolveIndexNowKey(), DEFAULT_PUBLIC_INDEXNOW_KEY);

assert.equal(isSearchEngineBot('Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)'), true);
assert.equal(isSearchEngineBot('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120'), false);

const botHome = enrichHtmlWithMetadata(renderStaticHomeForBots(), '/');
assert.match(
  botHome,
  /<h1>ClearPath Trader — Market Intelligence &amp; Education Terminal<\/h1>/,
  'bot homepage must expose a normal in-flow H1',
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
  'homepage enrichHtmlWithMetadata must expose an H1 when shell lacks one',
);

console.log('homepage-h1.selftest: ok');
