/**
 * Self-test for hard email blocklist + soft identity risk (fake name).
 * Run: npx tsx scripts/identity-risk.selftest.ts
 */
import assert from 'node:assert/strict';
import {
  assessIdentityRisk,
  assertRegistrationEmailAllowed,
  emailRiskReasons,
  getRegistrationEmailBlock,
} from '../src/server/identityRisk';

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

// --- Hard block: exact placeholders ---
expectBlocked('example@example.com', 'blocked_email');
expectBlocked('test@test.com', 'blocked_email');
expectBlocked('fake@example.com', 'blocked_email');
expectBlocked('probe@example.com', 'blocked_email');
expectBlocked('john.doe@example.com', 'blocked_email');
expectBlocked('your@email.com', 'blocked_email');
expectBlocked('admin@localhost', 'blocked_email');
expectBlocked('test@test.test', 'blocked_email');

// --- Hard block: reserved / example domains ---
expectBlocked('anyone@example.com', 'blocked_domain');
expectBlocked('x@example.net', 'blocked_domain');
expectBlocked('x@example.org', 'blocked_domain');
expectBlocked('x@localhost', 'blocked_domain');
expectBlocked('x@test.local', 'blocked_domain');
expectBlocked('x@foo.invalid', 'reserved_domain');
expectBlocked('x@foo.test', 'reserved_domain');

// --- Hard block: fake local-parts on real domains ---
expectBlocked('test@gmail.com', 'blocked_local');
expectBlocked('admin@yahoo.com', 'blocked_local');
expectBlocked('probe@outlook.com', 'blocked_local');
expectBlocked('demo+tag@gmail.com', 'blocked_local');
expectBlocked('123456@gmail.com', 'blocked_local');

// --- Hard block: disposable providers ---
expectBlocked('person@mailinator.com', 'disposable_domain');
expectBlocked('a@guerrillamail.com', 'disposable_domain');
expectBlocked('a@yopmail.com', 'disposable_domain');
expectBlocked('a@10minutemail.com', 'disposable_domain');
expectBlocked('a@temp-mail.org', 'disposable_domain');
expectBlocked('a@trashmail.com', 'disposable_domain');

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

// --- Soft suspect: name junk (email allowed) ---
expectSuspect('good@gmail.com', 'John Doe', 'placeholder_full_name');
expectSuspect('good@gmail.com', 'test', 'junk_single_name');
expectSuspect('good@gmail.com', 'aaaa', 'repeated_char_name');
expectSuspect('alex+fake@gmail.com', 'Alex Rivera', 'test_plus_tag');

// Hard-blocked emails also surface as suspect reasons when assessed
expectSuspect('fake@example.com', 'Real Person', 'blocked_email');
expectSuspect('person@mailinator.com', 'Alex Rivera', 'disposable_domain');
expectSuspect('12345@gmail.com', 'Alex Rivera', 'blocked_local');

expectClean('alex.rivera@gmail.com', 'Alex Rivera');
expectClean('barry.nicholl@hotmail.com', 'Barry Nicholl');
expectClean('dawnhobson@aol.com', 'Dawn Hobson');

const emailSuspect = assessIdentityRisk({ email: 'x@example.com', displayName: 'Alex Rivera' });
assert.equal(emailRiskReasons(emailSuspect.reasons), true);

const nameOnly = assessIdentityRisk({ email: 'alex@gmail.com', displayName: 'fake' });
assert.equal(emailRiskReasons(nameOnly.reasons), false);

console.log('identity-risk.selftest: ok');
