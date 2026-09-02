/**
 * Self-test: FMP is the second market-data layer after Twelve Data.
 * Run: npm run test:fmp-market-fallback
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { getEnabledAssets } from '../src/constants/assetRegistry.ts';
import { formatSymbolForTwelveData } from '../src/server/marketDataGateway.ts';
import {
  FMP_QUOTE_SYMBOL,
  fmpChartInterval,
  fmpQuoteSymbol,
  fmpSymbolsForRegistry,
  normalizeFmpCandles,
  normalizeFmpQuote,
} from '../src/server/fmpMarketFallback.ts';
import { historySymbol } from '../src/lib/institutional/vendorMaps.ts';

assert.equal(historySymbol('SPX').symbol, 'SPY');
assert.equal(historySymbol('NDX').symbol, 'QQQ');
assert.equal(formatSymbolForTwelveData('SPX'), 'SPY');
assert.equal(formatSymbolForTwelveData('NDX'), 'QQQ');
assert.equal(formatSymbolForTwelveData('XAUUSD'), 'XAU/USD');
assert.equal(formatSymbolForTwelveData('EURUSD'), 'EUR/USD');

assert.equal(fmpQuoteSymbol('SPX'), 'SPY');
assert.equal(fmpQuoteSymbol('VIX'), '^VIX');
assert.equal(fmpQuoteSymbol('US10Y'), '^TNX');
assert.equal(fmpQuoteSymbol('XAUUSD'), 'GCUSD');
assert.equal(fmpQuoteSymbol('XAU/USD'), 'GCUSD');
assert.equal(fmpQuoteSymbol('EURUSD'), 'EURUSD');
assert.equal(fmpQuoteSymbol('AAPL'), 'AAPL');
assert.equal(fmpQuoteSymbol('../etc'), null);
assert.ok(FMP_QUOTE_SYMBOL.WTI);

const registryMap = fmpSymbolsForRegistry();
for (const asset of getEnabledAssets()) {
  assert.ok(registryMap[asset.symbol], `registry ${asset.symbol} must have an FMP proxy id`);
  assert.ok(fmpQuoteSymbol(asset.providerSymbol), `provider ${asset.providerSymbol} must proxy`);
}
assert.equal(Object.keys(registryMap).length, getEnabledAssets().length);
assert.equal(fmpQuoteSymbol('NVDA'), 'NVDA');
assert.equal(fmpQuoteSymbol('GBPUSD'), 'GBPUSD');
assert.equal(fmpQuoteSymbol('BTCUSDT'), 'BTCUSD');
assert.equal(fmpQuoteSymbol('DXY'), 'DXUSD');
assert.equal(formatSymbolForTwelveData('VIX'), 'VIX');

assert.equal(fmpChartInterval('5min').kind, 'intraday');
assert.equal(fmpChartInterval('1day').kind, 'eod');
assert.equal(fmpChartInterval('1h').kind, 'intraday');

const q = normalizeFmpQuote({ price: 432.1, previousClose: 430, changesPercentage: 0.49, name: 'SPDR' }, 'SPX');
assert.ok(q);
assert.equal(q.price, '432.1');
assert.equal(q.close, '432.1');
assert.equal(q.vendor, 'FMP');
assert.equal(normalizeFmpQuote({ price: 0 }, 'SPX'), null);

const candles = normalizeFmpCandles(
  [
    { date: '2026-09-01 10:00:00', open: 1, high: 2, low: 0.5, close: 1.5, volume: 10 },
    { date: '2026-09-01 10:05:00', open: 1.5, high: 2.2, low: 1.4, close: 2, volume: 8 },
  ],
  'XAUUSD',
  '5min',
  50,
);
assert.ok(candles);
assert.equal(candles.status, 'ok');
assert.equal(candles.values.length, 2);
assert.equal(candles.values[0].datetime, '2026-09-01 10:05:00');

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverTs = fs.readFileSync(path.join(root, 'server.ts'), 'utf8');
assert.doesNotMatch(serverTs, /Sign in for higher limits/);
assert.match(serverTs, /max: 1200/);
assert.match(serverTs, /max: 2400/);
assert.match(serverTs, /intelLimiter/);
assert.match(serverTs, /fetchFmpQuote|getFmpApiKey\(\)/);

const gateway = fs.readFileSync(path.join(root, 'src/server/marketDataGateway.ts'), 'utf8');
assert.match(serverTs, /slice\(0, 80\)/);
assert.match(gateway, /fetchFmpQuote/);
assert.match(gateway, /fetchFmpQuotes/);
assert.match(gateway, /fetchFmpCandles/);
assert.match(gateway, /historySymbol/);

console.log('fmp-market-fallback.selftest: ok');
