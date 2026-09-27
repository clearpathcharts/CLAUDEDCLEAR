import React, { useState } from 'react';
import type { MembershipPlanId } from '../../content/membershipPricing';

export function PlanCheckoutButton({
  planId,
  planName,
  priceLabel,
}: {
  planId: Exclude<MembershipPlanId, 'basic'>;
  planName: string;
  priceLabel: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const startCheckout = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tier: planId, interval: 'month' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || typeof data.url !== 'string') {
        throw new Error(data.message || data.error || 'Checkout could not start.');
      }
      window.location.assign(data.url);
    } catch (err: any) {
      setError(err?.message || 'Checkout could not start.');
      setBusy(false);
    }
  };

  return (
    <div className="membership-checkout" data-testid="plan-checkout">
      <button
        type="button"
        onClick={() => void startCheckout()}
        disabled={busy}
        className="membership-plan-card__button membership-plan-card__button--checkout"
      >
        {busy ? 'Opening Stripe…' : `Get ${planName} · ${priceLabel}/mo`}
      </button>
      {error ? (
        <p className="membership-checkout__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
