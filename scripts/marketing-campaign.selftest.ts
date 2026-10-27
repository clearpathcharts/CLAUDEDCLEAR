/**
 * Marketing command center self-test.
 * Run: npx tsx scripts/marketing-campaign.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');
const metadata = JSON.parse(read('data/marketing/clearpath-marketing-metadata.json')) as {
  brand: { requiredDisclaimer: string; prohibitedClaims: string[] };
  audiences: Array<{ id: string; destination: string }>;
  keywordClusters: Array<{ id: string; destination: string; keywords: string[] }>;
  pageMetadata: Array<{ path: string; title: string; description: string; primaryKeyword: string }>;
  distribution: { approvalRule: string; vendorNotes: Array<{ name: string; decision: string }> };
};

assert.equal(metadata.brand.requiredDisclaimer.includes('Not financial advice'), true);
assert.ok(metadata.brand.prohibitedClaims.length >= 5);
assert.ok(metadata.audiences.length >= 6);
assert.ok(metadata.keywordClusters.length >= 8);
assert.ok(metadata.pageMetadata.length >= 6);

const keywords = metadata.keywordClusters.flatMap((cluster) => cluster.keywords);
assert.ok(keywords.length >= 75, `expected at least 75 keywords, got ${keywords.length}`);
assert.equal(
  new Set(keywords.map((keyword) => keyword.toLowerCase())).size,
  keywords.length,
  'keywords must be unique across clusters',
);
assert.ok(metadata.keywordClusters.every((cluster) => cluster.destination.startsWith('/')));
assert.match(metadata.distribution.approvalRule, /review|approval/i);
assert.ok(metadata.distribution.vendorNotes.some((vendor) => vendor.name === 'Mega'));
assert.ok(
  metadata.distribution.vendorNotes.some(
    (vendor) => vendor.name === 'Mega' && /not the first choice/i.test(vendor.decision),
  ),
);

const component = read('src/components/MarketingCampaignDesk.tsx');
assert.match(component, /clearpath-marketing-metadata\.json/);
assert.match(component, /data-ceo-marketing-campaign/);
assert.match(component, /Download metadata/);
assert.match(component, /Open ClearPath Social OS/);

const ceo = read('src/components/CeoDashboard.tsx');
assert.match(ceo, /import MarketingCampaignDesk/);
assert.match(ceo, /<MarketingCampaignDesk \/>/);

console.log('marketing-campaign.selftest: ok');
