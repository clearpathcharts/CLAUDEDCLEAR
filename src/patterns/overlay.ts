import { Time } from 'lightweight-charts';
import { Candle } from '../types/indicators';
import { DetectedPattern } from './types';
import { neonLineColor, NEON_PATTERN_LINE_COLORS } from './patternMeta';

export interface PatternLineOverlay {
  id: string;
  label: string;
  color: string;
  dashed: boolean;
  lineWidth: number;
  points: Array<{ time: Time; value: number }>;
}

const CANDLE_MARKER_COLOR = {
  bullish: '#22C55E',
  bearish: '#EF4444',
  neutral: '#00D9FF',
};

/** Build lightweight-charts line overlays — hot pink / purple neon geometry */
export function buildPatternLineOverlays(
  candles: Candle[],
  patterns: DetectedPattern[],
): PatternLineOverlay[] {
  const chartPatterns = patterns
    .filter((p) => p.category === 'chart' && p.geometry?.lines.length)
    .slice(0, 12);

  const overlays: PatternLineOverlay[] = [];

  for (const pattern of chartPatterns) {
    const nested = pattern.scale === 'nested';
    for (const [i, line] of (pattern.geometry?.lines ?? []).entries()) {
      if (line.from.time === line.to.time && line.from.price === line.to.price) continue;
      const color = neonLineColor(line.role, i, pattern.scale);
      overlays.push({
        id: `${pattern.scale ?? 'major'}-${pattern.id}-${pattern.startIndex}-${line.role}-${i}`,
        label: nested ? `${pattern.label} (nested)` : pattern.label,
        color,
        dashed: nested || line.role === 'neckline',
        lineWidth: nested
          ? 2
          : line.role === 'horizontal' || line.role === 'neckline' ? 4 : 3,
        points: [
          { time: line.from.time as Time, value: line.from.price },
          { time: line.to.time as Time, value: line.to.price },
        ],
      });
    }
  }

  return overlays.slice(-20);
}

export interface PatternCandleMarker {
  time: Time;
  position: 'aboveBar' | 'belowBar';
  shape: 'arrowUp' | 'arrowDown' | 'circle';
  color: string;
  text: string;
  price?: number;
}

/** Mark completion point for chart patterns */
export function buildPatternPeakMarkers(
  candles: Candle[],
  patterns: DetectedPattern[],
): PatternCandleMarker[] {
  const markers: PatternCandleMarker[] = [];
  const chartPatterns = patterns.filter((p) => p.category === 'chart').slice(0, 3);

  for (const pattern of chartPatterns) {
    if (pattern.geometry?.markerIndex != null) {
      const c = candles[pattern.geometry.markerIndex];
      if (c) {
        markers.push({
          time: c.time as Time,
          position: pattern.direction === 'bullish' ? 'belowBar' : 'aboveBar',
          shape: 'circle',
          color: NEON_PATTERN_LINE_COLORS.purple,
          text: pattern.label.slice(0, 4),
          price: pattern.geometry.markerPrice,
        });
      }
    }
  }

  return markers.slice(-6);
}

/** Mark recent candlestick pattern hits on the chart (max 12). */
export function buildCandlestickMarkers(
  candles: Candle[],
  patterns: DetectedPattern[],
): PatternCandleMarker[] {
  return patterns
    .filter((p) => p.category === 'candlestick')
    .slice(0, 6)
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
