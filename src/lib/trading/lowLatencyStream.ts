/**
 * LOW LATENCY STREAM (File 117)
 */

export interface NormalizedTick {
  symbol: string;
  price: number;
  prevPrice?: number;
  volume: number;
  time: number;
}

export class LowLatencyStream {
  private subscribers: ((ticks: NormalizedTick[]) => void)[] = [];
  private lastTick: Record<string, NormalizedTick> = {};
  private throttleMs = 100;
  private timer: NodeJS.Timeout | null = null;

  subscribe(fn: (ticks: NormalizedTick[]) => void) {
    this.subscribers.push(fn);
  }

  ingest(tick: { symbol: string; price: number; volume?: number; time?: number }) {
    const prev = this.lastTick[tick.symbol];
    const normalized: NormalizedTick = {
      symbol: tick.symbol,
      price: tick.price,
      prevPrice: prev?.price,
      volume: tick.volume || 1,
      time: tick.time || Date.now()
    };

    this.lastTick[tick.symbol] = normalized;
    this.scheduleEmit();
  }

  private scheduleEmit() {
    if (this.timer) return;

    this.timer = setTimeout(() => {
      this.timer = null;
      const snapshot = Object.values(this.lastTick);

      // Smooth prices
      snapshot.forEach(t => {
        if (t.prevPrice) {
          t.price = (t.price * 0.7) + (t.prevPrice * 0.3);
        }
      });

      this.subscribers.forEach(fn => fn(snapshot));
    }, this.throttleMs);
  }
}
