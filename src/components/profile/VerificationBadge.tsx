import React from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

interface VerificationBadgeProps {
  status?: 'verified' | 'pending' | 'restricted';
  tier?: 'Tier 1' | 'Tier 2' | 'Sovereign Desk';
}

export default function VerificationBadge({ status = 'verified', tier = 'Sovereign Desk' }: VerificationBadgeProps) {
  const getBadgeConfig = () => {
    switch (status) {
      case 'verified':
        return {
          glow: 'shadow-[0_0_20px_rgba(0,255,225,0.4)] border-[#00ffe1]',
          text: 'text-[#00ffe1]',
          bg: 'bg-[#00ffe1]/5',
          label: 'CFTC VERIFIED NODE',
          icon: <ShieldCheck className="w-5 h-5 text-[#00ffe1]" />
        };
      case 'restricted':
        return {
          glow: 'shadow-[0_0_20px_rgba(255,0,127,0.4)] border-[#ff007f]',
          text: 'text-[#ff007f]',
          bg: 'bg-[#ff007f]/5',
          label: 'RESTRICTED COMPLIANCE SCAN',
          icon: <ShieldAlert className="w-5 h-5 text-[#ff007f]" />
        };
      default:
        return {
          glow: 'shadow-[0_0_20px_rgba(255,90,31,0.4)] border-[#ff5a1f]',
          text: 'text-[#ff5a1f]',
          bg: 'bg-[#ff5a1f]/5',
          label: 'PENDING RADAR AUDIT',
          icon: <ShieldCheck className="w-5 h-5 text-[#ff5a1f]" />
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <div className={`p-4 md:p-5 rounded-2xl border-2 flex items-center justify-between gap-4 transition-all duration-300 ${config.bg} ${config.glow}`}>
      <div className="flex items-center gap-3">
        <div className="shrink-0">
          {config.icon}
        </div>
        <div>
          <span className={`text-xs md:text-sm font-mono font-black uppercase tracking-widest block ${config.text}`}>
            {config.label}
          </span>
          <span className="text-[11px] md:text-xs font-mono font-bold text-zinc-400 block uppercase mt-0.5">
            DESK LEVEL // <span className="text-white font-extrabold">{tier}</span>
          </span>
        </div>
      </div>
      
      <div className="hidden sm:block text-right font-mono text-[9px] md:text-[10px] text-zinc-500 font-extrabold leading-tight">
        REGULATORY MATRIX // active
        <span className="block text-emerald-400">STATUS LOG: 100% SECURE</span>
      </div>
    </div>
  );
}
