/**
 * Marketing intelligence engine self-test.
 * Run: npx tsx scripts/marketing-intelligence-engine.selftest.ts
 */
import assert from 'node:assert/strict';
import {
  createMarketingContentBrief,
  getGeminiPlannerStatus,
  getMarketingCapabilities,
  getMarketingIntelligenceReport,
  loadMarketingKeywordCatalog,
  matchMarketingKeyword,
} from '../src/server/marketingIntelligence';

const expectedCapabilities = [
  'SEO',
  'GEO',
  'AEO',
  'LLMO',
  'AIO',
  'AISO',
  'GSO',
  'SMO',
  'SSO',
  'VSO',
  'HSO',
  'ENTITY',
  'KGO',
  'CRO',
  'SXO',
  'ASO',
  'LOCAL',
  'VOICE',
  'AAO',
  'EEAT',
].sort();

const registry = getMarketingCapabilities();
assert.deepEqual(
  registry.capabilities.map((capability) => capability.id).sort(),
  expectedCapabilities,
  'all founder-specified capabilities must be governed by the registry',
);
assert.match(registry.operatingModel.approvalRule, /founder approval/i);
assert.match(registry.operatingModel.measurementRule, /not search demand/i);

const catalog = loadMarketingKeywordCatalog();
assert.equal(catalog.sourceCounts.master, 100);
assert.ok(catalog.sourceCounts.platform >= 130);

const report = getMarketingIntelligenceReport({ limit: 200 });
assert.equal(report.ok, true);
assert.equal(report.summary.capabilities, 20);
assert.ok(report.summary.uniqueOpportunities >= 200);
assert.ok(report.summary.canonicalRoutes >= 20);
assert.ok(report.summary.heldForReview >= 14);
assert.ok(report.summary.activate > 0);
assert.match(report.methodology.exclusions, /No search volume/i);
assert.ok(
  report.opportunities.every((opportunity) =>
    /not a demand or ranking score/i.test(opportunity.scoreMeaning),
  ),
);

const levelTwo = report.reviewQueue.find(
  (opportunity) => opportunity.keyword.toLowerCase() === 'level 2 market data',
);
assert.equal(levelTwo?.status, 'hold');
assert.equal(levelTwo?.canonicalPath, null);
assert.deepEqual(levelTwo?.capabilities, ['EEAT']);

const socialReport = getMarketingIntelligenceReport({
  capability: 'SMO',
  platform: 'Instagram',
  limit: 100,
});
assert.ok(socialReport.totalMatching > 0);
assert.ok(
  socialReport.opportunities.every(
    (opportunity) =>
      opportunity.platform === 'Instagram' && opportunity.capabilities.includes('SMO'),
  ),
);

const neuroBrief = createMarketingContentBrief({
  canonicalPath: '/desk/neurodivergent',
  platform: 'Instagram',
});
assert.equal(neuroBrief.approvalStatus, 'DRAFT_REQUIRES_FOUNDER_APPROVAL');
assert.ok(neuroBrief.capabilities.includes('AAO'));
assert.ok(neuroBrief.prohibitedShortcuts.some((rule) => /No autonomous social publishing/i.test(rule)));
assert.throws(
  () => createMarketingContentBrief({ canonicalPath: '/api/private' }),
  /allowlisted route/i,
);

const technicalMatches = matchMarketingKeyword('technical analysis');
assert.equal(technicalMatches[0]?.canonicalPath, '/indicators');
assert.equal(technicalMatches[0]?.status, 'approved');

const planner = getGeminiPlannerStatus();
assert.equal(planner.publishingEnabled, false);
assert.equal(planner.approvalRequired, true);
assert.ok(planner.model.length > 0);

console.log('marketing-intelligence-engine.selftest: ok');
