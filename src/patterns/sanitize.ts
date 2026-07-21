import { Candle } from '../types/indicators';

/** Max bars fed into geometry engines — keeps scans fast on 40k histories. */
export const PATTERN_ANALYSIS_MAX_BARS = 500;

export function sanitizeCandles(candles: Candle[]): Candle[] {
  if (!Array.isArray(candles)) return [];

  const valid: Candle[] = [];
  const seen = new Set<number>();

  for (const raw of candles) {
    if (!raw || typeof raw !== 'object') continue;
    const { time, open, high, low, close } = raw;
    if (
      !Number.isFinite(time)
      || !Number.isFinite(open)
      || !Number.isFinite(high)
      || !Number.isFinite(low)
      || !Number.isFinite(close)
    ) continue;
    if (high < low || high < Math.max(open, close) || low > Math.min(open, close)) continue;
    if (seen.has(time)) continue;
    seen.add(time);
    valid.push({ time, open, high, low, close });
  }

  return valid.sort((a, b) => a.time - b.time);
}

/** Tail slice used for all pattern geometry — never scan the full 40k window. */
export function analysisWindow(candles: Candle[], maxBars = PATTERN_ANALYSIS_MAX_BARS): Candle[] {
  const safe = sanitizeCandles(candles);
  if (safe.length <= maxBars) return safe;
  return safe.slice(-maxBars);
}

export function candleFingerprint(candles: Candle[], tail = 24): string {
  const slice = candles.slice(-tail);
  if (slice.length === 0) return '';
  return slice.map((c) => `${c.time}:${c.open.toFixed(5)}:${c.high.toFixed(5)}:${c.low.toFixed(5)}:${c.close.toFixed(5)}`).join('|');
}
