/**
 * Pattern engine self-test
 * Run: npm run patterns:scan-test
 */
import { generateSampleCandles } from '../river/runtime/fixtures/sampleCandles';
import { scanAllPatterns } from './scan';
import { scanCandlestickPatterns } from './candlesticks';
import { buildPatternLineOverlays } from './overlay';
import { allSegmentsCandleSafe } from './trendlineFit';
import { detectNestedStructures } from './chartPatterns';
import type { DetectedPattern } from './types';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

const engulfingCandles = [
  { time: 1, open: 110, high: 112, low: 105, close: 106 },
  { time: 2, open: 105, high: 115, low: 104, close: 114 },
];

const engulf = scanCandlestickPatterns(engulfingCandles);
assert(engulf.some((p) => p.id === 'bullish_engulfing'), 'expected bullish engulfing');

const soldiers = [
  { time: 1, open: 100, high: 103, low: 99.5, close: 102.8 },
  { time: 2, open: 102.2, high: 106, low: 102, close: 105.8 },
  { time: 3, open: 105, high: 109, low: 104.8, close: 108.7 },
];
assert(scanCandlestickPatterns(soldiers).some((p) => p.id === 'three_white_soldiers'), 'expected three white soldiers');

const oldHistory = generateSampleCandles(200);
const oldScan = scanAllPatterns(oldHistory);
assert(
  oldScan.patterns.every((p) => {
    if (p.scale === 'nested') {
      return oldScan.patterns.some((parent) => (
        parent.scale !== 'nested'
        && parent.category === 'chart'
        && p.startIndex >= parent.startIndex
        && p.endIndex <= parent.endIndex
      ));
    }
    return p.endIndex >= oldHistory.length - 12;
  }),
  'live-edge filter should drop historical pattern hits',
);

import { analyzeFormingStructure } from './forming';

const wedgeCandles: { time: number; open: number; high: number; low: number; close: number }[] = [];
for (let i = 0; i < 40; i++) {
  const floor = 100 + i * 0.35;
  const ceil = floor + 4 - i * 0.06;
  wedgeCandles.push({
    time: i + 1,
    open: floor + 1,
    high: ceil,
    low: floor,
    close: floor + 2.5,
  });
}
assert(analyzeFormingStructure(wedgeCandles, 'TEST', '1h', scanAllPatterns(wedgeCandles).patterns) !== null, 'expected forming brief');

const sample = generateSampleCandles(120);
const scan = scanAllPatterns(sample);
assert(scan.scannedBars === 120, 'expected 120 bars scanned');
assert(scan.swingHighs > 0 && scan.swingLows > 0, 'expected swing points');

const chartPatterns = scan.patterns.filter((p) => p.category === 'chart');
for (const p of chartPatterns) {
  assert(!!p.geometry?.lines?.length, `${p.id} should have geometry`);
  assert(allSegmentsCandleSafe(sample, p.geometry!.lines), `${p.id} trendline must not cut through candles`);
}

const lines = buildPatternLineOverlays(sample, scan.patterns);
assert(Array.isArray(lines), 'expected line overlays array');
console.log(`  line overlays: ${lines.length}`);
console.log(`  chart patterns: ${chartPatterns.map((p) => p.id).join(', ') || 'none on sample'}`);

function descTriangleBars(
  bars: number,
  floor: number,
  startHigh: number,
  t0: number,
): { time: number; open: number; high: number; low: number; close: number }[] {
  const out = [];
  for (let i = 0; i < bars; i++) {
    const t = bars === 1 ? 0 : i / (bars - 1);
    const peak = startHigh - (startHigh - floor - 0.4) * t;
    const isPeak = i % 3 === 0;
    const isTrough = i % 3 === 1;
    const high = isPeak ? peak : peak - 0.18;
    const low = isTrough ? floor : floor + 0.14;
    const open = low + (high - low) * (isPeak ? 0.35 : 0.65);
    const close = low + (high - low) * (isPeak ? 0.7 : 0.3);
    out.push({ time: t0 + i, open, high, low, close });
  }
  return out;
}

const nestedA = descTriangleBars(16, 105.4, 108.2, 1);
const drop1 = descTriangleBars(10, 102.2, 105.5, 17);
const nestedB = descTriangleBars(16, 102.4, 105.1, 27);
const drop2 = descTriangleBars(14, 100.0, 102.6, 43);
const fractalDesc = [...nestedA, ...drop1, ...nestedB, ...drop2];
const parentDesc: DetectedPattern = {
  id: 'descending_triangle',
  category: 'chart',
  label: 'Descending Triangle',
  direction: 'bearish',
  startIndex: 0,
  endIndex: fractalDesc.length - 1,
  time: fractalDesc[fractalDesc.length - 1].time,
  confidence: 0.81,
  scale: 'major',
  geometry: {
    lines: [
      {
        role: 'upper',
        from: { index: 0, time: fractalDesc[0].time, price: 108.2 },
        to: { index: fractalDesc.length - 1, time: fractalDesc[fractalDesc.length - 1].time, price: 101.2 },
      },
      {
        role: 'lower',
        from: { index: 0, time: fractalDesc[0].time, price: 100 },
        to: { index: fractalDesc.length - 1, time: fractalDesc[fractalDesc.length - 1].time, price: 100 },
      },
    ],
  },
};
const nestedHits = detectNestedStructures(fractalDesc, [parentDesc]);
assert(
  nestedHits.some((p) => p.id === 'descending_triangle' && p.scale === 'nested'),
  'expected nested descending triangle inside the larger descending triangle',
);
assert(
  nestedHits.every((p) => p.direction === 'bearish'),
  'nested retraces on a downtrend must stay bearish continuation — not bullish wedges',
);
const parentUpper = parentDesc.geometry!.lines.find((l) => l.role === 'upper')!;
const parentSlope = (parentUpper.to.price - parentUpper.from.price) / (parentUpper.to.index - parentUpper.from.index);
for (const nested of nestedHits) {
  const nestedUpper = nested.geometry?.lines.find((l) => l.role === 'upper');
  assert(!!nestedUpper, `${nested.id} nested hit needs an upper trendline`);
  const nestedSlope = (nestedUpper!.to.price - nestedUpper!.from.price) / (nestedUpper!.to.index - nestedUpper!.from.index);
  assert(
    Math.abs(nestedSlope - parentSlope) / Math.max(Math.abs(parentSlope), 1e-6) < 0.08,
    'nested upper must share the parent descending trendline — not an independent local triangle',
  );
}
const nestedOverlays = buildPatternLineOverlays(fractalDesc, [...nestedHits, parentDesc]);
assert(
  nestedOverlays.some((l) => l.color === '#00D9FF'),
  'nested geometry should draw in cyan',
);
console.log(`  nested hits: ${nestedHits.map((p) => `${p.id}@${p.startIndex}-${p.endIndex}`).join(', ')}`);

const downtrendScan = scanAllPatterns(fractalDesc);
const majorDown = downtrendScan.patterns.filter((p) => p.category === 'chart' && p.scale !== 'nested');
assert(
  !majorDown.some((p) => p.id === 'falling_wedge'),
  'a stepped downtrend with retraces must not be labeled a bullish falling wedge',
);
assert(
  majorDown.some((p) => p.id === 'descending_triangle'),
  'expected descending triangle continuation on the stepped downtrend',
);

console.log('PASS: Pattern engine (candle-safe geometry)');
