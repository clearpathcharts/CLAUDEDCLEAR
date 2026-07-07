import { Candle } from '../types/indicators';
import { DetectedPattern } from './types';

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

export function scanCandlestickPatterns(candles: Candle[]): DetectedPattern[] {
  const found: DetectedPattern[] = [];
  if (candles.length < 2) return found;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const r = range(c);
    if (r <= 0) continue;

    const b = body(c);
    const upperWick = c.high - Math.max(c.open, c.close);
    const lowerWick = Math.min(c.open, c.close) - c.low;

    // Doji — tiny body relative to range
    if (b / r < 0.1) {
      found.push({
        id: 'doji',
        category: 'candlestick',
        label: 'Doji',
        direction: 'neutral',
        startIndex: i,
        endIndex: i,
        time: c.time,
        confidence: 0.85,
      });
    }

    // Hammer / Hanging Man — small body on top, long lower shadow
    if (lowerWick >= b * 2 && upperWick <= b * 0.5 && b > 0) {
      const priorTrend = i >= 5 ? candles[i - 1].close - candles[i - 5].close : 0;
      if (priorTrend < 0) {
        found.push({
          id: 'hammer',
          category: 'candlestick',
          label: 'Hammer',
          direction: 'bullish',
          startIndex: i,
          endIndex: i,
          time: c.time,
          confidence: 0.8,
        });
      } else if (priorTrend > 0) {
        found.push({
          id: 'hanging_man',
          category: 'candlestick',
          label: 'Hanging Man',
          direction: 'bearish',
          startIndex: i,
          endIndex: i,
          time: c.time,
          confidence: 0.75,
        });
      }
    }

    // Engulfing (needs previous candle)
    if (i > 0) {
      const p = candles[i - 1];
      if (isBearish(p) && isBullish(c) && c.open <= p.close && c.close >= p.open) {
        found.push({
          id: 'bullish_engulfing',
          category: 'candlestick',
          label: 'Bullish Engulfing',
          direction: 'bullish',
          startIndex: i - 1,
          endIndex: i,
          time: c.time,
          confidence: 0.82,
        });
      }
      if (isBullish(p) && isBearish(c) && c.open >= p.close && c.close <= p.open) {
        found.push({
          id: 'bearish_engulfing',
          category: 'candlestick',
          label: 'Bearish Engulfing',
          direction: 'bearish',
          startIndex: i - 1,
          endIndex: i,
          time: c.time,
          confidence: 0.82,
        });
      }
    }

    // Three White Soldiers
    if (i >= 2) {
      const c1 = candles[i - 2];
      const c2 = candles[i - 1];
      const c3 = c;
      if (
        isBullish(c1) && isBullish(c2) && isBullish(c3) &&
        c2.close > c1.close && c3.close > c2.close &&
        c2.open > c1.open && c3.open > c2.open
      ) {
        found.push({
          id: 'three_white_soldiers',
          category: 'candlestick',
          label: 'Three White Soldiers',
          direction: 'bullish',
          startIndex: i - 2,
          endIndex: i,
          time: c.time,
          confidence: 0.78,
        });
      }

      // Three Black Crows
      if (
        isBearish(c1) && isBearish(c2) && isBearish(c3) &&
        c2.close < c1.close && c3.close < c2.close &&
        c2.open < c1.open && c3.open < c2.open
      ) {
        found.push({
          id: 'three_black_crows',
          category: 'candlestick',
          label: 'Three Black Crows',
          direction: 'bearish',
          startIndex: i - 2,
          endIndex: i,
          time: c.time,
          confidence: 0.78,
        });
      }

      // Morning Star (bearish, small body/doji, bullish)
      const c2Body = body(c2);
      const c2Range = range(c2);
      const c2Small = c2Range > 0 && c2Body / c2Range < 0.35;
      if (isBearish(c1) && c2Small && isBullish(c3) && c3.close > (c1.open + c1.close) / 2) {
        found.push({
          id: 'morning_star',
          category: 'candlestick',
          label: 'Morning Star',
          direction: 'bullish',
          startIndex: i - 2,
          endIndex: i,
          time: c.time,
          confidence: 0.72,
        });
      }

      // Evening Star
      if (isBullish(c1) && c2Small && isBearish(c3) && c3.close < (c1.open + c1.close) / 2) {
        found.push({
          id: 'evening_star',
          category: 'candlestick',
          label: 'Evening Star',
          direction: 'bearish',
          startIndex: i - 2,
          endIndex: i,
          time: c.time,
          confidence: 0.72,
        });
      }
    }
  }

  return found;
}
