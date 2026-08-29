import React from 'react';
import { advancedProfiles, type AdvancedProfileId } from '../../lib/advanced/profiles';
import { navigateToDesk } from '../../lib/traderDesks';

const MODE_BLURBS: Partial<Record<AdvancedProfileId, string>> = {
  calm_focus: 'Softer contrast, slower chrome, room to think.',
  low_stim_emergency: 'Lowest visual load when the screen is too much.',
  dyslexia_readable: 'Reading support for long labels and news.',
  adhd_dopamine_balanced: 'Clear targets without casino motion.',
  adhd_hyperfocus: 'One job on screen at a time.',
  autism_predictable: 'Stable layout. Same places. No surprise animation.',
  standard_red_green: 'Classic red/green candles if that is what you already know.',
};

function applyProfile(profileId: AdvancedProfileId) {
  try {
    localStorage.setItem('clearpath_current_profile_id', profileId);
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('clearpath-set-profile', { detail: profileId }));
  }
}

/**
 * Sensory profile picker for the Neurodivergent desk.
 * Applies the profile in-app (no hard navigation to /?profile=…) so a logged-in
 * session is not torn down by a full document reload into Auth/Dashboard.
 */
export default function NeurodivergentTraderDesk() {
  const modes = Object.values(advancedProfiles);

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-4 p-4" data-neuro-door>
      <section className="rounded-2xl border border-[#B026FF]/40 bg-black/70 p-5">
        <h2 className="text-xl font-black uppercase tracking-tight text-white">
          Built for different minds
        </h2>
        <p className="mt-2 max-w-2xl text-base font-bold leading-relaxed text-zinc-400">
          Pick a sensory profile. We save it on this device and open the Retail chart with that look.
          Full catalog of modes lives on the accessible UI page.
        </p>
        <a
          href="/ui"
          className="mt-3 inline-block text-base font-extrabold text-[#B026FF] underline-offset-2 hover:underline"
        >
          All accessible UI modes
        </a>
      </section>

      <ul className="grid gap-3 sm:grid-cols-2">
        {modes.map((profile) => (
          <li key={profile.id}>
            <button
              type="button"
              className="block h-full w-full rounded-2xl border p-4 text-left hover:bg-white/5"
              style={{ borderColor: `${profile.borderA}66` }}
              onClick={() => {
                applyProfile(profile.id);
                // Open the retail chart workstation with this look — stay in the SPA.
                navigateToDesk('retail');
              }}
            >
              <p className="text-base font-black uppercase tracking-widest" style={{ color: profile.borderA }}>
                {profile.name}
              </p>
              <p className="mt-2 text-base font-bold leading-relaxed text-zinc-400">
                {MODE_BLURBS[profile.id] || 'A dedicated visual profile for this terminal.'}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
