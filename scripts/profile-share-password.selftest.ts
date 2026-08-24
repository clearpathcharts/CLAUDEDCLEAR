/**
 * Profile public URL + password change / reset.
 * Run: npx tsx scripts/profile-share-password.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const repoRoot = path.resolve('.');

function read(rel: string): string {
  return fs.readFileSync(path.join(repoRoot, rel), 'utf8');
}

import {
  normalizeProfileUsername,
  isValidProfileUsername,
  isReservedProfileUsername,
  publicProfileUrl,
} from '../src/lib/profileUsername.ts';

assert.equal(normalizeProfileUsername('/u/RickTrades'), 'ricktrades');
assert.equal(normalizeProfileUsername('https://clearpathtrader.com/u/Rick_Trades'), 'rick_trades');
assert.equal(isValidProfileUsername('ricktrades'), true);
assert.equal(isValidProfileUsername('ab'), false);
assert.equal(isReservedProfileUsername('admin'), true);
assert.equal(isReservedProfileUsername('ricktrades'), false);
assert.equal(
  publicProfileUrl('https://clearpathtrader.com', 'ricktrades'),
  'https://clearpathtrader.com/u/ricktrades'
);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cp-profile-share-'));
process.chdir(tmp);
process.env.NODE_ENV = 'development';
process.env.CLEARPATH_DISABLE_FIRESTORE_ADMIN = '1';
delete process.env.FIREBASE_SERVICE_ACCOUNT;
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
delete process.env.STRIPE_SECRET_KEY;

async function main() {
  const profiles = await import('../src/server/profileStore.ts');
  profiles.writeProfile('user_a', {
    displayName: 'Alpha',
    username: 'alphahandle',
    publishStatus: 'Public',
    bio: 'hello',
    avatarUrl: '',
  });
  profiles.writeProfile('user_b', {
    displayName: 'Beta',
    username: 'betahandle',
    publishStatus: 'Private',
    bio: 'secret',
  });

  assert.equal(profiles.usernameTakenByOther('alphahandle', 'user_a'), false);
  assert.equal(profiles.usernameTakenByOther('alphahandle', 'user_b'), true);

  const pubA = profiles.toPublicMemberProfile(profiles.findProfileByUsername('alphahandle'));
  assert.ok(pubA);
  assert.equal(pubA.username, 'alphahandle');
  assert.equal(JSON.stringify(pubA).includes('@'), false);
  assert.equal('uid' in pubA, false);
  assert.equal('email' in pubA, false);

  const pubB = profiles.toPublicMemberProfile(profiles.findProfileByUsername('betahandle'));
  assert.equal(pubB, null);

  const reset = await import('../src/server/passwordResetStore.ts');
  const minted = reset.mintPasswordResetToken({ uid: 'user_a', email: 'alpha@gmail.com' });
  assert.ok(minted.rawToken.length > 16);
  assert.equal(reset.consumePasswordResetToken('not-a-real-token'), null);
  const consumed = reset.consumePasswordResetToken(minted.rawToken);
  assert.ok(consumed);
  assert.equal(consumed.email, 'alpha@gmail.com');
  assert.equal(reset.consumePasswordResetToken(minted.rawToken), null);

  const auth = await import('../src/server/privateAuthService.ts');
  auth._forceEphemeralPrivateStoreForTests(true);
  const provisioned = await auth.provisionPrivateUser({
    email: 'share.pw@gmail.com',
    password: 'OldPass123!',
    displayName: 'Share Pw',
    skipIdentityRisk: true,
  });
  assert.equal(provisioned.kind, 'ok');

  await assert.rejects(
    () =>
      auth.changeOwnPassword({
        email: 'share.pw@gmail.com',
        currentPassword: 'OldPass123!',
        newPassword: 'short',
      }),
    (err: any) => err instanceof auth.PrivateAuthError
  );

  await assert.rejects(
    () =>
      auth.changeOwnPassword({
        email: 'share.pw@gmail.com',
        currentPassword: 'WrongPass123!',
        newPassword: 'NewPass123!',
      }),
    (err: any) => err instanceof auth.PrivateAuthError
  );

  const changed = await auth.changeOwnPassword({
    email: 'share.pw@gmail.com',
    currentPassword: 'OldPass123!',
    newPassword: 'NewPass123!',
  });
  assert.equal(changed.email, 'share.pw@gmail.com');

  const login = await auth.loginPrivateUser({
    email: 'share.pw@gmail.com',
    password: 'NewPass123!',
  });
  assert.equal(login.kind, 'ok');

  const server = read('server.ts');
  assert.match(server, /\/api\/profile\/public\/:username/);
  assert.match(server, /\/api\/auth\/private\/change-password/);
  assert.match(server, /\/api\/auth\/private\/forgot-password/);
  assert.match(server, /\/api\/auth\/private\/reset-password/);
  const forgotIdx = server.indexOf("app.post('/api/auth/private/forgot-password'");
  assert.ok(forgotIdx >= 0);
  const forgotBlock = server.slice(forgotIdx, forgotIdx + 1600);
  assert.match(forgotBlock, /Always the same answer/);
  assert.doesNotMatch(forgotBlock, /res\.status\(404\)/);

  const publicPage = read('src/components/PublicMemberProfile.tsx');
  assert.doesNotMatch(publicPage, /Followers:\s*12/);
  assert.doesNotMatch(publicPage, /forexanarchy@gmail\.com/);
  assert.match(publicPage, /Educational profile only/);

  const hub = read('src/components/ProfileHub.tsx');
  assert.match(hub, /Copy link/);
  assert.match(hub, /ChangePasswordCard/);
  assert.match(hub, /Save Profile Settings/);
  assert.doesNotMatch(hub, /COMMUNITY INCENTIVES/);
  assert.doesNotMatch(hub, /Coffees Earned/);
  assert.doesNotMatch(hub, /Community Rewards Earned/);
  assert.doesNotMatch(hub, /Followers:\s*12,450/);
  assert.doesNotMatch(hub, /🥇 🥈 🥉 ☕/);

  console.log('profile-share-password.selftest: ok');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
