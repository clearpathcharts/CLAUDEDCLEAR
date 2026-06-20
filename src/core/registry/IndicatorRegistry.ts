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
  }
];
