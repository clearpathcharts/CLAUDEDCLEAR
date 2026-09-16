/**
 * Self-test for hard email/name blocklist + soft identity risk.
 * Run: npx tsx scripts/identity-risk.selftest.ts
 */
import assert from 'node:assert/strict';
import {
  assessIdentityRisk,
  assertRegistrationEmailAllowed,
  assertRegistrationNameAllowed,
  emailRiskReasons,
  getRegistrationDomainDnsBlock,
  getRegistrationEmailBlock,
  getRegistrationNameBlock,
} from '../src/server/identityRisk';
import { getDisposableDomainListStatus } from '../src/server/disposableEmailDomains';

function expectBlocked(email: string, code?: string) {
  const b = getRegistrationEmailBlock(email);
  assert.equal(b.blocked, true, `${email} should be blocked, got ${JSON.stringify(b)}`);
  if (code) {
    assert.equal(b.code, code, `${email} expected code ${code}, got ${b.code}`);
  }
}

function expectAllowed(email: string) {
  const b = getRegistrationEmailBlock(email);
  assert.equal(b.blocked, false, `${email} should be allowed, got ${JSON.stringify(b)}`);
}

function expectNameBlocked(name: string, code?: string) {
  const b = getRegistrationNameBlock(name);
  assert.equal(b.blocked, true, `name "${name}" should be blocked, got ${JSON.stringify(b)}`);
  if (code) {
    assert.equal(b.code, code, `name "${name}" expected code ${code}, got ${b.code}`);
  }
}

function expectNameAllowed(name: string) {
  const b = getRegistrationNameBlock(name);
  assert.equal(b.blocked, false, `name "${name}" should be allowed, got ${JSON.stringify(b)}`);
}

function expectSuspect(email: string, displayName: string, includesReason?: string) {
  const r = assessIdentityRisk({ email, displayName });
  assert.equal(r.risk, 'suspect', `${email} / ${displayName} should be suspect, got ${JSON.stringify(r)}`);
  if (includesReason) {
    assert.ok(r.reasons.includes(includesReason), `expected reason ${includesReason} in ${r.reasons}`);
  }
}

function expectClean(email: string, displayName: string) {
  const r = assessIdentityRisk({ email, displayName });
  assert.equal(r.risk, 'clean', `${email} / ${displayName} should be clean, got ${JSON.stringify(r)}`);
}

// --- Hard block: reserved domains ---
expectBlocked('x@example.com', 'blocked_domain');
expectBlocked('x@example.net', 'blocked_domain');
expectBlocked('x@example.org', 'blocked_domain');
expectBlocked('x@invalid', 'blocked_domain');
expectBlocked('x@localhost', 'blocked_domain');
expectBlocked('x@local', 'blocked_domain');
expectBlocked('x@localdomain', 'blocked_domain');
expectBlocked('x@test', 'blocked_domain');
expectBlocked('x@test.local', 'blocked_domain');
expectBlocked('x@example.invalid', 'blocked_domain');
expectBlocked('x@invalid.invalid', 'blocked_domain');
expectBlocked('x@foo.invalid', 'reserved_domain');
expectBlocked('x@foo.test', 'reserved_domain');

// --- Hard block: exact AI/dev placeholders ---
expectBlocked('john@example.com', 'blocked_email');
expectBlocked('john.doe@example.com', 'blocked_email');
expectBlocked('jane@example.com', 'blocked_email');
expectBlocked('jane.doe@example.com', 'blocked_email');
expectBlocked('user@example.com', 'blocked_email');
expectBlocked('admin@example.com', 'blocked_email');
expectBlocked('support@example.com', 'blocked_email');
expectBlocked('info@example.com', 'blocked_email');
expectBlocked('hello@example.com', 'blocked_email');
expectBlocked('contact@example.com', 'blocked_email');
expectBlocked('mail@example.com', 'blocked_email');
expectBlocked('test@example.com', 'blocked_email');
expectBlocked('probe@example.com', 'blocked_email');
expectBlocked('fake@example.com', 'blocked_email');
expectBlocked('sample@example.com', 'blocked_email');
expectBlocked('demo@example.com', 'blocked_email');
expectBlocked('someone@example.com', 'blocked_email');
expectBlocked('person@example.com', 'blocked_email');
expectBlocked('your@email.com', 'blocked_email');
expectBlocked('yourname@example.com', 'blocked_email');
expectBlocked('email@example.com', 'blocked_email');

// --- Hard block: developer/test local-parts ---
for (const local of [
  'test',
  'testing',
  'tester',
  'test1',
  'test123',
  'demo',
  'sample',
  'example',
  'probe',
  'placeholder',
  'fake',
  'dummy',
  'unknown',
  'anonymous',
  'guest',
  'admin',
  'administrator',
  'root',
  'system',
  'default',
  'null',
  'none',
  'nobody',
  'user',
  'username',
  'temp',
  'temporary',
  'mail',
  'email',
  'contact',
  'support',
  'info',
  'hello',
  'foo',
  'bar',
  'foobar',
  'asdf',
  'qwerty',
  'abc',
  'abc123',
  'xxxx',
  'xxxxx',
  '123',
  '1234',
  '12345',
  '123456',
]) {
  expectBlocked(`${local}@gmail.com`, 'blocked_local');
}

// --- Hard block: keyboard smash / repetitive locals ---
expectBlocked('asdfasdf@gmail.com', 'keyboard_smash');
expectBlocked('qweqwe@gmail.com', 'keyboard_smash');
expectBlocked('zxcvbn@gmail.com', 'keyboard_smash');
expectBlocked('aaaaaa@gmail.com', 'keyboard_smash');
expectBlocked('xxxxxxxx@gmail.com', 'keyboard_smash');
expectBlocked('123123@gmail.com', 'blocked_local'); // numeric-only catches first

// --- Vendored disposable list (merged from 3 upstream blocklists) ---
const disposableStatus = getDisposableDomainListStatus();
assert.equal(disposableStatus.source, 'file', `expected vendored file, got ${JSON.stringify(disposableStatus)}`);
assert.ok(disposableStatus.count > 50000, `expected large merged disposable list, got ${disposableStatus.count}`);
assert.ok(disposableStatus.upstream.length >= 3, 'expected three upstream sources');

expectBlocked('a@mailinator.com', 'disposable_domain');
expectBlocked('a@guerrillamail.com', 'disposable_domain');
expectBlocked('a@10minutemail.com', 'disposable_domain');
expectBlocked('a@temp-mail.org', 'disposable_domain');
expectBlocked('a@tempmail.com', 'disposable_domain');
expectBlocked('a@maildrop.cc', 'disposable_domain');
expectBlocked('a@getnada.com', 'disposable_domain');
expectBlocked('a@yopmail.com', 'disposable_domain');
expectBlocked('a@trashmail.com', 'disposable_domain');
expectBlocked('a@sharklasers.com', 'disposable_domain');
expectBlocked('a@emailondeck.com', 'disposable_domain');
expectBlocked('a@throwawaymail.com', 'disposable_domain');
expectBlocked('a@dispostable.com', 'disposable_domain');
expectBlocked('a@mintemail.com', 'disposable_domain');
expectBlocked('a@spamgourmet.com', 'disposable_domain');
expectBlocked('a@moakt.com', 'disposable_domain');
expectBlocked('a@mailnesia.com', 'disposable_domain');
expectBlocked('a@fakeinbox.com', 'disposable_domain');
// Parent-domain match from the big list
expectBlocked('someone@mail.mailinator.com', 'disposable_domain');

// --- Allowed real customer-shaped emails ---
expectAllowed('alex.rivera@gmail.com');
expectAllowed('barry.nicholl@hotmail.com');
expectAllowed('dawnhobson@aol.com');
expectAllowed('forexanarchy@gmail.com');

assert.throws(
  () => assertRegistrationEmailAllowed('test@example.com'),
  (err: unknown) => err instanceof Error && /not allowed/i.test(err.message)
);
assert.doesNotThrow(() => assertRegistrationEmailAllowed('alex.rivera@gmail.com'));

// --- Hard block: fake names ---
for (const name of [
  'Test User',
  'John Doe',
  'Jane Doe',
  'Foo Bar',
  'Example User',
  'Sample User',
  'Demo User',
  'Anonymous',
  'Guest',
  'Administrator',
  'Root',
  'Unknown',
  'Null',
  'None',
  'No Name',
  'Your Name',
  'First Last',
  'aaaaaaaa',
  'bbbbbbbb',
  '11111111',
  'xxxxxxxx',
  'asdfasdf',
  'qwerty',
]) {
  expectNameBlocked(name);
}

expectNameAllowed('Alex Rivera');
expectNameAllowed('Dawn Hobson');
expectNameAllowed('Barry Nicholl');
assert.throws(() => assertRegistrationNameAllowed('John Doe'));
assert.doesNotThrow(() => assertRegistrationNameAllowed('Alex Rivera'));

// Assess path surfaces block codes
expectSuspect('good@gmail.com', 'John Doe', 'placeholder_full_name');
expectSuspect('good@gmail.com', 'test', 'junk_single_name');
expectSuspect('good@gmail.com', 'aaaa', 'repeated_char_name');
expectSuspect('alex+fake@gmail.com', 'Alex Rivera', 'test_plus_tag');
expectSuspect('fake@example.com', 'Real Person', 'blocked_email');
expectSuspect('person@mailinator.com', 'Alex Rivera', 'disposable_domain');

expectClean('alex.rivera@gmail.com', 'Alex Rivera');
expectClean('barry.nicholl@hotmail.com', 'Barry Nicholl');
expectClean('dawnhobson@aol.com', 'Dawn Hobson');

const emailSuspect = assessIdentityRisk({ email: 'x@example.com', displayName: 'Alex Rivera' });
assert.equal(emailRiskReasons(emailSuspect.reasons), true);

const nameOnly = assessIdentityRisk({ email: 'alex@gmail.com', displayName: 'fake' });
assert.equal(emailRiskReasons(nameOnly.reasons), true); // names are hard-block codes now

async function dnsChecks() {
  process.env.IDENTITY_SKIP_MX = '';
  const gmail = await getRegistrationDomainDnsBlock('alex.rivera@gmail.com');
  assert.equal(gmail.blocked, false, `gmail should have MX, got ${JSON.stringify(gmail)}`);

  const bogus = await getRegistrationDomainDnsBlock('a@this-domain-should-not-exist-clearpath-xyz123.invalid');
  // .invalid is reserved — sync path blocks first; DNS helper skips already-blocked domains
  assert.equal(bogus.blocked, false); // reserved handled by sync blocklist

  const nx = await getRegistrationDomainDnsBlock('a@no-such-clearpath-domain-zzqqx9182.com');
  // May block (no_mx) or fail-open on transient DNS — either is acceptable
  if (nx.blocked) {
    assert.equal(nx.code, 'no_mx');
  }
}

dnsChecks()
  .then(() => {
    console.log('identity-risk.selftest: ok');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
