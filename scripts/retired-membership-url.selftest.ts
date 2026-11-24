/**
 * Legacy ?tab=Membership dashboard URLs must 301 to /plans.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { isLegacyMembershipDashboardUrl } from '../src/lib/retiredMembershipDashboardUrl.ts';

assert.equal(isLegacyMembershipDashboardUrl('?tab=Membership', ''), true);
assert.equal(isLegacyMembershipDashboardUrl('?profile=standard_red_green&tab=Membership', 'Membership'), true);
assert.equal(isLegacyMembershipDashboardUrl('?tab=StrictlyCharts', ''), false);

const server = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');
assert.match(server, /redirect\(301, '\/plans'\)/);

console.log('retired-membership-url.selftest: ok');
