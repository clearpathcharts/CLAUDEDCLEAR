/**
 * Smoke test for self-serve password reset (token mint → consume → login).
 * Run: npm run test:password-reset
 *
 * Forces local-only durable storage so CI (no Firebase credentials) never
 * initializes a lazy ADC client that crashes the process mid-test.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

process.env.CLEARPATH_DISABLE_FIRESTORE_ADMIN = '1';
process.env.NODE_ENV = 'development';
delete process.env.FIREBASE_SERVICE_ACCOUNT;
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
delete process.env.STRIPE_SECRET_KEY;
delete process.env.SMTP_HOST;
delete process.env.SMTP_USER;
delete process.env.SMTP_PASS;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cp-pwreset-'));
process.chdir(tmp);

async function main() {
  const auth = await import('../src/server/privateAuthService.ts');

  assert.equal(auth.isPasswordResetIntent('please reset my password'), true);
  assert.equal(auth.isPasswordResetIntent("I can't log in"), true);
  assert.equal(auth.isPasswordResetIntent('what is a wedge pattern?'), false);

  const email = 'member.reset.desk@gmail.com';
  const oldPassword = 'old-password-99';
  const newPassword = 'new-password-42';

  await auth.registerPrivateUser({
    email,
    password: oldPassword,
    displayName: 'Reset Member',
  });

  const unknown = await auth.mintPasswordResetToken('nobody@example.com');
  assert.equal(unknown.found, false);

  const minted = await auth.mintPasswordResetToken(email);
  assert.equal(minted.found, true);
  assert.ok(minted.rawToken && minted.rawToken.length >= 20);
  assert.ok(minted.expiresAt);

  const peeked = await auth.validatePasswordResetToken(minted.rawToken!);
  assert.equal(peeked.valid, true);
  if (peeked.valid) assert.equal(peeked.email, email);

  const badPeek = await auth.validatePasswordResetToken('not-a-real-token');
  assert.equal(badPeek.valid, false);

  const resetUrl = auth.buildPasswordResetUrl('https://clearpathtrader.com', minted.rawToken!);
  assert.match(resetUrl, /\/api\/auth\/private\/password\/reset\/confirm\?token=/);
  assert.doesNotMatch(resetUrl, /password=/i);

  await auth.completePasswordReset({
    token: minted.rawToken!,
    newPassword,
  });

  // Token is one-time — reuse must fail.
  let reused = false;
  try {
    await auth.completePasswordReset({
      token: minted.rawToken!,
      newPassword: 'another-password-99',
    });
    reused = true;
  } catch (err: any) {
    assert.ok(err instanceof auth.PrivateAuthError);
    assert.equal(err.code, 'RESET_INVALID');
  }
  assert.equal(reused, false);

  // Old password rejected; new password works.
  let oldWorked = false;
  try {
    await auth.loginPrivateUser({ email, password: oldPassword });
    oldWorked = true;
  } catch (err: any) {
    assert.ok(err instanceof auth.PrivateAuthError);
    assert.equal(err.status, 401);
  }
  assert.equal(oldWorked, false);

  const login = await auth.loginPrivateUser({ email, password: newPassword });
  assert.equal(login.kind, 'ok');
  if (login.kind === 'ok') {
    assert.equal(login.user.email, email);
  }

  console.log('password-reset.selftest: OK');
}

main().catch((err) => {
  console.error('password-reset.selftest FAILED:', err);
  process.exit(1);
});
