/**
 * Layer 2 self-test: parse the Gold Bar Alpha fixture into an AST and
 * assert the structural fingerprints of a real UT/ATR script.
 *
 * Run: npm run river:parse-test
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compilePineScript } from './compile';
import { getAssignments } from './compile';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(__dirname, 'fixtures', 'goldBarAlpha.pine');
const source = readFileSync(fixturePath, 'utf-8');

const result = compilePineScript(source);

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    if (result.errors.length) console.error(result.errors.join('\n'));
    process.exit(1);
  }
}

assert(result.errors.length === 0, `expected zero compile errors, got: ${result.errors.join(' | ')}`);
assert(result.program !== null, 'expected AST program');
assert(result.summary !== null, 'expected compile summary');

const summary = result.summary!;
const program = result.program!;
const assignments = getAssignments(program);

assert(summary.version === 5, `expected version 5, got ${summary.version}`);
assert(summary.indicatorTitle === 'Trading Anarchy Alpha', `unexpected title: ${summary.indicatorTitle}`);
assert(summary.declarationCount >= 20, `expected >=20 declarations, got ${summary.declarationCount}`);
assert(summary.assignmentCount >= 14, `expected >=14 assignments, got ${summary.assignmentCount}`);
assert(summary.reassignmentCount === 2, `expected 2 := reassignments, got ${summary.reassignmentCount}`);
assert(summary.inputBindings.a === 1, 'expected a=1');
assert(summary.inputBindings.c === 10, 'expected c=10');
assert(summary.inputBindings.h === false, 'expected h=false');
assert(summary.hasAtrCall, 'missing ta.atr call');
assert(summary.hasCrossoverCall, 'missing ta.crossover call');
assert(summary.hasPlotshape, 'missing plotshape call');
assert(summary.hasBarcolor, 'missing barcolor call');
assert(summary.hasGoldBarPattern, 'Gold Bar pattern not detected from AST');
assert(summary.topLevelCalls.filter((c) => c === 'plotshape').length === 2, 'expected 2 plotshape calls');
assert(summary.topLevelCalls.filter((c) => c === 'barcolor').length === 2, 'expected 2 barcolor calls');
assert(summary.topLevelCalls.filter((c) => c === 'alertcondition').length === 2, 'expected 2 alertcondition calls');

const assignNames = assignments.map((a) => a.name);
assert(assignNames.includes('xATRTrailingStop'), 'missing xATRTrailingStop assignment');
assert(assignNames.includes('buy'), 'missing buy assignment');
assert(assignNames.includes('sell'), 'missing sell assignment');

const trailingStopAssigns = assignments.filter((a) => a.name === 'xATRTrailingStop');
assert(trailingStopAssigns.some((a) => a.operator === '='), 'missing initial xATRTrailingStop =');
assert(trailingStopAssigns.some((a) => a.operator === ':='), 'missing xATRTrailingStop :=');

console.log('PASS: Gold Bar Alpha parser');
console.log(`  version: ${summary.version}`);
console.log(`  title: ${summary.indicatorTitle}`);
console.log(`  declarations: ${summary.declarationCount}`);
console.log(`  assignments: ${summary.assignmentCount} (${summary.reassignmentCount} reassignments)`);
console.log(`  inputs: a=${summary.inputBindings.a}, c=${summary.inputBindings.c}, h=${summary.inputBindings.h}`);
console.log(`  gold bar pattern: ${summary.hasGoldBarPattern}`);
