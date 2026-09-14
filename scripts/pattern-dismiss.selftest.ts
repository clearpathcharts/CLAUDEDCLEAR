/**
 * Per-pattern dismiss X: unique keys, filter, overlay drop, HUD/chart wiring.
 * Run: npx tsx scripts/pattern-dismiss.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DetectedPattern } from '../src/patterns/types.ts';
import {
  chartPatternDismissKey,
  chartPatternDismissAnchor,
  filterDismissedChartPatterns,
  buildPatternLineOverlays,
} from '../src/patterns/overlay.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const rising: DetectedPattern = {
  id: 'rising_wedge',
  category: 'chart',
  label: 'Rising Wedge',
  direction: 'bearish',
  startIndex: 10,
  endIndex: 40,
  time: 40,
  confidence: 0.8,
  scale: 'nested',
  geometry: {
    lines: [
      { role: 'upper', from: { index: 10, time: 1000, price: 154.2 }, to: { index: 40, time: 4000, price: 155.1 } },
      { role: 'lower', from: { index: 12, time: 1200, price: 153.8 }, to: { index: 40, time: 4000, price: 154.6 } },
    ],
  },
};

const triangle: DetectedPattern = {
  id: 'ascending_triangle',
  category: 'chart',
  label: 'Ascending Triangle',
  direction: 'bullish',
  startIndex: 2,
  endIndex: 20,
  time: 20,
  confidence: 0.7,
  scale: 'major',
  geometry: {
    lines: [
      { role: 'horizontal', from: { index: 2, time: 200, price: 156.3 }, to: { index: 20, time: 2000, price: 156.3 } },
      { role: 'lower', from: { index: 2, time: 200, price: 152.0 }, to: { index: 20, time: 2000, price: 155.0 } },
    ],
  },
};

const doji: DetectedPattern = {
  id: 'doji',
  category: 'candlestick',
  label: 'Doji',
  direction: 'neutral',
  startIndex: 19,
  endIndex: 19,
  time: 19,
  confidence: 0.6,
};

assert.notEqual(chartPatternDismissKey(rising), chartPatternDismissKey(triangle));
assert.match(chartPatternDismissKey(rising), /^nested:rising_wedge:10:40$/);

const high = chartPatternDismissAnchor(rising);
assert.ok(high);
assert.equal(high!.price, 155.1);
assert.equal(high!.time, 4000);

const dismissed = new Set([chartPatternDismissKey(rising)]);
const kept = filterDismissedChartPatterns([rising, triangle, doji], dismissed);
assert.equal(kept.length, 2);
assert.ok(kept.some((p) => p.id === 'ascending_triangle'));
assert.ok(kept.some((p) => p.id === 'doji'));
assert.ok(!kept.some((p) => p.id === 'rising_wedge'));

const allLines = buildPatternLineOverlays([], [rising, triangle]);
const filteredLines = buildPatternLineOverlays([], kept);
assert.ok(allLines.length > filteredLines.length);
assert.ok(filteredLines.every((l) => !l.id.includes('rising_wedge')));

const lc = fs.readFileSync(path.join(root, 'src/components/charts/LightweightCandles.tsx'), 'utf8');
assert.match(lc, /PatternDismissPins/);
assert.match(lc, /dismissedPatternKeys/);
assert.match(lc, /onDismissPattern/);

const pins = fs.readFileSync(path.join(root, 'src/components/charts/PatternDismissPins.tsx'), 'utf8');
assert.match(pins, /data-pattern-dismiss-pins/);
assert.match(pins, /data-pattern-dismiss=/);
assert.match(pins, /Remove .+ from this chart/);

const hud = fs.readFileSync(path.join(root, 'src/components/charts/ChartPatternHud.tsx'), 'utf8');
assert.match(hud, /onDismissPattern/);

console.log('pattern-dismiss.selftest: ok');
