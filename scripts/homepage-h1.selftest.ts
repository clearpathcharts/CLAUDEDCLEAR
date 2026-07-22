/**
 * Homepage must expose exactly one crawlable <h1> (Bing: missing OR more-than-one).
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

function countH1(html: string): number {
  return (html.match(/<h1[\s>]/gi) || []).length;
}

const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');
assert.equal(countH1(indexHtml), 1, 'index.html must contain exactly one <h1>');
assert.match(
  indexHtml,
  /<h1 id="seo-document-h1"[^>]*>ClearPath Trader — Market Intelligence &amp; Education Terminal<\/h1>/,
  'index.html must ship the canonical homepage H1',
);
assert.doesNotMatch(
  indexHtml,
  /seo-document-h1"[^>]*clip:rect/,
  'homepage H1 must not use clip/hidden cloaking',
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
assert.equal(countH1(botHome), 1, 'bot homepage must have exactly one <h1>');
assert.match(
  botHome,
  /<h1>ClearPath Trader — Market Intelligence &amp; Education Terminal<\/h1>/,
);

const shell = fs.readFileSync(path.resolve('index.html'), 'utf8');
const home = enrichHtmlWithMetadata(shell, '/');
assert.equal(countH1(home), 1, 'enriched homepage SPA shell must keep exactly one <h1>');
assert.match(home, /<noscript>[\s\S]*<\/noscript>/, 'noscript fallback should exist');
assert.doesNotMatch(
  home,
  /<noscript>[\s\S]*<h1/i,
  'noscript must not add a second <h1>',
);

console.log('homepage-h1.selftest: ok');
