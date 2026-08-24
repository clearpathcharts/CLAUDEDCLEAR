/**
 * Public UI / unauthenticated APIs must never print member emails or the
 * founder login. A debug banner previously told every signed-in user:
 * "CEO Dashboard is hidden because this session is <member>. Sign in as <founder>."
 *
 * Run: npx tsx scripts/founder-privacy.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const dashboard = read('src/components/Dashboard.tsx');
assert.doesNotMatch(
  dashboard,
  /CEO Dashboard is hidden/,
  'Dashboard must not tell members the CEO Dashboard is hidden',
);
assert.doesNotMatch(
  dashboard,
  /this session is/,
  'Dashboard must not print the signed-in session email',
);
assert.doesNotMatch(
  dashboard,
  /forexanarchy@gmail\.com/,
  'Dashboard must not hard-code the founder login in the UI',
);
assert.doesNotMatch(
  dashboard,
  /Sign in as/,
  'Dashboard must not instruct members to sign in as the founder',
);

const ceo = read('src/components/CeoDashboard.tsx');
const lockedIdx = ceo.indexOf('CEO Dashboard Locked');
assert.ok(lockedIdx >= 0, 'CeoDashboard still has a locked gate');
const lockedBlock = ceo.slice(lockedIdx, lockedIdx + 900);
assert.doesNotMatch(
  lockedBlock,
  /FOUNDER_EMAIL/,
  'Locked CEO screen must not name the founder email',
);
assert.doesNotMatch(
  lockedBlock,
  /forexanarchy@gmail\.com/,
  'Locked CEO screen must not hard-code the founder login',
);

const server = read('server.ts');
const unlockIdx = server.indexOf("app.post('/api/admin/founder-unlock'");
assert.ok(unlockIdx >= 0, 'founder-unlock route exists');
const unlockBlock = server.slice(unlockIdx, unlockIdx + 2200);
assert.match(unlockBlock, /NEED_GOOGLE_FOUNDER/);
assert.match(unlockBlock, /WRONG_GOOGLE_ACCOUNT/);
assert.doesNotMatch(
  unlockBlock,
  /NEED_GOOGLE_FOUNDER[\s\S]{0,400}\$\{FOUNDER_EMAIL\}/,
  'Unauthenticated founder-unlock must not echo the founder email',
);
assert.doesNotMatch(
  unlockBlock,
  /WRONG_GOOGLE_ACCOUNT[\s\S]{0,400}decoded\.email/,
  'Wrong-account founder-unlock must not echo the caller email',
);
assert.doesNotMatch(
  unlockBlock,
  /WRONG_GOOGLE_ACCOUNT[\s\S]{0,400}\$\{FOUNDER_EMAIL\}/,
  'Wrong-account founder-unlock must not name the founder email',
);

console.log('founder-privacy.selftest: ok');
