/** Indicators with live math in IndicatorBank — safe to overlay on charts. */
export const SUPPORTED_CHART_INDICATORS = [
  { name: "Simple Moving Average", category: "Trend", abbr: "SMA", activeColor: "#00FFFF" },
  { name: "Exponential Moving Average", category: "Trend", abbr: "EMA", activeColor: "#FFAA00" },
  { name: "Relative Strength Index", category: "Momentum", abbr: "RSI", activeColor: "#00FF66" },
  { name: "MACD", category: "Momentum", abbr: "MACD", activeColor: "#FF00C8" },
  { name: "Bollinger Bands", category: "Volatility", abbr: "BB", activeColor: "#7A3BFF" },
  { name: "Average True Range", category: "Volatility", abbr: "ATR", activeColor: "#FF4500" },
  { name: "Average Directional Index", category: "Trend", abbr: "ADX", activeColor: "#00D9FF" },
  { name: "On-Balance Volume", category: "Volume", abbr: "OBV", activeColor: "#118AB2" },
  { name: "Volume Weighted Average Price", category: "Volume", abbr: "VWAP", activeColor: "#F72585" },
  { name: "Ichimoku Cloud", category: "Trend", abbr: "ICHIMOKU", activeColor: "#2EC4B6" },
] as const;
