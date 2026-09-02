/**
 * Self-test: FMP trading wire maps real headlines and calendar rows only.
 * Run: npm run test:fmp-news-wire
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import {
  normalizeFmpCalendarEvent,
  normalizeFmpNewsArticle,
} from '../src/server/fmpNewsWire.ts';

const news = normalizeFmpNewsArticle(
  {
    title: 'EUR/USD holds as traders wait on CPI',
    publisher: 'Reuters',
    publishedDate: '2026-09-01 18:00:00',
    url: 'https://example.com/eurusd',
    text: 'Cable and euro both quiet.',
  },
  'FOREX',
);
assert.ok(news);
assert.equal(news.title, 'EUR/USD holds as traders wait on CPI');
assert.equal(news.source, 'REUTERS');
assert.equal(news.category, 'FOREX');
assert.equal(news.pubDate, '2026-09-01 18:00:00');
assert.equal(normalizeFmpNewsArticle({ title: '  ' }, 'FOREX'), null);

const printed = normalizeFmpCalendarEvent({
  date: '2026-09-01 12:30:00',
  country: 'US',
  event: 'Nonfarm Payrolls',
  currency: 'USD',
  previous: 140,
  estimate: 165,
  actual: 180,
  impact: 'High',
});
assert.ok(printed);
assert.match(printed.title, /USD Nonfarm Payrolls/);
assert.match(printed.title, /actual 180/);
assert.match(printed.title, /est 165/);
assert.equal(printed.source, 'FMP · US · HIGH');
assert.equal(printed.category, 'HIGH');

const upcoming = normalizeFmpCalendarEvent({
  date: '2026-09-02 12:30:00',
  country: 'US',
  event: 'CPI YoY',
  currency: 'USD',
  previous: 2.6,
  estimate: 2.7,
  actual: null,
  impact: 'High',
});
assert.ok(upcoming);
assert.doesNotMatch(upcoming.title, /actual/);
assert.match(upcoming.title, /est 2.7/);
assert.equal(normalizeFmpCalendarEvent({ event: '' }), null);

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverTs = fs.readFileSync(path.join(root, 'server.ts'), 'utf8');
assert.match(serverTs, /fetchFmpDeskNews/);
assert.match(serverTs, /fetchFmpEconomicWire/);
assert.match(serverTs, /\/api\/newsdata\/latest/);
assert.match(serverTs, /\/api\/economic\/news/);

console.log('fmp-news-wire.selftest: ok');
