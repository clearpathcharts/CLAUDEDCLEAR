/**
 * High-intensity candle pairs. These are the exact inks the chart and
 * drawing tools use when a color is already that hue — saturation stays
 * at the neon value instead of being washed toward a pastel.
 */

export const HIGH_INTENSITY_CANDLE_PAIRS = [
  { name: "Green / Red", up: "#00FF66", down: "#FF1744" },
  { name: "Cyan / Magenta", up: "#00F5FF", down: "#FF00CC" },
  { name: "Blue / Orange", up: "#2979FF", down: "#FF6D00" },
  { name: "Emerald / Crimson", up: "#00FFB3", down: "#FF0033" },
  { name: "Lime / Hot Pink", up: "#B7FF00", down: "#FF1493" },
  { name: "Teal / Coral", up: "#00FFD1", down: "#FF4D6D" },
  { name: "Electric Blue / Neon Red", up: "#00A8FF", down: "#FF204E" },
  { name: "Mint / Ruby", up: "#00FF99", down: "#FF0055" },
  { name: "Laser Green / Fuchsia", up: "#39FF14", down: "#FF00FF" },
  { name: "Ice Blue / Flame Orange", up: "#00E5FF", down: "#FF4500" },
  { name: "Royal Blue / Vivid Violet", up: "#4169FF", down: "#BF00FF" },
  { name: "Aqua / Scarlet", up: "#00FFFF", down: "#FF2400" },
  { name: "Neon Yellow / Electric Purple", up: "#FFFF00", down: "#9D00FF" },
  { name: "Gold / Magenta", up: "#FFD700", down: "#FF00A8" },
  { name: "White / Black", up: "#FFFFFF", down: "#202020" },
] as const;

export type HighIntensityPair = (typeof HIGH_INTENSITY_CANDLE_PAIRS)[number];

export type HighIntensityInk = HighIntensityPair["up"] | HighIntensityPair["down"];

/** Standard Chart (Red & Green) — the pair on profile=standard_red_green. */
export const STANDARD_GREEN_RED = HIGH_INTENSITY_CANDLE_PAIRS[0];

/** Every bull and bear ink, in pair order. Drawing-tool swatches use this. */
export const HIGH_INTENSITY_TOOL_COLORS: readonly HighIntensityInk[] = HIGH_INTENSITY_CANDLE_PAIRS.flatMap(
  (pair) => [pair.up, pair.down],
);

const PALETTE_SET = new Set<string>(HIGH_INTENSITY_TOOL_COLORS);

/**
 * Dull cousins of the pairs above. Same hue family, raised to the neon hex.
 * TradingView's classic "green" is a teal (#26A69A); on this chart that role
 * is the Green / Red pair, not a second cyan.
 */
const DULL_TO_VIVID: Record<string, string> = {
  "#26A69A": "#00FF66",
  "#EF5350": "#FF1744",
  "#00E676": "#00FF66",
  "#69F0AE": "#00FF66",
  "#00C853": "#00FF66",
  "#22C55E": "#00FF66",
  "#10B981": "#00FF99",
  "#43A047": "#00FF66",
  "#A5D6A7": "#00FFB3",
  "#FF5252": "#FF1744",
  "#EF4444": "#FF1744",
  "#D50000": "#FF1744",
  "#FF4444": "#FF204E",
  "#B71C1C": "#FF1744",
  "#EF9A9A": "#FF4D6D",
  "#E71D36": "#FF1744",
  "#00D9FF": "#00F5FF",
  "#4CC9F0": "#00E5FF",
  "#118AB2": "#00A8FF",
  "#4DFFFF": "#00FFFF",
  "#00FFCC": "#00FFD1",
  "#2EC4B6": "#00FFD1",
  "#06D6A0": "#00FF99",
  "#00F5D4": "#00FFD1",
  "#4DEEEA": "#00F5FF",
  "#FFD166": "#FFD700",
  "#FFAB00": "#FFD700",
  "#FFAA00": "#FF6D00",
  "#F59E0B": "#FF6D00",
  "#FF9F1C": "#FF6D00",
  "#FF7700": "#FF6D00",
  "#FF9E40": "#FF6D00",
  "#82B1FF": "#2979FF",
  "#3B82F6": "#2979FF",
  "#2962FF": "#2979FF",
  "#3D5AFE": "#2979FF",
  "#3E78FF": "#4169FF",
  "#4361EE": "#4169FF",
  "#7A3BFF": "#9D00FF",
  "#7C4DFF": "#9D00FF",
  "#7209B7": "#BF00FF",
  "#9D4EDD": "#BF00FF",
  "#AA00FF": "#BF00FF",
  "#7F00FF": "#9D00FF",
  "#A855F7": "#BF00FF",
  "#B5179E": "#FF00CC",
  "#FF2D95": "#FF00CC",
  "#FF00C8": "#FF00CC",
  "#FF007F": "#FF1493",
  "#F72585": "#FF1493",
  "#FF00AA": "#FF00A8",
  "#EF476F": "#FF4D6D",
  "#D500F9": "#BF00FF",
};

export function normalizeIntensityHex(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(t)) return t.toUpperCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(t)) {
    return `#${t[1]}${t[1]}${t[2]}${t[2]}${t[3]}${t[3]}`.toUpperCase();
  }
  return null;
}

export function isHighIntensityHex(hex: string): boolean {
  const n = normalizeIntensityHex(hex);
  return !!n && PALETTE_SET.has(n);
}

/**
 * Return the neon hex when `hex` is already in the palette or is a known dull
 * cousin. Returns null for grays and accessibility colors so those stay soft.
 */
export function intensifyNaturalHex(hex: string): string | null {
  const n = normalizeIntensityHex(hex);
  if (!n) return null;
  if (PALETTE_SET.has(n)) return n;
  return DULL_TO_VIVID[n] ?? null;
}
