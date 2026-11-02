/**
 * Assert membership affiliate / referral program stays fully disabled,
 * and leftover durable state can be purged without recreating rewards.
 * Run: npx tsx scripts/affiliate.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

process.env.CLEARPATH_DISABLE_FIRESTORE_ADMIN = '1';
delete process.env.FIREBASE_SERVICE_ACCOUNT;
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;

async function main() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cp-aff-purge-'));
  const prevCwd = process.cwd();
  process.chdir(tmp);

  try {
    const aff = await import('../src/server/affiliateService.ts');

    assert.equal(aff.AFFILIATE_PROGRAM_ENABLED, false);
    assert.equal(aff.AFFILIATE_RESIDUAL_RATE, 0);
    assert.equal(Object.keys(aff.TIER_PRICE_CENTS).length, 0);

    const click = aff.recordClick({ code: 'ANYCODE1', ip: '1.2.3.4' });
    assert.equal(click.ok, false);

    const attributed = aff.attributeSignup({ newUid: 'user_b', referralCode: 'ANYCODE1' });
    assert.equal(attributed.attributed, false);

    const paid = aff.markReferredPaid({ referredUid: 'user_b', tier: 'pro', periodKey: '2026-08-01' });
    assert.equal(paid.ok, false);
    assert.equal(paid.creditCents, 0);

    const payout = aff.requestAffiliatePayout({
      uid: 'user_a',
      method: 'paypal',
      destination: 'a@b.c',
    });
    assert.equal(payout.ok, false);

    const desk = aff.getAffiliateDashboard('user_a', 'https://clearpathtrader.com');
    assert.equal(desk.disabled, true);
    assert.equal(desk.shareUrl, null);
    assert.equal(desk.creditCents, 0);
    assert.equal(desk.discountPercent, 0);

    const board = aff.getLeaderboard(25);
    assert.equal(board.disabled, true);
    assert.equal(board.leaders.length, 0);

    const hydrate = await aff.hydrateAffiliateFromDurableStore();
    assert.equal(hydrate.source, 'disabled');
    assert.equal(hydrate.members, 0);

    // Plant leftover local durable state (as a prior Cloud Run instance might have left).
    const dataDir = path.join(tmp, 'data', 'affiliate');
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(
      path.join(dataDir, 'state.json'),
      JSON.stringify({
        members: { user_a: { uid: 'user_a', code: 'OLDCODE1', successfulReferrals: 2, creditCents: 500, discountPercent: 10 } },
        codeToUid: { OLDCODE1: 'user_a' },
        clicks: [{ id: '1', code: 'OLDCODE1', referrerUid: 'user_a', at: '2026-01-01T00:00:00.000Z' }],
        ledger: [],
        payouts: [],
      }),
      'utf8'
    );

    const before = await aff.inspectAffiliateDurableStore();
    assert.equal(before.localExists, true);
    assert.ok(before.localBytes > 0);
    assert.equal(before.approxMembers, 1);
    assert.equal(before.firestore, 'no_credentials');

    const purged = await aff.purgeAffiliateDurableStore();
    assert.equal(purged.ok, true);
    assert.equal(purged.localDeleted, true);
    assert.equal(purged.firestore, 'no_credentials');
    assert.equal(fs.existsSync(path.join(dataDir, 'state.json')), false);

    const after = await aff.inspectAffiliateDurableStore();
    assert.equal(after.localExists, false);
    assert.equal(after.approxMembers, 0);

    // Idempotent second purge
    const purged2 = await aff.purgeAffiliateDurableStore();
    assert.equal(purged2.ok, true);
    assert.equal(purged2.localDeleted, false);
  } finally {
    process.chdir(prevCwd);
  }

  // No live attribution routes or residual credit hook in the server/Stripe paths.
  const serverSrc = fs.readFileSync(path.join(prevCwd, 'server.ts'), 'utf8');
  assert.equal(/attributeSignup\s*\(/.test(serverSrc), false, 'server must not attribute signups');
  assert.equal(/ensureAffiliateMember\s*\(/.test(serverSrc), false, 'server must not mint affiliate members');
  assert.equal(/recordClick\s*\(/.test(serverSrc), false, 'server must not record referral clicks');
  assert.equal(/markReferredPaid\s*\(/.test(serverSrc), false, 'server must not mark referred paid');
  assert.equal(
    /app\.get\(\s*['"]\/r\/:code['"]/.test(serverSrc),
    true,
    'legacy /r/:code should still answer (gone redirect)',
  );
  assert.match(serverSrc, /AFFILIATE_PROGRAM_REMOVED|affiliate program removed/i);
  assert.match(serverSrc, /purgeAffiliateDurableStore/);
  assert.match(serverSrc, /\/api\/admin\/affiliate\/purge-durable/);
  assert.match(serverSrc, /\/api\/admin\/affiliate\/durable-status/);

  const stripeSrc = fs.readFileSync(path.join(prevCwd, 'src/server/stripeService.ts'), 'utf8');
  assert.equal(/markReferredPaid/.test(stripeSrc), false, 'Stripe must not credit affiliate residuals');
  assert.equal(/creditAffiliateResidual/.test(stripeSrc), false, 'Stripe residual helper must be gone');

  console.log('affiliate.selftest: ok (program disabled + durable purge)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
