/**
 * Technology / investment opportunity page + Brent communications desk.
 * Run: npx tsx scripts/investor-tech-opportunity.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

process.env.CLEARPATH_DISABLE_FIRESTORE_ADMIN = '1';

const root = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

assert.match(read('src/App.tsx'), /TechnologyInvestmentOpportunityPage/);
assert.match(read('src/App.tsx'), /BrentMarketingDepartment/);
assert.match(read('src/App.tsx'), /isTechnologyOpportunityPath/);
assert.match(read('src/App.tsx'), /isCommunicationsPath/);
assert.match(read('src/lib/publicIdentityRoutes.ts'), /technology-opportunity/);
assert.match(read('src/lib/publicIdentityRoutes.ts'), /communications/);
assert.match(read('server.ts'), /createBrentOutreachRouter/);
assert.match(read('server.ts'), /\/api\/communications/);
assert.match(read('.env.example'), /BRENT_OUTREACH_EMAIL=/);

const content = await import('../src/content/investorTechnologyOpportunity.ts');
assert.match(content.TECH_OPP_META.title, /Technology, Innovation & Investment Opportunity/);
assert.ok(content.TECH_OPP_VALUE_LAYERS.some((l) => l.id === 'trading-anarchy'));
assert.ok(content.TECH_OPP_VALUE_LAYERS.some((l) => l.id === 'four-up-three-down'));
assert.ok(content.TECH_OPP_VALUE_LAYERS.some((l) => l.id === 'live-pattern-scanner'));
assert.ok(content.TECH_OPP_PILLARS.some((p) => p.id === 'river'));
assert.ok(content.TECH_OPP_PILLARS.some((p) => p.id === 'neuro'));
assert.ok(content.TECH_OPP_SEC_NOTE.title.length > 10);
assert.equal(
  /scientifically disproven/i.test(content.TECH_OPP_VALUE_LAYERS.map((l) => l.body).join(' ')),
  true,
  'must explicitly refuse the disproven-Elliott claim trap'
);
assert.match(content.TECH_OPP_VALUATION.financialPosition.rows.map((r) => r.value).join(' '), /\$0 MRR/);
assert.match(content.TECH_OPP_VALUATION.honestyLead, /not necessarily the same as the current market value/i);
assert.ok(content.TECH_OPP_SWOT.strengths.length >= 5);
assert.ok(content.TECH_OPP_CAPITAL.stages.length === 3);
assert.match(content.TECH_OPP_CAPITAL.securityIncidentNote.body, /\$8,500/);
assert.doesNotMatch(
  content.TECH_OPP_CAPITAL.securityIncidentNote.body + content.TECH_OPP_VALUATION.honestyLead,
  /AI wormhole|guaranteed return|\$5–\$10 million range as ClearPath's established/i
);
assert.match(content.TECH_OPP_CLOSING.investmentClose, /already built the technology/i);

const brent = await import('../src/content/brentOutreach.ts');
assert.ok(brent.BRENT_OUTREACH_SCREENSHOTS.length >= 4);
assert.match(brent.TECHNOLOGY_OPPORTUNITY_URL, /technology-opportunity/);

const svc = await import('../src/server/brentOutreachService.ts');
const status = svc.brentOutreachStatus();
assert.equal(status.brentEmailConfigured, false);
assert.ok(status.investorCount > 100);
assert.ok(status.screenshotCount >= 4);

const targets = svc.listBrentInvestorTargets(5);
assert.ok(targets.length >= 1);
const draft = svc.buildBrentOutreachDraft(targets[0]!.id);
assert.match(draft.subject, /technology & investment opportunity/i);
assert.match(draft.text, /Brent/);
assert.match(draft.text, /Chief Communications Officer/);
assert.match(draft.html, /Website screenshots/i);
assert.match(draft.html, /technology-opportunity/);
assert.match(draft.html, /og-image\.png|institutional-trader/);
assert.equal(draft.fromConfigured, false);

const preview = await svc.sendBrentOutreachEmail({
  investorId: targets[0]!.id,
  toOverride: 'preview@example.com',
  confirmSend: false,
});
assert.equal(preview.ok, true);
assert.equal(preview.sent, false);
assert.equal(preview.reason, 'preview_only');

const blocked = await svc.sendBrentOutreachEmail({
  investorId: targets[0]!.id,
  toOverride: 'preview@example.com',
  confirmSend: true,
});
assert.equal(blocked.sent, false);
assert.equal(blocked.reason, 'brent_email_not_configured');

// Pitch deck must not advertise the removed affiliate program.
assert.doesNotMatch(read('src/pitch/pitchDeckData.ts'), /Affiliate network with cookie attribution/);

console.log('investor-tech-opportunity.selftest: ok');
