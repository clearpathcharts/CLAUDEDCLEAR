/**
 * Public signup must prove inbox ownership before any session, and must not reveal existing members.
 * Run: npx tsx scripts/email-verification.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const repoRoot = path.resolve('.');
const read = (rel: string) => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const serverSrc = read('server.ts');
const deskSrc = read('src/components/PrivateLoginDesk.tsx');
const waitlistSrc = read('src/server/registrationService.ts');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cp-email-verify-'));
process.chdir(tmp);
process.env.NODE_ENV = 'development';
process.env.CLEARPATH_DISABLE_FIRESTORE_ADMIN = '1';
delete process.env.FIREBASE_SERVICE_ACCOUNT;
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
delete process.env.STRIPE_SECRET_KEY;

const usersFile = path.join(tmp, 'data', 'private_accounts', 'users.json');
const editUser = (email: string, patch: Record<string, unknown>) => {
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  const u = users.find((x: any) => x.email === email);
  Object.assign(u, patch);
  fs.writeFileSync(usersFile, JSON.stringify(users));
};

async function main() {
  const auth = await import('../src/server/privateAuthService.ts');
  auth._forceEphemeralPrivateStoreForTests(true);
  const email = 'verify.member@gmail.com';
  const password = 'GoodPass123!';

  const reg = await auth.registerPrivateUser({ email, password, displayName: 'Verify Member' });
  assert.equal(reg.kind, 'pending_confirm', 'public signup must wait for the email link');
  assert.ok(reg.kind === 'pending_confirm' && reg.rawChallengeToken.length > 16);
  const token = reg.kind === 'pending_confirm' ? reg.rawChallengeToken : '';

  const blocked = await auth.loginPrivateUser({ email, password });
  assert.equal(blocked.kind, 'pending_confirm', 'correct password must not skip email confirmation');
  assert.ok(blocked.kind === 'pending_confirm' && blocked.reasons.includes(auth.EMAIL_UNVERIFIED_REASON));

  const gate = await auth.assertSessionIdentityAllowed({ email });
  assert.equal(gate.allowed, false, 'cookie session must not auto-clear the email gate');

  const again = await auth.registerPrivateUser({ email, password: 'OtherPass123!', displayName: 'Someone Else' });
  assert.equal(again.kind, 'already_registered', 'duplicate signup must not throw a distinguishable 409');

  const resub = await auth.resubmitIdentity({ currentEmail: email, password, newEmail: email, newDisplayName: 'Verify Member' });
  assert.equal(resub.kind, 'pending_confirm', 'resubmitting details must not unlock an unconfirmed inbox');
  const tokenAfterResubmit = resub.kind === 'pending_confirm' ? resub.rawChallengeToken : '';
  await assert.rejects(() => auth.confirmIdentityByToken(token), 'older link is replaced by the resubmit link');

  editUser(email, { identityChallengeExpiresAt: new Date(Date.now() - 60_000).toISOString() });
  await assert.rejects(() => auth.confirmIdentityByToken(tokenAfterResubmit), (e: any) => e.status === 400 && e.code !== 'IDENTITY_DECLINED');
  const stillPending = await auth.loginPrivateUser({ email, password });
  assert.equal(stillPending.kind, 'pending_confirm', 'a lapsed link must not permanently decline the account');

  const fresh = await auth.remintIdentityChallenge({ email, password });
  const confirmed = await auth.confirmIdentityByToken(fresh.rawChallengeToken);
  assert.equal(confirmed.identityStatus, 'ok');
  const ok = await auth.loginPrivateUser({ email, password });
  assert.equal(ok.kind, 'ok', 'confirmed email can sign in');

  const email2 = 'verify.reset@gmail.com';
  await auth.registerPrivateUser({ email: email2, password, displayName: 'Reset Member' });
  await auth.resetPrivateUserPassword({ email: email2, password: 'NewPass123!' });
  const afterReset = await auth.loginPrivateUser({ email: email2, password: 'NewPass123!' });
  assert.equal(afterReset.kind, 'ok', 'emailed reset link proves inbox ownership');

  const seeded = await auth.provisionPrivateUser({ email: 'seeded.member@gmail.com', password, displayName: 'Seeded Member', skipIdentityRisk: true });
  assert.equal(seeded.kind, 'ok', 'founder seed / recovery paths are not gated');

  const registerRoute = serverSrc.slice(serverSrc.indexOf("app.post('/api/auth/private/register'"), serverSrc.indexOf("app.use('/api/broker'"));
  assert.doesNotMatch(registerRoute, /grantFreshSession/, 'signup must not grant a session before the email link');
  assert.match(registerRoute, /sendAccountExistsEmail/, 'existing-email signup gets a notice email, not a 409');
  assert.match(registerRoute, /status\(202\)/);
  assert.doesNotMatch(registerRoute, /uid: (result\.)?user\.uid/, 'signup response must not expose the account id');
  assert.doesNotMatch(waitlistSrc, /already has a Private Login/, 'waitlist must not reveal existing members');
  assert.doesNotMatch(waitlistSrc, /registrationId: user\.uid/, 'waitlist must not expose the account id');
  assert.match(deskSrc, /email_unverified/, 'login desk routes unconfirmed accounts to the check-email screen');

  console.log('email-verification.selftest: ok');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
