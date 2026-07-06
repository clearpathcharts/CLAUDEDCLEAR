/**
 * Pattern engine self-test
 * Run: npm run patterns:scan-test
 */
import { generateSampleCandles } from '../river/runtime/fixtures/sampleCandles';
import { scanAllPatterns } from './scan';
import { scanCandlestickPatterns } from './candlesticks';
import { buildPatternLineOverlays } from './overlay';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

// Synthetic engulfing
const engulfingCandles = [
  { time: 1, open: 110, high: 112, low: 105, close: 106 },
  { time: 2, open: 105, high: 115, low: 104, close: 114 },
];

const engulf = scanCandlestickPatterns(engulfingCandles);
assert(engulf.some((p) => p.id === 'bullish_engulfing'), 'expected bullish engulfing');

// Synthetic three white soldiers
const soldiers = [
  { time: 1, open: 100, high: 103, low: 99, close: 102 },
  { time: 2, open: 101, high: 105, low: 100, close: 104 },
  { time: 3, open: 103, high: 108, low: 102, close: 107 },
];
assert(scanCandlestickPatterns(soldiers).some((p) => p.id === 'three_white_soldiers'), 'expected three white soldiers');

const sample = generateSampleCandles(120);
const scan = scanAllPatterns(sample);
assert(scan.scannedBars === 120, 'expected 120 bars scanned');
assert(scan.swingHighs > 0 && scan.swingLows > 0, 'expected swing points');

const lines = buildPatternLineOverlays(sample, scan.patterns);
assert(Array.isArray(lines), 'expected line overlays array');
console.log(`  line overlays: ${lines.length}`);

console.log('PASS: Pattern engine');
console.log(`  swings: ${scan.swingHighs} highs, ${scan.swingLows} lows`);
console.log(`  patterns found: ${scan.patterns.length}`);
const byType = scan.patterns.reduce<Record<string, number>>((acc, p) => {
  acc[p.id] = (acc[p.id] ?? 0) + 1;
  return acc;
}, {});
console.log(`  types: ${Object.entries(byType).map(([k, v]) => `${k}(${v})`).join(', ') || 'none on this sample'}`);
