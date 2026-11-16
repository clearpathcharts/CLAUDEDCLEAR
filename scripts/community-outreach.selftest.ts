/**
 * Clear Path Community Outreach portal + food-shelf future initiative.
 * Run: npm run test:community-outreach
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

process.env.CLEARPATH_DISABLE_FIRESTORE_ADMIN = '1';

const root = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

assert.match(read('src/App.tsx'), /CommunityOutreachPage/);
assert.match(read('src/App.tsx'), /isCommunityOutreachPath/);
assert.match(read('src/lib/publicIdentityRoutes.ts'), /community-outreach/);
assert.match(read('server.ts'), /createPublicCommunityOutreachRouter/);
assert.match(read('server.ts'), /\/api\/community-outreach/);
assert.match(read('server.ts'), /\/api\/admin\/community-outreach/);
assert.doesNotMatch(
  read('server.ts'),
  /app\.use\('\/api\/community-outreach',\s*communityOutreachInquiryLimiter/,
  'inquiry limiter must not wrap GET /snapshot',
);
assert.match(
  read('src/server/communityOutreachRoutes.ts'),
  /router\.post\('\/inquiry',\s*communityOutreachInquiryLimiter/,
);
assert.match(read('src/server/siteRegistry.ts'), /\/community-outreach/);
assert.match(read('src/components/CeoDashboard.tsx'), /CeoCommunityOutreachAdmin/);

const page = read('src/components/community/CommunityOutreachPage.tsx');
assert.match(page, /FOOD_SHELF_FUTURE_INITIATIVE/);
assert.match(page, /CALIFORNIA_COUNTY_DIRECTORY/);
assert.match(page, /statusBanner/);
assert.doesNotMatch(page, /LiveChart|MarketTicker|DeskRoute|candlestick|membership upgrade/i);
assert.doesNotMatch(page, /Approved partner|government authorized|official endorsement/i);

const content = await import('../src/content/communityOutreach.ts');
assert.equal(content.COMMUNITY_OUTREACH_PATH, '/community-outreach');
assert.match(content.FOOD_SHELF_FUTURE_INITIATIVE.statusBanner, /FUTURE INITIATIVE/);
assert.match(content.CALIFORNIA_UNEMPLOYMENT_CONTEXT.unemployed, /987/);
assert.match(content.CALIFORNIA_UNEMPLOYMENT_CONTEXT.period, /September 2026/);
assert.ok(content.FOOD_SHELF_FUTURE_INITIATIVE.helpAvailableNow.some((l) => /feedingamericaie/i.test(l.href)));
assert.ok(content.INQUIRY_CATEGORIES.includes('Food shelf / food bank coordination'));
assert.ok(content.DIRECTORY_INSTITUTIONS.every((i) => i.status === 'Proposed'));
assert.ok(content.EDUCATIONAL_RESOURCES.every((r) => r.downloadUrl === null));
assert.ok(content.DOCUMENT_CENTER.every((d) => d.downloadUrl === null));

const counties = await import('../src/content/californiaCountyDirectory.ts');
assert.equal(counties.CALIFORNIA_COUNTY_DIRECTORY.length, 58);
assert.equal(counties.CALIFORNIA_COUNTY_COUNT, 58);
assert.ok(counties.CALIFORNIA_COUNTY_DIRECTORY.every((c) => c.cities.length >= 1));
assert.ok(counties.CALIFORNIA_COUNTY_DIRECTORY.every((c) => /^https:\/\//.test(c.majorLibrary.url)));
assert.ok(counties.CALIFORNIA_COUNTY_DIRECTORY.every((c) => /^https:\/\//.test(c.majorCommunityCenter.url)));
assert.ok(counties.CALIFORNIA_COUNTY_DIRECTORY.some((c) => c.county === 'Riverside'));
assert.match(counties.CALIFORNIA_COUNTY_DIRECTORY_BANNER, /APPROVAL NOT YET CONFIRMED/);

// Fresh local durable store for deterministic assertions.
const outreachDataDir = path.join(root, 'data/community-outreach');
fs.rmSync(outreachDataDir, { recursive: true, force: true });

const store = await import('../src/server/communityOutreachStore.ts');
const snap = await store.getPublicOutreachSnapshot();
assert.ok(snap.institutions.every((i) => i.status === 'Proposed'));
assert.ok(snap.resources.every((r) => r.downloadUrl === null));
assert.ok(
  snap.institutions.every((i) => !('approvalSource' in i) && !('evidenceNote' in i)),
  'public snapshot must not leak approvalSource / evidenceNote',
);

const blocked = await store
  .updateInstitutionStatus({
    id: 'city-of-murrieta',
    status: 'Approved',
    actor: 'test',
    approvalSource: '',
  })
  .then(() => null)
  .catch((e) => e);
assert.ok(blocked instanceof store.CommunityOutreachError);

const approved = await store.updateInstitutionStatus({
  id: 'city-of-murrieta',
  status: 'Submitted',
  actor: 'test',
  approvalSource: 'internal note must stay private: citymanager@example.gov letter',
  evidenceNote: 'Confidential contact phone 555-0100',
});
assert.equal(approved.status, 'Submitted');
const publicAfter = await store.getPublicOutreachSnapshot();
const murrieta = publicAfter.institutions.find((i) => i.id === 'city-of-murrieta');
assert.ok(murrieta);
assert.equal(murrieta!.status, 'Submitted');
assert.ok(!('approvalSource' in murrieta!));
assert.ok(!('evidenceNote' in murrieta!));

const draft = await store.updateResourceRecord({
  id: 'understanding-money',
  actor: 'test',
  publicationStatus: 'Draft',
  downloadUrl: 'https://example.com/draft-understanding-money.pdf',
});
assert.equal(draft.downloadUrl, 'https://example.com/draft-understanding-money.pdf');
const publicDraft = await store.getPublicOutreachSnapshot();
assert.equal(
  publicDraft.resources.find((r) => r.id === 'understanding-money')?.downloadUrl,
  null,
  'draft download URLs must stay private',
);

const admin = await store.getAdminOutreachState();
const adminMurrieta = admin.institutions.find((i: any) => i.id === 'city-of-murrieta');
assert.match(String(adminMurrieta?.approvalSource || ''), /citymanager@example\.gov/);
assert.equal(
  admin.resources.find((r: any) => r.id === 'understanding-money')?.downloadUrl,
  'https://example.com/draft-understanding-money.pdf',
  'admin state must preserve draft download URLs so saves do not wipe them',
);
assert.match(
  read('src/server/communityOutreachStore.ts'),
  /refusing mutation fallback/,
);

const inquiry = await store.submitOutreachInquiry({
  name: 'Test Librarian',
  organization: 'Example Public Library',
  businessEmail: 'librarian@example.org',
  category: 'Food shelf / food bank coordination',
  message: 'Interested in future food shelf planning for Riverside County.',
});
assert.equal(inquiry.ok, true);
assert.ok(fs.existsSync(path.join(root, 'data/community-outreach/inquiries.json')));
const stateRaw = JSON.parse(fs.readFileSync(path.join(root, 'data/community-outreach/state.json'), 'utf8'));
assert.ok(!Array.isArray(stateRaw.inquiries) || stateRaw.inquiries.length === 0, 'inquiries must not live in overlay state');

const sensitive = await store
  .submitOutreachInquiry({
    name: 'Bad',
    organization: 'Org',
    businessEmail: 'a@example.org',
    category: 'General information',
    message: 'Here is my EBT card 1234',
  })
  .then(() => null)
  .catch((e) => e);
assert.ok(sensitive instanceof store.CommunityOutreachError);

const { enrichHtmlWithMetadata } = await import('../src/server/semanticDatabase.ts');
const { renderStaticIdentityPageForBots } = await import('../src/server/contentPages.ts');
const bot = renderStaticIdentityPageForBots('/community-outreach');
assert.ok(bot);
assert.match(bot!, /Clear Path Community Outreach/);
assert.match(bot!, /not yet operational/i);
const enriched = enrichHtmlWithMetadata('<html><head><title>x</title></head><body></body></html>', '/community-outreach');
assert.match(enriched, /Community Outreach/);
assert.match(enriched, /canonical"\s+href="https:\/\/clearpathtrader\.com\/community-outreach"/);

console.log('community-outreach.selftest: ok');
