import type { ReplayCandle, ReplayEngineState, ReplaySpeed } from './types';
import { REPLAY_SPEEDS } from './types';

/**
 * Pure Market Replay controller.
 * Guarantees look-ahead safety: visible candles are always candles[0..current].
 */
export class ReplayEngine {
  private state: ReplayEngineState;
  private listeners = new Set<(s: ReplayEngineState) => void>();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(init?: Partial<ReplayEngineState>) {
    this.state = {
      symbol: init?.symbol || '',
      timeframe: init?.timeframe || '1h',
      candles: init?.candles || [],
      replayStartIndex: init?.replayStartIndex ?? 0,
      currentReplayIndex: init?.currentReplayIndex ?? 0,
      replayEndIndex: init?.replayEndIndex ?? Math.max(0, (init?.candles?.length || 1) - 1),
      isPlaying: false,
      playbackSpeed: init?.playbackSpeed ?? 1,
    };
  }

  getState(): ReplayEngineState {
    return this.state;
  }

  subscribe(fn: (s: ReplayEngineState) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    const snap = this.state;
    for (const fn of this.listeners) fn(snap);
  }

  private patch(partial: Partial<ReplayEngineState>) {
    this.state = { ...this.state, ...partial };
    this.emit();
  }

  /** Load a full historical buffer and pin the playhead. */
  loadSession(opts: {
    symbol: string;
    timeframe: string;
    candles: ReplayCandle[];
    startIndex?: number;
  }) {
    this.pause();
    const candles = opts.candles.slice().sort((a, b) => a.time - b.time);
    if (candles.length === 0) {
      throw new Error('Market Replay requires real historical candles — buffer is empty.');
    }
    const end = candles.length - 1;
    const start = Math.max(0, Math.min(opts.startIndex ?? Math.max(0, end - 50), end));
    this.patch({
      symbol: opts.symbol,
      timeframe: opts.timeframe,
      candles,
      replayStartIndex: start,
      currentReplayIndex: start,
      replayEndIndex: end,
      isPlaying: false,
    });
  }

  /** Candles the chart/strategy may see — NEVER includes future bars. */
  visibleCandles(): ReplayCandle[] {
    const { candles, currentReplayIndex } = this.state;
    if (candles.length === 0) return [];
    const end = Math.max(0, Math.min(currentReplayIndex, candles.length - 1));
    return candles.slice(0, end + 1);
  }

  currentCandle(): ReplayCandle | null {
    const vis = this.visibleCandles();
    return vis.length ? vis[vis.length - 1] : null;
  }

  setSpeed(speed: ReplaySpeed) {
    if (!(REPLAY_SPEEDS as readonly number[]).includes(speed)) return;
    this.patch({ playbackSpeed: speed });
    if (this.state.isPlaying) {
      this.pause();
      this.play();
    }
  }

  play() {
    if (this.state.isPlaying) return;
    if (this.state.currentReplayIndex >= this.state.replayEndIndex) return;
    this.patch({ isPlaying: true });
    const ms = Math.max(40, Math.round(1000 / this.state.playbackSpeed));
    this.timer = setInterval(() => {
      if (this.state.currentReplayIndex >= this.state.replayEndIndex) {
        this.pause();
        return;
      }
      this.step(1);
    }, ms);
  }

  pause() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.state.isPlaying) this.patch({ isPlaying: false });
  }

  /** Advance (or rewind with negative) by N candles without look-ahead past end. */
  step(n: number) {
    if (!Number.isFinite(n) || n === 0) return;
    const next = Math.max(
      this.state.replayStartIndex,
      Math.min(this.state.replayEndIndex, this.state.currentReplayIndex + Math.trunc(n)),
    );
    if (next === this.state.currentReplayIndex) {
      if (next >= this.state.replayEndIndex) this.pause();
      return;
    }
    this.patch({ currentReplayIndex: next });
    if (next >= this.state.replayEndIndex) this.pause();
  }

  seekToIndex(index: number) {
    const next = Math.max(
      this.state.replayStartIndex,
      Math.min(this.state.replayEndIndex, Math.trunc(index)),
    );
    this.patch({ currentReplayIndex: next });
  }

  restart() {
    this.pause();
    this.patch({ currentReplayIndex: this.state.replayStartIndex });
  }

  dispose() {
    this.pause();
    this.listeners.clear();
  }
}

/** Find the nearest candle index at or after unixSeconds (or closest). */
export function findReplayStartIndex(candles: ReplayCandle[], unixSeconds: number): number {
  if (!candles.length) return 0;
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < candles.length; i++) {
    const d = Math.abs(candles[i].time - unixSeconds);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}
