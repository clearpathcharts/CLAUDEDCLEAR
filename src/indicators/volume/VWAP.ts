import { Candle } from "../../types/indicators";

function candleVolume(c: Candle): number {
  return typeof c.volume === "number" && Number.isFinite(c.volume) ? c.volume : 0;
}

/** UTC calendar day key from unix seconds (or ms). */
function sessionKey(time: number): string {
  const ms = time > 1e12 ? time : time * 1000;
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Session VWAP: resets on each UTC day.
 * Typical price = (H+L+C)/3. Missing volume contributes 0 (no fake volume=1).
 */
export function calculateVWAP(data: Candle[]): { time: number; value: number }[] {
  if (data.length === 0) return [];

  let cumulativePv = 0;
  let cumulativeVol = 0;
  let currentSession: string | null = null;
  let lastVwap = data[0].close;

  return data.map((d) => {
    const key = sessionKey(d.time);
    if (currentSession !== key) {
      currentSession = key;
      cumulativePv = 0;
      cumulativeVol = 0;
    }

    const typicalPrice = (d.high + d.low + d.close) / 3;
    const vol = candleVolume(d);
    cumulativePv += typicalPrice * vol;
    cumulativeVol += vol;

    if (cumulativeVol > 0) {
      lastVwap = cumulativePv / cumulativeVol;
    }

    return {
      time: d.time,
      value: lastVwap,
    };
  });
}
