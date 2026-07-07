import { Candle } from "../../types/indicators";
import { IndicatorBank } from "./IndicatorBank";

export class IndicatorEngine {
  static calculate(indicator: string, candles: Candle[], settings?: any): any {
    const sym = indicator.toUpperCase();
    const fn = IndicatorBank[sym];

    if (!fn) {
      throw new Error(`Indicator calculation function not registered in IndicatorBank: ${indicator}`);
    }

    if (sym === "SMA" || sym === "EMA" || sym === "WMA" || sym === "TEMA" || sym === "HMA" || sym === "DEMA" || sym === "KAMA" || sym === "ATR" || sym === "RSI" || sym === "ADX") {
      return fn(candles, settings?.period);
    }
    if (sym === "ICHIMOKU") {
      return fn(
        candles,
        settings?.conversionPeriods || 9,
        settings?.basePeriods || 26,
        settings?.laggingSpan2Periods || 52,
        settings?.displacement || 26
      );
    }
    if (sym === "MACD") {
      return fn(
        candles,
        settings?.fastPeriod || 12,
        settings?.slowPeriod || 26,
        settings?.signalPeriod || 9
      );
    }
    if (sym === "BB" || sym === "KC") {
      return fn(candles, settings?.period || 20, settings?.multiplier || 2);
    }
    if (sym === "DC") {
      return fn(candles, settings?.period || 20);
    }
    if (sym === "STOCH") {
      return fn(candles, settings?.kPeriod || 14, settings?.dPeriod || 3);
    }
    if (sym === "STOCHRSI") {
      return fn(
        candles,
        settings?.rsiPeriod || 14,
        settings?.stochPeriod || 14,
        settings?.kSmooth || 3,
        settings?.dSmooth || 3,
      );
    }
    if (sym === "SUPERTREND") {
      return fn(candles, settings?.period || 10, settings?.multiplier || 3);
    }
    if (sym === "CCI" || sym === "WPR" || sym === "ROC" || sym === "MFI" || sym === "CMF" || sym === "DPO" || sym === "TRIX" || sym === "AROON" || sym === "FI") {
      return fn(candles, settings?.period);
    }
    if (sym === "ULTOSC") {
      return fn(candles, settings?.period1 || 7, settings?.period2 || 14, settings?.period3 || 28);
    }
    if (sym === "KST") {
      return fn(
        candles,
        settings?.rocPer1 || 10,
        settings?.rocPer2 || 15,
        settings?.rocPer3 || 20,
        settings?.rocPer4 || 30,
        settings?.smaRocPer1 || 10,
        settings?.smaRocPer2 || 10,
        settings?.smaRocPer3 || 10,
        settings?.smaRocPer4 || 15,
        settings?.signalPeriod || 9,
      );
    }
    if (sym === "PIVOT") {
      return fn(candles, settings?.lookback || 24);
    }
    if (sym === "AO") {
      return fn(candles, settings?.fastPeriod || 5, settings?.slowPeriod || 34);
    }
    if (sym === "PSAR") {
      return fn(candles, settings?.step || 0.02, settings?.maxStep || 0.2);
    }
    if (sym === "VWAP" || sym === "OBV") {
      return fn(candles);
    }

    return fn(candles, settings);
  }
}
