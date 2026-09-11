import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { PAYMENTS_DISABLED_MESSAGE } from '../lib/paymentsEnabled';
import { PlanComparisonTable } from './PlanComparisonTable';
import { PackagesPanel } from './PackagesPanel';
import { CANONICAL_PLANS } from '../lib/planCatalog';

export default function MembershipTab({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <div className="rounded-3xl border border-white/10 bg-zinc-950 p-8 text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 flex items-center justify-center">
          <ShieldCheck className="w-7 h-7 text-emerald-300" />
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-widest">Membership packages</h2>
        <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl mx-auto">{PAYMENTS_DISABLED_MESSAGE}</p>
        <p className="text-zinc-500 text-xs font-mono">
          Four membership packages (no list prices). Silver add-ons are priced extras only — not new tiers. Preview a tier with{' '}
          {CANONICAL_PLANS.map((id) => (
            <a
              key={id}
              href={`?planPreview=${id}`}
              className="text-cyan-300 hover:underline mx-1 uppercase"
            >
              {id}
            </a>
          ))}
          .
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
      <PackagesPanel showAddForm />
      <PlanComparisonTable />
    </div>
  );
}
