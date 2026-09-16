import React, { useId, useMemo, useRef } from 'react';
import {
  COLOR_CHART_GRAYS,
  COLOR_CHART_HUE_GRID,
  COLOR_CHART_PRESETS,
  DESK_COLOR_TARGETS,
  DESK_COLOR_TARGET_META,
  isPlotColorTarget,
  neuroPastelSwatches,
  type DeskColorOverrides,
  type DeskColorTarget,
} from '../../lib/deskColorChart';

function formatSavedAt(iso: string): string {
  if (iso === 'device-local') return 'already on this device';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

function savedSlots(overrides: DeskColorOverrides): string[] {
  return DESK_COLOR_TARGETS.filter((id) => overrides[id]).map((id) => DESK_COLOR_TARGET_META[id].label);
}

type Props = {
  target: DeskColorTarget;
  onTargetChange: (target: DeskColorTarget) => void;
  selected?: string | null;
  recents?: string[];
  opacity: number;
  onPick: (hex: string) => void;
  onOpacity: (value: number) => void;
  onReset: () => void;
  onSave: () => void;
  onSaveAll: () => void;
  onDiscard: () => void;
  isDirty: boolean;
  savedAt?: string | null;
  lastSaveScope?: 'desk' | 'all' | null;
  overrides?: DeskColorOverrides;
  deskLabel: string;
  showPastels?: boolean;
  noPlotOnDesk?: boolean;
};

function Swatch({
  hex,
  selected,
  onPick,
  label,
}: {
  hex: string;
  selected: boolean;
  onPick: (hex: string) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      title={hex}
      aria-label={label || hex}
      aria-pressed={selected}
      onClick={() => onPick(hex)}
      className="color-chart-swatch"
      style={{
        background: hex,
        boxShadow: selected ? '0 0 0 2px #111, 0 0 0 4px #fff' : 'inset 0 0 0 1px rgba(255,255,255,0.12)',
      }}
    />
  );
}

export default function ColorChartPicker({
  target,
  onTargetChange,
  selected,
  recents = [],
  opacity,
  onPick,
  onOpacity,
  onReset,
  onSave,
  onSaveAll,
  onDiscard,
  isDirty,
  savedAt,
  lastSaveScope,
  overrides = {},
  deskLabel,
  showPastels = false,
  noPlotOnDesk = false,
}: Props) {
  const fileId = useId();
  const customRef = useRef<HTMLInputElement | null>(null);
  const meta = DESK_COLOR_TARGET_META[target];
  const showOpacity = meta.appliesOpacity;
  const match = (hex: string) => !!selected && selected.toUpperCase() === hex.toUpperCase();

  const grid = useMemo(() => COLOR_CHART_HUE_GRID, []);

  return (
    <div data-color-chart className="color-chart" role="region" aria-label={`${deskLabel} color chart`}>
      <div className="color-chart-tabs" role="tablist" aria-label="Color target">
        {DESK_COLOR_TARGETS.map((id) => {
          const on = id === target;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={on}
              data-color-target={id}
              onClick={() => onTargetChange(id)}
              className="color-chart-tab"
              style={{
                color: on ? '#fff' : '#a1a1aa',
                borderColor: on ? '#fff' : 'rgba(255,255,255,0.16)',
                background: on ? 'rgba(255,255,255,0.12)' : 'transparent',
              }}
            >
              {DESK_COLOR_TARGET_META[id].label}
            </button>
          );
        })}
        <button type="button" className="color-chart-reset" onClick={onReset}>
          Reset desk
        </button>
      </div>

      <p className="color-chart-hint">
        {deskLabel} · {meta.hint}
        {selected ? ` · ${selected}` : ''}
      </p>

      {noPlotOnDesk && isPlotColorTarget(target) ? (
        <p className="color-chart-warn" data-color-chart-no-plot>
          This desk has no price plot. Save still keeps the color. Use Save to all desks to paint
          charts, candles, and indicators on Retail, Institutional, and Neurodivergent.
        </p>
      ) : null}

      <div className="color-chart-savebar" data-color-chart-savebar>
        <button
          type="button"
          data-color-chart-save
          className="color-chart-save"
          disabled={!isDirty}
          onClick={onSave}
        >
          Save colors
        </button>
        <button
          type="button"
          data-color-chart-save-all
          className="color-chart-save-all"
          onClick={onSaveAll}
        >
          Save to all desks
        </button>
        <button
          type="button"
          data-color-chart-discard
          className="color-chart-discard"
          disabled={!isDirty}
          onClick={onDiscard}
        >
          Discard
        </button>
        <p className="color-chart-save-status" data-color-chart-save-status>
          {isDirty
            ? 'Unsaved changes — preview only until you save'
            : lastSaveScope === 'all'
              ? 'Saved to all four desks on this device'
              : savedAt
                ? `Saved on this device · ${formatSavedAt(savedAt)}`
                : 'No saved colors on this desk yet'}
        </p>
      </div>

      {savedSlots(overrides).length ? (
        <p className="color-chart-slots" data-color-chart-slots>
          Saved slots: {savedSlots(overrides).join(' · ')}
        </p>
      ) : null}

      <div className="color-chart-panel">
        <div className="color-chart-row" role="listbox" aria-label="Grayscale">
          {COLOR_CHART_GRAYS.map((hex) => (
            <Swatch key={`g-${hex}`} hex={hex} selected={match(hex)} onPick={onPick} label={`Gray ${hex}`} />
          ))}
        </div>

        {showPastels ? (
          <div className="color-chart-row color-chart-pastels" role="listbox" aria-label="Soft pastels">
            {neuroPastelSwatches().map((hex) => (
              <Swatch key={`pastel-${hex}`} hex={hex} selected={match(hex)} onPick={onPick} label={`Pastel ${hex}`} />
            ))}
          </div>
        ) : null}

        <div className="color-chart-grid" role="listbox" aria-label="Hue chart">
          {grid.map((row, ri) => (
            <div key={`row-${ri}`} className="color-chart-row">
              {row.map((hex) => (
                <Swatch
                  key={`${ri}-${hex}`}
                  hex={hex}
                  selected={match(hex)}
                  onPick={onPick}
                  label={`Hue ${hex}`}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="color-chart-divider" aria-hidden="true" />

        <div className="color-chart-row color-chart-presets" role="listbox" aria-label="Preset and recent colors">
          {COLOR_CHART_PRESETS.map((hex) => (
            <Swatch key={`p-${hex}`} hex={hex} selected={match(hex)} onPick={onPick} label={`Preset ${hex}`} />
          ))}
          <label className="color-chart-add" htmlFor={fileId} title="Custom color">
            <span aria-hidden="true">+</span>
            <input
              id={fileId}
              ref={customRef}
              type="color"
              value={selected && /^#[0-9A-Fa-f]{6}$/.test(selected) ? selected : '#FF1744'}
              aria-label="Custom color"
              onChange={(e) => onPick(e.target.value)}
            />
          </label>
        </div>

        {recents.length ? (
          <div className="color-chart-row color-chart-recents" role="listbox" aria-label="Recent colors">
            {recents.map((hex) => (
              <Swatch key={`recent-${hex}`} hex={hex} selected={match(hex)} onPick={onPick} label={`Recent ${hex}`} />
            ))}
          </div>
        ) : null}

        {showOpacity ? (
          <label className="color-chart-opacity">
            <span>Opacity</span>
            <input
              type="range"
              min={10}
              max={100}
              step={1}
              value={opacity}
              aria-valuemin={10}
              aria-valuemax={100}
              aria-valuenow={opacity}
              onChange={(e) => onOpacity(Number(e.target.value))}
            />
            <span className="color-chart-opacity-val">{opacity}%</span>
          </label>
        ) : (
          <p className="color-chart-opacity-note">Opacity applies to background and bento fills.</p>
        )}
      </div>
    </div>
  );
}
