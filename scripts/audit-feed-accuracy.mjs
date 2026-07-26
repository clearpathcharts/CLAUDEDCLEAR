import { createRequire } from "module";
import { pathToFileURL } from "url";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

// Dynamic import of TS via tsx when run as: npx tsx scripts/audit-feed-accuracy.mjs
const { resolveTwelveDataInterval } = await import(
  pathToFileURL(path.join(root, "src/services/marketData.ts")).href
);

const ui = [
  "1m", "2m", "3m", "5m", "10m", "15m", "30m",
  "1H", "2H", "3H", "4H", "1D", "1W", "1M", "3M", "6M", "YTD",
];
const toInternal = {
  "1H": "1h", "2H": "2h", "3H": "3h", "4H": "4h",
  "1D": "1d", "1W": "1w", "1M": "1M", "3M": "3M", "6M": "6M", "YTD": "ytd",
};

const exact = new Set(["1min", "5min", "15min", "30min", "1h", "2h", "4h", "1day", "1week", "1month"]);
const rows = ui.map((tf) => {
  const internal = toInternal[tf] || tf;
  const resolved = resolveTwelveDataInterval(internal);
  let status = "OK";
  if (tf === "2m" || tf === "3m") status = resolved === "1min" ? "APPROX (→1min)" : "BROKEN";
  else if (tf === "10m") status = resolved === "15min" ? "APPROX (→15min)" : "BROKEN";
  else if (tf === "3H") status = resolved === "2h" ? "APPROX (→2h)" : "BROKEN";
  else if (tf === "3M" || tf === "6M" || tf === "YTD") status = resolved === "1day" ? "APPROX (→1day)" : "BROKEN";
  else if (!exact.has(resolved) && resolved !== "1day") status = "CHECK";
  return { tf, internal, resolved, status };
});

console.log("=== TIMEFRAME AUDIT ===");
for (const r of rows) {
  console.log(`${r.tf.padEnd(4)} → ${r.resolved.padEnd(8)} ${r.status}`);
}

const broken = rows.filter((r) => r.status === "BROKEN");
console.log(`\nBroken count: ${broken.length}`);
console.log("Exact native TF count:", rows.filter((r) => r.status === "OK").length);
console.log("Approx count:", rows.filter((r) => r.status.startsWith("APPROX")).length);
