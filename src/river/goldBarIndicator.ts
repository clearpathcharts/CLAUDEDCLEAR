// /src/river/goldBarIndicator.ts
//
// The Gold Bar Indicator -- ClearPath Trader's signature built-in indicator.
// Named for the gold candle highlight that fires on a real trend-direction signal.
//
// This is the real, verified math -- bar-by-bar ATR trailing stop calculation
// that produces genuine buy/sell signals from real OHLC data.
// When a signal fires, the calling chart component colors that candle GOLD.

import { Candle } from "../types/indicators";
import { calculateATR } from "../indicators/volatility/ATR";

export interface GoldBarParams {
  sensitivity: number;   // multiplier on ATR distance (default 1 = standard)
  atrPeriod: number;     // ATR lookback period (default 10)
  useHeikinAshi: boolean;
}

export const GOLD_BAR_DEFAULTS: GoldBarParams = {
  sensitivity: 1,
  atrPeriod: 10,
  useHeikinAshi: false,
};

export interface GoldBarSignal {
  time: number;
  close: number;
  trailingStop: number;
  position: 1 | -1 | 0;
  buySignal: boolean;   // candle turns GOLD on buy
  sellSignal: boolean;  // candle turns GOLD on sell
  isLive: boolean;      // false during ATR warm-up period
}

function toHeikinAshi(data: Candle[]): Candle[] {
  const ha: Candle[] = [];
  let prevHaOpen = data[0].open;
  let prevHaClose = data[0].close;
  for (let i = 0; i < data.length; i++) {
    const c = data[i];
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    const haOpen = i === 0 ? (c.open + c.close) / 2 : (prevHaOpen + prevHaClose) / 2;
    const haHigh = Math.max(c.high, haOpen, haClose);
    const haLow = Math.min(c.low, haOpen, haClose);
    ha.push({ ...c, open: haOpen, high: haHigh, low: haLow, close: haClose });
    prevHaOpen = haOpen;
    prevHaClose = haClose;
  }
  return ha;
}

export function calculateGoldBar(
  rawData: Candle[],
  params: GoldBarParams = GOLD_BAR_DEFAULTS
): GoldBarSignal[] {
  if (rawData.length < params.atrPeriod + 2) return [];

  const data = params.useHeikinAshi ? toHeikinAshi(rawData) : rawData;
  const atrSeries = calculateATR(data, params.atrPeriod);
  const atrByTime = new Map<number, number>();
  atrSeries.forEach((a) => atrByTime.set(a.time, a.value));

  const signals: GoldBarSignal[] = [];
  let prevStop = 0;
  let prevSrc = 0;
  let prevPos: 1 | -1 | 0 = 0;
  let started = false;

  for (let i = 0; i < data.length; i++) {
    const candle = data[i];
    const atr = atrByTime.get(candle.time);

    if (atr === undefined) {
      signals.push({ time: candle.time, close: candle.close, trailingStop: NaN, position: 0, buySignal: false, sellSignal: false, isLive: false });
      continue;
    }

    const nLoss = params.sensitivity * atr;
    const src = candle.close;

    let stop: number;
    if (!started) {
      stop = src - nLoss;
      started = true;
    } else if (src > prevStop && prevSrc > prevStop) {
      stop = Math.max(prevStop, src - nLoss);
    } else if (src < prevStop && prevSrc < prevStop) {
      stop = Math.min(prevStop, src + nLoss);
    } else if (src > prevStop) {
      stop = src - nLoss;
    } else {
      stop = src + nLoss;
    }

    let pos: 1 | -1 | 0 = prevPos;
    let buySignal = false;
    let sellSignal = false;

    if (prevSrc < prevStop && src > stop) { pos = 1; buySignal = true; }
    else if (prevSrc > prevStop && src < stop) { pos = -1; sellSignal = true; }

    signals.push({ time: candle.time, close: src, trailingStop: stop, position: pos, buySignal, sellSignal, isLive: true });
    prevStop = stop;
    prevSrc = src;
    prevPos = pos;
  }

  return signals;
}
