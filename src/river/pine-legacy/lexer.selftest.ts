/**
 * Layer 1 self-test: tokenize the Gold Bar Alpha fixture and assert
 * the lexer sees the structural fingerprints of a real UT/ATR script.
 *
 * Run: npm run river:lex-test
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lexPineScript } from './lexer';
import { PineTokenType } from './token';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(__dirname, 'fixtures', 'goldBarAlpha.pine');
const source = readFileSync(fixturePath, 'utf-8');

const result = lexPineScript(source);

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

assert(result.errors.length === 0, `expected zero lex errors, got ${result.errors.length}: ${JSON.stringify(result.errors)}`);
assert(result.version === 5, `expected //@version=5, got ${result.version}`);
assert(result.significantTokenCount > 200, `expected >200 significant tokens, got ${result.significantTokenCount}`);

const types = result.tokens.map((t) => t.type);
const lexemes = result.tokens.map((t) => t.lexeme);

assert(types.includes(PineTokenType.INDICATOR), 'missing indicator keyword');
assert(types.includes(PineTokenType.COLON_ASSIGN), 'missing := reassignment operator');
assert(lexemes.filter((l) => l === ':=').length >= 2, 'expected at least 2 := operators');
assert(lexemes.includes('ta'), 'missing ta namespace');
assert(lexemes.includes('atr'), 'missing atr call');
assert(lexemes.includes('crossover'), 'missing crossover call');
assert(lexemes.includes('plotshape'), 'missing plotshape call');
assert(lexemes.includes('barcolor'), 'missing barcolor call');
assert(lexemes.includes('alertcondition'), 'missing alertcondition call');

const historyRefs = result.tokens.filter(
  (t, i) =>
    t.type === PineTokenType.LEFT_BRACKET &&
    result.tokens[i + 1]?.type === PineTokenType.NUMBER &&
    result.tokens[i + 2]?.type === PineTokenType.RIGHT_BRACKET,
);
assert(historyRefs.length >= 8, `expected >=8 [n] history refs, got ${historyRefs.length}`);

const titleToken = result.tokens.find(
  (t) => t.type === PineTokenType.STRING && t.literal === 'Trading Anarchy Alpha',
);
assert(!!titleToken, 'missing indicator title string');

console.log('PASS: Gold Bar Alpha lexer');
console.log(`  version: ${result.version}`);
console.log(`  tokens: ${result.tokens.length} total, ${result.significantTokenCount} significant`);
console.log(`  history refs [n]: ${historyRefs.length}`);
console.log(`  := reassignments: ${lexemes.filter((l) => l === ':=').length}`);
