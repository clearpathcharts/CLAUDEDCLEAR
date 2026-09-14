/**
 * Market Replay engine self-test — real-buffer slicing + no look-ahead + paper fills.
 * Run: npx tsx scripts/market-replay.selftest.ts
 */
import assert from 'node:assert/strict';
import { ReplayEngine, findReplayStartIndex } from '../src/lib/replay/ReplayEngine.ts';
import { ChartDataAdapter } from '../src/lib/replay/ChartDataAdapter.ts';
import { TradingSimulationEngine, computeTradePnl } from '../src/lib/replay/TradingSimulationEngine.ts';
import type { ReplayCandle } from '../src/lib/replay/types.ts';

function makeCandles(n: number, start = 1_700_000_000): ReplayCandle[] {
  const out: ReplayCandle[] = [];
  let px = 100;
  for (let i = 0; i < n; i++) {
    const open = px;
    const close = px + ((i % 3) - 1) * 0.2;
    out.push({
      time: start + i * 3600,
      open,
      high: Math.max(open, close) + 0.1,
      low: Math.min(open, close) - 0.1,
      close,
      volume: 1000 + i,
    });
    px = close;
  }
  return out;
}

const candles = makeCandles(100);
const eng = new ReplayEngine();
eng.loadSession({ symbol: 'USDJPY', timeframe: '1h', candles, startIndex: 40 });

assert.equal(eng.getState().currentReplayIndex, 40);
assert.equal(eng.visibleCandles().length, 41, 'visible includes index 0..40');
assert.equal(eng.visibleCandles()[eng.visibleCandles().length - 1].time, candles[40].time);

const adapter = new ChartDataAdapter(eng);
const vis = adapter.getChartCandles();
assert.ok(vis.every((c, i) => c.time === candles[i].time));
assert.equal(vis.length, 41);
// Future bars must not appear
assert.ok(!vis.some((c) => c.time === candles[41].time));

eng.step(5);
assert.equal(eng.getState().currentReplayIndex, 45);
assert.equal(eng.visibleCandles().length, 46);
assert.ok(!eng.visibleCandles().some((c) => c.time > candles[45].time));

eng.step(1000);
assert.equal(eng.getState().currentReplayIndex, 99);
assert.equal(eng.visibleCandles().length, 100);

eng.restart();
assert.equal(eng.getState().currentReplayIndex, 40);

const idx = findReplayStartIndex(candles, candles[55].time);
assert.equal(idx, 55);

// Paper sim — market long then close
const sim = new TradingSimulationEngine(50_000, 'EURUSD');
sim.placeOrder({
  side: 'long',
  type: 'market',
  size: 0.1,
  barIndex: 40,
  bar: candles[40],
});
assert.ok(sim.getAccount().openPosition);
sim.onBar(41, { ...candles[41], high: candles[40].close + 1, low: candles[40].close - 1, close: candles[40].close + 0.5 });
const closed = sim.closePosition(42, candles[42], 'manual');
assert.ok(closed);
assert.equal(sim.getAccount().trades.length, 1);
assert.ok(Number.isFinite(closed!.pnl));

// Limit fill on bar touch
sim.reset(50_000);
sim.placeOrder({
  side: 'long',
  type: 'limit',
  size: 0.1,
  price: 99.5,
  barIndex: 0,
  bar: candles[0],
});
assert.equal(sim.getAccount().pendingOrders.length, 1);
sim.onBar(1, { time: candles[1].time, open: 100, high: 100.2, low: 99.4, close: 99.6 });
assert.ok(sim.getAccount().openPosition);
assert.equal(sim.getAccount().pendingOrders.length, 0);

const pnl = computeTradePnl('long', 1.1, 1.2, 1, 'EURUSD');
assert.ok(pnl > 0);

console.log('market-replay.selftest: ok');
