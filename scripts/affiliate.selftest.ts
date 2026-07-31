/**
 * Smoke test for affiliate attribution + rewards ladder.
 * Run: npx tsx scripts/affiliate.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cp-aff-'));
process.chdir(tmp);

async function main() {
  const aff = await import('../src/server/affiliateService.ts');

  const a = aff.ensureAffiliateMember('user_a');
  const b = aff.ensureAffiliateMember('user_b');
  assert.ok(a.code.length >= 6);
  assert.notEqual(a.code, b.code);

  // Dormant link: no clicks, no attribution before the Agreement is accepted
  const dormantClick = aff.recordClick({ code: a.code, ip: '1.2.3.4' });
  assert.equal(dormantClick.ok, false);
  const dormantAttr = aff.attributeSignup({ newUid: 'user_b', referralCode: a.code });
  assert.equal(dormantAttr.attributed, false);

  // Activate → link goes live
  const activated = aff.activateAffiliate('user_a');
  assert.ok(activated.activatedAt);
  assert.equal(activated.termsVersion, (await import('../src/content/affiliateTerms.ts')).AFFILIATE_TERMS_VERSION);

  const click = aff.recordClick({ code: a.code, ip: '1.2.3.4' });
  assert.equal(click.ok, true);

  const attributed = aff.attributeSignup({ newUid: 'user_b', referralCode: a.code });
  assert.equal(attributed.attributed, true);
  assert.equal(attributed.referrerUid, 'user_a');

  const desk = aff.getAffiliateDashboard('user_a', 'https://clearpathtrader.com');
  assert.equal(desk.monthSignups, 1);
  assert.equal(desk.discountPercent, 10);
  assert.ok(desk.shareUrl.includes(`/r/${a.code}`));

  // Self-referral blocked
  const self = aff.attributeSignup({ newUid: 'user_a', referralCode: a.code });
  assert.equal(self.attributed, false);

  const paid = aff.markReferredPaid({ referredUid: 'user_b', tier: 'pro', periodKey: '2026-08-01' });
  assert.equal(paid.ok, true);
  assert.equal(paid.creditCents, Math.round(aff.TIER_PRICE_CENTS.pro * aff.AFFILIATE_RESIDUAL_RATE));

  const desk2 = aff.getAffiliateDashboard('user_a', 'https://clearpathtrader.com');
  assert.equal(desk2.creditCents, paid.creditCents);

  // Idempotent within the same billing period
  const paid2 = aff.markReferredPaid({ referredUid: 'user_b', tier: 'pro', periodKey: '2026-08-01' });
  assert.equal(paid2.ok, true);
  assert.equal(paid2.creditCents, 0);

  // Lifetime residual: the NEXT billing period credits again
  const paid3 = aff.markReferredPaid({ referredUid: 'user_b', tier: 'pro', periodKey: '2026-09-01' });
  assert.equal(paid3.ok, true);
  assert.equal(paid3.creditCents, Math.round(aff.TIER_PRICE_CENTS.pro * aff.AFFILIATE_RESIDUAL_RATE));

  const desk3 = aff.getAffiliateDashboard('user_a', 'https://clearpathtrader.com');
  assert.equal(desk3.creditCents, (paid.creditCents || 0) + (paid3.creditCents || 0));

  // Payouts: below minimum rejected, at/above minimum reserved, admin settle deducts
  const tooSmall = aff.requestAffiliatePayout({ uid: 'user_a', method: 'paypal', destination: 'a@b.c' });
  assert.equal(tooSmall.ok, false); // 2 × $2.49 < $25 minimum

  // Boost credit over the minimum via an ultimate-yearly period
  aff.markReferredPaid({ referredUid: 'user_b', tier: 'ultimate', amountCents: 77940, periodKey: 'y-2026' });
  const req1 = aff.requestAffiliatePayout({ uid: 'user_a', method: 'paypal', destination: 'a@b.c' });
  assert.equal(req1.ok, true);
  assert.ok((req1.payout?.amountCents || 0) >= aff.MIN_PAYOUT_CENTS);

  // Second request while one is pending → nothing available
  const req2 = aff.requestAffiliatePayout({ uid: 'user_a', method: 'paypal', destination: 'a@b.c' });
  assert.equal(req2.ok, false);

  const settled = aff.adminResolvePayout({ payoutId: req1.payout!.id, action: 'paid' });
  assert.equal(settled.ok, true);
  const desk4 = aff.getAffiliateDashboard('user_a', 'https://clearpathtrader.com');
  assert.equal(desk4.creditCents, 0);
  assert.equal(desk4.payout.availableCents, 0);

  console.log('affiliate.selftest: ok');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
