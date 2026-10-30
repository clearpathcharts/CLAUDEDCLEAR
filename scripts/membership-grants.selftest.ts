/**
 * Complimentary membership grants: lifetime/expiry, tier ranking, and route guards.
 * Run: npx tsx scripts/membership-grants.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.CLEARPATH_DISABLE_FIRESTORE_ADMIN = '1';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cp-grants-'));
process.chdir(tmp);

const grants = await import('../src/server/membershipGrants.ts');
const { pickRicherMembershipReport } = await import('../src/server/stripeService.ts');

await assert.rejects(grants.saveMembershipGrants(['a@x.com'], { tier: 'basic', reason: 't', grantedBy: 'test' }));
await assert.rejects(grants.saveMembershipGrants(['a@x.com'], { tier: 'diamond', reason: 't', grantedBy: 'test' }));

const n = await grants.saveMembershipGrants(['Gold@Example.com', 'gold@example.com', 'not-an-email'], {
  tier: 'gold',
  reason: 'security incident',
  grantedBy: 'test',
});
assert.equal(n.length, 1, 'dedupes and drops invalid emails');

const gold = await grants.grantReportForEmails(['GOLD@example.com']);
assert.deepEqual(gold, { active: true, tier: 'gold', status: 'complimentary' }, 'lifetime gold grant');
assert.equal(await grants.grantReportForEmails(['someone@else.com']), null);

await grants.saveMembershipGrants(['old@example.com'], {
  tier: 'gold',
  reason: 't',
  grantedBy: 'test',
  expiresAt: new Date(Date.now() - 1000).toISOString(),
});
assert.equal(await grants.grantReportForEmails(['old@example.com']), null, 'expired grant is ignored');

const paidPlatinum = { active: true, tier: 'platinum', status: 'active' };
assert.equal(pickRicherMembershipReport([paidPlatinum, gold!]).tier, 'platinum', 'paid Platinum upgrade wins');
const canceled = { active: false, tier: 'platinum', status: 'canceled' };
assert.equal(pickRicherMembershipReport([canceled, gold!]).tier, 'gold', 'Gold survives a canceled upgrade');

assert.equal(await grants.revokeMembershipGrant('gold@example.com'), true);
assert.equal(await grants.grantReportForEmails(['gold@example.com']), null);

const server = fs.readFileSync(path.join(root, 'server.ts'), 'utf8');
assert.match(server, /app\.post\('\/api\/admin\/membership-grants', requireFounderOrCatalogAdmin, requireFounderActionHeader/);
assert.match(server, /app\.delete\('\/api\/admin\/membership-grants\/:email', requireFounderOrCatalogAdmin, requireFounderActionHeader/);
const access = fs.readFileSync(path.join(root, 'src/server/membershipAccess.ts'), 'utf8');
assert.match(access, /decoded\.email_verified === true\) emails\.add/, 'Google emails must be verified to claim a grant');

process.chdir(root);
fs.rmSync(tmp, { recursive: true, force: true });
console.log('membership-grants.selftest: ok');
