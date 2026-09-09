/**
 * SVG "screenshot" of completed daily candles + measured pattern overlays.
 * Generated from OHLC we already fetched — not a TradingView scrape.
 */

import type { Candle } from "../types/indicators";
import type { DetectedPattern } from "../patterns/types";
import { neonLineColor } from "../patterns/patternMeta";

const WIDTH = 420;
const HEIGHT = 168;
const PAD = { l: 8, r: 8, t: 18, b: 10 };

function xmlEscape(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function yScale(min: number, max: number) {
  const span = max - min || 1;
  const inner = HEIGHT - PAD.t - PAD.b;
  return (price: number) => PAD.t + ((max - price) / span) * inner;
}

function xScale(count: number) {
  const inner = WIDTH - PAD.l - PAD.r;
  const step = count > 0 ? inner / count : inner;
  return (index: number) => PAD.l + (index + 0.5) * step;
}

export type SnapshotMeta = {
  symbol: string;
  sessionDate: string | null;
  title: string;
};

/** Last N completed daily bars as an inline SVG snapshot. */
export function renderDailyPatternSnapshot(
  candles: Candle[],
  patterns: DetectedPattern[],
  meta: SnapshotMeta,
  lastBars = 48,
): string {
  const slice = candles.slice(-Math.max(12, lastBars));
  if (slice.length < 2) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="DATA UNAVAILABLE"><rect width="100%" height="100%" fill="#09090b"/><text x="50%" y="50%" fill="#71717a" font-size="11" text-anchor="middle" font-family="ui-monospace,monospace">DATA UNAVAILABLE</text></svg>`;
  }

  const offset = candles.length - slice.length;
  const highs = slice.map((c) => c.high);
  const lows = slice.map((c) => c.low);
  const max = Math.max(...highs);
  const min = Math.min(...lows);
  const y = yScale(min, max);
  const x = xScale(slice.length);
  const bodyW = Math.max(1.4, (WIDTH - PAD.l - PAD.r) / slice.length * 0.55);

  const bodies: string[] = [];
  for (let i = 0; i < slice.length; i++) {
    const c = slice[i];
    const up = c.close >= c.open;
    const color = up ? "#22c55e" : "#ef4444";
    const cx = x(i);
    const top = y(Math.max(c.open, c.close));
    const bot = y(Math.min(c.open, c.close));
    const h = Math.max(1, bot - top);
    bodies.push(
      `<line x1="${cx.toFixed(2)}" y1="${y(c.high).toFixed(2)}" x2="${cx.toFixed(2)}" y2="${y(c.low).toFixed(2)}" stroke="${color}" stroke-width="1"/>` +
        `<rect x="${(cx - bodyW / 2).toFixed(2)}" y="${top.toFixed(2)}" width="${bodyW.toFixed(2)}" height="${h.toFixed(2)}" fill="${color}"/>`,
    );
  }

  const overlays: string[] = [];
  for (const pattern of patterns) {
    const lines = pattern.geometry?.lines ?? [];
    for (const [li, line] of lines.entries()) {
      const fromIdx = line.from.index - offset;
      const toIdx = line.to.index - offset;
      if (fromIdx < 0 && toIdx < 0) continue;
      if (fromIdx >= slice.length && toIdx >= slice.length) continue;
      const x1 = x(Math.max(0, Math.min(slice.length - 1, fromIdx)));
      const x2 = x(Math.max(0, Math.min(slice.length - 1, toIdx)));
      const color = neonLineColor(line.role, li, pattern.scale);
      const dashed = pattern.scale === "nested" || line.role === "neckline" ? ' stroke-dasharray="4 3"' : "";
      overlays.push(
        `<line x1="${x1.toFixed(2)}" y1="${y(line.from.price).toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y(line.to.price).toFixed(2)}" stroke="${color}" stroke-width="${pattern.scale === "nested" ? 1.5 : 2}"${dashed} fill="none"/>`,
      );
    }
  }

  const title = xmlEscape(meta.title);
  const session = meta.sessionDate ? xmlEscape(meta.sessionDate) : "";
  const label = session ? `${title} · ${session}` : title;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${xmlEscape(label)}">`,
    `<rect width="100%" height="100%" fill="#09090b"/>`,
    `<text x="${PAD.l}" y="12" fill="#e4e4e7" font-size="10" font-family="ui-monospace,monospace">${label}</text>`,
    ...bodies,
    ...overlays,
    `</svg>`,
  ].join("");
}

export function sessionDateFromCandles(candles: Candle[]): string | null {
  if (!candles.length) return null;
  const last = candles[candles.length - 1];
  const d = new Date(last.time);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}
