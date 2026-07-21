/** Boost saturation and lightness so candles read vividly on dark charts. */

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.trim();
  const m = raw.match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = m[1];
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16),
  };
}

function toHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[c(r), c(g), c(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

  if (d !== 0) {
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break;
      case gn: h = ((bn - rn) / d + 2) / 6; break;
      default: h = ((rn - gn) / d + 4) / 6; break;
    }
  }

  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  if (s === 0) {
    const v = l * 255;
    return { r: v, g: v, b: v };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: hue2rgb(p, q, h + 1 / 3) * 255,
    g: hue2rgb(p, q, h) * 255,
    b: hue2rgb(p, q, h - 1 / 3) * 255,
  };
}

/** Push a hex color toward max saturation + brightness while keeping hue. */
export function intensifyHexColor(hex: string, amount = 1): string {
  if (!hex || typeof hex !== 'string') return hex;
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;

  const rgb = parseHex(hex);
  if (!rgb) return hex;

  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const satBoost = 0.38 * amount;
  const lightBoost = 0.1 * amount;

  const nextS = Math.min(1, s + satBoost + s * 0.35);
  const nextL = Math.min(0.88, Math.max(0.22, l + lightBoost + l * 0.12));
  const out = hslToRgb(h, nextS, nextL);

  return toHex(out.r, out.g, out.b);
}

export interface CandleColorSet {
  upColor: string;
  downColor: string;
  wickUpColor: string;
  wickDownColor: string;
  borderUpColor: string;
  borderDownColor: string;
}

export function intensifyCandleColors<T extends Partial<CandleColorSet>>(colors: T, amount = 1): T {
  const out = { ...colors };
  for (const key of Object.keys(out) as (keyof CandleColorSet)[]) {
    const value = out[key];
    if (typeof value === 'string') {
      (out as CandleColorSet)[key] = intensifyHexColor(value, amount);
    }
  }
  return out;
}
