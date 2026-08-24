import React from 'react';
import { Lock, Sparkles, ArrowRight, Check } from 'lucide-react';
import { TIER_LABEL, type PlanTier } from '../lib/entitlements';
import { PAYMENTS_ENABLED } from '../lib/paymentsEnabled';

const TIER_PRICE_LABEL: Record<Exclude<PlanTier, 'basic'>, string> = {
  pro: '$9.95/mo',
  proplus: '$19.95/mo',
  premium: '$30.95/mo',
  ultimate: '$69.95/mo',
};

const TIER_ACCENT: Record<Exclude<PlanTier, 'basic'>, string> = {
  pro: 'text-[#06b6d4] border-[#06b6d4]/30 bg-[#06b6d4]/10',
  proplus: 'text-[#a78bfa] border-[#8b5cf6]/30 bg-[#8b5cf6]/10',
  premium: 'text-teal-300 border-teal-400/30 bg-teal-400/10',
  ultimate: 'text-[#ec4899] border-[#ec4899]/30 bg-[#ec4899]/10',
};

export default function FeatureGate({
  allowed,
  loading,
  requiredTier,
  featureTitle,
  perks,
  onUpgrade,
  children,
}: {
  allowed: boolean;
  loading?: boolean;
  requiredTier: Exclude<PlanTier, 'basic'>;
  featureTitle: string;
  perks?: string[];
  onUpgrade: () => void;
  children: React.ReactNode;
}) {
  if (PAYMENTS_ENABLED === false || allowed) return <>{children}</>;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
      </div>
    );
  }

  const tierName = TIER_LABEL[requiredTier];

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6" id={`feature_gate_${requiredTier}`}>
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-950 to-black p-8 text-center space-y-5">
        <div className="mx-auto w-14 h-14 rounded-2xl border border-white/10 bg-zinc-900 flex items-center justify-center">
          <Lock className="w-6 h-6 text-zinc-400" />
        </div>

        <div className="space-y-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-mono font-black uppercase tracking-widest ${TIER_ACCENT[requiredTier]}`}>
            <Sparkles className="w-3 h-3" />
            {tierName} feature
          </span>
          <h2 className="text-xl font-black font-mono tracking-tight text-white">{featureTitle}</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            This is included with the <strong className="text-white">{tierName}</strong> plan
            ({TIER_PRICE_LABEL[requiredTier]}) and above — free for your first 15 days.
          </p>
        </div>

        {perks && perks.length > 0 && (
          <ul className="text-left space-y-2 max-w-xs mx-auto">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-zinc-300 text-sm">
                <div className="w-5 h-5 rounded-full bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-cyan-400" />
                </div>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={onUpgrade}
          className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-zinc-950 text-xs font-black uppercase tracking-widest transition-all duration-300 hover:scale-[1.03] cursor-pointer"
        >
          Unlock with {tierName} — 15 days free
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-[10px] font-mono text-zinc-600">
          Cancel anytime · Secure checkout by Stripe
        </p>
      </div>
    </div>
  );
}
