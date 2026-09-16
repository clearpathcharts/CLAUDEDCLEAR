/**
 * Manual / CI runner for the swap-hour timeframe accuracy verifier.
 *
 * Usage:
 *   npx tsx scripts/verify-timeframe-accuracy.mjs
 *   TIMEFRAME_VERIFY_SYMBOLS=EURUSD,XAUUSD npx tsx scripts/verify-timeframe-accuracy.mjs
 *
 * On the live server this also runs automatically once per day between
 * 02:00–02:59 America/New_York (override via TIMEFRAME_VERIFY_HOUR / _TZ).
 */
import "dotenv/config";
import { pathToFileURL } from "url";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const { runTimeframeAccuracyVerify } = await import(
  pathToFileURL(path.join(root, "src/server/timeframeAccuracyVerifier.ts")).href
);

console.log("=== TIMEFRAME ACCURACY VERIFY (swap-hour suite) ===");
const report = await runTimeframeAccuracyVerify({ force: true, delayMs: 350 });

console.log(`Ran at:   ${report.ranAt}`);
console.log(`Window:   ${report.window.label}`);
console.log(`Symbols:  ${report.symbols.join(", ")}`);
console.log(`TFs:      ${report.timeframes.length}`);
console.log(
  `Summary:  passed=${report.summary.passed} failed=${report.summary.failed} ok=${report.summary.ok}`
);

if (report.planCollisions.length) {
  console.log("\nPlan collisions:");
  for (const c of report.planCollisions) console.log("  ", c);
}

const fails = report.rows.filter((r) => !r.ok);
if (fails.length) {
  console.log("\nFailures:");
  for (const r of fails.slice(0, 40)) {
    console.log(
      `  ${r.symbol.padEnd(8)} ${r.ui.padEnd(4)} ${r.errors.join(" | ")}`
    );
  }
  if (fails.length > 40) console.log(`  … +${fails.length - 40} more`);
} else {
  console.log("\nAll symbol × timeframe checks passed.");
}

console.log(`\nReport written to data/timeframe-verify/latest.json`);
process.exitCode = report.summary.ok ? 0 : 1;
