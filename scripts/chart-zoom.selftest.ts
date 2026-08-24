/**
 * Independent time stretch / price lift-squish math for chart axis gestures.
 * Run: npx tsx scripts/chart-zoom.selftest.ts
 */
import assert from 'node:assert/strict';
import { nextCenteredRange } from '../src/lib/charts/chartZoom.ts';

const wider = nextCenteredRange({ from: 0, to: 100 }, 0.78);
assert.ok(wider.to - wider.from < 100, 'wider time window shows fewer bars');
assert.ok(Math.abs((wider.from + wider.to) / 2 - 50) < 1e-9, 'stretch stays centered');

const tighter = nextCenteredRange({ from: 0, to: 100 }, 1.22);
assert.ok(tighter.to - tighter.from > 100, 'tighter time window shows more bars');

const lift = nextCenteredRange({ from: 1900, to: 2100 }, 1.18, 1e-9);
assert.ok(lift.to - lift.from > 200, 'lift expands the price range');

const squish = nextCenteredRange({ from: 1900, to: 2100 }, 0.82, 1e-9);
assert.ok(squish.to - squish.from < 200, 'squish compresses the price range');

const floor = nextCenteredRange({ from: 10, to: 12 }, 0.1, 6);
assert.equal(floor.to - floor.from, 6, 'logical range never collapses below min span');

console.log('chart-zoom.selftest: ok');
