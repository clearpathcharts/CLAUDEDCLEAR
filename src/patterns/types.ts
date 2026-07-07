// Native ClearPath pattern detection — not Pine import, pure OHLC geometry.

import { Candle } from '../types/indicators';
import type { PatternGroup } from './patternMeta';

export type PatternCategory = 'candlestick' | 'chart' | 'structure';

export type CandlestickPatternId =
  | 'doji'
  | 'hammer'
  | 'hanging_man'
  | 'bullish_engulfing'
  | 'bearish_engulfing'
  | 'three_white_soldiers'
  | 'three_black_crows'
  | 'morning_star'
  | 'evening_star';

/** Major chart patterns only — no harmonic / Fibonacci fiction. */
export type ChartPatternId =
  | 'rising_wedge'
  | 'falling_wedge'
  | 'ascending_triangle'
  | 'descending_triangle'
  | 'cup_and_handle';

export type PatternId = CandlestickPatternId | ChartPatternId;

export interface DetectedPattern {
  id: PatternId;
  category: PatternCategory;
  label: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  patternGroup?: PatternGroup;
  startIndex: number;
  endIndex: number;
  time: number;
  confidence: number;
  detail?: string;
  geometry?: PatternGeometry;
}

export interface PatternLineSegment {
  role: 'upper' | 'lower' | 'horizontal' | 'neckline' | 'cup';
  from: { index: number; time: number; price: number };
  to: { index: number; time: number; price: number };
}

export interface PatternGeometry {
  lines: PatternLineSegment[];
  markerIndex?: number;
  markerPrice?: number;
}

export interface PatternScanResult {
  scannedBars: number;
  patterns: DetectedPattern[];
  swingHighs: number;
  swingLows: number;
}

export interface SwingPoint {
  index: number;
  time: number;
  price: number;
  kind: 'high' | 'low';
}

export type { Candle };
