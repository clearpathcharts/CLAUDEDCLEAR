import { Candle } from '../types/indicators';
import { PatternScanResult } from './types';
import { scanCandlestickPatterns } from './candlesticks';
import { scanChartPatterns, findSwingPoints } from './chartPatterns';

export function scanAllPatterns(candles: Candle[]): PatternScanResult {
  const swings = findSwingPoints(candles, 3, 3);
  const candlestick = scanCandlestickPatterns(candles);
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
