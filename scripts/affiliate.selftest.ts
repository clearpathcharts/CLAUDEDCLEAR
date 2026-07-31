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

  const paid = aff.markReferredPaid({ referredUid: 'user_b', tier: 'pro' });
  assert.equal(paid.ok, true);
  assert.equal(paid.creditCents, Math.round(aff.TIER_PRICE_CENTS.pro * 0.2));

  const desk2 = aff.getAffiliateDashboard('user_a', 'https://clearpathtrader.com');
  assert.equal(desk2.creditCents, paid.creditCents);

  // Idempotent
  const paid2 = aff.markReferredPaid({ referredUid: 'user_b', tier: 'pro' });
  assert.equal(paid2.ok, true);
  assert.equal(paid2.creditCents, 0);

  console.log('affiliate.selftest: ok');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
