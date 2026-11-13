/**
 * Self-test: FMP is the second market-data layer after Twelve Data.
 * Same-instrument only — never silent spot↔futures / index↔ETF swaps.
 * Run: npm run test:fmp-market-fallback
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { getEnabledAssets } from '../src/constants/assetRegistry.ts';
import {
  buildProvenance,
  forbiddenSubstitutionReason,
  isForbiddenPriceSubstitution,
  provenanceHeaders,
  sanitizeInstrumentSymbol,
} from '../src/lib/instrumentIntegrity.ts';
import { formatSymbolForTwelveData } from '../src/server/marketDataGateway.ts';
import {
  FMP_QUOTE_SYMBOL,
  fmpChartInterval,
  fmpPriceRefusal,
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
assert.equal(formatSymbolForTwelveData('ETH'), 'ETH/USD');
assert.equal(formatSymbolForTwelveData('BTC'), 'BTC/USD');
assert.equal(formatSymbolForTwelveData('SOL'), 'SOL/USD');

// Same-instrument FMP maps still work.
assert.equal(fmpQuoteSymbol('VIX'), '^VIX');
assert.equal(fmpQuoteSymbol('US10Y'), '^TNX');
assert.equal(fmpQuoteSymbol('EURUSD'), 'EURUSD');
assert.equal(fmpQuoteSymbol('AAPL'), 'AAPL');
assert.equal(fmpQuoteSymbol('../etc'), null);

// Spot gold / silver / energy may try the SAME instrument id on FMP — never futures.
assert.notEqual(fmpQuoteSymbol('XAUUSD'), 'GCUSD', 'spot gold must not map to GCUSD');
assert.notEqual(fmpQuoteSymbol('XAU/USD'), 'GCUSD', 'spot gold slash form must not map to GCUSD');
assert.ok(
  fmpQuoteSymbol('XAUUSD') === 'XAUUSD' || fmpQuoteSymbol('XAUUSD') === null,
  'spot gold FMP id is same-instrument or absent',
);
assert.notEqual(fmpQuoteSymbol('XAGUSD'), 'SIUSD', 'spot silver must not map to SIUSD');
assert.notEqual(fmpQuoteSymbol('WTI'), 'CLUSD', 'WTI must not map to CLUSD');
assert.notEqual(fmpQuoteSymbol('BRENT'), 'BZUSD', 'Brent must not map to BZUSD');
assert.notEqual(fmpQuoteSymbol('DXY'), 'DXUSD', 'DXY must not map to DXUSD futures');
assert.notEqual(fmpQuoteSymbol('NATGAS'), 'NGUSD');
assert.notEqual(fmpQuoteSymbol('COPPER'), 'HGUSD');
assert.equal(fmpQuoteSymbol('SPX'), null, 'cash index must not silently become SPY on FMP');
assert.equal(fmpQuoteSymbol('NDX'), null);
assert.equal(fmpQuoteSymbol('DJI'), null);

assert.ok(isForbiddenPriceSubstitution('XAUUSD', 'GCUSD'));
assert.ok(isForbiddenPriceSubstitution('XAU/USD', 'GCUSD'));
assert.ok(forbiddenSubstitutionReason('XAUUSD', 'GCUSD')?.includes('Spot gold'));
// Same-instrument XAUUSD may still be attempted on FMP; futures stand-in is what we refuse.
assert.notEqual(fmpQuoteSymbol('XAUUSD'), 'GCUSD');
assert.ok(
  fmpPriceRefusal('SPX')?.toLowerCase().includes('spy') ||
    fmpPriceRefusal('SPX')?.toLowerCase().includes('same-instrument') ||
    fmpPriceRefusal('SPX') != null,
);

assert.ok(!('XAUUSD' in FMP_QUOTE_SYMBOL));
assert.ok(!('WTI' in FMP_QUOTE_SYMBOL));

const registryMap = fmpSymbolsForRegistry();
for (const asset of getEnabledAssets()) {
  const mapped = fmpQuoteSymbol(asset.symbol);
  if (mapped) {
    assert.equal(registryMap[asset.symbol], mapped);
    assert.ok(
      !isForbiddenPriceSubstitution(asset.symbol, mapped),
      `${asset.symbol} → ${mapped} is a forbidden cross-instrument price map`,
    );
  } else {
    assert.equal(registryMap[asset.symbol], undefined);
  }
  // Provider symbol path must also refuse forbidden futures stand-ins.
  if (asset.category === 'metals' || asset.category === 'commodities') {
    assert.equal(
      fmpQuoteSymbol(asset.providerSymbol),
      fmpQuoteSymbol(asset.symbol),
      `${asset.symbol} provider form must match desk form`,
    );
  }
}

assert.equal(fmpQuoteSymbol('NVDA'), 'NVDA');
assert.equal(fmpQuoteSymbol('GBPUSD'), 'GBPUSD');
assert.equal(fmpQuoteSymbol('BTCUSDT'), 'BTCUSD');
assert.equal(formatSymbolForTwelveData('VIX'), 'VIX');

assert.equal(fmpChartInterval('5min').kind, 'intraday');
assert.equal(fmpChartInterval('1day').kind, 'eod');
assert.equal(fmpChartInterval('1h').kind, 'intraday');

const q = normalizeFmpQuote({ price: 432.1, previousClose: 430, changesPercentage: 0.49, name: 'Apple' }, 'AAPL', 'AAPL');
assert.ok(q);
assert.equal(q.price, '432.1');
assert.equal(q.close, '432.1');
assert.equal(q.vendor, 'FMP');
assert.equal(q.provenance.provider, 'fmp');
assert.equal(q.provenance.providerSymbol, 'AAPL');
assert.equal(q.provenance.isFallback, true);
assert.equal(q.provenance.isProxy, false);
assert.equal(normalizeFmpQuote({ price: 0 }, 'AAPL'), null);
// Refuse to normalize a quote that would be a forbidden substitution.
assert.equal(normalizeFmpQuote({ price: 2000 }, 'XAUUSD', 'GCUSD'), null);

const candles = normalizeFmpCandles(
  [
    { date: '2026-09-01 10:00:00', open: 1, high: 2, low: 0.5, close: 1.5, volume: 10 },
    { date: '2026-09-01 10:05:00', open: 1.5, high: 2.2, low: 1.4, close: 2, volume: 8 },
  ],
  'AAPL',
  '5min',
  50,
);
assert.ok(candles);
assert.equal(candles.status, 'ok');
assert.equal(candles.values.length, 2);
assert.equal(candles.values[0].datetime, '2026-09-01 10:05:00');
assert.equal(candles.provenance.provider, 'fmp');
assert.equal(candles.provenance.requestedSymbol, 'AAPL');

// Control chars / CR-LF in the requested symbol must not survive into provenance
// or headers (shared candle-cache poison → setHeader 500). See security review on #392.
assert.equal(sanitizeInstrumentSymbol('AA\nPL'), 'AAPL');
assert.equal(sanitizeInstrumentSymbol('AA\r\nPL'), 'AAPL');
{
  const poisoned = buildProvenance({
    requestedSymbol: 'AA\nPL',
    provider: 'fmp',
    providerSymbol: 'AA\rPL',
    isFallback: true,
  });
  assert.equal(poisoned.requestedSymbol, 'AAPL');
  assert.equal(poisoned.providerSymbol, 'AAPL');
  const headers = provenanceHeaders(poisoned);
  for (const [k, v] of Object.entries(headers)) {
    assert.doesNotMatch(v, /[\r\n\u0000-\u001F\u007F]/, `${k} must be header-safe`);
  }
  assert.equal(headers['X-ClearPath-Requested-Symbol'], 'AAPL');
}

// Spot gold may normalize against same-instrument XAUUSD — never GCUSD futures.
const goldCandles = normalizeFmpCandles(
  [{ date: '2026-09-01', open: 1, high: 2, low: 0.5, close: 1.5 }],
  'XAUUSD',
  '1day',
  10,
);
assert.ok(goldCandles);
assert.equal(goldCandles.provenance.providerSymbol, 'XAUUSD');
assert.notEqual(goldCandles.provenance.providerSymbol, 'GCUSD');

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverTs = fs.readFileSync(path.join(root, 'server.ts'), 'utf8');
assert.doesNotMatch(serverTs, /Sign in for higher limits/);
assert.doesNotMatch(serverTs, /express-rate-limit/);
assert.doesNotMatch(serverTs, /intelLimiter/);
assert.doesNotMatch(serverTs, /quoteLimiter/);
assert.match(serverTs, /fetchFmpQuote|getFmpApiKey\(\)/);
assert.match(serverTs, /provenanceHeaders/);
assert.match(serverTs, /sanitizeInstrumentSymbol/);
assert.match(serverTs, /invalid symbol/);

const gateway = fs.readFileSync(path.join(root, 'src/server/marketDataGateway.ts'), 'utf8');
assert.match(gateway, /fetchFmpQuote/);
assert.match(gateway, /fetchFmpQuotes/);
assert.match(gateway, /fetchFmpCandles/);
assert.match(gateway, /historySymbol/);
assert.match(gateway, /attachCandleProvenance/);

const integrity = fs.readFileSync(path.join(root, 'src/lib/instrumentIntegrity.ts'), 'utf8');
assert.match(integrity, /FORBIDDEN_PRICE_SUBSTITUTIONS/);
assert.match(integrity, /Spot gold is not COMEX gold futures/);

console.log('fmp-market-fallback.selftest: ok');
