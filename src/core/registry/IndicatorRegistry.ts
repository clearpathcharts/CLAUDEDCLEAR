import { IndicatorDefinition } from "../../types/indicators";
import { IndicatorCategory } from "./CategoryRegistry";

export const IndicatorRegistry: IndicatorDefinition[] = [
  {
    id: "sma",
    name: "Simple Moving Average",
    abbr: "SMA",
    category: IndicatorCategory.Trend,
    activeColor: "#00FFFF",
    sourceFile: "indicators/trend/SMA.ts",
    parameters: { period: 20 }
  },
  {
    id: "ema",
    name: "Exponential Moving Average",
    abbr: "EMA",
    category: IndicatorCategory.Trend,
    activeColor: "#FFAA00",
    sourceFile: "indicators/trend/EMA.ts",
    parameters: { period: 50 }
  },
  {
    id: "ichimoku",
    name: "Ichimoku Cloud",
    abbr: "ICHIMOKU",
    category: IndicatorCategory.Trend,
    activeColor: "#2EC4B6",
    sourceFile: "indicators/trend/IchimokuCloud.ts",
    parameters: { conversionPeriods: 9, basePeriods: 26, laggingSpan2Periods: 52, displacement: 26 }
  },
  {
    id: "rsi",
    name: "Relative Strength Index",
    abbr: "RSI",
    category: IndicatorCategory.Momentum,
    activeColor: "#00FF66",
    sourceFile: "indicators/momentum/RSI.ts",
    parameters: { period: 14 }
  },
  {
    id: "macd",
    name: "Moving Average Convergence Divergence",
    abbr: "MACD",
    category: IndicatorCategory.Momentum,
    activeColor: "#FF4D4D", // removed magenta default (#FF00C8)
    sourceFile: "indicators/momentum/MACD.ts",
    parameters: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 }
  },
  {
    id: "atr",
    name: "Average True Range",
    abbr: "ATR",
    category: IndicatorCategory.Volatility,
    activeColor: "#FF4500",
    sourceFile: "indicators/volatility/ATR.ts",
    parameters: { period: 14 }
  },
  {
    id: "bb",
    name: "Bollinger Bands",
    abbr: "BB",
    category: IndicatorCategory.Volatility,
    activeColor: "#7A3BFF",
    sourceFile: "indicators/volatility/BollingerBands.ts",
    parameters: { period: 20, multiplier: 2 }
  },
  {
    id: "vwap",
    name: "Volume Weighted Average Price",
    abbr: "VWAP",
    category: IndicatorCategory.Volume,
    activeColor: "#F72585",
    sourceFile: "indicators/volume/VWAP.ts",
    parameters: {}
  },
  {
    id: "obv",
    name: "On-Balance Volume",
    abbr: "OBV",
    category: IndicatorCategory.Volume,
    activeColor: "#118AB2",
    sourceFile: "indicators/volume/OBV.ts",
    parameters: {}
  },
  {
    id: "adx",
    name: "Average Directional Index",
    abbr: "ADX",
    category: IndicatorCategory.Trend,
    activeColor: "#00D9FF",
    sourceFile: "indicators/trend/ADX.ts",
    parameters: { period: 14 }
  },
  {
    id: "wma",
    name: "Weighted Moving Average",
    abbr: "WMA",
    category: IndicatorCategory.Trend,
    activeColor: "#3E78FF",
    sourceFile: "indicators/trend/WMA.ts",
    parameters: { period: 20 }
  },
  {
    id: "psar",
    name: "Parabolic SAR",
    abbr: "PSAR",
    category: IndicatorCategory.Trend,
    activeColor: "#FFD166",
    sourceFile: "indicators/trend/ParabolicSAR.ts",
    parameters: { step: 0.02, maxStep: 0.2 }
  },
  {
    id: "stoch",
    name: "Stochastic Oscillator",
    abbr: "STOCH",
    category: IndicatorCategory.Momentum,
    activeColor: "#B5179E",
    sourceFile: "indicators/momentum/Stochastic.ts",
    parameters: { kPeriod: 14, dPeriod: 3 }
  },
  {
    id: "cci",
    name: "Commodity Channel Index",
    abbr: "CCI",
    category: IndicatorCategory.Momentum,
    activeColor: "#9D4EDD",
    sourceFile: "indicators/momentum/CCI.ts",
    parameters: { period: 20 }
  },
  {
    id: "wpr",
    name: "Williams %R",
    abbr: "WPR",
    category: IndicatorCategory.Momentum,
    activeColor: "#06D6A0",
    sourceFile: "indicators/momentum/WilliamsR.ts",
    parameters: { period: 14 }
  },
  {
    id: "roc",
    name: "Rate of Change",
    abbr: "ROC",
    category: IndicatorCategory.Momentum,
    activeColor: "#480CA8",
    sourceFile: "indicators/momentum/ROC.ts",
    parameters: { period: 12 }
  },
  {
    id: "ao",
    name: "Awesome Oscillator",
    abbr: "AO",
    category: IndicatorCategory.Momentum,
    activeColor: "#3E78FF",
    sourceFile: "indicators/momentum/AO.ts",
    parameters: { fastPeriod: 5, slowPeriod: 34 }
  },
  {
    id: "dc",
    name: "Donchian Channels",
    abbr: "DC",
    category: IndicatorCategory.Volatility,
    activeColor: "#F72585",
    sourceFile: "indicators/volatility/DonchianChannels.ts",
    parameters: { period: 20 }
  },
  {
    id: "mfi",
    name: "Money Flow Index",
    abbr: "MFI",
    category: IndicatorCategory.Volume,
    activeColor: "#00D9FF",
    sourceFile: "indicators/volume/MFI.ts",
    parameters: { period: 14 }
  },
  {
    id: "cmf",
    name: "Chaikin Money Flow",
    abbr: "CMF",
    category: IndicatorCategory.Volume,
    activeColor: "#00E5FF",
    sourceFile: "indicators/volume/CMF.ts",
    parameters: { period: 20 }
  },
  {
    id: "tema",
    name: "Triple Exponential Moving Average",
    abbr: "TEMA",
    category: IndicatorCategory.Trend,
    activeColor: "#AA00FF",
    sourceFile: "indicators/trend/TEMA.ts",
    parameters: { period: 20 }
  },
  {
    id: "hma",
    name: "Hull Moving Average",
    abbr: "HMA",
    category: IndicatorCategory.Trend,
    activeColor: "#EF476F",
    sourceFile: "indicators/trend/HMA.ts",
    parameters: { period: 20 }
  },
  {
    id: "supertrend",
    name: "Supertrend",
    abbr: "SUPERTREND",
    category: IndicatorCategory.Trend,
    activeColor: "#00FFCC",
    sourceFile: "indicators/trend/Supertrend.ts",
    parameters: { period: 10, multiplier: 3 }
  },
  {
    id: "kc",
    name: "Keltner Channels",
    abbr: "KC",
    category: IndicatorCategory.Volatility,
    activeColor: "#E71D36",
    sourceFile: "indicators/volatility/KeltnerChannels.ts",
    parameters: { period: 20, multiplier: 2 }
  },
  {
    id: "stochrsi",
    name: "Stochastic RSI",
    abbr: "STOCHRSI",
    category: IndicatorCategory.Momentum,
    activeColor: "#FF0055",
    sourceFile: "indicators/momentum/StochRSI.ts",
    parameters: { rsiPeriod: 14, stochPeriod: 14, kSmooth: 3, dSmooth: 3 }
  }
];

/** Abbreviations that plot on live charts via IndicatorEngine. */
export const IMPLEMENTED_CHART_ABBRS = IndicatorRegistry.map((i) => i.abbr);

