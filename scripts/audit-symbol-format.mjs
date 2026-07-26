import { pathToFileURL } from "url";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const { formatSymbolForTwelveData } = await import(
  pathToFileURL(path.join(root, "src/server/marketDataGateway.ts")).href
);
const { getEnabledAssets, ENABLED_ASSET_COUNT } = await import(
  pathToFileURL(path.join(root, "src/constants/assetRegistry.ts")).href
);

console.log("=== SYMBOL FORMAT AUDIT (registry) ===");
console.log("Enabled:", ENABLED_ASSET_COUNT);
let risk = 0;
for (const a of getEnabledAssets()) {
  const f = formatSymbolForTwelveData(a.symbol);
  const ok = f === a.providerSymbol;
  if (!ok) {
    risk++;
    console.log(`${a.symbol.padEnd(10)} → ${f.padEnd(14)} EXPECTED ${a.providerSymbol}`);
  } else {
    console.log(`${a.symbol.padEnd(10)} → ${f.padEnd(14)} ${a.latencyClass}`);
  }
}
console.log("\nMismatch count:", risk);
if (risk > 0) process.exitCode = 1;
