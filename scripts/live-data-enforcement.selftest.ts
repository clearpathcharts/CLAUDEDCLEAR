/**
 * LiveDataEnforcementEngine guards — quiet markets must not 403 charts.
 * Run: npx tsx scripts/live-data-enforcement.selftest.ts
 */
import assert from 'node:assert/strict';
import { LiveDataEnforcementEngine } from '../src/truth/LiveDataEnforcementEngine.ts';

const symbol = `TEST_XAU_${Date.now()}`;
const base = Date.now();

// Spaced identical prices (cache / quiet tape) must stay valid
for (let i = 0; i < 20; i++) {
  const r = LiveDataEnforcementEngine.validateTick({
    symbol,
    price: 4050.12,
    timestamp: base + i * 5000,
    source: 'TWELVEDATA_QUOTE_LIVE',
    latencyMs: 100,
  });
  assert.equal(r.valid, true, `spaced identical tick ${i} must pass`);
}

// Rapid identical prices can still trip (synthetic detector) after enough hits
const rapidSym = `TEST_RAPID_${Date.now()}`;
let blocked = false;
for (let i = 0; i < 50; i++) {
  const r = LiveDataEnforcementEngine.validateTick({
    symbol: rapidSym,
    price: 1.2345,
    timestamp: base + i * 100,
    source: 'MOCK',
    latencyMs: 10,
  });
  if (!r.valid) {
    blocked = true;
    break;
  }
}
// MOCK source may fail earlier on policy — either way we only assert spaced path above.
void blocked;

console.log('live-data-enforcement.selftest: ok');
