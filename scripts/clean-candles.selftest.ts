/**
 * Guards TradingView-clean candle styling — body/wick/border must match,
 * borders off, no muddy lighter-wick look.
 *
 * Run: npx tsx scripts/clean-candles.selftest.ts
 */
import assert from 'node:assert/strict';
import {
  CLEAN_NEON_CANDLE_COLORS,
  cleanCandleSeriesOptions,
  unifyCandleColors,
} from '../src/lib/charts/cleanCandleSeries.ts';

const mismatched = {
  upColor: '#00E5FF',
  downColor: '#FF1493',
  wickUpColor: '#7fffff',
  wickDownColor: '#ff7dff',
  borderUpColor: '#00ffff',
  borderDownColor: '#ff00ff',
};

const unified = unifyCandleColors(mismatched);
assert.equal(unified.upColor, unified.wickUpColor);
assert.equal(unified.upColor, unified.borderUpColor);
assert.equal(unified.downColor, unified.wickDownColor);
assert.equal(unified.downColor, unified.borderDownColor);

const opts = cleanCandleSeriesOptions(mismatched, 1.1);
assert.equal(opts.borderVisible, false);
assert.equal(opts.upColor, opts.wickUpColor);
assert.equal(opts.upColor, opts.borderUpColor);
assert.equal(opts.downColor, opts.wickDownColor);
assert.equal(opts.downColor, opts.borderDownColor);

const defaults = cleanCandleSeriesOptions();
assert.equal(defaults.upColor, CLEAN_NEON_CANDLE_COLORS.upColor);
assert.equal(defaults.downColor, CLEAN_NEON_CANDLE_COLORS.downColor);
assert.equal(defaults.borderVisible, false);

console.log('clean-candles.selftest: ok');
