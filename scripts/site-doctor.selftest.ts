/**
 * Site Doctor — hourly detect+report sweep (src/server/siteDoctor.ts).
 *
 * Site Doctor is what tells the founder the site is healthy, so the dangerous
 * failure mode is not "the sweep crashed", it is "the sweep says green while a
 * vendor is actually dark". The headline guard here runs the real sweep with no
 * Twelve Data key present and proves the market-feed check reports critical
 * instead of inventing a pass — the same honesty rule that keeps missing vendor
 * cells blank on the desks.
 *
 * Also guards the wiring that makes the sweep reach the founder at all:
 * scheduler registration, both admin routes, SITE_DOCTOR_ENABLED gating, and
 * the check shape the CEO Dashboard "Site Doctor — Hourly Pulse" panel renders.
 *
 * Run: npx tsx scripts/site-doctor.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve('.');
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

const doctor = read('src/server/siteDoctor.ts');
const server = read('server.ts');
const ceo = read('src/components/CeoDashboard.tsx');
const envExample = read('.env.example');

/** Body of a top-level function, brace-matched, so assertions can be scoped to one check. */
function functionBody(source: string, name: string): string {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `src/server/siteDoctor.ts must still declare ${name}()`);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  assert.fail(`unbalanced braces while reading ${name}()`);
}

/** Field names of a `type X = { … }` block, with optional members flagged. */
function typeFields(source: string, typeName: string): Array<{ name: string; optional: boolean }> {
  const block = source.match(new RegExp(`type ${typeName} = \\{([\\s\\S]*?)\\n\\};`));
  assert.ok(block, `expected a \`type ${typeName}\` declaration`);
  return [...block[1].matchAll(/^\s{2}([A-Za-z][A-Za-z0-9]*)(\??):/gm)].map((m) => ({
    name: m[1],
    optional: m[2] === '?',
  }));
}

// 1. The honest-failure branch, read from source: a missing key must short-circuit
//    to a critical fail BEFORE any vendor call, and the pass must be derived from
//    the bars that came back — never a hardcoded true.
const twelveData = functionBody(doctor, 'checkTwelveData');
const guardAt = twelveData.indexOf('if (!key)');
const fetchAt = twelveData.indexOf('getMarketCandles');
assert.ok(guardAt >= 0, 'checkTwelveData must guard on a missing TWELVEDATA_API_KEY.');
assert.ok(fetchAt >= 0, 'checkTwelveData must still sample live candles when a key exists.');
assert.ok(
  guardAt < fetchAt,
  'The missing-key guard must come before getMarketCandles — Site Doctor must not call the vendor with an empty key and report whatever comes back.',
);
const noKeyBranch = twelveData.slice(guardAt, fetchAt);
assert.match(
  noKeyBranch,
  /ok:\s*false/,
  'With no TWELVEDATA_API_KEY the Twelve Data check must report ok:false. A green market-feed row with no key is a lie on the founder dashboard.',
);
assert.match(
  noKeyBranch,
  /severity:\s*["']critical["']/,
  'A dark market feed is critical, not info/warn — it is why the site looks empty to members.',
);
assert.doesNotMatch(
  noKeyBranch,
  /ok:\s*true/,
  'The missing-key branch must never produce a passing check.',
);
assert.match(
  twelveData,
  /const ok = n > 0/,
  'With a key present, the check must pass only when real bars came back, not because the request did not throw.',
);

// 2. Check ids are derived from the real source, never guessed. (A stale draft of
//    this test asserted "waitlist", but siteDoctor.ts calls it "waitlist_convert".)
const sourceCheckIds = [
  ...new Set([...doctor.matchAll(/\bid:\s*["']([a-z0-9_]+)["']/g)].map((m) => m[1])),
].sort();
assert.ok(
  sourceCheckIds.length >= 8,
  `expected at least 8 Site Doctor checks, found ${sourceCheckIds.length}`,
);
assert.ok(
  sourceCheckIds.includes('waitlist_convert'),
  'The waitlist conversion check id is waitlist_convert; do not rename it without updating its consumers.',
);
assert.ok(
  !sourceCheckIds.includes('waitlist'),
  'There is no check called "waitlist" — assert the real id, waitlist_convert.',
);

// 3. SITE_DOCTOR_ENABLED gating, and a sane interval floor so a bad env value
//    cannot turn the hourly pulse into a hot loop against Twelve Data.
const enabled = functionBody(doctor, 'isEnabled');
assert.match(enabled, /SITE_DOCTOR_ENABLED/, 'isEnabled() must read SITE_DOCTOR_ENABLED.');
for (const off of ['0', 'false', 'off']) {
  assert.ok(enabled.includes(`"${off}"`), `SITE_DOCTOR_ENABLED=${off} must switch the sweep off.`);
}
assert.match(
  functionBody(doctor, 'startSiteDoctorScheduler'),
  /if \(!isEnabled\(\)\)/,
  'startSiteDoctorScheduler() must return early when SITE_DOCTOR_ENABLED is off.',
);
assert.match(
  functionBody(doctor, 'intervalMs'),
  /n >= 60_000/,
  'SITE_DOCTOR_INTERVAL_MS must be floored at 60s so a typo cannot hammer the vendor.',
);
assert.match(envExample, /^SITE_DOCTOR_ENABLED=/m, '.env.example must document SITE_DOCTOR_ENABLED.');

// 4. Wiring: the sweep is armed at boot and both founder routes exist behind the
//    founder/catalog-admin guard. An unguarded route would expose secret presence.
const doctorImport = server.match(/import \{([\s\S]*?)\} from '\.\/src\/server\/siteDoctor'/);
assert.ok(doctorImport, "server.ts must import from './src/server/siteDoctor'.");
for (const fn of ['getLatestSiteDoctorReport', 'runSiteDoctorSweep', 'startSiteDoctorScheduler']) {
  assert.ok(doctorImport[1].includes(fn), `server.ts must import ${fn} from src/server/siteDoctor.`);
}
const listenAt = server.indexOf('server.listen(PORT');
assert.ok(listenAt >= 0, 'server.ts must still call server.listen(PORT, …).');
assert.ok(
  server.indexOf('startSiteDoctorScheduler();', listenAt) > listenAt,
  'startSiteDoctorScheduler() must run in the listen callback, or the hourly pulse never arms in production.',
);
assert.match(
  server,
  /app\.get\(\s*'\/api\/admin\/site-doctor',\s*requireFounderOrCatalogAdmin/,
  'GET /api/admin/site-doctor must exist and stay behind requireFounderOrCatalogAdmin.',
);
assert.match(
  server,
  /app\.post\(\s*'\/api\/admin\/site-doctor\/run',\s*requireFounderOrCatalogAdmin/,
  'POST /api/admin/site-doctor/run must exist and stay behind requireFounderOrCatalogAdmin.',
);
assert.ok(
  ceo.includes("'/api/admin/site-doctor'") && ceo.includes("'/api/admin/site-doctor/run'"),
  'The CEO Dashboard pulse panel must call both Site Doctor routes.',
);
assert.match(
  ceo,
  /Site Doctor — Hourly Pulse/,
  'The CEO Dashboard must still render the Site Doctor panel.',
);

// 5. Run the real sweep with no Twelve Data key, in a throwaway cwd so the
//    report lands in a temp data/site-doctor instead of the repo.
delete process.env.TWELVEDATA_API_KEY;
delete process.env.TWELVE_DATA_API_KEY;
process.env.CLEARPATH_DISABLE_FIRESTORE_ADMIN = '1';
delete process.env.FIREBASE_SERVICE_ACCOUNT;
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cp-site-doctor-'));
process.chdir(tmp);

async function main() {
  const siteDoctor = await import('../src/server/siteDoctor.ts');
  const report = await siteDoctor.runSiteDoctorSweep();

  const feed = report.checks.find((c) => c.id === 'twelvedata');
  assert.ok(feed, 'The sweep must always include the twelvedata market-feed check.');
  assert.equal(
    feed!.ok,
    false,
    'THE POINT OF THIS TEST: with no TWELVEDATA_API_KEY the Twelve Data check reported ok. Site Doctor must fail closed and show the founder a dark feed, never a green row it cannot back with data.',
  );
  assert.equal(feed!.severity, 'critical', 'A dark market feed must be severity critical.');
  assert.match(
    feed!.detail,
    /TWELVEDATA_API_KEY/,
    'The failure detail must name the missing key so the founder knows what to set, not just "unhealthy".',
  );

  const secrets = report.checks.find((c) => c.id === 'core_secrets');
  assert.ok(secrets, 'The sweep must include the core_secrets check.');
  assert.equal(secrets!.ok, false, 'core_secrets must fail when TWELVEDATA_API_KEY is absent.');
  assert.match(secrets!.detail, /TWELVEDATA_API_KEY/, 'core_secrets must name the missing key.');

  assert.ok(report.failCount >= 1, 'A missing vendor key must count as a critical failure.');
  assert.equal(
    report.overall,
    'red',
    'A sweep with no market-data key must roll up to red. Green here would tell the founder the site is fine while members see an empty chart.',
  );

  // Every id declared in siteDoctor.ts is actually produced, and nothing extra.
  const reported = [...new Set(report.checks.map((c) => c.id))].sort();
  assert.deepEqual(
    reported,
    sourceCheckIds,
    `The sweep must produce exactly the checks declared in src/server/siteDoctor.ts. Reported [${reported.join(', ')}], declared [${sourceCheckIds.join(', ')}].`,
  );

  // The CEO panel renders whatever the server sends, so its type is the contract.
  for (const field of typeFields(ceo, 'SiteDoctorCheck')) {
    if (field.optional) continue;
    for (const check of report.checks) {
      assert.ok(
        field.name in check,
        `Check "${check.id}" is missing "${field.name}", which the CEO Dashboard Site Doctor panel reads.`,
      );
    }
  }
  for (const field of typeFields(ceo, 'SiteDoctorReport')) {
    if (field.optional) continue;
    assert.ok(
      field.name in report,
      `The sweep report is missing "${field.name}", which the CEO Dashboard Site Doctor panel reads.`,
    );
  }
  const panelSeverities = ceo.match(/severity: ('[a-z]+'(?: \| '[a-z]+')*)/);
  assert.ok(panelSeverities, 'The CEO panel must declare the severity union it styles.');
  for (const check of report.checks) {
    assert.ok(
      panelSeverities[1].includes(`'${check.severity}'`),
      `Severity "${check.severity}" from check "${check.id}" is not one the CEO panel can style (${panelSeverities[1]}).`,
    );
  }
  assert.ok(
    ['green', 'yellow', 'red'].includes(report.overall),
    `overall must be one of the three colours the panel styles, got "${report.overall}".`,
  );

  // The report is persisted, so the panel still has something to show after a restart.
  const persisted = path.join(tmp, 'data', 'site-doctor', 'latest.json');
  assert.ok(fs.existsSync(persisted), 'Each sweep must write data/site-doctor/latest.json.');
  assert.equal(
    JSON.parse(fs.readFileSync(persisted, 'utf8')).ranAt,
    report.ranAt,
    'latest.json must hold the sweep that just ran.',
  );
  assert.equal(
    siteDoctor.getLatestSiteDoctorReport()?.ranAt,
    report.ranAt,
    'getLatestSiteDoctorReport() must return the latest sweep for GET /api/admin/site-doctor.',
  );

  // SITE_DOCTOR_ENABLED=0 must stop the scheduler arming at all.
  process.env.SITE_DOCTOR_ENABLED = '0';
  const lines: string[] = [];
  const realLog = console.log;
  console.log = (...args: unknown[]) => void lines.push(args.join(' '));
  try {
    siteDoctor.startSiteDoctorScheduler();
  } finally {
    console.log = realLog;
    delete process.env.SITE_DOCTOR_ENABLED;
  }
  assert.ok(
    lines.some((l) => l.includes('[SiteDoctor] Disabled')),
    'SITE_DOCTOR_ENABLED=0 must report the sweep as disabled.',
  );
  assert.ok(
    !lines.some((l) => l.includes('Scheduler armed')),
    'SITE_DOCTOR_ENABLED=0 must not arm the hourly timer.',
  );

  siteDoctor.stopSiteDoctorScheduler();
  process.chdir(root);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('site-doctor.selftest: ok');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
