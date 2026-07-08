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

export interface PatternOverlayLimits {
  maxChartPatterns?: number;
  maxLineOverlays?: number;
  maxCandleMarkers?: number;
  maxPeakMarkers?: number;
}

/** Build lightweight-charts line overlays — hot pink / purple neon geometry */
export function buildPatternLineOverlays(
  candles: Candle[],
  patterns: DetectedPattern[],
  limits: PatternOverlayLimits = {},
): PatternLineOverlay[] {
  const maxChartPatterns = limits.maxChartPatterns ?? 8;
  const maxLineOverlays = limits.maxLineOverlays ?? 20;

  const chartPatterns = patterns
    .filter((p) => p.category === 'chart' && p.geometry?.lines.length)
    .slice(-maxChartPatterns);

  const overlays: PatternLineOverlay[] = [];

  for (const pattern of chartPatterns) {
    for (const [i, line] of (pattern.geometry?.lines ?? []).entries()) {
      if (line.from.time === line.to.time && line.from.price === line.to.price) continue;
      const color = neonLineColor(line.role, i);
      overlays.push({
        id: `${pattern.id}-${line.role}-${i}`,
        label: pattern.label,
        color,
        dashed: line.role === 'neckline',
        lineWidth: line.role === 'horizontal' || line.role === 'neckline' ? 4 : 3,
        points: [
          { time: line.from.time as Time, value: line.from.price },
          { time: line.to.time as Time, value: line.to.price },
        ],
      });
    }
  }

  return overlays.slice(-maxLineOverlays);
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
  limits: PatternOverlayLimits = {},
): PatternCandleMarker[] {
  const maxPeakMarkers = limits.maxPeakMarkers ?? 6;
  const markers: PatternCandleMarker[] = [];
  const chartPatterns = patterns.filter((p) => p.category === 'chart').slice(-3);

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

  return markers.slice(-maxPeakMarkers);
}

/** Mark recent candlestick pattern hits on the chart. */
export function buildCandlestickMarkers(
  candles: Candle[],
  patterns: DetectedPattern[],
  limits: PatternOverlayLimits = {},
): PatternCandleMarker[] {
  const maxCandleMarkers = limits.maxCandleMarkers ?? 12;

  return patterns
    .filter((p) => p.category === 'candlestick')
    .slice(-maxCandleMarkers)
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
