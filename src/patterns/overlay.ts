import { Time } from 'lightweight-charts';
import { Candle } from '../types/indicators';
import { DetectedPattern } from './types';

export interface PatternLineOverlay {
  id: string;
  label: string;
  color: string;
  dashed: boolean;
  points: Array<{ time: Time; value: number }>;
}

const DIRECTION_COLOR = {
  bullish: '#22C55E',
  bearish: '#EF4444',
  neutral: '#EAB308',
};

const CANDLE_MARKER_COLOR = {
  bullish: '#22C55E',
  bearish: '#EF4444',
  neutral: '#00D9FF',
};

/** Build lightweight-charts line overlays from detected chart patterns (max 4 to avoid clutter). */
export function buildPatternLineOverlays(
  candles: Candle[],
  patterns: DetectedPattern[],
): PatternLineOverlay[] {
  const chartPatterns = patterns
    .filter((p) => p.category === 'chart' && p.geometry?.lines.length)
    .slice(-4);

  const overlays: PatternLineOverlay[] = [];

  for (const pattern of chartPatterns) {
    const color = DIRECTION_COLOR[pattern.direction];
    for (const [i, line] of (pattern.geometry?.lines ?? []).entries()) {
      overlays.push({
        id: `${pattern.id}-${line.role}-${i}`,
        label: pattern.label,
        color,
        dashed: line.role === 'neckline' || line.role === 'horizontal',
        points: [
          { time: line.from.time as Time, value: line.from.price },
          { time: line.to.time as Time, value: line.to.price },
        ],
      });
    }
  }

  return overlays;
}

export interface PatternCandleMarker {
  time: Time;
  position: 'aboveBar' | 'belowBar';
  shape: 'arrowUp' | 'arrowDown' | 'circle';
  color: string;
  text: string;
  price?: number;
}

/** Mark recent candlestick pattern hits on the chart (max 12). */
export function buildCandlestickMarkers(
  candles: Candle[],
  patterns: DetectedPattern[],
): PatternCandleMarker[] {
  return patterns
    .filter((p) => p.category === 'candlestick')
    .slice(-12)
    .map((p) => {
      const c = candles[p.endIndex];
      const price = c ? (p.direction === 'bullish' ? c.low : c.high) : undefined;
      return {
        time: p.time as Time,
        position: p.direction === 'bullish' ? 'belowBar' as const : 'aboveBar' as const,
        shape: p.direction === 'bullish' ? 'arrowUp' as const : p.direction === 'bearish' ? 'arrowDown' as const : 'circle' as const,
        color: CANDLE_MARKER_COLOR[p.direction],
        text: p.label.slice(0, 3),
        price,
      };
    });
}
