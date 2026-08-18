/**
 * Smoke test: founder members list helpers never leak secrets.
 * Run: npx tsx scripts/admin-members.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cp-members-'));
process.chdir(tmp);

async function main() {
  const privateDir = path.join(tmp, 'data', 'private_accounts');
  const regDir = path.join(tmp, 'data', 'registrations');
  fs.mkdirSync(privateDir, { recursive: true });
  fs.mkdirSync(regDir, { recursive: true });

  fs.writeFileSync(
    path.join(privateDir, 'users.json'),
    JSON.stringify(
      [
        {
          uid: 'cpt_test1',
          email: 'alpha@example.com',
          displayName: 'Alpha',
          passwordHash: 'SECRET_HASH',
          passwordSalt: 'SECRET_SALT',
          createdAt: '2026-01-02T00:00:00.000Z',
          lastLoginAt: '2026-01-03T00:00:00.000Z',
        },
      ],
      null,
      2
    )
  );

  fs.writeFileSync(
    path.join(regDir, 'waitlist.json'),
    JSON.stringify(
      [
        {
          id: 'local_1',
          firstName: 'Beta',
          emailAddress: 'beta@example.com',
          country: 'US',
          experienceLevel: 'beginner',
          status: 'confirmed',
          registrationSource: 'selftest',
          activationKey: 'SHOULD_NEVER_LEAK',
          createdAt: '2026-01-04T00:00:00.000Z',
        },
      ],
      null,
      2
    )
  );

  const auth = await import('../src/server/privateAuthService.ts');
  const reg = await import('../src/server/registrationStore.ts');

  const listed = await auth.listPrivateMembersSafe();
  assert.equal(listed.members.length, 1);
  assert.equal(listed.members[0].email, 'alpha@example.com');
  assert.equal(listed.members[0].displayName, 'Alpha');
  assert.ok(!('passwordHash' in listed.members[0]));
  assert.ok(!('passwordSalt' in listed.members[0]));
  const leaked = JSON.stringify(listed.members);
  assert.equal(leaked.includes('SECRET_HASH'), false);
  assert.equal(leaked.includes('SECRET_SALT'), false);

  const waitlist = reg.listLocalWaitlistSafe();
  assert.equal(waitlist.length, 1);
  assert.equal(waitlist[0].email, 'beta@example.com');
  assert.equal(waitlist[0].firstName, 'Beta');
  assert.equal(waitlist[0].source, 'local');
  assert.ok(!('activationKey' in waitlist[0]));
  assert.equal(JSON.stringify(waitlist).includes('SHOULD_NEVER_LEAK'), false);

  const meta = auth.getPrivateStorageMeta();
  assert.ok(meta.privateCollection === 'private_accounts');

  const mail = await import('../src/server/inviteMailService.ts');
  assert.equal(mail.friendlyFirstName('Brent Miller', 'clearpath.brent@gmail.com'), 'Brent');
  mail._resetPublicForgotCooldownForTests();
  const forgotUnknown = await mail.requestPublicPasswordReset('nobody-unknown@example.com');
  assert.equal(forgotUnknown.ok, true);
  assert.equal(forgotUnknown.message, mail.PUBLIC_FORGOT_PASSWORD_UNAVAILABLE);
  const forgotInvalid = await mail.requestPublicPasswordReset('not-an-email');
  assert.equal(forgotInvalid.message, mail.PUBLIC_FORGOT_PASSWORD_MESSAGE);

  console.log('admin-members.selftest: ok');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
