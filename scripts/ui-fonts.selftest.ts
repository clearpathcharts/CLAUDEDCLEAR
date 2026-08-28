/**
 * Inter (UI) + IBM Plex Mono (data/terminal) must be loaded from Google Fonts
 * and wired into CSS + production CSP. Chart axis labels set the mono family
 * in lightweight-charts (CSS cannot style the canvas).
 *
 * Run: npx tsx scripts/ui-fonts.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');
const indexCss = fs.readFileSync(path.resolve('src/index.css'), 'utf8');
const serverTs = fs.readFileSync(path.resolve('server.ts'), 'utf8');
const candles = fs.readFileSync(
  path.resolve('src/components/charts/LightweightCandles.tsx'),
  'utf8',
);
const liveChart = fs.readFileSync(path.resolve('src/components/LiveChart.tsx'), 'utf8');

assert.match(
  indexHtml,
  /fonts\.googleapis\.com/,
  'index.html must preconnect / load Google Fonts',
);
assert.match(
  indexHtml,
  /fonts\.gstatic\.com/,
  'index.html must preconnect fonts.gstatic.com for font files',
);
assert.match(
  indexHtml,
  /family=IBM\+Plex\+Mono:wght@400;500;600;700/,
  'Google Fonts URL must include IBM Plex Mono 400–700',
);
assert.match(
  indexHtml,
  /family=Inter:wght@400;500;600;700;800;900/,
  'Google Fonts URL must include Inter 400–900 (UI uses font-black)',
);

const linkHref = indexHtml.match(
  /href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)"/,
);
assert.ok(linkHref, 'must have a single Google Fonts css2 stylesheet link');
assert.match(linkHref[1], /family=Inter/);
assert.match(linkHref[1], /family=IBM\+Plex\+Mono/);

assert.match(indexCss, /--font-ui:\s*"Inter"/);
assert.match(indexCss, /--font-mono:\s*"IBM Plex Mono"/);
assert.match(indexCss, /--font-sans:\s*"Inter"/);
assert.match(
  indexCss,
  /html,\s*body \{[\s\S]*font-family:\s*var\(--font-ui\)/,
  'html/body must use --font-ui (Inter), including the later layout override',
);
assert.doesNotMatch(
  indexCss,
  /html,\s*body \{[\s\S]*font-family:\s*system-ui/,
  'must not force system-ui on html/body after Inter is set',
);
assert.match(
  indexCss,
  /\.font-mono[\s\S]{0,80}font-family:\s*var\(--font-mono\)/,
  'Tailwind font-mono (CHART-BUILD, tickers, timestamps) must resolve to IBM Plex Mono',
);

assert.match(
  serverTs,
  /styleSrc:[\s\S]*https:\/\/fonts\.googleapis\.com/,
  'prod CSP must allow Google Fonts CSS',
);
assert.match(
  serverTs,
  /fontSrc:[\s\S]*https:\/\/fonts\.gstatic\.com/,
  'prod CSP must allow Google Font files',
);

assert.match(
  candles,
  /fontFamily:\s*'"IBM Plex Mono"/,
  'Lightweight Charts axis/crosshair text must use IBM Plex Mono',
);
assert.match(candles, /CHART-BUILD-2026-08-28-FONTS/, 'stamp must mark the fonts build');
assert.match(
  liveChart,
  /fontFamily:\s*'"IBM Plex Mono"/,
  'public LiveChart axis text must use IBM Plex Mono',
);
assert.match(
  fs.readFileSync(path.resolve('src/components/Auth.tsx'), 'utf8'),
  /font-mono text-zinc-500 text-\[9px\][\s\S]*DXY INDEX/,
  'public header tickers (DXY / BTC / USDJPY) must use IBM Plex Mono',
);
assert.match(
  candles,
  /data-chart-build/,
  'CHART-BUILD stamp must be targetable as a mono data readout',
);
assert.match(
  indexCss,
  /\[data-chart-build\][\s\S]{0,80}font-family:\s*var\(--font-mono\)/,
);
assert.match(
  fs.readFileSync(path.resolve('src/server/semanticDatabase.ts'), 'utf8'),
  /font-family:Inter/,
  'SSR homepage H1 fallback must use Inter, not system-ui',
);

console.log('ui-fonts.selftest: ok');
