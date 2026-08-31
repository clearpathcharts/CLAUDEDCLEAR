/**
 * Shared TradingView-style color chart for all four trader desks.
 * Users paint background, chart plot, candles, indicators, and bento panels.
 */

import type { TraderDeskId } from './traderDesks';

export const DESK_COLOR_CHART_STORAGE_KEY = 'clearpath_desk_color_chart_v1';
export const DESK_COLOR_CHART_EVENT = 'clearpath-desk-color-chart';

export const DESK_COLOR_TARGETS = [
  'background',
  'chart',
  'candleUp',
  'candleDown',
  'indicator',
  'bento',
] as const;

export type DeskColorTarget = (typeof DESK_COLOR_TARGETS)[number];

export const DESK_COLOR_TARGET_META: Record<
  DeskColorTarget,
  { label: string; hint: string; appliesOpacity: boolean }
> = {
  background: {
    label: 'Background',
    hint: 'Desk paper behind every panel',
    appliesOpacity: true,
  },
  chart: {
    label: 'Chart',
    hint: 'Price-plot fill, grid, and scale',
    appliesOpacity: false,
  },
  candleUp: {
    label: 'Candle ↑',
    hint: 'Bullish body, wick, and border',
    appliesOpacity: false,
  },
  candleDown: {
    label: 'Candle ↓',
    hint: 'Bearish body, wick, and border',
    appliesOpacity: false,
  },
  indicator: {
    label: 'Indicators',
    hint: 'Every overlay and oscillator on the plot',
    appliesOpacity: false,
  },
  bento: {
    label: 'Bento',
    hint: 'Panel cards, headers, and container fill',
    appliesOpacity: true,
  },
};

export type DeskColorOverrides = Partial<Record<DeskColorTarget, string>> & {
  opacity?: number;
};

export type DeskColorChartStore = {
  desks: Partial<Record<TraderDeskId, DeskColorOverrides>>;
  recents: string[];
  savedAt?: Partial<Record<TraderDeskId, string>>;
};

export const PLOT_COLOR_TARGETS: readonly DeskColorTarget[] = [
  'chart',
  'candleUp',
  'candleDown',
  'indicator',
];

export function isPlotColorTarget(value: DeskColorTarget): boolean {
  return (PLOT_COLOR_TARGETS as readonly string[]).includes(value);
}

export function normalizeOverrides(slots: DeskColorOverrides | undefined): DeskColorOverrides {
  if (!slots) return {};
  const out: DeskColorOverrides = {};
  for (const key of DESK_COLOR_TARGETS) {
    const hex = normalizeHex(slots[key]);
    if (hex) out[key] = hex;
  }
  if (slots.opacity != null) out.opacity = clampOpacity(slots.opacity);
  return out;
}

export function overridesEqual(a: DeskColorOverrides | undefined, b: DeskColorOverrides | undefined): boolean {
  return JSON.stringify(normalizeOverrides(a)) === JSON.stringify(normalizeOverrides(b));
}

export function cloneStore(store: DeskColorChartStore): DeskColorChartStore {
  return {
    desks: { ...store.desks },
    recents: [...store.recents],
    savedAt: store.savedAt ? { ...store.savedAt } : {},
  };
}

export function stampDeskSavedAt(
  store: DeskColorChartStore,
  deskId: TraderDeskId,
  when: string = new Date().toISOString(),
): DeskColorChartStore {
  return {
    ...store,
    savedAt: { ...(store.savedAt || {}), [deskId]: when },
  };
}

export function copyDeskColorsToAll(
  store: DeskColorChartStore,
  fromDesk: TraderDeskId,
  when: string = new Date().toISOString(),
): DeskColorChartStore {
  const src = normalizeOverrides(store.desks[fromDesk]);
  const desks: DeskColorChartStore['desks'] = { ...store.desks };
  const savedAt: NonNullable<DeskColorChartStore['savedAt']> = { ...(store.savedAt || {}) };
  for (const id of ['institutional', 'fundamental', 'retail', 'neurodivergent'] as const) {
    desks[id] = { ...src };
    savedAt[id] = when;
  }
  return { ...store, desks, savedAt };
}

/** 10-stop grayscale row — white → black, matching the chart screenshot. */
export const COLOR_CHART_GRAYS: readonly string[] = [
  '#FFFFFF',
  '#F2F2F2',
  '#D9D9D9',
  '#BFBFBF',
  '#A6A6A6',
  '#8C8C8C',
  '#737373',
  '#595959',
  '#404040',
  '#000000',
];

/** Hue columns left → right: red, orange, yellow, green, teal, sky, royal, purple, magenta, pink. */
export const COLOR_CHART_HUES = [0, 24, 48, 120, 168, 195, 220, 265, 295, 330] as const;

/**
 * Saturation / lightness rows for the 8×10 hue grid.
 * Row 0 = peak saturated (screenshot selection row).
 * Rows 1–3 = pastel tints (neurodivergent-friendly).
 * Rows 4–7 = deepening shades.
 */
export const COLOR_CHART_ROW_SL: readonly { s: number; l: number }[] = [
  { s: 92, l: 54 },
  { s: 42, l: 90 },
  { s: 50, l: 82 },
  { s: 60, l: 72 },
  { s: 80, l: 40 },
  { s: 82, l: 30 },
  { s: 78, l: 20 },
  { s: 70, l: 12 },
];

/** High-vibrancy preset row from the screenshot (plus-button adds custom). */
export const COLOR_CHART_PRESETS: readonly string[] = [
  '#00E5FF',
  '#FF2D95',
  '#39FF14',
  '#FF1744',
  '#D500F9',
  '#FFAB00',
  '#3D5AFE',
  '#7C4DFF',
  '#2962FF',
];

export function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const light = l / 100;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = light - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

export function buildHueGrid(): string[][] {
  return COLOR_CHART_ROW_SL.map((row) => COLOR_CHART_HUES.map((h) => hslToHex(h, row.s, row.l)));
}

export const COLOR_CHART_HUE_GRID: readonly (readonly string[])[] = buildHueGrid();

export function normalizeHex(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(t)) return t.toUpperCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(t)) {
    return `#${t[1]}${t[1]}${t[2]}${t[2]}${t[3]}${t[3]}`.toUpperCase();
  }
  return null;
}

export function hexToRgba(hex: string, alpha: number): string {
  const n = normalizeHex(hex);
  if (!n) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(n.slice(1, 3), 16);
  const g = parseInt(n.slice(3, 5), 16);
  const b = parseInt(n.slice(5, 7), 16);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r},${g},${b},${a})`;
}

export function clampOpacity(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 100;
  return Math.max(10, Math.min(100, Math.round(n)));
}

export function isDeskColorTarget(value: unknown): value is DeskColorTarget {
  return typeof value === 'string' && (DESK_COLOR_TARGETS as readonly string[]).includes(value);
}

export function emptyStore(): DeskColorChartStore {
  return { desks: {}, recents: [], savedAt: {} };
}

export function parseDeskColorChartStore(raw: unknown): DeskColorChartStore {
  const out = emptyStore();
  if (!raw || typeof raw !== 'object') return out;
  const rec = raw as { desks?: unknown; recents?: unknown; savedAt?: unknown };
  if (rec.desks && typeof rec.desks === 'object') {
    for (const [desk, slots] of Object.entries(rec.desks as Record<string, unknown>)) {
      if (!slots || typeof slots !== 'object') continue;
      const next: DeskColorOverrides = {};
      for (const [key, val] of Object.entries(slots as Record<string, unknown>)) {
        if (key === 'opacity') {
          next.opacity = clampOpacity(val);
          continue;
        }
        if (!isDeskColorTarget(key)) continue;
        const hex = normalizeHex(typeof val === 'string' ? val : null);
        if (hex) next[key] = hex;
      }
      out.desks[desk as TraderDeskId] = next;
    }
  }
  if (Array.isArray(rec.recents)) {
    const seen = new Set<string>();
    for (const item of rec.recents) {
      const hex = normalizeHex(typeof item === 'string' ? item : null);
      if (!hex || seen.has(hex)) continue;
      seen.add(hex);
      out.recents.push(hex);
      if (out.recents.length >= 9) break;
    }
  }
  if (rec.savedAt && typeof rec.savedAt === 'object') {
    out.savedAt = {};
    for (const [desk, stamp] of Object.entries(rec.savedAt as Record<string, unknown>)) {
      if (typeof stamp === 'string' && stamp.trim()) out.savedAt[desk as TraderDeskId] = stamp;
    }
  }
  return out;
}

export function loadDeskColorChartStore(): DeskColorChartStore {
  try {
    const raw = localStorage.getItem(DESK_COLOR_CHART_STORAGE_KEY);
    if (!raw) return emptyStore();
    return parseDeskColorChartStore(JSON.parse(raw));
  } catch {
    return emptyStore();
  }
}

export function saveDeskColorChartStore(store: DeskColorChartStore): void {
  try {
    localStorage.setItem(DESK_COLOR_CHART_STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* quota / private mode */
  }
}

export function broadcastDeskColorChart(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(DESK_COLOR_CHART_EVENT));
  }
}

export function pushRecentColor(recents: string[], hex: string): string[] {
  const n = normalizeHex(hex);
  if (!n) return recents;
  return [n, ...recents.filter((c) => c !== n)].slice(0, 9);
}

export function setDeskColorOverride(
  store: DeskColorChartStore,
  deskId: TraderDeskId,
  target: DeskColorTarget,
  color: string,
): DeskColorChartStore {
  const hex = normalizeHex(color);
  if (!hex) return store;
  const prev = store.desks[deskId] || {};
  return {
    desks: { ...store.desks, [deskId]: { ...prev, [target]: hex } },
    recents: pushRecentColor(store.recents, hex),
  };
}

export function setDeskColorOpacity(
  store: DeskColorChartStore,
  deskId: TraderDeskId,
  opacity: number,
): DeskColorChartStore {
  const prev = store.desks[deskId] || {};
  return {
    ...store,
    desks: { ...store.desks, [deskId]: { ...prev, opacity: clampOpacity(opacity) } },
  };
}

export function clearDeskColorOverrides(
  store: DeskColorChartStore,
  deskId: TraderDeskId,
): DeskColorChartStore {
  if (!store.desks[deskId]) return store;
  const desks = { ...store.desks };
  delete desks[deskId];
  return { ...store, desks };
}

export function resolveDeskOverrides(
  store: DeskColorChartStore,
  deskId: TraderDeskId,
): DeskColorOverrides {
  return store.desks[deskId] || {};
}

export type DeskVisualPaint = {
  chart?: string;
  text?: string;
  grid?: string;
  candleUp?: string;
  candleDown?: string;
  indicator?: string;
};

export function resolveDeskVisualPaint(overrides: DeskColorOverrides): DeskVisualPaint {
  const paint: DeskVisualPaint = {};
  if (overrides.chart) {
    paint.chart = overrides.chart;
    paint.text = luminanceText(overrides.chart);
    paint.grid = hexToRgba(luminanceText(overrides.chart), 0.18);
  }
  if (overrides.candleUp) paint.candleUp = overrides.candleUp;
  if (overrides.candleDown) paint.candleDown = overrides.candleDown;
  if (overrides.indicator) paint.indicator = overrides.indicator;
  return paint;
}

/** Contrast-aware label color for a solid fill. */
export function luminanceText(hex: string): string {
  const n = normalizeHex(hex);
  if (!n) return '#F8FAFC';
  const r = parseInt(n.slice(1, 3), 16) / 255;
  const g = parseInt(n.slice(3, 5), 16) / 255;
  const b = parseInt(n.slice(5, 7), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return L > 0.45 ? '#111111' : '#F8FAFC';
}

export function deskCssVars(overrides: DeskColorOverrides): Record<string, string> {
  const opacity = clampOpacity(overrides.opacity ?? 100) / 100;
  const vars: Record<string, string> = {
    '--desk-user-opacity': String(opacity),
  };
  if (overrides.background) {
    vars['--desk-user-bg'] = hexToRgba(overrides.background, opacity);
    vars['--desk-user-bg-solid'] = overrides.background;
  }
  if (overrides.bento) {
    vars['--desk-user-bento'] = overrides.bento;
    vars['--desk-user-bento-fill'] = hexToRgba(overrides.bento, opacity);
    vars['--desk-panel'] = hexToRgba(overrides.bento, opacity);
    vars['--desk-border'] = hexToRgba(overrides.bento, Math.min(1, opacity + 0.15));
    vars['--desk-cyan'] = overrides.bento;
  }
  if (overrides.indicator) {
    vars['--desk-user-indicator'] = overrides.indicator;
  }
  if (overrides.candleUp) vars['--desk-user-candle-up'] = overrides.candleUp;
  if (overrides.candleDown) vars['--desk-user-candle-down'] = overrides.candleDown;
  if (overrides.chart) vars['--desk-user-chart'] = overrides.chart;
  return vars;
}

/** Soft pastels from hue-grid rows 1–2 — default suggestion for neurodivergent desks. */
export function neuroPastelSwatches(): string[] {
  const row1 = COLOR_CHART_HUE_GRID[1] || [];
  const row2 = COLOR_CHART_HUE_GRID[2] || [];
  return [...row1.slice(0, 5), ...row2.slice(5, 10)];
}
