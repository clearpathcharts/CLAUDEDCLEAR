/**
 * RSS discover helpers for the YWC ingest script.
 * Run: npx tsx scripts/rss-discover.selftest.ts
 */
import assert from 'node:assert/strict';
import {
  candidateFeedUrls,
  feedLinksFromHtml,
  homepageFromDomain,
  registrableHost,
} from '../src/server/rssDiscover.ts';

assert.equal(registrableHost('www.motorsport.com'), 'motorsport.com');
assert.equal(registrableHost('cdn-5.motorsport.com'), 'motorsport.com');
assert.equal(homepageFromDomain('motorsport.com'), 'https://motorsport.com/');
assert.equal(homepageFromDomain('# comment'), null);
assert.equal(homepageFromDomain('http://evil.example'), null, 'http homepages are rejected');

const html = `<link rel="alternate" type="application/rss+xml" href="/rss/f1/news/" />`;
const links = feedLinksFromHtml(html, 'https://www.motorsport.com/');
assert.ok(links.some((u) => u.includes('/rss/f1/news/')));

const candidates = candidateFeedUrls('https://www.wired.com/', html);
assert.ok(candidates.some((u) => u.endsWith('/feed')));
assert.ok(candidates.every((u) => u.startsWith('https://')));

console.log('rss-discover.selftest: ok');
