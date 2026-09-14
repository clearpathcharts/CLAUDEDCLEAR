import {
  fetchTieredHistoricalData,
  type NormalizedCandle,
} from '../../services/marketData';
import type { ReplayCandle } from './types';
import { findReplayStartIndex } from './ReplayEngine';

export type ReplayLoadRequest = {
  symbol: string;
  timeframe: string;
  /** Unix seconds — desired replay start (nearest candle). */
  startUnix?: number;
  /** YYYY-MM-DD optional window for Twelve Data. */
  startDate?: string;
  endDate?: string;
  userTier?: string;
};

export type ReplayLoadResult = {
  candles: ReplayCandle[];
  startIndex: number;
  /** Provider depth note when window is truncated. */
  note: string;
};

/**
 * HistoricalDataService — real OHLCV only via existing /api/market/history.
 * Never invents bars. Empty responses are hard errors.
 */
export class HistoricalDataService {
  async loadForReplay(req: ReplayLoadRequest): Promise<ReplayLoadResult> {
    const symbol = (req.symbol || '').trim().toUpperCase();
    if (!symbol) throw new Error('Symbol required for Market Replay.');

    const candles = await fetchTieredHistoricalData(
      symbol,
      req.timeframe || '1h',
      req.userTier || 'VIP',
      {
        startDate: req.startDate,
        endDate: req.endDate,
        limit: 5000,
      },
    );

    if (!candles.length) {
      throw new Error(
        `No real historical candles returned for ${symbol} ${req.timeframe}. ` +
          `Check the Twelve Data key / date window (max 5000 bars per request).`,
      );
    }

    const startIndex =
      typeof req.startUnix === 'number'
        ? findReplayStartIndex(candles, req.startUnix)
        : Math.max(0, candles.length - Math.min(120, candles.length));

    const first = candles[0];
    const last = candles[candles.length - 1];
    const note =
      `Loaded ${candles.length} real bars ` +
      `(${formatTs(first.time)} → ${formatTs(last.time)}). ` +
      `Twelve Data caps one request at 5000 bars — pick a nearer date if your start is outside this window.`;

    return { candles, startIndex, note };
  }
}

function formatTs(unix: number): string {
  try {
    return new Date(unix * 1000).toISOString().replace('T', ' ').slice(0, 16) + 'Z';
  } catch {
    return String(unix);
  }
}

export function toReplayCandles(raw: NormalizedCandle[]): ReplayCandle[] {
  return raw.map((c) => ({
    time: c.time,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
  }));
}

export const historicalDataService = new HistoricalDataService();
