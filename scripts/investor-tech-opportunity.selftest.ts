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
assert.match(read('.env.example'), /BRENT_OUTREACH_EMAIL=clearpath\.brent@gmail\.com/);

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
assert.equal(brent.BRENT_OUTREACH_EMAIL_DEFAULT, 'clearpath.brent@gmail.com');
assert.ok(brent.BRENT_OUTREACH_SCREENSHOTS.length >= 4);
assert.match(brent.TECHNOLOGY_OPPORTUNITY_URL, /technology-opportunity/);
assert.equal(brent.brentOutreachEmail(), 'clearpath.brent@gmail.com');
assert.equal(brent.brentOutreachConfigured(), true);

const svc = await import('../src/server/brentOutreachService.ts');
const status = svc.brentOutreachStatus();
assert.equal(status.brentEmailConfigured, true);
assert.match(String(status.fromPreview), /clearpath\.brent@gmail\.com/);
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
assert.equal(draft.fromConfigured, true);
assert.match(draft.fromPreview, /clearpath\.brent@gmail\.com/);

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
assert.equal(blocked.reason, 'smtp_not_configured');

// CEO daily bento reads durable send log (local file when Firestore Admin is off).
const logDir = path.join(root, 'data', 'communications');
fs.mkdirSync(logDir, { recursive: true });
const sample = {
  id: 'bos_test_ceo_bento',
  sentAt: new Date().toISOString(),
  dayKey: '2099-01-02',
  from: 'Brent · ClearPath Trader <clearpath.brent@gmail.com>',
  to: 'vc@example.com',
  investorId: targets[0]!.id,
  investorName: targets[0]!.name,
  subject: 'ClearPath Trader — technology & investment opportunity (live product)',
  bodyText: 'Subject: test\n\nHello investor — pattern measurement and River.',
};
fs.writeFileSync(path.join(logDir, 'brent_outreach_sends.json'), JSON.stringify([sample], null, 2), 'utf8');
const log = await svc.listBrentOutreachSendLog({ dayKey: '2099-01-02', limitDays: 30 });
assert.equal(log.days.length, 1);
assert.equal(log.days[0]!.count, 1);
assert.equal(log.days[0]!.sends[0]!.to, 'vc@example.com');
assert.match(log.days[0]!.sends[0]!.bodyText, /pattern measurement/);
fs.rmSync(path.join(logDir, 'brent_outreach_sends.json'), { force: true });

assert.match(read('src/components/CeoDashboard.tsx'), /CeoBrentOutreachBento/);
assert.match(read('src/server/brentOutreachRoutes.ts'), /\/sent-log/);
assert.match(read('server.ts'), /createBrentOutreachRouter/);
assert.match(
  read('src/server/brentOutreachService.ts'),
  /orderBy\(['"]sentAt['"],\s*['"]desc['"]\)/,
  'Firestore send-log must orderBy sentAt desc so newest rows are not dropped by limit',
);

// Pitch deck must not advertise the removed affiliate program.
assert.doesNotMatch(read('src/pitch/pitchDeckData.ts'), /Affiliate network with cookie attribution/);

console.log('investor-tech-opportunity.selftest: ok');
