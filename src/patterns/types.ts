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

export type ChartPatternId =
  // Continuation
  | 'bull_flag'
  | 'bear_flag'
  | 'bull_pennant'
  | 'bear_pennant'
  | 'cup_and_handle'
  | 'ascending_triangle'
  | 'descending_triangle'
  | 'rectangle'
  // Reversal
  | 'head_and_shoulders'
  | 'inverse_head_and_shoulders'
  | 'double_top'
  | 'double_bottom'
  | 'triple_top'
  | 'triple_bottom'
  | 'rising_wedge'
  | 'falling_wedge'
  // Bilateral
  | 'symmetrical_triangle'
  | 'broadening_wedge';

export type PatternId = CandlestickPatternId | ChartPatternId;

export interface DetectedPattern {
  id: PatternId;
  category: PatternCategory;
  label: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  /** continuation · reversal · bilateral (chart patterns only) */
  patternGroup?: PatternGroup;
  startIndex: number;
  endIndex: number;
  time: number;
  confidence: number; // 0–1 honest score, never faked as 100%
  detail?: string;
  /** Drawable geometry for chart overlays */
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
