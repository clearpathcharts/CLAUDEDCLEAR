import React, { useEffect, useState } from 'react';
import {
  STRIPE_PLANS_BUY_BUTTON_ID,
  membershipCheckoutRef,
  type MembershipPlanId,
} from '../../content/membershipPricing';

const BUY_BUTTON_SRC = 'https://js.stripe.com/v3/buy-button.js';

type StripeBuyButtonBoot = {
  buyButtonId?: string;
  publishableKey?: string;
};

function readBootConfig(): StripeBuyButtonBoot {
  if (typeof window === 'undefined') return {};
  return (window as Window & { __CLEARPATH_STRIPE_BUY_BUTTON__?: StripeBuyButtonBoot }).__CLEARPATH_STRIPE_BUY_BUTTON__
    || {};
}

function ensureBuyButtonScript() {
  if (document.querySelector(`script[src="${BUY_BUTTON_SRC}"]`)) return;
  const script = document.createElement('script');
  script.src = BUY_BUTTON_SRC;
  script.async = true;
  document.body.appendChild(script);
}

export function StripePlansBuyButton({
  planId,
  uid,
}: {
  planId: Exclude<MembershipPlanId, 'basic'>;
  uid: string;
}) {
  const [boot] = useState(readBootConfig);
  const buyButtonId = boot.buyButtonId || STRIPE_PLANS_BUY_BUTTON_ID;
  const publishableKey = boot.publishableKey || '';

  useEffect(() => {
    ensureBuyButtonScript();
  }, []);

  if (!publishableKey.startsWith('pk_')) {
    return (
      <p className="membership-plan-card__included">
        Stripe publishable key is not on this server yet. Set STRIPE_PUBLISHABLE_KEY on Cloud Run.
      </p>
    );
  }

  return (
    <div className="membership-stripe-buy" data-testid="stripe-plans-buy-button">
      {React.createElement('stripe-buy-button', {
        key: `${planId}-${uid}`,
        'buy-button-id': buyButtonId,
        'publishable-key': publishableKey,
        'client-reference-id': membershipCheckoutRef(uid, planId),
      })}
    </div>
  );
}
