/**
 * Pattern engine self-test
 * Run: npm run patterns:scan-test
 */
import { generateSampleCandles } from '../river/runtime/fixtures/sampleCandles';
import { scanAllPatterns } from './scan';
import { scanCandlestickPatterns } from './candlesticks';
import { buildPatternLineOverlays } from './overlay';
import { allSegmentsCandleSafe } from './trendlineFit';

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
  { time: 1, open: 100, high: 103, low: 99, close: 102 },
  { time: 2, open: 101, high: 105, low: 100, close: 104 },
  { time: 3, open: 103, high: 108, low: 102, close: 107 },
];
assert(scanCandlestickPatterns(soldiers).some((p) => p.id === 'three_white_soldiers'), 'expected three white soldiers');

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
assert(analyzeFormingStructure(wedgeCandles, 'TEST', '1h') !== null, 'expected forming brief');

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

console.log('PASS: Pattern engine (candle-safe geometry)');
