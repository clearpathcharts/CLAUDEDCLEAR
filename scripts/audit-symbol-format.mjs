import { pathToFileURL } from "url";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const { formatSymbolForTwelveData } = await import(
  pathToFileURL(path.join(root, "src/server/marketDataGateway.ts")).href
);
const { marketCatalog } = await import(
  pathToFileURL(path.join(root, "src/engine/marketCatalog.ts")).href
);
const { MARKET_ASSETS } = await import(
  pathToFileURL(path.join(root, "src/constants/marketAssets.ts")).href
);

const deck = [
  "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "NZDUSD",
  "XAUUSD", "XAGUSD", "BTCUSD", "ETHUSD", "SOLUSD", "SPX", "DXY",
  "BTCUSDT", "USDCHF", "EURJPY", "GBPJPY", "EURGBP",
  "AAPL", "MSFT", "NVDA", "TSLA",
  "AUDCAD", "EURCHF", "GBPAUD", "NZDJPY", "AUDJPY", "EURAUD", "CADJPY",
  "NDX", "DJI", "ES1!", "NQ1!", "CL1!", "GC1!", "US10Y", "US30Y",
  "WTI", "BRENT", "NATGAS",
];

const all = [...new Set([
  ...deck,
  ...marketCatalog.map((m) => m.symbol),
  ...MARKET_ASSETS.map((a) => a.value),
])].sort();

console.log("=== SYMBOL FORMAT AUDIT ===");
const risk = [];
for (const s of all) {
  const f = formatSymbolForTwelveData(s);
  const unchanged = f === s;
  const looksFx = /^[A-Z]{3}\/[A-Z]{3}$/.test(f);
  const looksCrypto = /^[A-Z]+\/(USD|USDT)$/.test(f);
  let note = "ok";
  if (["SPX", "NDX", "DJI", "AAPL", "MSFT", "NVDA", "TSLA", "WTI", "BRENT", "NATGAS", "US10Y", "US30Y"].includes(s) && unchanged) {
    note = "pass-through (provider symbol)";
  } else if (s.includes("1!") && unchanged) {
    note = "RISK — futures bang-symbol may not resolve on TD";
    risk.push(s);
  } else if (s === "DXY" && f === "DX-Y.F") {
    note = "mapped (DXY futures root; app may still compute basket)";
  } else if (!looksFx && !looksCrypto && unchanged && s.length === 6) {
    note = "RISK — 6-letter not slash-formatted";
    risk.push(s);
  }
  console.log(`${s.padEnd(10)} → ${f.padEnd(12)} ${note}`);
}
console.log("\nTotal:", all.length);
console.log("Risk count:", risk.length);
if (risk.length) console.log("Risk symbols:", risk.join(", "));
