import { pathToFileURL } from "url";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const { resolveTimeframePlan, resolveTwelveDataInterval } = await import(
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

const rows = ui.map((tf) => {
  const internal = toInternal[tf] || tf;
  const plan = resolveTimeframePlan(internal);
  const resolved = resolveTwelveDataInterval(internal);
  return {
    tf,
    internal,
    resolved,
    agg: plan.aggregateBars,
    vis: plan.visibleBars ?? "-",
    mode: plan.mode,
    note: plan.note,
  };
});

console.log("=== TIMEFRAME AUDIT (plans) ===");
for (const r of rows) {
  console.log(
    `${r.tf.padEnd(4)} → fetch=${r.resolved.padEnd(7)} agg=${String(r.agg).padEnd(2)} vis=${String(r.vis).padEnd(5)} ${r.mode.padEnd(10)} ${r.note}`
  );
}

const sig = new Map();
for (const r of rows) {
  const key = `${r.resolved}|x${r.agg}|v${r.vis}`;
  if (!sig.has(key)) sig.set(key, []);
  sig.get(key).push(r.tf);
}
const collisions = [...sig.entries()].filter(([, arr]) => arr.length > 1);
console.log(`\nUnique plan signatures: ${sig.size}/${rows.length}`);
console.log(`Collisions: ${collisions.length}`);
for (const [k, arr] of collisions) console.log(`  ${k} → ${arr.join(",")}`);
process.exitCode = collisions.length ? 1 : 0;
