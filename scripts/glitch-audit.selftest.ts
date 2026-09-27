/**
 * Regressions from the glitch/lag audit:
 * founder inboxes, Firebase provider email, uid list, history cache key,
 * membership cliffs (past_due, stacked subs, richer profile).
 *
 * Run: npx tsx scripts/glitch-audit.selftest.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCandleLimit } from '../src/config/tierLimits.ts';
import {
  founderEmailOf,
  isFounderAuthUser,
  isFounderEmail,
  isFounderFirebaseUid,
} from '../src/lib/founder.ts';
import {
  membershipGrantsAccess,
  pickRicherMembershipReport,
  resolveSubscriptionMembershipWrite,
} from '../src/server/stripeService.ts';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel: string) => readFileSync(path.join(root, rel), 'utf8');

assert.equal(isFounderEmail('forexanarchy@gmail.com'), true);
assert.equal(isFounderEmail('  ClearPathCharts@gmail.com '), true);
assert.equal(isFounderEmail('someone@gmail.com'), false);
assert.equal(
  founderEmailOf({ email: null, providerData: [{ email: 'forexanarchy@gmail.com' }] }),
  'forexanarchy@gmail.com',
);
assert.equal(
  isFounderAuthUser({ email: null, providerData: [{ email: 'clearpathcharts@gmail.com' }] }),
  true,
);

const previousUid = process.env.FOUNDER_FIREBASE_UID;
process.env.FOUNDER_FIREBASE_UID = '';
assert.equal(isFounderFirebaseUid('any-uid'), true, 'unset uid gate stays email-only');
process.env.FOUNDER_FIREBASE_UID = 'uid-forex, uid-charts';
assert.equal(isFounderFirebaseUid('uid-charts'), true);
assert.equal(isFounderFirebaseUid('uid-other'), false);
if (previousUid === undefined) delete process.env.FOUNDER_FIREBASE_UID;
else process.env.FOUNDER_FIREBASE_UID = previousUid;

assert.equal(getCandleLimit('VIP'), getCandleLimit('BRONZE'));
const marketData = read('src/services/marketData.ts');
assert.match(marketData, /getCandleLimit\(userTier\)/, 'history cache key uses the candle cap, not the tier name');

const retail = read('src/components/desks/retail/useRetailIntelligence.ts');
assert.match(retail, /prev\.some\(\(q\) => q\.price != null\)/, 'retail ribbon keeps the last good tape');
const institutional = read('src/components/desks/institutional/useInstitutionalIntelligence.ts');
assert.match(institutional, /prev\.some\(\(q\) => q\.price != null\)/, 'institutional ribbon keeps the last good tape');
assert.match(institutional, /sameCandleMap/);

const neuro = read('src/components/desks/neuro/NeurodivergentDashboard.tsx');
assert.match(neuro, /data=\{candles\}/);
assert.doesNotMatch(neuro, /candles\.length === 0 \?/, 'neuro chart mounts even when parent history is still empty');
assert.match(neuro, /deskSectionOpen\(hold\?\.isHeld, \['news'\]\)/);

const retailDesk = read('src/components/desks/retail/RetailDashboard.tsx');
assert.match(retailDesk, /data=\{intel\.candlesByKey\[/);

assert.equal(membershipGrantsAccess('past_due'), true);
assert.equal(membershipGrantsAccess('canceled'), false);

const kept = resolveSubscriptionMembershipWrite(
  { tier: 'platinum', status: 'active', stripeSubscriptionId: 'sub_high' },
  { tier: 'silver', status: 'active', stripeSubscriptionId: 'sub_low' },
);
assert.equal(kept, null, 'a lower second subscription must not replace a live higher plan');

const canceledOther = resolveSubscriptionMembershipWrite(
  { tier: 'gold', status: 'active', stripeSubscriptionId: 'sub_gold' },
  { tier: 'silver', status: 'canceled', stripeSubscriptionId: 'sub_silver' },
);
assert.equal(canceledOther, null, 'canceling a different subscription must not wipe the live plan');

const sameSub = resolveSubscriptionMembershipWrite(
  { tier: 'gold', status: 'active', stripeSubscriptionId: 'sub_gold' },
  { tier: '', status: 'past_due', stripeSubscriptionId: 'sub_gold' },
);
assert.equal(sameSub?.tier, 'gold');
assert.equal(sameSub?.status, 'past_due');

const richer = pickRicherMembershipReport([
  { active: true, tier: 'silver', status: 'active' },
  { active: true, tier: 'platinum', status: 'active' },
]);
assert.equal(richer.tier, 'platinum');

console.log('ok glitch-audit');
