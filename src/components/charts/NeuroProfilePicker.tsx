import React from 'react';
import { Brain, Zap } from 'lucide-react';
import { themeProfiles, type ThemeProfileId } from '../../lib/theme/profiles';

const PROFILE_ORDER: ThemeProfileId[] = [
  'calm_focus',
  'low_stim_emergency',
  'dyslexia_readable',
  'dyscalculia_numeric_relief',
  'visual_processing_safe',
  'apd_assist',
  'executive_function_support',
  'motor_friendly',
  'adhd_dopamine_balanced',
  'adhd_hyperfocus',
  'autism_predictable',
  'tourette_tic_friendly',
  'standard_red_green',
];

interface NeuroProfilePickerProps {
  activeProfileId: string;
  onProfileChange: (profileId: ThemeProfileId) => void;
  compact?: boolean;
}

/** Neuro-adaptive chart profile switcher — restores per-profile chart theming on CHARTS. */
export function NeuroProfilePicker({ activeProfileId, onProfileChange, compact = false }: NeuroProfilePickerProps) {
  return (
    <div
      className={`rounded-2xl border-2 border-[#FF1493]/50 bg-black/80 backdrop-blur-md shadow-[0_0_32px_rgba(255,20,147,0.25),0_0_48px_rgba(255,69,0,0.15)] ${
        compact ? 'p-3' : 'p-4 md:p-5'
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#FF4500]/30 pb-3">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-[#FF1493] drop-shadow-[0_0_8px_#FF1493]" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-[#FF0080] via-[#FF4500] to-[#BF00FF]">
            Neuro-Adaptive Chart Profiles
          </span>
        </div>
        <span className="flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider text-[#00E5FF]">
          <Zap size={10} className="animate-pulse" />
          Live on every chart
        </span>
      </div>

      <div className={`grid gap-2 ${compact ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
        {PROFILE_ORDER.map((id) => {
          const p = themeProfiles[id];
          const isActive = activeProfileId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onProfileChange(id)}
              className={`rounded-xl border px-2 py-2.5 text-left transition-all duration-200 active:scale-[0.98] ${
                isActive
                  ? 'border-[#FF1493] bg-gradient-to-br from-[#FF1493]/25 via-[#FF4500]/15 to-[#BF00FF]/20 text-white shadow-[0_0_20px_rgba(255,20,147,0.45)]'
                  : 'border-white/10 bg-black/50 text-zinc-400 hover:border-[#FF4500]/50 hover:text-white hover:shadow-[0_0_12px_rgba(255,69,0,0.25)]'
              }`}
              style={
                isActive
                  ? {
                      boxShadow: `0 0 18px ${p.borderA}55, 0 0 28px ${p.borderB}33`,
                      borderColor: p.borderA,
                    }
                  : undefined
              }
            >
              <span
                className="block text-[9px] font-black uppercase tracking-wide leading-tight"
                style={{ color: isActive ? p.borderA : undefined }}
              >
                {p.label}
              </span>
              <span className="mt-0.5 block truncate text-[8px] font-mono uppercase text-zinc-500">
                {id.replace(/_/g, ' ')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
