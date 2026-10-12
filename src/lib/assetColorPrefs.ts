/**
 * Per-asset rainbow color preferences (device-local).
 * Venture registry symbols (NVDA, MSFT, …) stay identity-only;
 * users pick font / asset label / numerology (number) colors freely.
 */

export type AssetColorSlots = {
  /** Symbol / ticker label color */
  asset: string;
  /** General label / caption font color */
  font: string;
  /** Price & numeric readouts (“numerology”) */
  number: string;
};

export type AssetColorMap = Record<string, Partial<AssetColorSlots>>;

export const ASSET_COLOR_STORAGE_KEY = 'clearpath_asset_colors_v1';

/** Full rainbow presets — still free to pick any hex via native color input. */
export const RAINBOW_PRESETS: string[] = [
  '#FF0000',
  '#FF1493',
  '#FF2D55',
  '#FF6B00',
  '#FFD60A',
  '#FFCC00',
  '#39FF14',
  '#00FF9C',
  '#00E5FF',
  '#00FFFF',
  '#3B82F6',
  '#2962FF',
  '#6366F1',
  '#7C4DFF',
  '#A855F7',
  '#BF00FF',
  '#D500F9',
  '#FFFFFF',
  '#8C8C8C',
  '#000000',
];

export const DEFAULT_ASSET_COLORS: AssetColorSlots = {
  asset: '#F5F3FF',
  font: '#A1A1AA',
  number: '#E9D5FF',
};

function normalizeHex(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(t)) return t.toUpperCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(t)) {
    const r = t[1];
    const g = t[2];
    const b = t[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return null;
}

export function loadAssetColorMap(): AssetColorMap {
  try {
    const raw = localStorage.getItem(ASSET_COLOR_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as AssetColorMap;
    if (!parsed || typeof parsed !== 'object') return {};
    const out: AssetColorMap = {};
    for (const [sym, slots] of Object.entries(parsed)) {
      if (!slots || typeof slots !== 'object') continue;
      const key = sym.trim().toUpperCase();
      if (!key) continue;
      out[key] = {
        asset: normalizeHex(slots.asset) ?? undefined,
        font: normalizeHex(slots.font) ?? undefined,
        number: normalizeHex(slots.number) ?? undefined,
      };
    }
    return out;
  } catch {
    return {};
  }
}

export function saveAssetColorMap(map: AssetColorMap): void {
  try {
    localStorage.setItem(ASSET_COLOR_STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* quota / private mode */
  }
}

export function resolveAssetColors(
  map: AssetColorMap,
  symbol: string | null | undefined,
): AssetColorSlots {
  const key = (symbol || '').trim().toUpperCase();
  const row = key ? map[key] : undefined;
  return {
    asset: normalizeHex(row?.asset) || DEFAULT_ASSET_COLORS.asset,
    font: normalizeHex(row?.font) || DEFAULT_ASSET_COLORS.font,
    number: normalizeHex(row?.number) || DEFAULT_ASSET_COLORS.number,
  };
}

export function setAssetColorSlot(
  map: AssetColorMap,
  symbol: string,
  slot: keyof AssetColorSlots,
  color: string,
): AssetColorMap {
  const key = symbol.trim().toUpperCase();
  if (!key) return map;
  const hex = normalizeHex(color);
  if (!hex) return map;
  const prev = map[key] || {};
  return { ...map, [key]: { ...prev, [slot]: hex } };
}

export function clearAssetColors(map: AssetColorMap, symbol: string): AssetColorMap {
  const key = symbol.trim().toUpperCase();
  if (!key || !map[key]) return map;
  const next = { ...map };
  delete next[key];
  return next;
}

export function subscribeAssetColors(onChange: () => void): () => void {
  const handler = (e: Event) => {
    if (e instanceof StorageEvent && e.key && e.key !== ASSET_COLOR_STORAGE_KEY) return;
    onChange();
  };
  window.addEventListener('storage', handler);
  window.addEventListener('clearpath-asset-colors', handler as EventListener);
  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener('clearpath-asset-colors', handler as EventListener);
  };
}

export function broadcastAssetColors(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('clearpath-asset-colors'));
  }
}
