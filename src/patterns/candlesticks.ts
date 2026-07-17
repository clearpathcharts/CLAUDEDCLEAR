import { Candle } from '../types/indicators';
import { DetectedPattern } from './types';
import { clamp01, roundConfidence } from './lineFit';
import { CANDLESTICK_SCAN_BARS } from './liveEdge';

function body(c: Candle): number {
  return Math.abs(c.close - c.open);
}

function range(c: Candle): number {
  return c.high - c.low;
}

function isBullish(c: Candle): boolean {
  return c.close > c.open;
}

function isBearish(c: Candle): boolean {
  return c.close < c.open;
}

function bodyRatio(c: Candle): number {
  const r = range(c);
  return r > 0 ? body(c) / r : 0;
}

function closePosition(c: Candle): number {
  const r = range(c);
  return r > 0 ? (c.close - c.low) / r : 0.5;
}

function avgRange(candles: Candle[]): number {
  if (candles.length === 0) return 0;
  return candles.reduce((sum, c) => sum + range(c), 0) / candles.length;
}

function meaningfulRange(c: Candle, avgR: number): boolean {
  const r = range(c);
  return r > 0 && (avgR <= 0 || r >= avgR * 0.35);
}

function priorTrend(candles: Candle[], index: number, lookback = 8): number {
  const start = Math.max(0, index - lookback);
  if (index <= start) return 0;
  return candles[index].close - candles[start].close;
}

function pushOnce(
  found: DetectedPattern[],
  seen: Set<string>,
  pattern: DetectedPattern,
): void {
  const key = `${pattern.id}:${pattern.endIndex}`;
  if (seen.has(key)) return;
  seen.add(key);
  found.push(pattern);
}

/**
 * Scan only the most recent bars for candlestick patterns.
 * Stricter geometry than textbook minimums — fewer false positives.
 */
export function scanCandlestickPatterns(candles: Candle[]): DetectedPattern[] {
  const found: DetectedPattern[] = [];
  if (candles.length < 2) return found;

  const seen = new Set<string>();
  const avgR = avgRange(candles.slice(-Math.min(candles.length, 40)));
  const scanFrom = Math.max(0, candles.length - CANDLESTICK_SCAN_BARS);

  for (let i = scanFrom; i < candles.length; i++) {
    const c = candles[i];
    const r = range(c);
    if (!meaningfulRange(c, avgR)) continue;

    const b = body(c);
    const upperWick = c.high - Math.max(c.open, c.close);
    const lowerWick = Math.min(c.open, c.close) - c.low;

    // Doji — very small body, both wicks present
    if (b / r < 0.08 && upperWick / r > 0.15 && lowerWick / r > 0.15) {
      pushOnce(found, seen, {
        id: 'doji',
        category: 'candlestick',
        label: 'Doji',
        direction: 'neutral',
        startIndex: i,
        endIndex: i,
        time: c.time,
        confidence: roundConfidence(clamp01(0.55 + (0.08 - b / r) * 4)),
        detail: 'Indecision bar — open and close nearly equal on the latest candle.',
      });
    }

    // Hammer / Hanging Man — body in upper third, long lower shadow
    if (
      b > 0
      && lowerWick >= b * 2.5
      && upperWick <= b * 0.35
      && closePosition(c) >= 0.55
      && bodyRatio(c) >= 0.15
    ) {
      const trend = priorTrend(candles, i);
      const avgPrice = (c.high + c.low) / 2;
      const trendPct = avgPrice > 0 ? trend / avgPrice : 0;

      if (trendPct < -0.003) {
        pushOnce(found, seen, {
          id: 'hammer',
          category: 'candlestick',
          label: 'Hammer',
          direction: 'bullish',
          startIndex: i,
          endIndex: i,
          time: c.time,
          confidence: roundConfidence(clamp01(0.6 + Math.min(lowerWick / (b * 2.5), 1.5) * 0.15)),
          detail: 'Long lower wick after a dip — buyers rejected lower prices on the latest bar.',
        });
      } else if (trendPct > 0.003) {
        pushOnce(found, seen, {
          id: 'hanging_man',
          category: 'candlestick',
          label: 'Hanging Man',
          direction: 'bearish',
          startIndex: i,
          endIndex: i,
          time: c.time,
          confidence: roundConfidence(clamp01(0.58 + Math.min(lowerWick / (b * 2.5), 1.5) * 0.12)),
          detail: 'Long lower wick after a rise — selling pressure appeared on the latest bar.',
        });
      }
    }

    if (i > 0) {
      const p = candles[i - 1];
      const pBody = body(p);
      const cBody = body(c);

      // Engulfing — full body engulf with meaningful bodies
      if (
        isBearish(p) && isBullish(c)
        && c.open <= p.close && c.close >= p.open
        && pBody / Math.max(range(p), 1e-9) >= 0.35
        && cBody > pBody * 1.1
        && bodyRatio(c) >= 0.55
      ) {
        pushOnce(found, seen, {
          id: 'bullish_engulfing',
          category: 'candlestick',
          label: 'Bullish Engulfing',
          direction: 'bullish',
          startIndex: i - 1,
          endIndex: i,
          time: c.time,
          confidence: roundConfidence(clamp01(0.62 + (cBody / Math.max(pBody, 1e-9) - 1) * 0.1)),
          detail: 'Latest bullish bar fully wrapped the prior bearish body.',
        });
      }

      if (
        isBullish(p) && isBearish(c)
        && c.open >= p.close && c.close <= p.open
        && pBody / Math.max(range(p), 1e-9) >= 0.35
        && cBody > pBody * 1.1
        && bodyRatio(c) >= 0.55
      ) {
        pushOnce(found, seen, {
          id: 'bearish_engulfing',
          category: 'candlestick',
          label: 'Bearish Engulfing',
          direction: 'bearish',
          startIndex: i - 1,
          endIndex: i,
          time: c.time,
          confidence: roundConfidence(clamp01(0.62 + (cBody / Math.max(pBody, 1e-9) - 1) * 0.1)),
          detail: 'Latest bearish bar fully wrapped the prior bullish body.',
        });
      }
    }

    if (i >= 2) {
      const c1 = candles[i - 2];
      const c2 = candles[i - 1];
      const c3 = c;

      const strongBull = (bar: Candle) =>
        isBullish(bar)
        && bodyRatio(bar) >= 0.55
        && closePosition(bar) >= 0.65
        && meaningfulRange(bar, avgR);

      const strongBear = (bar: Candle) =>
        isBearish(bar)
        && bodyRatio(bar) >= 0.55
        && closePosition(bar) <= 0.35
        && meaningfulRange(bar, avgR);

      // Three White Soldiers — three strong bullish bodies stair-stepping higher
      if (
        strongBull(c1) && strongBull(c2) && strongBull(c3)
        && c2.close > c1.close && c3.close > c2.close
        && c2.open >= c1.open && c2.open <= c1.close
        && c3.open >= c2.open && c3.open <= c2.close
        && c2.open > c1.open && c3.open > c2.open
      ) {
        pushOnce(found, seen, {
          id: 'three_white_soldiers',
          category: 'candlestick',
          label: 'Three White Soldiers',
          direction: 'bullish',
          startIndex: i - 2,
          endIndex: i,
          time: c.time,
          confidence: roundConfidence(clamp01(0.65 + (c3.close - c1.close) / Math.max(avgR, 1e-9) * 0.05)),
          detail: 'Three consecutive strong bullish bars closed higher — measured on the latest three candles.',
        });
      }

      if (
        strongBear(c1) && strongBear(c2) && strongBear(c3)
        && c2.close < c1.close && c3.close < c2.close
        && c2.open <= c1.open && c2.open >= c1.close
        && c3.open <= c2.open && c3.open >= c2.close
        && c2.open < c1.open && c3.open < c2.open
      ) {
        pushOnce(found, seen, {
          id: 'three_black_crows',
          category: 'candlestick',
          label: 'Three Black Crows',
          direction: 'bearish',
          startIndex: i - 2,
          endIndex: i,
          time: c.time,
          confidence: roundConfidence(clamp01(0.65 + (c1.close - c3.close) / Math.max(avgR, 1e-9) * 0.05)),
          detail: 'Three consecutive strong bearish bars closed lower — measured on the latest three candles.',
        });
      }

      const c2Body = body(c2);
      const c2Range = range(c2);
      const c2Small = c2Range > 0 && c2Body / c2Range < 0.3;
      const c1Mid = (c1.open + c1.close) / 2;

      // Morning Star — bearish leg, small star, bullish recovery through midpoint
      if (
        isBearish(c1) && bodyRatio(c1) >= 0.45
        && c2Small
        && isBullish(c3) && bodyRatio(c3) >= 0.45
        && c3.close > c1Mid
        && c2.high < c1.close
      ) {
        pushOnce(found, seen, {
          id: 'morning_star',
          category: 'candlestick',
          label: 'Morning Star',
          direction: 'bullish',
          startIndex: i - 2,
          endIndex: i,
          time: c.time,
          confidence: roundConfidence(clamp01(0.6 + (c3.close - c1Mid) / Math.max(avgR, 1e-9) * 0.08)),
          detail: 'Bearish bar, small pause, then bullish recovery through the prior midpoint.',
        });
      }

      if (
        isBullish(c1) && bodyRatio(c1) >= 0.45
        && c2Small
        && isBearish(c3) && bodyRatio(c3) >= 0.45
        && c3.close < c1Mid
        && c2.low > c1.close
      ) {
        pushOnce(found, seen, {
          id: 'evening_star',
          category: 'candlestick',
          label: 'Evening Star',
          direction: 'bearish',
          startIndex: i - 2,
          endIndex: i,
          time: c.time,
          confidence: roundConfidence(clamp01(0.6 + (c1Mid - c3.close) / Math.max(avgR, 1e-9) * 0.08)),
          detail: 'Bullish bar, small pause, then bearish rejection through the prior midpoint.',
        });
      }
    }
  }

  return found.sort((a, b) => b.endIndex - a.endIndex || b.confidence - a.confidence);
}
