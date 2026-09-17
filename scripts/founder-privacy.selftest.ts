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
import { GITHUB_SOURCE_ZIP_URL } from '../src/lib/sourceRepo.ts';

const root = path.resolve('.');

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const clearNav = read('src/components/nav/ClearNav.tsx');
assert.match(clearNav, /label: "CEO"/, 'Founder desktop primary nav pins a CEO chip');
assert.doesNotMatch(
  clearNav,
  /label: "CEO DASHBOARD"/,
  'CEO is the short top-bar label, not buried as CEO DASHBOARD',
);

const mobileNav = read('src/components/nav/MobileCommandCenter.tsx');
assert.match(mobileNav, /<span>CEO<\/span>/, 'Founder mobile top bar pins a CEO chip');
assert.match(mobileNav, /isFounder \? \(/, 'Mobile CEO chip is founder-gated');

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

assert.match(ceo, /Download source ZIP/, 'CEO Dashboard has a one-tap source ZIP control');
assert.match(ceo, /GITHUB_SOURCE_ZIP_URL/, 'CEO Dashboard uses the shared GitHub main ZIP URL');
assert.match(ceo, /Website source ZIP/, 'CEO Dashboard explains the source ZIP vs disaster backup');
assert.doesNotMatch(ceo, /Waitlist \/ registrations/, 'CEO Members no longer shows a waitlist table');
assert.doesNotMatch(ceo, /RELEASE waitlist/i, 'CEO Members no longer has a RELEASE waitlist button');
assert.doesNotMatch(ceo, /EMPTY WAITLIST/, 'CEO Members no longer has EMPTY WAITLIST');

assert.equal(
  GITHUB_SOURCE_ZIP_URL,
  'https://github.com/clearpathcharts/CLAUDEDCLEAR/archive/refs/heads/main.zip',
  'resolved source ZIP URL is the GitHub main archive',
);

const app = read('src/App.tsx');
assert.match(app, /function isCeoPath/, '/ceo must not require a logged-in shell');
assert.match(app, /isCeoPath\(currentPath\)/, 'logged-out /ceo still mounts the CEO route');

const server = read('server.ts');
assert.match(server, /\/api\/auth\/founder-session/, 'founder cookie probe for CEO routing');
assert.doesNotMatch(
  server,
  /\/api\/auth\/founder-session[\s\S]{0,120}FOUNDER_EMAIL/,
  'founder-session must not echo founder email',
);
assert.match(
  server,
  /\/api\/auth\/private\/me[\s\S]{0,220}status\(200\)\.json\(\{ user: null \}\)/,
  'Guest /me must be 200 so Inspect does not show a fake auth failure',
);
assert.doesNotMatch(
  server,
  /\/api\/auth\/private\/me[\s\S]{0,180}status\(401\).*Not signed in/,
  'Guest session probe must not return 401',
);
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
