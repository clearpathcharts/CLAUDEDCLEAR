/**
 * Smoke: production hard-fail + import helpers never leak password hashes.
 * Run: npx tsx scripts/private-durable.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cp-durable-'));
process.chdir(tmp);
process.env.NODE_ENV = 'production';
process.env.CLEARPATH_DISABLE_FIRESTORE_ADMIN = '1';
delete process.env.FIREBASE_SERVICE_ACCOUNT;
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
delete process.env.STRIPE_SECRET_KEY;

async function main() {
  const auth = await import('../src/server/privateAuthService.ts');
  auth._forceEphemeralPrivateStoreForTests(true);

  const meta = auth.getPrivateStorageMeta();
  assert.equal(meta.durable, false);
  assert.equal(meta.writesAllowed, false);
  assert.equal(meta.productionHardFail, true);
  assert.ok(meta.persistenceWarning && meta.persistenceWarning.includes('PRODUCTION BLOCKED'));

  await assert.rejects(
    () =>
      auth.provisionPrivateUser({
        email: 'ghost@example.com',
        password: 'password123',
        displayName: 'Ghost',
      }),
    (err: any) => err instanceof auth.PrivateAuthError && err.status === 503
  );

  await assert.rejects(
    () => auth.loginPrivateUser({ email: 'ghost@example.com', password: 'password123' }),
    (err: any) => err instanceof auth.PrivateAuthError && err.status === 503
  );

  // Dev path still allows local when not production.
  process.env.NODE_ENV = 'development';
  const provisioned = await auth.provisionPrivateUser({
    email: 'devlocal@gmail.com',
    password: 'password123',
    displayName: 'Dev Local',
    skipIdentityRisk: true,
  });
  assert.equal(provisioned.kind, 'ok');
  assert.equal(provisioned.user.email, 'devlocal@gmail.com');

  const listed = await auth.listPrivateMembersSafe();
  assert.ok(listed.members.some((m) => m.email === 'devlocal@gmail.com'));
  assert.equal(JSON.stringify(listed.members).includes('passwordHash'), false);

  const recovery = await import('../src/server/privateAccountRecoveryService.ts');
  process.env.NODE_ENV = 'production';
  await assert.rejects(
    () =>
      recovery.importPrivateMembers({
        members: [{ email: 'a@example.com', displayName: 'A' }],
        dryRun: false,
      }),
    (err: any) => err instanceof auth.PrivateAuthError && err.status === 503
  );

  // Dry-run import is allowed without durable store (no writes).
  const dry = await recovery.importPrivateMembers({
    members: [{ email: 'a@example.com', displayName: 'A' }],
    dryRun: true,
  });
  assert.equal(dry.created, 1);
  assert.equal(dry.dryRun, true);

  const emergency = await import('../src/server/emergencyMemberSeed.ts');
  assert.ok(emergency.EMERGENCY_KNOWN_MEMBERS.some((m) => m.email === 'dawnhobson@aol.com'));
  const emergencyDry = await emergency.seedEmergencyKnownMembers({ dryRun: true, resetExisting: true });
  assert.equal(emergencyDry.dryRun, true);
  assert.ok(emergencyDry.created + emergencyDry.reset >= emergency.EMERGENCY_KNOWN_MEMBERS.length);

  // Live reset/seed still hard-fails in production without durable store.
  await assert.rejects(
    () => emergency.seedEmergencyKnownMembers({ dryRun: false }),
    (err: any) => err instanceof auth.PrivateAuthError && err.status === 503
  );
  await assert.rejects(
    () => emergency.emergencyResetMemberPassword('dawnhobson@aol.com'),
    (err: any) => err instanceof auth.PrivateAuthError && err.status === 503
  );

  auth._forceEphemeralPrivateStoreForTests(false);
  console.log('private-durable.selftest: ok');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
