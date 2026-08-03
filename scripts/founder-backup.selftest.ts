/**
 * Smoke: founder disaster backup package shape + restore dry-run.
 * Run: npx tsx scripts/founder-backup.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cp-backup-'));
process.chdir(tmp);
process.env.NODE_ENV = 'development';
process.env.CLEARPATH_DISABLE_FIRESTORE_ADMIN = '1';
delete process.env.FIREBASE_SERVICE_ACCOUNT;
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
delete process.env.STRIPE_SECRET_KEY;

async function main() {
  const auth = await import('../src/server/privateAuthService.ts');
  auth._forceEphemeralPrivateStoreForTests(false);

  const user = await auth.provisionPrivateUser({
    email: 'backup-user@example.com',
    password: 'password12345',
    displayName: 'Backup User',
  });
  assert.equal(user.email, 'backup-user@example.com');

  const backupMod = await import('../src/server/founderBackupService.ts');
  const pkg = await backupMod.buildFounderBackupPackage({ includeStripeCustomerEmails: false });
  assert.equal(pkg.kind, 'clearpath_founder_disaster_backup');
  assert.equal(pkg.schemaVersion, 1);
  assert.ok(pkg.warning.toLowerCase().includes('backup'));
  assert.ok(pkg.privateAccounts.count >= 1);
  const row = pkg.privateAccounts.accounts.find((a) => a.email === 'backup-user@example.com');
  assert.ok(row);
  assert.ok(row!.passwordHash.length > 16);
  assert.ok(row!.passwordSalt.length >= 8);
  assert.equal(JSON.stringify(pkg).includes('password12345'), false);

  const dry = await backupMod.restorePrivateAccountsFromBackupPackage({
    accounts: pkg.privateAccounts.accounts,
    dryRun: true,
  });
  assert.equal(dry.dryRun, true);
  assert.ok(dry.restored >= 1);

  // Production hard-fail: each restore row errors when durable store is offline.
  process.env.NODE_ENV = 'production';
  auth._forceEphemeralPrivateStoreForTests(true);
  const blocked = await backupMod.restorePrivateAccountsFromBackupPackage({
    accounts: [pkg.privateAccounts.accounts[0]!],
    dryRun: false,
  });
  assert.equal(blocked.restored, 0);
  assert.equal(blocked.errors, 1);
  assert.ok(String(blocked.results[0]?.message || '').toLowerCase().includes('durable'));

  await assert.rejects(
    () =>
      auth.restorePrivateAccountFromBackup({
        email: 'blocked@example.com',
        passwordHash: 'a'.repeat(32),
        passwordSalt: 'b'.repeat(16),
      }),
    (err: any) => err instanceof auth.PrivateAuthError && err.status === 503
  );

  auth._forceEphemeralPrivateStoreForTests(false);
  console.log('founder-backup.selftest: ok');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
