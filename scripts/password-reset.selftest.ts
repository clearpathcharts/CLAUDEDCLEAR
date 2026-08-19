/**
 * Smoke: forgot-password mint + complete + change-password (local durable path).
 * Run: npx tsx scripts/password-reset.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cp-pwreset-'));
process.chdir(tmp);
process.env.NODE_ENV = 'development';
process.env.CLEARPATH_DISABLE_FIRESTORE_ADMIN = '1';
delete process.env.FIREBASE_SERVICE_ACCOUNT;
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
delete process.env.STRIPE_SECRET_KEY;
delete process.env.SMTP_HOST;
delete process.env.SMTP_USER;
delete process.env.SMTP_PASS;

async function main() {
  const auth = await import('../src/server/privateAuthService.ts');
  const emailMod = await import('../src/server/registrationEmail.ts');

  auth._forceEphemeralPrivateStoreForTests(false);

  const email = 'member.reset@gmail.com';
  const provisioned = await auth.provisionPrivateUser({
    email,
    password: 'oldpassword1',
    displayName: 'Reset Member',
    skipIdentityRisk: true,
  });
  assert.equal(provisioned.kind, 'ok');

  const missing = await auth.requestPasswordReset({ email: 'nobody.here@gmail.com' });
  assert.equal(missing.accountFound, false);

  const minted = await auth.requestPasswordReset({ email });
  assert.equal(minted.accountFound, true);
  assert.ok(minted.rawToken && minted.rawToken.length > 10);

  const resetUrl = auth.buildPasswordResetUrl('https://clearpathtrader.com', minted.rawToken!);
  assert.ok(resetUrl.includes('/login?reset='));
  assert.equal(emailMod.isSmtpConfigured(), false);

  await assert.rejects(
    () => auth.completePasswordReset({ token: 'bogus-token', newPassword: 'newpassword1' }),
    (err: any) => err instanceof auth.PrivateAuthError
  );

  const after = await auth.completePasswordReset({
    token: minted.rawToken!,
    newPassword: 'newpassword1',
  });
  assert.equal(after.email, email);

  await assert.rejects(
    () => auth.loginPrivateUser({ email, password: 'oldpassword1' }),
    (err: any) => err instanceof auth.PrivateAuthError && err.status === 401
  );

  const login = await auth.loginPrivateUser({ email, password: 'newpassword1' });
  assert.equal(login.kind, 'ok');

  await auth.changePrivatePassword({
    email,
    currentPassword: 'newpassword1',
    newPassword: 'newerpass12',
  });

  const login2 = await auth.loginPrivateUser({ email, password: 'newerpass12' });
  assert.equal(login2.kind, 'ok');

  // Spent token cannot be reused.
  await assert.rejects(
    () => auth.completePasswordReset({ token: minted.rawToken!, newPassword: 'anotherpass1' }),
    (err: any) => err instanceof auth.PrivateAuthError
  );

  console.log('password-reset.selftest: OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
