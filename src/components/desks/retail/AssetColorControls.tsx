import React from 'react';
import {
  RAINBOW_PRESETS,
  type AssetColorSlots,
  type AssetColorMap,
  resolveAssetColors,
  setAssetColorSlot,
  clearAssetColors,
  saveAssetColorMap,
  broadcastAssetColors,
} from '../../../lib/assetColorPrefs';

const SLOTS: { id: keyof AssetColorSlots; label: string }[] = [
  { id: 'asset', label: 'Asset' },
  { id: 'font', label: 'Font' },
  { id: 'number', label: 'Numerology' },
];

type Props = {
  symbol: string;
  map: AssetColorMap;
  onChange: (next: AssetColorMap) => void;
  compact?: boolean;
};

/**
 * Full rainbow color controls for one Venture asset (NVDA, MSFT, …).
 * Native color input = any hue; presets for one-tap rainbow picks.
 */
export function AssetColorControls({ symbol, map, onChange, compact = false }: Props) {
  const colors = resolveAssetColors(map, symbol);

  const commit = (next: AssetColorMap) => {
    saveAssetColorMap(next);
    broadcastAssetColors();
    onChange(next);
  };

  return (
    <div
      data-asset-color-controls
      className={`rounded-lg border border-[var(--desk-border)] bg-black/30 ${compact ? 'p-2' : 'p-3'}`}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-black uppercase tracking-[0.14em] text-[var(--desk-pink)]">
          Colors · {symbol}
        </p>
        <button
          type="button"
          className="text-sm font-black uppercase tracking-wider text-[var(--desk-muted)] hover:text-[var(--desk-text)]"
          onClick={() => commit(clearAssetColors(map, symbol))}
        >
          Reset
        </button>
      </div>
      <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'}`}>
        {SLOTS.map((slot) => {
          const slotId = slot.id;
          const value = colors[slotId];
          return (
          <label key={slotId} className="block min-w-0">
            <span className="mb-1 block text-sm font-black uppercase tracking-wider text-[var(--desk-muted)]">
              {slot.label}
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={value}
                aria-label={`${symbol} ${slot.label} color`}
                onChange={(e) =>
                  commit(setAssetColorSlot(map, symbol, slotId, e.target.value))
                }
                className="h-9 w-12 cursor-pointer rounded border border-white/20 bg-transparent p-0.5"
              />
              <input
                type="text"
                value={value}
                spellCheck={false}
                aria-label={`${symbol} ${slot.label} hex`}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (/^#[0-9A-Fa-f]{6}$/.test(v) || /^#[0-9A-Fa-f]{3}$/.test(v)) {
                    commit(setAssetColorSlot(map, symbol, slotId, v));
                  }
                }}
                className="min-w-0 flex-1 rounded border border-[var(--desk-border)] bg-black/40 px-2 py-1.5 font-mono text-sm text-[var(--desk-text)]"
              />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1" role="listbox" aria-label={`${slot.label} rainbow`}>
              {RAINBOW_PRESETS.map((hex) => (
                <button
                  key={`${slotId}-${hex}`}
                  type="button"
                  title={hex}
                  aria-label={`${slot.label} ${hex}`}
                  onClick={() => commit(setAssetColorSlot(map, symbol, slotId, hex))}
                  className="h-5 w-5 rounded-full border border-white/25"
                  style={{
                    background: hex,
                    outline: value.toUpperCase() === hex.toUpperCase() ? '2px solid #fff' : undefined,
                  }}
                />
              ))}
            </div>
          </label>
          );
        })}
      </div>
      <p className="mt-2 text-sm font-bold text-[var(--desk-muted)]">
        Pick any color — presets are shortcuts. Saved on this device for each asset.
      </p>
    </div>
  );
}
