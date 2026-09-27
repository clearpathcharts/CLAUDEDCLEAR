import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AFFILIATE_PAYOUTS_ENABLED,
  MEMBERSHIP_CHECKOUT_ENABLED,
  STRIPE_ACCOUNT_RECOVERY_ENABLED,
} from '../src/lib/paymentsEnabled';
import { MEMBERSHIP_PLANS, membershipMonthlyCents } from '../src/content/membershipPricing';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel: string) => readFileSync(path.join(root, rel), 'utf8');
const page = read('src/components/membership/MembershipPricingPage.tsx');
const button = read('src/components/membership/PlanCheckoutButton.tsx');
const stripeService = read('src/server/stripeService.ts');
const hook = read('src/hooks/useMembership.ts');
const gate = read('src/components/FeatureGate.tsx');
const server = read('server.ts');

assert.equal(MEMBERSHIP_CHECKOUT_ENABLED, true, 'package checkout is on');
assert.equal(AFFILIATE_PAYOUTS_ENABLED, false, 'affiliate cash payouts stay off');
assert.equal(STRIPE_ACCOUNT_RECOVERY_ENABLED, false, 'Stripe account recovery stays off');

assert.equal(MEMBERSHIP_PLANS.length, 4);
assert.equal(membershipMonthlyCents('silver'), 598);
assert.equal(membershipMonthlyCents('gold'), 993);
assert.equal(membershipMonthlyCents('platinum'), 1499);

assert.match(page, /PlanCheckoutButton/);
assert.equal(page.includes('buy-button.js'), false, 'no shared Stripe Buy Button');
assert.equal(existsSync(path.join(root, 'src/components/membership/StripePlansBuyButton.tsx')), false);
assert.equal(existsSync(path.join(root, 'src/server/stripeBuyButtonConfig.ts')), false);
assert.match(button, /\/api\/stripe\/create-checkout-session/);
assert.match(button, /interval: 'month'/);
assert.match(page, /data-testid="offered-package"/);
assert.match(page, /choosePlan/);
assert.equal(page.includes('Review only'), false);
assert.equal(page.includes('membership-plan-grid'), false);

assert.match(stripeService, /membershipMonthlyCents\(billsAs\)/, 'checkout charges the /plans amount');
assert.match(stripeService, /const tier = String\(session\.metadata\?\.tier \|\| ''\)\.trim\(\);/, 'tier only from server metadata');
assert.equal(stripeService.includes('parseMembershipCheckoutRef'), false);
assert.match(stripeService, /subscription_data: \{[\s\S]*?metadata: \{ uid: input\.uid, tier: input\.tier/);

assert.equal(hook.includes("tier: 'platinum'"), false);
assert.equal(hook.includes('PAYMENTS_OFF'), false);
assert.equal(gate.includes('PAYMENTS_ENABLED === false'), false);
assert.equal(server.includes("entitlementsFor('platinum')"), false);
assert.match(server, /pickRicherMembershipReport/);
assert.match(server, /getMembershipStatus\(/);

console.log('ok membership-offer · one package + per-package Stripe checkout');
