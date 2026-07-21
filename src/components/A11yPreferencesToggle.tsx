import React, { useEffect, useState } from 'react';
import { Contrast, EyeOff, Settings2, X } from 'lucide-react';
import { useA11yPreferences } from '../contexts/A11yPreferencesContext';

/**
 * Mandatory WCAG control — available on every page.
 * Default keeps the neuro-optimized palette; toggles unlock high contrast
 * mid-tones and reduced sensory (less motion / glow).
 */
export default function A11yPreferencesToggle() {
  const {
    highContrast,
    reducedSensory,
    toggleHighContrast,
    toggleReducedSensory,
  } = useA11yPreferences();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="a11y-prefs-root fixed bottom-4 left-4 z-[9999] font-sans">
      {open && (
        <div
          id="a11y-prefs-dialog"
          role="dialog"
          aria-modal="false"
          aria-labelledby="a11y-prefs-title"
          className="mb-3 w-[min(100vw-2rem,288px)] rounded-2xl border border-white/15 bg-[#0a0a0a]/95 p-4 shadow-[0_8px_40px_rgba(0,0,0,0.65)] backdrop-blur-xl"
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <h2 id="a11y-prefs-title" className="text-xs font-black uppercase tracking-widest text-white">
                Display &amp; Sensory
              </h2>
              <p className="mt-1 text-[10px] leading-relaxed text-zinc-400">
                WCAG-oriented options. Default keeps ClearPath&apos;s neuro-optimized look.
              </p>
            </div>
            <button
              type="button"
              aria-label="Close accessibility settings"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-3">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 hover:border-[var(--cpt-pink)]/40">
              <input
                type="checkbox"
                checked={highContrast}
                onChange={() => toggleHighContrast()}
                className="mt-0.5 h-4 w-4 accent-[var(--cpt-pink)]"
              />
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-white">
                  <Contrast size={12} aria-hidden="true" /> High contrast
                </span>
                <span className="mt-1 block text-[10px] leading-relaxed text-zinc-400">
                  Brightens muted labels and tinted accents further for low vision.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 hover:border-[var(--cpt-orange)]/40">
              <input
                type="checkbox"
                checked={reducedSensory}
                onChange={() => toggleReducedSensory()}
                className="mt-0.5 h-4 w-4 accent-[var(--cpt-orange)]"
              />
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-white">
                  <EyeOff size={12} aria-hidden="true" /> Reduced sensory
                </span>
                <span className="mt-1 block text-[10px] leading-relaxed text-zinc-400">
                  Cuts motion, neon glow, and heavy shadows for calmer processing.
                </span>
              </span>
            </label>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="a11y-prefs-dialog"
        aria-label="Open accessibility display settings"
        className="flex h-12 items-center gap-2 rounded-full border-2 px-4 text-[10px] font-black uppercase tracking-widest shadow-lg transition-transform hover:scale-[1.02]"
        style={{
          background: 'linear-gradient(135deg, var(--cpt-pink) 0%, var(--cpt-orange) 100%)',
          color: 'var(--cpt-cta-on-pink)',
          borderColor: 'var(--cpt-orange)',
          boxShadow: '0 0 18px color-mix(in srgb, var(--cpt-orange) 45%, transparent)',
        }}
      >
        <Settings2 size={16} aria-hidden="true" />
        A11y
        {(highContrast || reducedSensory) && (
          <span className="rounded-full bg-black/25 px-1.5 py-0.5 text-[8px] text-white">ON</span>
        )}
      </button>
    </div>
  );
}
