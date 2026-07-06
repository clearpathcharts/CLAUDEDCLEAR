/**
 * Layer 4 self-test: execute Gold Bar RIR on sample candles.
 *
 * Run: npm run river:runtime-test
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compilePineScript } from '../pine/compile';
import { executeRir } from './execute';
import { generateSampleCandles } from './fixtures/sampleCandles';
import { isGoldBarRir } from './types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(__dirname, '../pine/fixtures/goldBarAlpha.pine');
const source = readFileSync(fixturePath, 'utf-8');

const compiled = compilePineScript(source);
const candles = generateSampleCandles(100);

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

assert(compiled.errors.length === 0, `compile errors: ${compiled.errors.join(' | ')}`);
assert(compiled.rir !== null, 'missing RIR');
assert(isGoldBarRir(compiled.rir!), 'not a gold bar RIR program');

const result = executeRir(compiled.rir!, candles, { a: 1, c: 10, h: false });
assert(result.errors.length === 0, `runtime errors: ${result.errors.map((e) => e.message).join(' | ')}`);
assert(result.execution !== null, 'missing execution result');

const exec = result.execution!;
assert(exec.barsProcessed === 100, `expected 100 bars, got ${exec.barsProcessed}`);
assert(exec.isLive, 'expected live bars after ATR warmup');
assert(exec.bytecodeId === compiled.rirBytecodeId, 'bytecode id mismatch');
assert(exec.goldBarHits >= 0, 'gold bar hits should be non-negative');

const hasTrailingStop = compiled.rir!.series.some((s) => /trailingstop/i.test(s.name));
assert(hasTrailingStop, 'fixture must include trailing stop series');

console.log('PASS: Gold Bar Alpha runtime');
console.log(`  bytecode: ${exec.bytecodeId}`);
console.log(`  bars processed: ${exec.barsProcessed}`);
console.log(`  buy signals: ${exec.buySignals}`);
console.log(`  sell signals: ${exec.sellSignals}`);
console.log(`  gold bar hits: ${exec.goldBarHits}`);
