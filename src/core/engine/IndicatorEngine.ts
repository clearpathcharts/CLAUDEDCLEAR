import { Candle } from "../../types/indicators";
import { IndicatorBank } from "./IndicatorBank";

export class IndicatorEngine {
  static calculate(indicator: string, candles: Candle[], settings?: any): any {
    const sym = indicator.toUpperCase();
    const fn = IndicatorBank[sym];

    if (!fn) {
      throw new Error(`Indicator calculation function not registered in IndicatorBank: ${indicator}`);
    }

    if (sym === "SMA" || sym === "EMA" || sym === "ATR" || sym === "RSI" || sym === "ADX") {
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
    if (sym === "BB") {
      return fn(candles, settings?.period || 20, settings?.multiplier || 2);
    }
    if (sym === "VWAP" || sym === "OBV") {
      return fn(candles);
    }

    return fn(candles, settings);
  }
}
