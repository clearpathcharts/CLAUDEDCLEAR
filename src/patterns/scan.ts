import { Candle } from '../types/indicators';
import { PatternScanResult } from './types';
import { scanCandlestickPatterns } from './candlesticks';
import { scanChartPatterns, findSwingPoints } from './chartPatterns';
import { filterLivePatterns } from './liveEdge';

export function scanAllPatterns(candles: Candle[]): PatternScanResult {
  const swings = findSwingPoints(candles, 3, 3);
  const candlestick = scanCandlestickPatterns(candles);
  const chart = scanChartPatterns(candles);

  const patterns = filterLivePatterns([...candlestick, ...chart], candles.length);

  return {
    scannedBars: candles.length,
    patterns,
    swingHighs: swings.filter((s) => s.kind === 'high').length,
    swingLows: swings.filter((s) => s.kind === 'low').length,
  };
}
