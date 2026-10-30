/**
 * Global search intelligence self-test.
 * Run: npx tsx scripts/marketing-search-intelligence.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const intelligence = JSON.parse(read('data/marketing/global-search-intelligence.json')) as {
  masterGroups: Array<{ category: string; audience: string; keywords: string[] }>;
  platforms: Array<{
    platform: string;
    type: string;
    language: string;
    keywords: string[];
    note?: string;
  }>;
  brandAcquisitionTerms: string[];
  officialBrandTerms: string[];
  neurodivergentTerms: string[];
  audienceAllocation: Array<{ audience: string; allocationPercent: number; purpose: string }>;
  researchOnlyTerms: Array<{ term: string; reason: string }>;
  excludedPlatforms: Array<{ platform: string; reason: string }>;
  governance: {
    approvalRule: string;
    truthRule: string;
    volumeRule: string;
    accessibilityRule: string;
    brandRule: string;
  };
};
const metadata = JSON.parse(read('data/marketing/clearpath-marketing-metadata.json')) as {
  keywordClusters: Array<{ keywords: string[] }>;
};

const masterTerms = intelligence.masterGroups.flatMap((group) => group.keywords);
const platformTerms = intelligence.platforms.flatMap((platform) => platform.keywords);
const allTerms = [
  ...masterTerms,
  ...platformTerms,
  ...intelligence.brandAcquisitionTerms,
  ...intelligence.officialBrandTerms,
  ...intelligence.neurodivergentTerms,
];
const activePlatforms = new Set(intelligence.platforms.map((platform) => platform.platform));

assert.equal(masterTerms.length, 100, 'the supplied foundational catalog must remain complete');
assert.ok(allTerms.length >= 280, `expected at least 280 search records, got ${allTerms.length}`);
assert.equal(
  intelligence.audienceAllocation.reduce((total, audience) => total + audience.allocationPercent, 0),
  100,
  'audience allocation must total 100%',
);

for (const platform of [
  'Facebook',
  'Instagram',
  'TikTok',
  'YouTube',
  'LinkedIn',
  'Threads',
  'Bluesky',
  'Reddit',
  'Pinterest',
  'Discord',
  'Telegram',
  'WhatsApp',
  'Bing',
  'VK',
  'Meta Ads',
]) {
  assert.ok(activePlatforms.has(platform), `${platform} search language is missing`);
}
assert.ok(!activePlatforms.has('X'), 'X must remain excluded');
assert.ok(!activePlatforms.has('Telegram X'), 'Telegram X is not a separate distribution network');
assert.ok(intelligence.excludedPlatforms.some((item) => item.platform === 'X'));
assert.ok(intelligence.excludedPlatforms.some((item) => item.platform === 'Telegram X'));
assert.ok(
  intelligence.platforms
    .find((platform) => platform.platform === 'VK')
    ?.keywords.some((keyword) => /[А-Яа-яЁё]/.test(keyword)),
  'VK must retain reviewed Russian-language source terms',
);
assert.match(
  intelligence.platforms.find((platform) => platform.platform === 'WhatsApp')?.note || '',
  /not a conventional public hashtag search engine/i,
);

const masterSet = new Set(masterTerms.map((term) => term.toLowerCase()));
const publicKeywordSet = new Set(
  metadata.keywordClusters.flatMap((cluster) => cluster.keywords.map((term) => term.toLowerCase())),
);
for (const item of intelligence.researchOnlyTerms) {
  assert.ok(masterSet.has(item.term.toLowerCase()), `${item.term} must trace to the source catalog`);
  assert.ok(item.reason.length >= 20, `${item.term} requires a specific review reason`);
  assert.ok(
    !publicKeywordSet.has(item.term.toLowerCase()),
    `${item.term} cannot enter route-backed public metadata without claim review`,
  );
}

assert.match(intelligence.governance.approvalRule, /founder review/i);
assert.match(intelligence.governance.truthRule, /not automatically/i);
assert.match(intelligence.governance.volumeRule, /do not claim/i);
assert.match(intelligence.governance.accessibilityRule, /certification/i);
assert.match(intelligence.governance.brandRule, /ClearPath Trader/);

const component = read('src/components/MarketingCampaignDesk.tsx');
assert.match(component, /global-search-intelligence\.json/);
assert.match(component, /GlobalSearchIntelligencePanel/);
const panel = read('src/components/GlobalSearchIntelligencePanel.tsx');
assert.match(panel, /Global search intelligence/);
assert.match(panel, /Download search CSV/);
assert.match(panel, /Claim review queue/);
assert.match(panel, /Platform language map/);

console.log('marketing-search-intelligence.selftest: ok');
