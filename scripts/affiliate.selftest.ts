/**
 * Assert membership affiliate / referral program stays fully disabled.
 * Run: npx tsx scripts/affiliate.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

process.env.CLEARPATH_DISABLE_FIRESTORE_ADMIN = '1';
delete process.env.FIREBASE_SERVICE_ACCOUNT;
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;

async function main() {
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

  // No live attribution routes or residual credit hook in the server/Stripe paths.
  const serverSrc = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');
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

  const stripeSrc = fs.readFileSync(path.join(process.cwd(), 'src/server/stripeService.ts'), 'utf8');
  assert.equal(/markReferredPaid/.test(stripeSrc), false, 'Stripe must not credit affiliate residuals');
  assert.equal(/creditAffiliateResidual/.test(stripeSrc), false, 'Stripe residual helper must be gone');

  console.log('affiliate.selftest: ok (program disabled)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
