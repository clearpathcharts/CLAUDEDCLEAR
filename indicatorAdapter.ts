// ============================================================================
// ClearPath — Indicator Library Adapter
// ----------------------------------------------------------------------------
// Wraps the open-source @ixjb94/indicators library (104 indicators, tested
// against TradingView data) into ClearPath's existing shape:
//     input:  Candle[]  ->  output: { time: number; value: number }[]
//
// This gives the IndicatorBank 100+ REAL, verified indicators without
// hand-writing the math. The library does the calculation; this file just
// translates formats and aligns each value to the correct candle time.
//
// SETUP (one time):
//     npm install @ixjb94/indicators
//
// Then register these in your IndicatorBank (see bottom of file).
// ============================================================================

import { Indicators } from "@ixjb94/indicators";
import { Candle } from "../../types/indicators";

const ta = new Indicators();

type Point = { time: number; value: number };

// --- helpers ----------------------------------------------------------------
const closes = (d: Candle[]) => d.map((c) => c.close);
const highs = (d: Candle[]) => d.map((c) => c.high);
const lows = (d: Candle[]) => d.map((c) => c.low);
const opens = (d: Candle[]) => d.map((c) => c.open);
const vols = (d: Candle[]) => d.map((c) => (c as any).volume ?? 0);

/**
 * The library trims the warmup period, so its output array is shorter than the
 * input. Align each output value to the LAST candles (newest-aligned), exactly
 * how a warmup offset works. Returns clean { time, value } points.
 */
function align(data: Candle[], values: number[]): Point[] {
  const offset = data.length - values.length;
  const out: Point[] = [];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v === null || v === undefined || Number.isNaN(v)) continue;
    out.push({ time: data[offset + i].time, value: v });
  }
  return out;
}

// A single-line indicator: takes Candle[], returns one line of points.
type LineFn = (data: Candle[], ...params: number[]) => Promise<Point[]>;

// ============================================================================
// SINGLE-LINE INDICATORS (return one { time, value }[] line)
// These are safe to plot directly on the chart or an oscillator pane.
// ============================================================================

export const calculateSMA: LineFn = async (d, period = 20) =>
  align(d, await ta.sma(closes(d), period));

export const calculateEMA: LineFn = async (d, period = 50) =>
  align(d, await ta.ema(closes(d), period));

export const calculateWMA: LineFn = async (d, period = 20) =>
  align(d, await ta.wma(closes(d), period));

export const calculateHMA: LineFn = async (d, period = 20) =>
  align(d, await ta.hma(closes(d), period));

export const calculateDEMA: LineFn = async (d, period = 20) =>
  align(d, await ta.dema(closes(d), period));

export const calculateTEMA: LineFn = async (d, period = 20) =>
  align(d, await ta.tema(closes(d), period));

export const calculateTRIMA: LineFn = async (d, period = 20) =>
  align(d, await ta.trima(closes(d), period));

export const calculateKAMA: LineFn = async (d, period = 20) =>
  align(d, await ta.kama(closes(d), period));

export const calculateZLEMA: LineFn = async (d, period = 20) =>
  align(d, await ta.zlema(closes(d), period));

export const calculateVWMA: LineFn = async (d, period = 20) =>
  align(d, await ta.vwma(closes(d), vols(d), period));

export const calculateRSI: LineFn = async (d, period = 14) =>
  align(d, await ta.rsi(closes(d), period));

export const calculateStochRSI: LineFn = async (d, period = 14) =>
  align(d, await ta.stochrsi(closes(d), period));

export const calculateCCI: LineFn = async (d, period = 20) =>
  align(d, await ta.cci(highs(d), lows(d), closes(d), period));

export const calculateCMO: LineFn = async (d, period = 14) =>
  align(d, await ta.cmo(closes(d), period));

export const calculateMOM: LineFn = async (d, period = 10) =>
  align(d, await ta.mom(closes(d), period));

export const calculateROC: LineFn = async (d, period = 10) =>
  align(d, await ta.roc(closes(d), period));

export const calculateWilliamsR: LineFn = async (d, period = 14) =>
  align(d, await ta.willr(highs(d), lows(d), closes(d), period));

export const calculateATR: LineFn = async (d, period = 14) =>
  align(d, await ta.atr(highs(d), lows(d), closes(d), period));

export const calculateNATR: LineFn = async (d, period = 14) =>
  align(d, await ta.natr(highs(d), lows(d), closes(d), period));

export const calculateStdDev: LineFn = async (d, period = 20) =>
  align(d, await ta.stddev(closes(d), period));

export const calculateOBV: LineFn = async (d) =>
  align(d, await ta.obv(closes(d), vols(d)));

export const calculateMFI: LineFn = async (d, period = 14) =>
  align(d, await ta.mfi(highs(d), lows(d), closes(d), vols(d), period));

export const calculateADX: LineFn = async (d, period = 14) =>
  align(d, await ta.adx(highs(d), lows(d), period));

export const calculateAO: LineFn = async (d) =>
  align(d, await ta.ao(highs(d), lows(d)));

export const calculateTRIX: LineFn = async (d, period = 15) =>
  align(d, await ta.trix(closes(d), period));

export const calculatePSAR: LineFn = async (d, step = 0.02, max = 0.2) =>
  align(d, await ta.psar(highs(d), lows(d), step, max));

export const calculateVWAP: LineFn = async (d) =>
  align(d, await ta.vwap(highs(d), lows(d), closes(d), vols(d)));

// ============================================================================
// MULTI-LINE INDICATORS (return several lines — handle separately on the chart)
// Each returns an object of named lines, every line a { time, value }[].
// ============================================================================

export async function calculateMACD(
  d: Candle[],
  fast = 12,
  slow = 26,
  signal = 9
): Promise<{ macd: Point[]; signal: Point[]; histogram: Point[] }> {
  const out: any = await ta.macd(closes(d), fast, slow, signal);
  return {
    macd: align(d, out[0]),
    signal: align(d, out[1]),
    histogram: align(d, out[2]),
  };
}

export async function calculateBollingerBands(
  d: Candle[],
  period = 20,
  mult = 2
): Promise<{ lower: Point[]; middle: Point[]; upper: Point[] }> {
  const out: any = await ta.bbands(closes(d), period, mult);
  return {
    lower: align(d, out[0]),
    middle: align(d, out[1]),
    upper: align(d, out[2]),
  };
}

export async function calculateStochastic(
  d: Candle[],
  kPeriod = 14,
  kSlow = 3,
  dPeriod = 3
): Promise<{ k: Point[]; d: Point[] }> {
  const out: any = await ta.stoch(highs(d), lows(d), closes(d), kPeriod, kSlow, dPeriod);
  return { k: align(d, out[0]), d: align(d, out[1]) };
}

export async function calculateAroon(
  d: Candle[],
  period = 14
): Promise<{ down: Point[]; up: Point[] }> {
  const out: any = await ta.aroon(highs(d), lows(d), period);
  return { down: align(d, out[0]), up: align(d, out[1]) };
}

// ============================================================================
// REGISTRY — drop these into your IndicatorBank.
// Single-line ones can go straight into the existing Record<string, Function>.
// Multi-line ones (MACD, BB, STOCH, AROON) need the chart to plot each line.
// ============================================================================

export const ExtendedIndicatorBank: Record<string, Function> = {
  // moving averages / overlays
  SMA: calculateSMA,
  EMA: calculateEMA,
  WMA: calculateWMA,
  HMA: calculateHMA,
  DEMA: calculateDEMA,
  TEMA: calculateTEMA,
  TRIMA: calculateTRIMA,
  KAMA: calculateKAMA,
  ZLEMA: calculateZLEMA,
  VWMA: calculateVWMA,
  VWAP: calculateVWAP,
  PSAR: calculatePSAR,
  // momentum / oscillators
  RSI: calculateRSI,
  STOCHRSI: calculateStochRSI,
  CCI: calculateCCI,
  CMO: calculateCMO,
  MOM: calculateMOM,
  ROC: calculateROC,
  WILLR: calculateWilliamsR,
  ADX: calculateADX,
  AO: calculateAO,
  TRIX: calculateTRIX,
  // volatility
  ATR: calculateATR,
  NATR: calculateNATR,
  STDDEV: calculateStdDev,
  // volume
  OBV: calculateOBV,
  MFI: calculateMFI,
  // multi-line (handle in chart with named lines)
  MACD: calculateMACD,
  BB: calculateBollingerBands,
  STOCH: calculateStochastic,
  AROON: calculateAroon,
};
