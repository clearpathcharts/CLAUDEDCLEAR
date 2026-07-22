/**
 * Homepage must expose exactly one crawlable <h1> (Bing: missing OR more-than-one).
 * IndexNow public key must be Bing/Yandex-safe (no underscores).
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

assert.match(
  DEFAULT_PUBLIC_INDEXNOW_KEY,
  /^[a-zA-Z0-9-]{8,128}$/,
  'IndexNow key must be a-z A-Z 0-9 hyphen only (Bing/Yandex reject underscore)',
);
assert.doesNotMatch(DEFAULT_PUBLIC_INDEXNOW_KEY, /_/, 'IndexNow key must not contain underscore');

const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');
assert.equal(countH1(indexHtml), 1, 'index.html must contain exactly one <h1>');
assert.match(
  indexHtml,
  /<h1 id="seo-document-h1"[^>]*>ClearPath Trader — Market Intelligence &amp; Education Terminal<\/h1>/,
);

const keyFile = path.resolve('public', `${DEFAULT_PUBLIC_INDEXNOW_KEY}.txt`);
assert.equal(
  fs.readFileSync(keyFile, 'utf8').trim(),
  DEFAULT_PUBLIC_INDEXNOW_KEY,
);

process.env.INDEXNOW_KEY = '';
process.env.SESSION_SECRET = '';
process.env.CATALOG_ADMIN_SECRET = '';
assert.equal(resolveIndexNowKey(), DEFAULT_PUBLIC_INDEXNOW_KEY);

assert.equal(isSearchEngineBot('Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)'), true);

const botHome = enrichHtmlWithMetadata(renderStaticHomeForBots(), '/');
assert.equal(countH1(botHome), 1, 'bot homepage must have exactly one <h1>');

const shell = fs.readFileSync(path.resolve('index.html'), 'utf8');
const home = enrichHtmlWithMetadata(shell, '/');
assert.equal(countH1(home), 1, 'enriched homepage SPA shell must keep exactly one <h1>');
assert.doesNotMatch(home, /<noscript>[\s\S]*<h1/i, 'noscript must not add a second <h1>');

// Simulate stale deploy that still had an H1 inside noscript — enrich must demote it.
const stale = shell.replace(
  '<div id="root">',
  `<noscript><article><h1>Stale duplicate</h1></article></noscript>\n    <div id="root">`,
);
const cleaned = enrichHtmlWithMetadata(stale, '/');
assert.equal(countH1(cleaned), 1, 'stale noscript H1 must be removed/demoted');

console.log('homepage-h1.selftest: ok');
