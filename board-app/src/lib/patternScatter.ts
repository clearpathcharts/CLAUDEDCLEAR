import type { Candle } from "@/lib/marketData";

export type PatternHit = {
  id: string;
  label: string;
  group: "continuation" | "reversal" | "candlestick";
  direction: "bullish" | "bearish" | "neutral";
  /** Candle index in the series (0 = oldest). */
  index: number;
  /** Optional second index for multi-bar geometry. */
  endIndex?: number;
};

function swingHighs(candles: Candle[], left = 2, right = 2): number[] {
  const out: number[] = [];
  for (let i = left; i < candles.length - right; i++) {
    let ok = true;
    for (let j = i - left; j <= i + right; j++) {
      if (j === i) continue;
      if (candles[j].h >= candles[i].h) {
        ok = false;
        break;
      }
    }
    if (ok) out.push(i);
  }
  return out;
}

function swingLows(candles: Candle[], left = 2, right = 2): number[] {
  const out: number[] = [];
  for (let i = left; i < candles.length - right; i++) {
    let ok = true;
    for (let j = i - left; j <= i + right; j++) {
      if (j === i) continue;
      if (candles[j].l <= candles[i].l) {
        ok = false;
        break;
      }
    }
    if (ok) out.push(i);
  }
  return out;
}

/** Lightweight board-demo pattern scatter (educational — not the full River engine). */
export function scanPatternScatter(candles: Candle[]): PatternHit[] {
  if (candles.length < 12) return [];
  const hits: PatternHit[] = [];
  const highs = swingHighs(candles);
  const lows = swingLows(candles);

  for (let i = 1; i < highs.length; i++) {
    const a = highs[i - 1];
    const b = highs[i];
    const tol = Math.max(Math.abs(candles[a].h) * 0.004, 0.0001);
    if (Math.abs(candles[a].h - candles[b].h) <= tol && b - a >= 4) {
      hits.push({
        id: `double-top-${a}-${b}`,
        label: "Double Top",
        group: "reversal",
        direction: "bearish",
        index: a,
        endIndex: b,
      });
    }
  }

  for (let i = 1; i < lows.length; i++) {
    const a = lows[i - 1];
    const b = lows[i];
    const tol = Math.max(Math.abs(candles[a].l) * 0.004, 0.0001);
    if (Math.abs(candles[a].l - candles[b].l) <= tol && b - a >= 4) {
      hits.push({
        id: `double-bottom-${a}-${b}`,
        label: "Double Bottom",
        group: "reversal",
        direction: "bullish",
        index: a,
        endIndex: b,
      });
    }
  }

  // Rising / falling three-swing structure as triangle-ish continuation hints
  if (highs.length >= 3 && lows.length >= 2) {
    const h1 = highs[highs.length - 3];
    const h2 = highs[highs.length - 2];
    const h3 = highs[highs.length - 1];
    if (candles[h2].h < candles[h1].h && candles[h3].h < candles[h2].h) {
      hits.push({
        id: `desc-tri-${h1}-${h3}`,
        label: "Descending Triangle watch",
        group: "continuation",
        direction: "bearish",
        index: h1,
        endIndex: h3,
      });
    }
    if (candles[h2].h > candles[h1].h && candles[h3].h > candles[h2].h) {
      const lLast = lows[lows.length - 1];
      hits.push({
        id: `asc-tri-${h1}-${h3}`,
        label: "Ascending Triangle watch",
        group: "continuation",
        direction: "bullish",
        index: Math.min(h1, lLast),
        endIndex: h3,
      });
    }
  }

  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1];
    const cur = candles[i];
    const prevBody = Math.abs(prev.c - prev.o);
    const curBody = Math.abs(cur.c - cur.o);
    if (curBody > prevBody * 1.15) {
      if (prev.c < prev.o && cur.c > cur.o && cur.c >= prev.o && cur.o <= prev.c) {
        hits.push({
          id: `bull-engulf-${i}`,
          label: "Bullish Engulfing",
          group: "candlestick",
          direction: "bullish",
          index: i,
        });
      }
      if (prev.c > prev.o && cur.c < cur.o && cur.o >= prev.c && cur.c <= prev.o) {
        hits.push({
          id: `bear-engulf-${i}`,
          label: "Bearish Engulfing",
          group: "candlestick",
          direction: "bearish",
          index: i,
        });
      }
    }
  }

  // Keep newest / densest readable set
  return hits.slice(-18);
}
