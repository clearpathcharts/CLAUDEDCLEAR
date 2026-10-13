/**
 * Guards signed-out chart status placement.
 *
 * Public charts are intentionally taller than the remaining first viewport.
 * Loading and provider-unavailable messages must stay near the plot's top,
 * otherwise a missing market-data key looks like an unexplained black void.
 *
 * Run: npx tsx scripts/chart-empty-state.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.resolve('src/components/charts/LightweightCandles.tsx'),
  'utf8',
);

const placement = source.match(
  /const CHART_STATUS_OVERLAY_CLASS\s*=\s*\n?\s*"([^"]+)"/,
);
assert.ok(placement, 'chart status overlays must share an explicit placement class');
assert.match(
  placement[1],
  /\bjustify-start\b/,
  'chart statuses must anchor near the plot top so they remain visible above the fold',
);
assert.match(
  placement[1],
  /\bpt-(?:1[0246]|[6-9])\b/,
  'chart statuses need top padding to clear in-plot controls',
);
assert.doesNotMatch(
  placement[1],
  /\bjustify-center\b/,
  'vertically centering status content hides it below the viewport on tall public charts',
);

for (const testId of ['chart-loading-state', 'chart-unavailable-state']) {
  const at = source.indexOf(`data-testid="${testId}"`);
  assert.ok(at >= 0, `${testId} must remain identifiable for regression checks`);
  const openingTag = source.slice(Math.max(0, at - 320), at + 80);
  assert.match(
    openingTag,
    /CHART_STATUS_OVERLAY_CLASS/,
    `${testId} must use the above-fold status placement`,
  );
}

assert.match(
  source,
  /Chart data unavailable/,
  'provider failure must render an honest unavailable label instead of an empty chart',
);
assert.match(
  source,
  /No historical data available for this timeframe/,
  'empty history must produce an explanatory message',
);

console.log('chart-empty-state.selftest: ok');
