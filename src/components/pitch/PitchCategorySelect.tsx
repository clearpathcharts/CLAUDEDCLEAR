import React from 'react';
import { PITCH_CATEGORIES, pitchHref, type PitchSlideId } from '../../pitch/pitchDeckData';

export function PitchCategorySelect({
  value,
  onChange,
  className = '',
}: {
  value: PitchSlideId;
  onChange?: (id: PitchSlideId) => void;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#BF00FF]/80">
        Pitch categories
      </span>
      <select
        value={value}
        onChange={(e) => {
          const id = e.target.value as PitchSlideId;
          if (onChange) onChange(id);
          else window.location.assign(pitchHref(id));
        }}
        className="rounded-xl border border-[#BF00FF]/40 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-[#FF1493] focus:ring-1 focus:ring-[#FF1493]/50"
      >
        {PITCH_CATEGORIES.map((c) => (
          <option key={c.id} value={c.id} className="bg-[#0a0a0f]">
            {c.menuLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
