/**
 * Forming structure self-test
 * Run: npm run patterns:forming-test
 */
import { generateSampleCandles } from '../river/runtime/fixtures/sampleCandles';
import { analyzeFormingStructure } from './forming';
import { scanAllPatterns } from './scan';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

const sample = generateSampleCandles(120);
const measured = scanAllPatterns(sample).patterns;
const brief = analyzeFormingStructure(sample, 'EURUSD', '1h', measured);
assert(brief !== null, 'expected forming brief');
assert(brief!.scannedBars === 120, 'expected 120 bars');
assert(Array.isArray(brief!.narrativeLines), 'expected narrative lines');
assert(brief!.narrativeLines.length > 0, 'expected at least one narrative line');

console.log('PASS: Forming structure engine');
console.log(`  symbol: ${brief!.symbol}`);
console.log(`  possibilities: ${brief!.possibilities.map((p) => `${p.label}(${Math.round(p.probability * 100)}%)`).join(', ') || 'none above threshold'}`);
if (brief!.clock.active) {
  console.log(`  clock: ${brief!.clock.bar}/${brief!.clock.total} — ${brief!.clock.reason}`);
}
