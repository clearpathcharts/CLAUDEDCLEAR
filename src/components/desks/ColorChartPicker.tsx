import React, { useId, useMemo, useRef, useState } from 'react';
import {
  COLOR_CHART_GRAYS,
  COLOR_CHART_HUE_GRID,
  COLOR_CHART_PRESETS,
  COLOR_CHART_SWATCH_COUNT,
  DESK_COLOR_TARGETS,
  DESK_COLOR_TARGET_META,
  hslToHex,
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

function HueMoon({
  hue,
  onHue,
}: {
  hue: number;
  onHue: (hue: number) => void;
}) {
  const pick = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    if (x * x + y * y < (r.width * 0.18) ** 2) return;
    const angle = (Math.atan2(y, x) * 180) / Math.PI;
    onHue((angle + 360 + 90) % 360);
  };
  return (
    <button
      type="button"
      data-color-chart-moon
      aria-label="Full rainbow hue moon"
      title="Full rainbow — same 24-bit range as TradingView, NinjaTrader, and Bloomberg"
      onPointerDown={pick}
      onPointerMove={(e) => {
        if (e.buttons) pick(e);
      }}
      className="color-chart-moon"
      style={{
        background: `conic-gradient(from 0deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080, #ff0000)`,
        boxShadow: `inset 0 0 0 18px transparent, 0 0 0 2px ${hslToHex(hue, 92, 54)}`,
      }}
    >
      <span className="color-chart-moon-core" style={{ background: hslToHex(hue, 92, 54) }} />
    </button>
  );
}

function SaturationSquare({
  hue,
  sat,
  light,
  onPick,
}: {
  hue: number;
  sat: number;
  light: number;
  onPick: (hex: string) => void;
}) {
  const pick = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    const s = Math.round(x * 100);
    const l = Math.round((1 - y) * 88 + 6);
    onPick(hslToHex(hue, s, l));
  };
  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label="Saturation and brightness square"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={sat}
      data-color-chart-square
      className="color-chart-square"
      onPointerDown={pick}
      onPointerMove={(e) => {
        if (e.buttons) pick(e);
      }}
      style={{
        background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hslToHex(hue, 100, 50)})`,
      }}
    >
      <span
        className="color-chart-square-dot"
        style={{ left: `${sat}%`, top: `${100 - ((light - 6) / 88) * 100}%` }}
      />
    </div>
  );
}

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
  const [wheelHue, setWheelHue] = useState(0);
  const [wheelSat, setWheelSat] = useState(92);
  const [wheelLight, setWheelLight] = useState(54);
  const meta = DESK_COLOR_TARGET_META[target];
  const showOpacity = meta.appliesOpacity;
  const match = (hex: string) => !!selected && selected.toUpperCase() === hex.toUpperCase();

  const grid = useMemo(() => COLOR_CHART_HUE_GRID, []);
  const pickFromWheel = (hex: string) => {
    onPick(hex);
  };
  const pickHue = (hue: number) => {
    setWheelHue(hue);
    pickFromWheel(hslToHex(hue, wheelSat, wheelLight));
  };
  const pickSquare = (hex: string) => {
    setWheelSat(92);
    pickFromWheel(hex);
  };

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
        <p className="color-chart-count" data-color-chart-count>
          {COLOR_CHART_SWATCH_COUNT} named colors · full 24-bit moon — TradingView, NinjaTrader, Bloomberg
        </p>
        <div className="color-chart-spectrum">
          <HueMoon hue={wheelHue} onHue={pickHue} />
          <SaturationSquare
            hue={wheelHue}
            sat={wheelSat}
            light={wheelLight}
            onPick={(hex) => {
              setWheelSat(80);
              setWheelLight(48);
              pickSquare(hex);
            }}
          />
        </div>

        <div className="color-chart-row color-chart-grays" role="listbox" aria-label="Grayscale">
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
