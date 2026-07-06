/**
 * Layer 3 self-test: lower Gold Bar Alpha AST into RIR bytecode.
 *
 * Run: npm run river:rir-test
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compilePineScript } from '../pine/compile';
import { lowerPineToRir } from './lower';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(__dirname, '../pine/fixtures/goldBarAlpha.pine');
const source = readFileSync(fixturePath, 'utf-8');

const compiled = compilePineScript(source);

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

assert(compiled.errors.length === 0, `compile errors: ${compiled.errors.join(' | ')}`);
assert(compiled.program !== null, 'missing AST');

const result = lowerPineToRir(compiled.program!);

if (result.errors.length > 0) {
  console.error('RIR lower errors:', result.errors);
}
assert(result.errors.length === 0, `expected zero RIR errors, got ${result.errors.length}`);
assert(result.program !== null, 'missing RIR program');
assert(result.bytecodeId !== null, 'missing bytecode id');

const rir = result.program!;
const inputNames = rir.inputs.map((i) => i.name);
const seriesNames = rir.series.map((s) => s.name);
const mutable = rir.series.filter((s) => s.mutable).map((s) => s.name);

assert(rir.indicatorName === 'Trading Anarchy Alpha', `title mismatch: ${rir.indicatorName}`);
assert(rir.rirVersion === 1, 'RIR version must be 1');
assert(inputNames.includes('a') && inputNames.includes('c') && inputNames.includes('h'), 'missing inputs');
assert(seriesNames.includes('xATR'), 'missing xATR series');
assert(seriesNames.includes('xATRTrailingStop'), 'missing trailing stop series');
assert(seriesNames.includes('buy') && seriesNames.includes('sell'), 'missing buy/sell series');
assert(mutable.includes('xATRTrailingStop'), 'trailing stop must be mutable');
assert(mutable.includes('pos'), 'pos must be mutable');

const trailingStopAssigns = rir.statements.filter((s) => s.target === 'xATRTrailingStop');
assert(trailingStopAssigns.some((s) => s.operator === '='), 'missing initial trailing stop assign');
assert(trailingStopAssigns.some((s) => s.operator === ':='), 'missing trailing stop reassignment');

const srcAssign = rir.statements.find((s) => s.target === 'src');
assert(srcAssign?.expr.kind === 'heikinashi_src', 'src must lower to heikinashi_src');

assert(rir.outputs.filter((o) => o.kind === 'barcolor').length === 2, 'expected 2 barcolor outputs');
assert(rir.outputs.filter((o) => o.kind === 'plotshape').length === 2, 'expected 2 plotshape outputs');
assert(rir.outputs.filter((o) => o.kind === 'alert').length === 2, 'expected 2 alert outputs');

const goldBarColor = rir.outputs.find(
  (o) => o.kind === 'barcolor' && o.color.join(',') === '255,215,0',
);
assert(!!goldBarColor, 'expected gold barcolor rgb(255,215,0)');

console.log('PASS: Gold Bar Alpha RIR');
console.log(`  bytecode: ${result.bytecodeId}`);
console.log(`  inputs: ${inputNames.join(', ')}`);
console.log(`  series: ${rir.series.length} (${mutable.length} mutable)`);
console.log(`  statements: ${rir.statements.length}`);
console.log(`  outputs: ${rir.outputs.length}`);
