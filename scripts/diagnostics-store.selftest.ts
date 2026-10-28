/**
 * Firestore-backed Site Doctor / timeframe-verify latest reports.
 * Run: npm run test:diagnostics-store
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(".");
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");

const store = read("src/server/diagnosticsReportStore.ts");
const doctor = read("src/server/siteDoctor.ts");
const tf = read("src/server/timeframeAccuracyVerifier.ts");
const server = read("server.ts");

assert.match(store, /ops_diagnostics/, "Firestore collection must be ops_diagnostics");
assert.match(store, /site_doctor_latest/, "Site Doctor latest doc id");
assert.match(store, /timeframe_verify_latest/, "Timeframe verify latest doc id");

assert.match(doctor, /writeDiagnosticsLatest\(\s*["']site_doctor["']/, "Site Doctor must write through diagnostics store");
assert.match(doctor, /hydrateSiteDoctorReportFromStore/, "Site Doctor must expose hydrate");
assert.match(tf, /writeDiagnosticsLatest\(\s*["']timeframe_verify["']/, "TF verify must write through diagnostics store");
assert.match(tf, /hydrateTimeframeVerifyReportFromStore/, "TF verify must expose hydrate");

assert.match(server, /hydrateSiteDoctorReportFromStore/, "server.ts must hydrate Site Doctor on boot");
assert.match(server, /hydrateTimeframeVerifyReportFromStore/, "server.ts must hydrate TF verify on boot");
assert.match(
  server,
  /await Promise\.all\([\s\S]*hydrateSiteDoctorReportFromStore[\s\S]*startSiteDoctorScheduler\(\)/,
  "Site Doctor scheduler must start after Firestore hydrate is awaited",
);

console.log("diagnostics-store.selftest: ok");
