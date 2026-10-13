import React, { useState } from 'react';
import { membershipAuthHeaders } from '../../hooks/useMembership';

export function ManageBillingButton({ className = '' }: { className?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const openPortal = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        credentials: 'include',
        headers: { ...(await membershipAuthHeaders()), 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || typeof data.url !== 'string') {
        throw new Error(data.error || 'Billing portal could not open.');
      }
      window.location.assign(data.url);
    } catch (err: any) {
      setError(err?.message || 'Billing portal could not open.');
      setBusy(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => void openPortal()}
        disabled={busy}
        className="membership-plan-card__button membership-plan-card__button--secondary"
      >
        {busy ? 'Opening Stripe…' : 'Manage billing'}
      </button>
      {error ? (
        <p className="membership-checkout__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
