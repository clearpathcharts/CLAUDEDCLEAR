import type { ReplayCandle } from './types';
import type { ReplayEngine } from './ReplayEngine';

/**
 * ChartDataAdapter — only projects candles the replay playhead has revealed.
 * Passing this array into LightweightCandles guarantees no future bars render.
 */
export class ChartDataAdapter {
  constructor(private engine: ReplayEngine) {}

  /** Visible OHLC for the chart (look-ahead safe). */
  getChartCandles(): ReplayCandle[] {
    return this.engine.visibleCandles();
  }

  getCurrentTimestamp(): number | null {
    return this.engine.currentCandle()?.time ?? null;
  }

  getProgress(): { current: number; start: number; end: number; total: number } {
    const s = this.engine.getState();
    return {
      current: s.currentReplayIndex,
      start: s.replayStartIndex,
      end: s.replayEndIndex,
      total: s.candles.length,
    };
  }
}
