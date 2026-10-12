/**
 * Chart white/black background: storage, color resolve, and UI wiring.
 *
 * Run: npx tsx scripts/chart-background.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  CHART_BACKGROUND_PRESETS,
  CHART_BACKGROUND_STORAGE_KEY,
  chartBackgroundColors,
  isChartBackgroundMode,
} from '../src/lib/charts/chartBackground.ts';
import {
  CEO_DAILY_TRADING_COLORS,
  CHART_BACKGROUND_GRAYS,
  ceoGoldBarWick,
} from '../src/lib/charts/ceoDailyColors.ts';

assert.equal(isChartBackgroundMode('white'), true);
assert.equal(isChartBackgroundMode('black'), true);
assert.equal(isChartBackgroundMode('profile'), true);
assert.equal(isChartBackgroundMode('neon'), false);
assert.equal(CHART_BACKGROUND_STORAGE_KEY, 'clearpath_chart_background');

const fallback = { background: '#07111f', text: '#dbeafe', grid: 'rgba(125,211,252,0.15)' };
assert.deepEqual(chartBackgroundColors('white', fallback), { ...CHART_BACKGROUND_PRESETS.white });
assert.deepEqual(chartBackgroundColors('black', fallback), { ...CHART_BACKGROUND_PRESETS.black });
assert.deepEqual(chartBackgroundColors('profile', fallback), fallback);
assert.equal(CHART_BACKGROUND_PRESETS.white.background, '#ffffff');
assert.equal(CHART_BACKGROUND_PRESETS.black.background, '#000000');
assert.equal(chartBackgroundColors('profile', fallback, '#000000').background, '#000000');
assert.equal(chartBackgroundColors('profile', fallback, '#FFFFFF').text, '#111318');
assert.deepEqual(chartBackgroundColors('profile', fallback, 'nope'), fallback);

assert.equal(CHART_BACKGROUND_GRAYS[0], '#000000');
assert.equal(CHART_BACKGROUND_GRAYS[CHART_BACKGROUND_GRAYS.length - 1], '#FFFFFF');
assert.equal(CEO_DAILY_TRADING_COLORS.bullishCandle, '#00F5FF');
assert.equal(CEO_DAILY_TRADING_COLORS.bearishCandle, '#FF00CC');
assert.equal(CEO_DAILY_TRADING_COLORS.goldBarCandle, '#FFD700');
assert.equal(CEO_DAILY_TRADING_COLORS.bullishWick, '#00FFFF');
assert.equal(CEO_DAILY_TRADING_COLORS.bearishWick, '#FF1493');
assert.equal(ceoGoldBarWick('#FFD700', true), '#FFFF00');
assert.equal(ceoGoldBarWick('#FFD700', false), null);

const root = path.resolve('.');
const candles = fs.readFileSync(path.join(root, 'src/components/charts/LightweightCandles.tsx'), 'utf8');
assert.match(candles, /ChartBackgroundToggle/);
assert.match(candles, /paint\.background/);
assert.match(candles, /useChartBackgroundMode/);
assert.match(candles, /backgroundColor: paint\.background/);

const toggle = fs.readFileSync(path.join(root, 'src/components/charts/ChartBackgroundToggle.tsx'), 'utf8');
assert.match(toggle, /White/);
assert.match(toggle, /Black/);
assert.match(toggle, /Theme/);
assert.match(toggle, /aria-label="Chart background"/);

const publicChart = fs.readFileSync(path.join(root, 'src/components/PublicLiveChart.tsx'), 'utf8');
assert.match(publicChart, /ChartBackgroundToggle/);

const market = fs.readFileSync(path.join(root, 'src/components/markets/LightweightMarketUI.tsx'), 'utf8');
assert.match(market, /ChartBackgroundToggle/);

const nav = fs.readFileSync(path.join(root, 'src/components/nav/ClearNav.tsx'), 'utf8');
assert.match(nav, /RecommendedChartColorsBox/);
const box = fs.readFileSync(path.join(root, 'src/components/nav/RecommendedChartColorsBox.tsx'), 'utf8');
assert.match(box, /ClearPath recommended colors for your charts/);
assert.match(box, /Not financial advice/);
assert.match(box, /Use CEO daily colors/);

console.log('chart-background.selftest: ok');
