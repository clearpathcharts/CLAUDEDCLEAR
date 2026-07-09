import { Candle } from '../types/indicators';
import { DetectedPattern, PatternScanResult } from './types';
import { scanCandlestickPatterns } from './candlesticks';
import { scanChartPatterns, findSwingPoints } from './chartPatterns';

const CANDLESTICK_MIN_SPACING: Partial<Record<string, number>> = {
  doji: 8,
  hammer: 5,
  hanging_man: 5,
};

const MAX_CANDLESTICK_HITS = 24;

/** Suppress repetitive candlestick spam (especially doji on every tiny body). */
function dedupeCandlestickPatterns(patterns: DetectedPattern[]): DetectedPattern[] {
  const candlesticks = patterns
    .filter((p) => p.category === 'candlestick')
    .sort((a, b) => a.endIndex - b.endIndex);

  const kept: DetectedPattern[] = [];
  const lastById = new Map<string, number>();

  for (const p of candlesticks) {
    const minGap = CANDLESTICK_MIN_SPACING[p.id] ?? 3;
    const lastIndex = lastById.get(p.id);
    if (lastIndex !== undefined && p.endIndex - lastIndex < minGap) continue;
    kept.push(p);
    lastById.set(p.id, p.endIndex);
  }

  return kept.slice(-MAX_CANDLESTICK_HITS);
}

export function scanAllPatterns(candles: Candle[]): PatternScanResult {
  const swings = findSwingPoints(candles, 3, 3);
  const candlestick = dedupeCandlestickPatterns(scanCandlestickPatterns(candles));
  const chart = scanChartPatterns(candles);

  const patterns = [...candlestick, ...chart].sort((a, b) => a.endIndex - b.endIndex);

  return {
    scannedBars: candles.length,
    patterns,
    swingHighs: swings.filter((s) => s.kind === 'high').length,
    swingLows: swings.filter((s) => s.kind === 'low').length,
  };
}

/**
 * Mobile / small screens: scan only the recent window so hits stay relevant
 * to what's on screen (avoids thousands of ancient doji tags).
 */
export function scanPatternsForViewport(
  candles: Candle[],
  lookback = 200,
): PatternScanResult {
  if (candles.length <= lookback) {
    return scanAllPatterns(candles);
  }

  const offset = candles.length - lookback;
  const slice = candles.slice(-lookback);
  const partial = scanAllPatterns(slice);

  return {
    ...partial,
    scannedBars: lookback,
    patterns: partial.patterns.map((p) => ({
      ...p,
      startIndex: p.startIndex + offset,
      endIndex: p.endIndex + offset,
    })),
  };
}
