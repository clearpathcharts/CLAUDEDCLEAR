/**
 * Self-test for identity risk detection (fake email / fake name).
 * Run: npx tsx scripts/identity-risk.selftest.ts
 */
import assert from 'node:assert/strict';
import { assessIdentityRisk, emailRiskReasons } from '../src/server/identityRisk';

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

expectSuspect('fake@example.com', 'Real Person', 'disposable_domain');
expectSuspect('person@mailinator.com', 'Alex Rivera', 'disposable_domain');
expectSuspect('good@gmail.com', 'John Doe', 'placeholder_full_name');
expectSuspect('good@gmail.com', 'test', 'junk_single_name');
expectSuspect('good@gmail.com', 'aaaa', 'repeated_char_name');
expectSuspect('12345@gmail.com', 'Alex Rivera', 'numeric_only_local');
expectSuspect('user+fake@gmail.com', 'Alex Rivera', 'test_plus_tag');

expectClean('alex.rivera@gmail.com', 'Alex Rivera');
expectClean('barry.nicholl@hotmail.com', 'Barry Nicholl');
expectClean('dawnhobson@aol.com', 'Dawn Hobson');

const emailSuspect = assessIdentityRisk({ email: 'x@example.com', displayName: 'Alex Rivera' });
assert.equal(emailRiskReasons(emailSuspect.reasons), true);

const nameOnly = assessIdentityRisk({ email: 'alex@gmail.com', displayName: 'fake' });
assert.equal(emailRiskReasons(nameOnly.reasons), false);

console.log('identity-risk.selftest: ok');
