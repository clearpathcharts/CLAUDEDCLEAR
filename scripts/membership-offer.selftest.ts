import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAYMENTS_ENABLED } from '../src/lib/paymentsEnabled';
import {
  MEMBERSHIP_PLANS,
  STRIPE_PLANS_BUY_BUTTON_ID,
  membershipCheckoutRef,
  parseMembershipCheckoutRef,
} from '../src/content/membershipPricing';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const page = readFileSync(path.join(root, 'src/components/membership/MembershipPricingPage.tsx'), 'utf8');
const hook = readFileSync(path.join(root, 'src/hooks/useMembership.ts'), 'utf8');
const gate = readFileSync(path.join(root, 'src/components/FeatureGate.tsx'), 'utf8');
const server = readFileSync(path.join(root, 'server.ts'), 'utf8');

assert.equal(PAYMENTS_ENABLED, false, 'in-app Checkout Sessions stay hard-off');
assert.equal(MEMBERSHIP_PLANS.length, 4);
assert.match(STRIPE_PLANS_BUY_BUTTON_ID, /^buy_btn_/);
assert.match(
  readFileSync(path.join(root, 'src/server/stripeBuyButtonConfig.ts'), 'utf8'),
  /pk_live_|STRIPE_PUBLISHABLE_KEY/,
);
assert.equal(membershipCheckoutRef('user-1', 'gold'), 'user-1|gold');
assert.deepEqual(parseMembershipCheckoutRef('user-1|silver'), { uid: 'user-1', planId: 'silver' });

assert.match(page, /StripePlansBuyButton/);
assert.match(page, /data-testid="offered-package"/);
assert.match(page, /choosePlan/);
assert.equal(page.includes('Review only'), false);
assert.equal(page.includes('membership-plan-grid'), false);

assert.equal(hook.includes("tier: 'platinum'"), false);
assert.equal(hook.includes('PAYMENTS_OFF'), false);
assert.equal(gate.includes('PAYMENTS_ENABLED === false'), false);
assert.equal(server.includes("entitlementsFor('platinum')"), false);
assert.match(server, /getMembershipStatus\(sessionUser\.uid\)/);

console.log('ok membership-offer · one package + Stripe buy button');
