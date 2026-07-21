/**
 * Ensures ticker/chart quote resolution prefers Twelve Data `close`
 * so header tickers cannot stick on stale hardcoded bases (e.g. gold 2382).
 */
import assert from "node:assert/strict";

function resolveQuotePrice(data) {
  if (!data || data.error) return null;
  const raw = data.close ?? data.price;
  if (raw === undefined || raw === null || raw === "") return null;
  const n = typeof raw === "number" ? raw : parseFloat(String(raw));
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Production-shaped Twelve Data /quote payload (no `price` field)
assert.equal(
  resolveQuotePrice({
    symbol: "XAU/USD",
    close: "4022.12997",
    percent_change: "0.28734238",
  }),
  4022.12997
);

// Prefer close when both exist (chart + ticker must agree)
assert.equal(
  resolveQuotePrice({ close: "4022.13", price: "2382.40" }),
  4022.13
);

// price-only payloads still work (DXY /price-style)
assert.equal(resolveQuotePrice({ price: "104.82" }), 104.82);

// Never treat missing/error as a live level
assert.equal(resolveQuotePrice(null), null);
assert.equal(resolveQuotePrice({ error: "UPSTREAM_ERROR" }), null);
assert.equal(resolveQuotePrice({ close: "0" }), null);

console.log("quote-price-resolve.selftest: ok");
