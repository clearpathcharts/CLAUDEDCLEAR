import { Candle } from "../../types/indicators";
import { IndicatorBank } from "./IndicatorBank";

export class IndicatorEngine {
  static calculate(indicator: string, candles: Candle[], settings?: any): any {
    const raw = indicator.toUpperCase();
    const sym = raw === "A/D" ? "AD" : raw;
    const fn = IndicatorBank[sym] || IndicatorBank[raw];

    if (!fn) {
      throw new Error(`Indicator calculation function not registered in IndicatorBank: ${indicator}`);
    }

    const p = settings?.period;
    const s = settings || {};

    switch (sym) {
      case "SMA":
      case "EMA":
      case "WMA":
      case "VWMA":
      case "DEMA":
      case "TEMA":
      case "HMA":
      case "LRC":
      case "ATR":
      case "RSI":
      case "ADX":
      case "DMI":
      case "ROC":
      case "CCI":
      case "WPR":
      case "CMO":
      case "DPO":
      case "TRIX":
      case "BBW":
      case "DC":
      case "HV":
      case "CMF":
      case "MFI":
      case "EFI":
      case "EOM":
      case "FT":
        return fn(candles, p ?? defaultPeriod(sym));
      case "ICHIMOKU":
        return fn(
          candles,
          s.conversionPeriods || 9,
          s.basePeriods || 26,
          s.laggingSpan2Periods || 52,
          s.displacement || 26
        );
      case "MACD":
      case "PPO":
        return fn(candles, s.fastPeriod || 12, s.slowPeriod || 26, s.signalPeriod || 9);
      case "BB":
        return fn(candles, s.period || 20, s.multiplier || 2);
      case "KC":
        return fn(candles, s.emaPeriod || 20, s.atrPeriod || 10, s.multiplier || 2);
      case "STOCH":
        return fn(candles, s.kPeriod || 14, s.kSmooth || 3, s.dPeriod || 3);
      case "STOCHRSI":
        return fn(candles, s.rsiPeriod || 14, s.stochPeriod || 14, s.kSmooth || 3, s.dPeriod || 3);
      case "AO":
        return fn(candles, s.fastPeriod || 5, s.slowPeriod || 34);
      case "RVI":
        return fn(candles, s.period || 10);
      case "TSI":
        return fn(candles, s.longPeriod || 25, s.shortPeriod || 13, s.signalPeriod || 13);
      case "UO":
        return fn(candles, s.p1 || 7, s.p2 || 14, s.p3 || 28);
      case "PSAR":
        return fn(candles, s.step || 0.02, s.maxStep || 0.2);
      case "SUPERTREND":
        return fn(candles, s.atrPeriod || 10, s.multiplier || 3);
      case "ZZ":
        return fn(candles, s.deviationPct || 5);
      case "CHV":
        return fn(candles, s.emaPeriod || 10, s.rocPeriod || 10);
      case "VO":
        return fn(candles, s.fastPeriod || 5, s.slowPeriod || 10);
      case "CC":
        return fn(candles, s.roc1 || 14, s.roc2 || 11, s.wmaPeriod || 10);
      case "VWAP":
      case "OBV":
      case "AD":
      case "VOL":
      case "NETVOL":
      case "PIVOT":
      case "KST":
        return fn(candles);
      default:
        return fn(candles, settings);
    }
  }
}

function defaultPeriod(sym: string): number {
  switch (sym) {
    case "EMA":
      return 50;
    case "ROC":
      return 12;
    case "LRC":
      return 25;
    case "TRIX":
      return 15;
    case "EFI":
      return 13;
    default:
      return 14;
  }
}
