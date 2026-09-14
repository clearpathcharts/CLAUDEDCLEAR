/**
 * Waitlist is retired as a product. Leftover emails convert into Firestore
 * private_accounts. Boot must never reset existing Private Login passwords.
 *
 * Run: npx tsx scripts/waitlist-convert.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const convert = read('src/server/waitlistConvertService.ts');
assert.match(
  convert,
  /resetExisting\?: boolean/,
  'convertWaitlistToPrivateAccounts accepts resetExisting',
);
assert.match(
  convert,
  /const resetExisting = Boolean\(options\?\.resetExisting\)/,
  'resetExisting defaults false unless the caller opts in',
);
assert.match(convert, /if \(!resetExisting\)/, 'existing Private Login members are marked already, not reset');

const server = read('server.ts');
assert.match(
  server,
  /convertWaitlistToPrivateAccounts\(\{\s*resetExisting:\s*false\s*\}\)/,
  'boot conversion must not reset existing member passwords',
);
assert.match(
  server,
  /Waitlist → Firestore private_accounts/,
  'boot log names Firestore private_accounts as the destination',
);

const register = read('src/server/registrationService.ts');
assert.match(register, /provisionPrivateUser/, 'leftover waitlist POST creates a private account');
assert.match(register, /findPrivateUserByEmail/, 'leftover waitlist POST refuses duplicate private emails');
assert.doesNotMatch(
  register,
  /saveWaitlistRegistration/,
  'leftover waitlist POST must not write site_registrations',
);

const pages = read('src/server/contentPages.ts');
assert.match(pages, /\/\?login=1/, 'content pages CTA opens Private Login');
assert.doesNotMatch(pages, /id="cpt-waitlist"/, 'content pages must not render a waitlist form');
assert.doesNotMatch(pages, /\/api\/registrations\/waitlist/, 'content pages must not POST waitlist from the public form');

const ceo = read('src/components/CeoDashboard.tsx');
assert.match(ceo, /Private Login members/, 'CEO Members heading is Private Login');
assert.doesNotMatch(ceo, /Waitlist \/ registrations/, 'CEO has no waitlist table');
assert.doesNotMatch(ceo, /RELEASE waitlist/i, 'CEO has no RELEASE waitlist button');
assert.doesNotMatch(ceo, /EMPTY WAITLIST/, 'CEO has no EMPTY WAITLIST button');
assert.doesNotMatch(ceo, /Globe size=\{18\} \/> Waitlist/, 'CEO has no waitlist count card');

const doctor = read('src/server/siteDoctor.ts');
assert.match(doctor, /Waitlist → Firestore convert/, 'Site Doctor reports leftover waitlist conversion');
assert.doesNotMatch(doctor, /Waitlist backend/, 'Site Doctor must not treat Appwrite waitlist as a live backend');

console.log('waitlist-convert.selftest: ok');
