import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { PAYMENTS_DISABLED_MESSAGE } from '../lib/paymentsEnabled';

export default function MembershipTab({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  return (
    <div className="max-w-xl mx-auto p-8 space-y-5">
      <div className="rounded-3xl border border-white/10 bg-zinc-950 p-8 text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 flex items-center justify-center">
          <ShieldCheck className="w-7 h-7 text-emerald-300" />
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-widest">No billing on this site</h2>
        <p className="text-zinc-400 text-sm leading-relaxed">{PAYMENTS_DISABLED_MESSAGE}</p>
        <p className="text-zinc-500 text-xs font-mono">
          Stripe checkout, Payment Links, trials, and paid tiers are disabled. Charts, education, and
          private login stay free.
        </p>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('Discovery')}
            className="px-4 py-2 rounded-xl border border-cyan-500/40 text-cyan-200 text-xs font-black uppercase tracking-widest"
          >
            Back to the desk
          </button>
        )}
      </div>
    </div>
  );
}
