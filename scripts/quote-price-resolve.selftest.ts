/**
 * Ensures ticker/chart quote resolution prefers Twelve Data `close`
 * so header tickers cannot stick on stale leftover `price` (e.g. gold 2382).
 * Run: npm run test:quote-price-resolve
 */
import assert from "node:assert/strict";
import { resolveQuotePrice, withTapePrice } from "../src/lib/resolveQuotePrice.ts";
import { resolveMarketAsset } from "../src/constants/marketAssets.ts";
import { getRegistryAsset, searchEnabledAssets } from "../src/constants/assetRegistry.ts";
import { resolvePanelScan, setActivePatternScan, clearPatternScan } from "../src/patterns/index.ts";
import type { PatternScanResult } from "../src/patterns/types.ts";

assert.equal(
  resolveQuotePrice({
    symbol: "XAU/USD",
    close: "4022.12997",
    percent_change: "0.28734238",
  } as { close: string }),
  4022.12997,
);

assert.equal(resolveQuotePrice({ close: "4022.13", price: "2382.40" }), 4022.13);
assert.equal(resolveQuotePrice({ price: "104.82" }), 104.82);
assert.equal(resolveQuotePrice(null), null);
assert.equal(resolveQuotePrice({ error: "UPSTREAM_ERROR" }), null);
assert.equal(resolveMarketAsset("ETH").value, "ETHUSD");
assert.equal(resolveMarketAsset("eth").value, "ETHUSD");
assert.equal(resolveMarketAsset("BTC").value, "BTCUSD");
assert.equal(resolveMarketAsset("SOL").value, "SOLUSD");
assert.equal(resolveMarketAsset("ETH/USD").value, "ETHUSD");
assert.equal(getRegistryAsset("ETH")?.providerSymbol, "ETH/USD");
assert.notEqual(resolveMarketAsset("ETH").value, "ETH");
assert.ok(searchEnabledAssets("e", 25).length <= 25);
assert.ok(searchEnabledAssets("ETH", 25).some((a) => a.symbol === "ETHUSD"));

const taped = withTapePrice({ close: "4022.13", price: "2382.40", symbol: "XAUUSD" });
assert.equal(taped.price, 4022.13);
assert.equal(taped.close, "4022.13");

const emptyScan = (symbol: string): PatternScanResult => ({
  scannedBars: 12,
  swingHighs: 0,
  swingLows: 0,
  patterns: [
    {
      id: "rising_wedge",
      label: `${symbol} planted`,
      category: "chart",
      patternGroup: "continuation",
      direction: "bullish",
      confidence: 0.9,
      startIndex: 0,
      endIndex: 11,
      time: 1,
    },
  ],
});

setActivePatternScan(emptyScan("EURUSD"), "EURUSD", "1h");
assert.equal(resolvePanelScan("XAUUSD", "1h"), null, "keyed miss must not steal another chart's scan");
assert.equal(resolvePanelScan("—", "1h"), null);
assert.equal(resolvePanelScan("", "1h"), null);
assert.equal(resolvePanelScan("EURUSD", "1h")?.patterns[0]?.label, "EURUSD planted");
clearPatternScan("EURUSD", "1h");

console.log("quote-price-resolve.selftest: ok");
