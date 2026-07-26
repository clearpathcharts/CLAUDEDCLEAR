/**
 * Dual smoke gate for Venture 70 rollout.
 *
 * Default: http://localhost:3000
 * Cloud:   CLEARPATH_API_BASE=https://clearpathtrader.com npx tsx scripts/smoke-venture70.mjs
 *
 * Runs deck-critical symbols on 15m / 1H / 1D serially (no parallel stampede).
 * Also validates format for every enabled registry symbol offline.
 */
import { pathToFileURL } from "url";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const base = (process.env.CLEARPATH_API_BASE || "http://localhost:3000").replace(/\/$/, "");

const { getDeckCriticalAssets, getEnabledAssets, ENABLED_ASSET_COUNT } = await import(
  pathToFileURL(path.join(root, "src/constants/assetRegistry.ts")).href
);
const { formatSymbolForTwelveData } = await import(
  pathToFileURL(path.join(root, "src/server/marketDataGateway.ts")).href
);
const { resolveTwelveDataInterval } = await import(
  pathToFileURL(path.join(root, "src/services/marketData.ts")).href
);

const INTERVALS = ["15m", "1h", "1d"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

console.log(`=== VENTURE 70 SMOKE ===`);
console.log(`Base: ${base}`);
console.log(`Enabled assets: ${ENABLED_ASSET_COUNT}`);

let formatFails = 0;
for (const asset of getEnabledAssets()) {
  const formatted = formatSymbolForTwelveData(asset.symbol);
  if (formatted !== asset.providerSymbol) {
    console.log(`FORMAT  ${asset.symbol.padEnd(10)} got ${formatted} expected ${asset.providerSymbol}`);
    formatFails++;
  }
}
console.log(`Format mismatches: ${formatFails}`);

const critical = getDeckCriticalAssets();
const results = [];

for (const asset of critical) {
  for (const uiTf of INTERVALS) {
    const interval = resolveTwelveDataInterval(uiTf);
    const url =
      `${base}/api/market/history` +
      `?symbol=${encodeURIComponent(asset.symbol)}` +
      `&interval=${encodeURIComponent(interval)}` +
      `&limit=50`;
    let status = "EMPTY";
    try {
      const res = await fetch(url);
      if (res.status === 429) status = "RATE_LIMIT";
      else if (res.status === 503) status = "NO_KEY";
      else if (!res.ok) status = `HTTP_${res.status}`;
      else {
        const body = await res.json();
        if (Array.isArray(body) && body.length > 0) status = "PASS";
        else if (body?.error) status = String(body.error);
        else status = "EMPTY";
      }
    } catch (err) {
      status = `NET:${err?.message || err}`;
    }
    results.push({ symbol: asset.symbol, tf: uiTf, interval, status });
    console.log(`${status.padEnd(12)} ${asset.symbol.padEnd(10)} ${uiTf}→${interval}`);
    await sleep(350);
  }
}

const fails = results.filter((r) => r.status !== "PASS");
const rateLimited = results.filter((r) => r.status === "RATE_LIMIT");
console.log(`\nDeck-critical checks: ${results.length}`);
console.log(`PASS: ${results.length - fails.length}`);
console.log(`FAIL: ${fails.length}`);
if (rateLimited.length) {
  console.log(`RATE_LIMIT hits: ${rateLimited.length} (retry off-peak or raise cooldown)`);
}

if (formatFails > 0) {
  process.exitCode = 1;
} else if (fails.length === 0) {
  console.log("\nShip gate: all deck-critical checks passed.");
  process.exitCode = 0;
} else if (fails.some((f) => f.status !== "RATE_LIMIT" && f.status !== "NO_KEY" && !String(f.status).startsWith("NET:"))) {
  process.exitCode = 1;
} else if (fails.every((f) => f.status === "NO_KEY" || String(f.status).startsWith("NET:"))) {
  console.log("\nNote: server unreachable or TWELVEDATA_API_KEY missing — format gate still ran.");
  // Don't fail CI solely for unreachable server when format is clean.
  process.exitCode = 0;
} else if (fails.every((f) => f.status === "RATE_LIMIT")) {
  console.log("\nAll live failures were rate limits — format OK; retry later.");
  process.exitCode = 0;
} else {
  process.exitCode = 1;
}
