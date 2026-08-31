/**
 * Desk color chart: palette, persistence, CSS vars, and four-desk wiring.
 * Run: npx tsx scripts/desk-color-chart.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  COLOR_CHART_GRAYS,
  COLOR_CHART_HUE_GRID,
  COLOR_CHART_PRESETS,
  COLOR_CHART_ROW_SL,
  DESK_COLOR_CHART_STORAGE_KEY,
  DESK_COLOR_TARGETS,
  DESK_COLOR_TARGET_META,
  buildHueGrid,
  clampOpacity,
  clearDeskColorOverrides,
  deskCssVars,
  emptyStore,
  hexToRgba,
  hslToHex,
  isDeskColorTarget,
  luminanceText,
  neuroPastelSwatches,
  normalizeHex,
  parseDeskColorChartStore,
  pushRecentColor,
  resolveDeskOverrides,
  resolveDeskVisualPaint,
  setDeskColorOpacity,
  setDeskColorOverride,
} from '../src/lib/deskColorChart.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

assert.equal(COLOR_CHART_GRAYS.length, 10);
assert.equal(COLOR_CHART_GRAYS[0], '#FFFFFF');
assert.equal(COLOR_CHART_GRAYS[9], '#000000');
assert.equal(COLOR_CHART_PRESETS.length, 9);
assert.equal(COLOR_CHART_ROW_SL.length, 8);
assert.equal(COLOR_CHART_HUE_GRID.length, 8);
assert.equal(COLOR_CHART_HUE_GRID[0].length, 10);
assert.equal(buildHueGrid()[0][0], hslToHex(0, 92, 54));
assert.ok(COLOR_CHART_PRESETS.includes('#00E5FF'));
assert.ok(COLOR_CHART_PRESETS.includes('#FF1744'));
assert.equal(DESK_COLOR_TARGETS.length, 6);
for (const id of DESK_COLOR_TARGETS) {
  assert.ok(DESK_COLOR_TARGET_META[id].label);
  assert.equal(isDeskColorTarget(id), true);
}
assert.equal(isDeskColorTarget('neon'), false);

assert.equal(normalizeHex('#ff0'), '#FFFF00');
assert.equal(normalizeHex('#00e5ff'), '#00E5FF');
assert.equal(normalizeHex('nope'), null);
assert.equal(hexToRgba('#00E5FF', 0.5), 'rgba(0,229,255,0.5)');
assert.equal(clampOpacity(140), 100);
assert.equal(clampOpacity(4), 10);
assert.equal(luminanceText('#FFFFFF'), '#111111');
assert.equal(luminanceText('#000000'), '#F8FAFC');

let store = emptyStore();
store = setDeskColorOverride(store, 'retail', 'candleUp', '#39FF14');
store = setDeskColorOverride(store, 'retail', 'bento', '#7C4DFF');
store = setDeskColorOpacity(store, 'retail', 80);
const retail = resolveDeskOverrides(store, 'retail');
assert.equal(retail.candleUp, '#39FF14');
assert.equal(retail.bento, '#7C4DFF');
assert.equal(retail.opacity, 80);
assert.deepEqual(resolveDeskOverrides(store, 'institutional'), {});

const paint = resolveDeskVisualPaint(retail);
assert.equal(paint.candleUp, '#39FF14');
assert.equal(paint.indicator, undefined);
store = setDeskColorOverride(store, 'institutional', 'indicator', '#00E5FF');
store = setDeskColorOverride(store, 'institutional', 'chart', '#000000');
const instPaint = resolveDeskVisualPaint(resolveDeskOverrides(store, 'institutional'));
assert.equal(instPaint.indicator, '#00E5FF');
assert.equal(instPaint.chart, '#000000');
assert.equal(instPaint.text, '#F8FAFC');

const vars = deskCssVars(retail);
assert.equal(vars['--desk-user-bento'], '#7C4DFF');
assert.match(vars['--desk-user-bento-fill'] || '', /rgba\(124,77,255,0\.8\)/);

store = clearDeskColorOverrides(store, 'retail');
assert.deepEqual(resolveDeskOverrides(store, 'retail'), {});
assert.equal(resolveDeskOverrides(store, 'institutional').indicator, '#00E5FF');

assert.deepEqual(pushRecentColor(['#FFFFFF'], '#00e5ff'), ['#00E5FF', '#FFFFFF']);
assert.equal(pushRecentColor(['#00E5FF', '#FFFFFF'], '#00E5FF')[0], '#00E5FF');
assert.equal(neuroPastelSwatches().length, 10);

const parsed = parseDeskColorChartStore({
  desks: { neurodivergent: { background: '#f2f2f2', opacity: 60, junk: '#111' } },
  recents: ['#ff0', 'bad', '#00E5FF'],
});
assert.equal(parsed.desks.neurodivergent?.background, '#F2F2F2');
assert.equal(parsed.desks.neurodivergent?.opacity, 60);
assert.deepEqual(parsed.recents, ['#FFFF00', '#00E5FF']);
assert.equal(DESK_COLOR_CHART_STORAGE_KEY, 'clearpath_desk_color_chart_v1');

const files = [
  'src/lib/deskColorChart.ts',
  'src/components/desks/ColorChartPicker.tsx',
  'src/components/desks/colorChart.css',
  'src/components/desks/DeskAppearanceContext.tsx',
  'src/components/desks/DeskRoute.tsx',
  'src/components/desks/TraderDeskChrome.tsx',
  'src/components/charts/LightweightCandles.tsx',
  'src/components/desks/neuro/NeurodivergentDashboard.tsx',
];
for (const rel of files) {
  assert.ok(fs.existsSync(path.join(root, rel)), rel);
}

const chrome = fs.readFileSync(path.join(root, 'src/components/desks/TraderDeskChrome.tsx'), 'utf8');
assert.match(chrome, /data-color-chart-toggle/);
assert.match(chrome, /ColorChartPicker/);
assert.match(chrome, /showPastels=\{active === 'neurodivergent'\}/);
assert.match(chrome, /Colors/);

const picker = fs.readFileSync(path.join(root, 'src/components/desks/ColorChartPicker.tsx'), 'utf8');
assert.match(picker, /data-color-chart/);
assert.match(picker, /role="tablist"/);
assert.match(picker, /DESK_COLOR_TARGET_META/);
assert.match(picker, /data-color-target/);
assert.match(picker, /Opacity/);
assert.match(picker, /COLOR_CHART_GRAYS/);
assert.match(picker, /COLOR_CHART_HUE_GRID/);
assert.match(picker, /COLOR_CHART_PRESETS/);
assert.match(picker, /neuroPastelSwatches/);

const candles = fs.readFileSync(path.join(root, 'src/components/charts/LightweightCandles.tsx'), 'utf8');
assert.match(candles, /visualPaint/);
assert.match(candles, /useOptionalDeskAppearance/);
assert.match(candles, /indColor/);
assert.match(candles, /visualPaint\?\.candleUp/);
assert.match(candles, /visualPaint\?\.indicator/);
assert.match(candles, /visualPaint\?\.chart/);

const route = fs.readFileSync(path.join(root, 'src/components/desks/DeskRoute.tsx'), 'utf8');
assert.match(route, /DeskAppearanceProvider deskId=\{deskId\}/);
assert.match(route, /data-desk-color-bg/);
assert.match(route, /data-desk-color-bento/);
assert.match(route, /colorChart\.css/);

const css = fs.readFileSync(path.join(root, 'src/components/desks/colorChart.css'), 'utf8');
assert.match(css, /data-desk-color-bg/);
assert.match(css, /data-desk-color-bento/);
assert.match(css, /\.fund-card/);
assert.match(css, /--desk-user-bento-fill/);

const ctx = fs.readFileSync(path.join(root, 'src/components/desks/DeskAppearanceContext.tsx'), 'utf8');
assert.match(ctx, /applyColor/);
assert.match(ctx, /resetVisual/);
assert.match(ctx, /visualPaint/);

console.log('desk-color-chart.selftest: ok');
