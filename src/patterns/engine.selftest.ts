/**
 * Chart Vision Engine self-test
 * Run: npm run patterns:engine-test
 */
import { generateSampleCandles } from '../river/runtime/fixtures/sampleCandles';
import { resolvePatternConflicts } from './conflicts';
import { runChartVisionPipeline, publishChartVision } from './engine';
import { analysisWindow, sanitizeCandles } from './sanitize';
import { scanAllPatterns } from './scan';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

const bad = sanitizeCandles([
  { time: 1, open: 100, high: 99, low: 98, close: 100 },
  { time: 2, open: NaN, high: 101, low: 99, close: 100 },
  { time: 2, open: 100, high: 101, low: 99, close: 100 },
  { time: 3, open: 100, high: 102, low: 99, close: 101 },
] as any);
assert(bad.length === 2, 'sanitize should drop invalid and duplicate times');

const huge = generateSampleCandles(2000);
const window = analysisWindow(huge);
assert(window.length === 500, 'analysis window should cap at 500 bars');

const sample = generateSampleCandles(120);
const first = runChartVisionPipeline({ candles: sample, symbol: 'TEST', timeframe: '1h' }, { force: true });
assert(first !== null, 'expected vision output');
assert(
  first!.scan.patterns.every((p) => (
    p.scale === 'nested'
    || p.endIndex >= sample.length - 12
  )),
  'major patterns should be live-edge',
);

const second = runChartVisionPipeline({ candles: sample, symbol: 'TEST', timeframe: '1h' });
assert(second === null, 'unchanged fingerprint should skip re-scan');

publishChartVision(first!);

const conflicts = resolvePatternConflicts(scanAllPatterns(sample).patterns);
const structure = conflicts.filter((p) => p.category === 'chart' && p.scale !== 'nested');
assert(structure.length <= 2, 'conflict resolver should cap major chart patterns');

console.log('PASS: Chart Vision Engine');
console.log(`  patterns: ${first!.scan.patterns.map((p) => p.label).join(', ') || 'none'}`);
