/**
 * Billing switches. Each one gates a different money flow, so turning on
 * package checkout never turns on Stripe account recovery.
 */

/** Silver / Gold / Platinum Stripe Checkout Sessions from /plans. */
export const MEMBERSHIP_CHECKOUT_ENABLED = true;

/** Rebuilding private accounts from Stripe customer emails (boot + founder route). */
export const STRIPE_ACCOUNT_RECOVERY_ENABLED = false;

export const CHECKOUT_DISABLED_MESSAGE = 'Package checkout is paused. Basic stays free.';

export const STRIPE_RECOVERY_DISABLED_MESSAGE = 'Stripe account recovery is turned off.';
