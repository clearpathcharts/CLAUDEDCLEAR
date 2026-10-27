/**
 * Marketing funnel self-test — local only, no Firestore or network.
 * Run: npx tsx scripts/marketing-funnel.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

async function main() {
  const repoRoot = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'clearpath-marketing-funnel-'));
  process.chdir(tempRoot);
  process.env.NODE_ENV = 'test';
  process.env.CLEARPATH_DISABLE_FIRESTORE_ADMIN = '1';
  process.env.SESSION_SECRET = 'marketing-funnel-selftest-secret';

  const funnel = await import('../src/server/marketingFunnelService');
  assert.equal(funnel.MEMBERS_PER_TIER_GOAL, 25_000);
  assert.equal(funnel.MEMBERS_PER_CYCLE_GOAL, 100_000);

  const attribution = funnel.sanitizeMarketingAttribution({
    source: 'Instagram Ads',
    medium: 'Paid Social',
    campaign: 'Tier Launch',
    content: 'Gold Poster',
    targetTier: 'gold',
    landingPath: '/plans?offer=gold',
  });
  assert.equal(attribution.source, 'instagram_ads');
  assert.equal(attribution.targetTier, 'gold');

  const cookie = funnel.encodeMarketingAttributionCookie(attribution);
  assert.deepEqual(funnel.decodeMarketingAttributionCookie(cookie), attribution);
  assert.equal(funnel.decodeMarketingAttributionCookie(`${cookie}tampered`), null);

  const visit = await funnel.recordPublicMarketingEvent('visit', attribution);
  assert.equal(visit.recorded, true);
  assert.equal(visit.storage, 'local');

  assert.equal(await funnel.recordMarketingSignup('uid-1', cookie), true);
  assert.equal(await funnel.recordMarketingSignup('uid-1', cookie), false, 'signup must deduplicate by uid');
  assert.equal(await funnel.recordMarketingTrial('uid-1', 'gold'), true);
  assert.equal(await funnel.recordMarketingTrial('uid-1', 'gold'), false, 'trial must deduplicate by uid');
  assert.equal(await funnel.recordMarketingConversion('uid-1', 'gold'), true);
  assert.equal(await funnel.recordMarketingConversion('uid-1', 'gold'), false, 'conversion must deduplicate by uid');

  const analytics = await funnel.getMarketingAnalytics();
  assert.equal(analytics.storage, 'local');
  assert.equal(analytics.totals.visits, 1);
  assert.equal(analytics.totals.signups, 1);
  assert.equal(analytics.totals.trials, 1);
  assert.equal(analytics.totals.conversions, 1);
  assert.equal(analytics.campaignCycle.lifetimeMembers, 1);
  const gold = analytics.tiers.find((tier) => tier.tier === 'gold');
  assert.equal(gold?.lifetimeMembers, 1);
  assert.equal(gold?.goal, 25_000);
  assert.equal(gold?.goalProgress, 1);

  const catalog = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'data/marketing/tier-content-catalog.json'), 'utf8'),
  );
  assert.equal(catalog.goals.membersPerTier, 25_000);
  assert.equal(catalog.goals.membersPerCycle, 100_000);
  assert.equal(catalog.tiers.length, 4);
  assert.ok(catalog.excludedChannels.includes('x'));
  for (const tier of catalog.tiers) {
    assert.ok(tier.videos.length >= 2);
    const posterPath = path.join(repoRoot, 'public', tier.poster.assetUrl.replace(/^\//, ''));
    assert.ok(fs.existsSync(posterPath), `poster missing for ${tier.id}`);
    const poster = fs.readFileSync(posterPath, 'utf8');
    assert.match(poster, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.doesNotMatch(
      poster,
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/,
      `poster contains an XML-illegal control character for ${tier.id}`,
    );
  }

  process.chdir(repoRoot);
  fs.rmSync(tempRoot, { recursive: true, force: true });
  console.log('marketing-funnel.selftest: ok');
}

main().catch((error) => {
  console.error('marketing-funnel.selftest FAILED', error);
  process.exitCode = 1;
});
