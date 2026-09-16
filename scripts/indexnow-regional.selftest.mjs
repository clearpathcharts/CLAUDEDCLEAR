/**
 * IndexNow URL normalization + regional market config checks (no network).
 */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const INDEXNOW_HOST = 'clearpathtrader.com';
const INDEXNOW_SITE = `https://${INDEXNOW_HOST}`;

function normalizeIndexNowUrls(urls) {
  const out = [];
  const seen = new Set();
  for (const raw of urls) {
    if (typeof raw !== 'string') continue;
    let u;
    try {
      u = new URL(raw.trim());
    } catch {
      try {
        u = new URL(raw.trim().startsWith('/') ? raw.trim() : `/${raw.trim()}`, INDEXNOW_SITE);
      } catch {
        continue;
      }
    }
    if (u.protocol !== 'https:' && u.protocol !== 'http:') continue;
    if (u.hostname.replace(/^www\./, '') !== INDEXNOW_HOST) continue;
    u.hash = '';
    const href = u.toString().replace(/\/$/, u.pathname === '/' ? '/' : '');
    if (seen.has(href)) continue;
    seen.add(href);
    out.push(href);
  }
  return out;
}

function resolveIndexNowKey(env) {
  const fromEnv = (env.INDEXNOW_KEY || '').trim();
  // Match server: Bing/Yandex-safe charset (no underscore)
  if (fromEnv && /^[a-zA-Z0-9-]{8,128}$/.test(fromEnv)) return fromEnv;
  const seed = env.SESSION_SECRET?.trim() || env.CATALOG_ADMIN_SECRET?.trim() || '';
  if (!seed) return 'clearpath-trader-indexnow-01';
  return crypto.createHash('sha256').update(`indexnow:${seed}`).digest('hex').slice(0, 32);
}

const REGIONAL_MARKETS = [
  { id: 'ru', ogLocale: 'ru_RU', lang: 'ru-RU' },
  { id: 'cn', ogLocale: 'zh_CN', lang: 'zh-CN' },
  { id: 'jp', ogLocale: 'ja_JP', lang: 'ja-JP' },
  { id: 'ph', ogLocale: 'fil_PH', lang: 'fil-PH' },
];

assert.equal(resolveIndexNowKey({ INDEXNOW_KEY: 'clearpath-indexnow-testkey-01' }), 'clearpath-indexnow-testkey-01');
assert.equal(resolveIndexNowKey({ INDEXNOW_KEY: 'bad' }), 'clearpath-trader-indexnow-01');
assert.equal(resolveIndexNowKey({ INDEXNOW_KEY: 'has_underscore_bad' }), 'clearpath-trader-indexnow-01');
// Deterministic fixture — not a live credential (Aikido secret scanners)
assert.match(resolveIndexNowKey({ SESSION_SECRET: 'test-fixture-not-a-real-secret' }), /^[a-f0-9]{32}$/);

assert.deepEqual(
  normalizeIndexNowUrls([
    'https://clearpathtrader.com/learn',
    'https://clearpathtrader.com/learn',
    '/guides/macro-spreads',
    'https://evil.example/phish',
  ]),
  ['https://clearpathtrader.com/learn', 'https://clearpathtrader.com/guides/macro-spreads']
);

assert.deepEqual(
  REGIONAL_MARKETS.map((m) => m.id),
  ['ru', 'cn', 'jp', 'ph']
);

console.log('indexnow-regional.selftest: ok');
