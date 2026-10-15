/**
 * Stripe billing hardening — pure logic (no live Stripe API).
 * Run: npm run test:stripe-billing
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  membershipGrantsAccess,
  resolveSubscriptionMembershipWrite,
} from '../src/server/stripeService.ts';

const root = process.cwd();
const stripeSrc = fs.readFileSync(path.join(root, 'src/server/stripeService.ts'), 'utf8');
const server = fs.readFileSync(path.join(root, 'server.ts'), 'utf8');
const profileStore = fs.readFileSync(path.join(root, 'src/server/profileStore.ts'), 'utf8');

assert.equal(membershipGrantsAccess('active'), true);
assert.equal(membershipGrantsAccess('trialing'), true);
assert.equal(membershipGrantsAccess('past_due'), false, 'past_due must not unlock paid features');
assert.equal(membershipGrantsAccess('canceled'), false);

assert.match(stripeSrc, /beginStripeWebhookEvent/);
assert.match(stripeSrc, /releaseStripeWebhookEvent/);
assert.match(stripeSrc, /reconcileStripeMembershipForUid/);
assert.match(stripeSrc, /billing_address_collection: 'required'/);
assert.match(stripeSrc, /tax_id_collection/);
assert.match(stripeSrc, /writeProfileDurable/);
assert.match(stripeSrc, /validateConfiguredPrice/);
assert.match(stripeSrc, /getOrCreateStripeCustomer/);
assert.match(stripeSrc, /assertNoConflictingSubscription/);
assert.match(stripeSrc, /createMembershipPortalSession/);
assert.match(stripeSrc, /invoice\.paid/);
assert.match(stripeSrc, /invoice\.payment_failed/);
assert.match(stripeSrc, /charge\.refunded/);
assert.match(stripeSrc, /customer: customerId/);
assert.doesNotMatch(stripeSrc, /customer_email:/);

assert.match(profileStore, /export async function writeProfileDurable/);
assert.match(server, /create-portal-session/);
assert.match(server, /requireMembershipFeature/);

const membershipAccess = fs.readFileSync(path.join(root, 'src/server/membershipAccess.ts'), 'utf8');
assert.match(membershipAccess, /resolveMembershipReportForRequest/);

const kept = resolveSubscriptionMembershipWrite(
  { tier: 'platinum', status: 'active', stripeSubscriptionId: 'sub_high' },
  { tier: 'silver', status: 'active', stripeSubscriptionId: 'sub_low' },
);
assert.equal(kept, null);

console.log('stripe-billing.selftest: ok');
