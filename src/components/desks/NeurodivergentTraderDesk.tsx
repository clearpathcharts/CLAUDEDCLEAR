import React, { useState } from 'react';
import { ChartPlatformPanel } from '../charts/ChartPlatformPanel';
import { themeProfiles, type ThemeProfileId } from '../../lib/theme/profiles';
import { NEURODIVERGENT_BANNER } from '../../content/chooseYourPath';

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

const MODE_BLURBS: Partial<Record<ThemeProfileId, string>> = {
  calm_focus: 'Softer contrast, slower chrome, room to think.',
  low_stim_emergency: 'Lowest visual load when the screen is too much.',
  dyslexia_readable: 'Reading support for long labels and news.',
  dyscalculia_numeric_relief: 'Numbers stay large and spaced.',
  visual_processing_safe: 'Fewer competing edges and glows.',
  apd_assist: 'Less signal noise around the chart.',
  executive_function_support: 'One chart, one job, clear next step.',
  motor_friendly: 'Large targets for timeframe and search.',
  adhd_dopamine_balanced: 'Clear targets without casino motion.',
  adhd_hyperfocus: 'One job on screen at a time.',
  autism_predictable: 'Stable layout. Same places. No surprise animation.',
  tourette_tic_friendly: 'Minimal motion on the chrome.',
  standard_red_green: 'Classic red/green candles if that is what you already know.',
};

const PROFILE_STORAGE_KEY = 'clearpath_current_profile_id';

function isThemeProfileId(value: string | null): value is ThemeProfileId {
  return !!value && value in themeProfiles;
}

function readSavedThemeProfile(): ThemeProfileId {
  const fallback = isThemeProfileId(NEURODIVERGENT_BANNER.profileId)
    ? NEURODIVERGENT_BANNER.profileId
    : 'autism_predictable';
  try {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    return isThemeProfileId(saved) ? saved : fallback;
  } catch {
    return fallback;
  }
}

export default function NeurodivergentTraderDesk() {
  const [profileId, setProfileId] = useState<ThemeProfileId>(readSavedThemeProfile);
  const profile = themeProfiles[profileId];

  const selectProfile = (id: ThemeProfileId) => {
    setProfileId(id);
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-4 p-4">
      <section className="rounded-2xl border border-[#B026FF]/40 bg-black/70 p-5">
        <h2 className="text-xl font-black uppercase tracking-tight text-white">
          Built for different minds
        </h2>
        <p className="mt-2 max-w-2xl text-base font-bold leading-relaxed text-zinc-400">
          Pick a sensory profile. The chart below uses that look on this desk so we can tune each
          mode later. We also save it on this device.
        </p>
        <a
          href="/ui"
          className="mt-3 inline-block text-base font-extrabold text-[#B026FF] underline-offset-2 hover:underline"
        >
          All accessible UI modes
        </a>
      </section>

      <ul className="grid gap-3 sm:grid-cols-2">
        {PROFILE_ORDER.map((id) => {
          const mode = themeProfiles[id];
          const selected = profileId === id;
          return (
            <li key={id}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => selectProfile(id)}
                className="block h-full w-full rounded-2xl border p-4 text-left hover:bg-white/5"
                style={{
                  borderColor: selected ? mode.borderA : `${mode.borderA}66`,
                  boxShadow: selected ? `0 0 18px ${mode.borderA}44` : undefined,
                }}
              >
                <p className="text-base font-black uppercase tracking-widest" style={{ color: mode.borderA }}>
                  {mode.label}
                </p>
                <p className="mt-2 text-base font-bold leading-relaxed text-zinc-400">
                  {MODE_BLURBS[id] || 'A dedicated visual profile for this terminal.'}
                </p>
              </button>
            </li>
          );
        })}
      </ul>

      <ChartPlatformPanel
        variant="neurodivergent"
        profileId={profileId}
        accent={profile.borderA}
        heading="Your chart"
        description={`Live candles in ${profile.label}. Search a market, pick a timeframe, then switch profiles above to try another look.`}
        searchPlaceholder="Search AAPL, EURUSD, gold…"
      />
    </div>
  );
}
