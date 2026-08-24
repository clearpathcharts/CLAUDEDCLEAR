import { INDICATOR_DESCRIPTIONS } from './indicatorDescriptions';
import { getIndicatorGuide, type IndicatorGuide } from './indicatorGuides';
import { SUPPORTED_CHART_INDICATORS } from '../config/tradingViewIndicators';

export const INDICATOR_NAMES = [
  "Acceleration Bands", "Accumulation/Distribution Line", "Advance/Decline Line", "Advance-Decline Ratio",
  "ADX (Average Directional Index)", "Alligator Indicator", "Alpha", "Andrews Pitchfork", "Aroon Indicator",
  "Aroon Oscillator", "ATR (Average True Range)", "Average Price", "Average Volume", "Awesome Oscillator",
  "Balance of Power", "Beta", "Bid-Ask Spread", "Bollinger Bands", "Bollinger Band Width", "Breadth Thrust",
  "Bull Bear Power", "Bull Market Support Band",
  "Camarilla Pivot Points", "Candlestick Pattern Index", "CCI (Commodity Channel Index)", "Center of Gravity",
  "Chaikin Money Flow", "Chaikin Oscillator", "Chaikin Volatility", "Chande Forecast Oscillator", "Chande Momentum Oscillator",
  "Channel Index", "Closing Price Location Value", "Commitment of Traders (COT)", "Commodity Selection Index",
  "Composite Index", "Connors RSI", "Coppock Curve", "Correlation Coefficient", "Cumulative Delta",
  "Detrended Price Oscillator", "Demand Index", "DeMarker Indicator", "Directional Movement Index (DMI)",
  "Donchian Channels", "Double EMA", "Downside Deviation", "DPO",
  "Ease of Movement", "Elder Force Index", "Elder Ray", "Elliott Wave Oscillator", "EMA (Exponential Moving Average)",
  "Envelope Indicator",
  "Fair Value Gap", "Fast Stochastic", "Fibonacci Arcs", "Fibonacci Channels", "Fibonacci Expansion",
  "Fibonacci Fan", "Fibonacci Retracement", "Fisher Transform", "Force Index", "Fractal Indicator",
  "Gann Fan", "Gann Grid", "Gann Square", "Golden Cross", "Gravity Center", "Gross Domestic Product (GDP)",
  "Harmonic Patterns", "Heikin Ashi", "Historical Volatility", "Hull Moving Average",
  "Ichimoku Cloud", "Implied Volatility", "Inflation Rate", "Interest Coverage Ratio", "Interest Rate Differential",
  "Internal Bar Strength",
  "Jurik Moving Average",
  "Kairi Relative Index", "Keltner Channels", "Know Sure Thing (KST)",
  "Lagging Span", "Linear Regression", "Linear Regression Channel", "Liquidity Void", "Local Volatility", "Log Return",
  "MACD", "MACD Histogram", "Market Breadth", "Market Facilitation Index", "Market Profile", "Market Sentiment Index",
  "Mass Index", "McClellan Oscillator", "McClellan Summation Index", "Median Price", "Momentum", "Money Flow Index",
  "Moving Average", "Moving Average Envelope",
  "Nasdaq Advance Decline", "Negative Volume Index", "Net Change", "Net Volume", "New High New Low Index", "NFP (Non-Farm Payrolls)",
  "OBV (On Balance Volume)", "Open Interest", "Option Delta", "Option Gamma", "Option Theta", "Option Vega",
  "Oscillator of Moving Average",
  "Parabolic SAR", "Percent B", "Percent Price Oscillator", "Pivot Points", "Positive Volume Index", "PPO",
  "Price Action Channel", "Price Oscillator", "Price Rate of Change", "Price Volume Trend", "Put Call Ratio",
  "Qstick Indicator", "Quadrant Lines",
  "Rate of Change", "Relative Strength Index (RSI)", "Relative Vigor Index", "Renko Trend", "Risk Reward Ratio",
  "ROC", "Rolling Volatility",
  "Schaff Trend Cycle", "Seasonal Index", "Sharpe Ratio", "Slow Stochastic", "SMA (Simple Moving Average)",
  "Smoothed Moving Average", "Sortino Ratio", "Spread Indicator", "Standard Deviation", "Standard Error",
  "Stochastic Momentum Index", "Stochastic RSI", "SuperTrend", "Support and Resistance", "Swing Index",
  "T3 Moving Average", "TEMA", "Tick Index", "Time Segmented Volume", "TRIN (Arms Index)", "Triple EMA",
  "Triple Top Bottom", "TRIX", "True Strength Index", "Turtle Channels",
  "Ulcer Index", "Ultimate Oscillator", "Unemployment Rate", "Upside Downside Ratio",
  "Value Area", "Variable Moving Average", "Vertical Horizontal Filter", "VIX", "Volume", "Volume Delta",
  "Volume Oscillator", "Volume Profile", "Volume Rate of Change", "Volume Weighted Average Price (VWAP)",
  "Volume Weighted Moving Average", "Vortex Indicator",
  "Weighted Moving Average", "Williams %R", "Williams Accumulation Distribution", "Wolfe Waves",
  "XTL Trend Indicator",
  "Yield Curve", "Yield Spread",
  "Zig Zag Indicator", "Z-Score", "Zero Lag EMA", "Zero Line Cross", "ZLEMA"
];

const FUNDAMENTAL = new Set([
  "Gross Domestic Product (GDP)",
  "Unemployment Rate",
  "NFP (Non-Farm Payrolls)",
  "Inflation Rate",
  "Interest Coverage Ratio",
  "Interest Rate Differential",
  "Yield Curve",
  "Yield Spread",
  "Alpha",
  "Beta",
  "Sharpe Ratio",
  "Sortino Ratio",
]);

const DRAWING = new Set([
  "Andrews Pitchfork",
  "Fibonacci Arcs",
  "Fibonacci Channels",
  "Fibonacci Expansion",
  "Fibonacci Fan",
  "Fibonacci Retracement",
  "Gann Fan",
  "Gann Grid",
  "Gann Square",
  "Harmonic Patterns",
  "Quadrant Lines",
  "Support and Resistance",
  "Wolfe Waves",
]);

const LIVE_ABBRS = new Set(SUPPORTED_CHART_INDICATORS.map((i) => i.abbr));

/** Matches scripts/generate-indicator-svgs.mjs slugify output. */
export function indicatorImageSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[()%/]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function indicatorImagePath(name: string): string {
  return `/encyclopedia-indicators/${indicatorImageSlug(name)}.svg`;
}

/** Map encyclopedia names → chart bank abbreviations when a live overlay exists. */
const CHART_ABBR_BY_NAME: Record<string, string> = {
  "SMA (Simple Moving Average)": "SMA",
  "Moving Average": "SMA",
  "EMA (Exponential Moving Average)": "EMA",
  "Weighted Moving Average": "WMA",
  "Volume Weighted Moving Average": "VWMA",
  "Double EMA": "DEMA",
  TEMA: "TEMA",
  "Triple EMA": "TEMA",
  "Hull Moving Average": "HMA",
  "Linear Regression": "LRC",
  "Linear Regression Channel": "LRC",
  "Parabolic SAR": "PSAR",
  SuperTrend: "SUPERTREND",
  "Ichimoku Cloud": "ICHIMOKU",
  "Lagging Span": "ICHIMOKU",
  "Zig Zag Indicator": "ZZ",
  "Pivot Points": "PIVOT",
  "Camarilla Pivot Points": "PIVOT",
  "ADX (Average Directional Index)": "ADX",
  "Directional Movement Index (DMI)": "DMI",
  "Relative Strength Index (RSI)": "RSI",
  MACD: "MACD",
  "MACD Histogram": "MACD",
  "Fast Stochastic": "STOCH",
  "Slow Stochastic": "STOCH",
  "Stochastic RSI": "STOCHRSI",
  "CCI (Commodity Channel Index)": "CCI",
  "Williams %R": "WPR",
  "Rate of Change": "ROC",
  ROC: "ROC",
  "Price Rate of Change": "ROC",
  "Awesome Oscillator": "AO",
  "Price Oscillator": "PPO",
  PPO: "PPO",
  "Percent Price Oscillator": "PPO",
  "Chande Momentum Oscillator": "CMO",
  "Detrended Price Oscillator": "DPO",
  DPO: "DPO",
  "Relative Vigor Index": "RVI",
  TRIX: "TRIX",
  "True Strength Index": "TSI",
  "Ultimate Oscillator": "UO",
  "Know Sure Thing (KST)": "KST",
  "Fisher Transform": "FT",
  "Coppock Curve": "CC",
  "Bollinger Bands": "BB",
  "Bollinger Band Width": "BBW",
  "ATR (Average True Range)": "ATR",
  "Donchian Channels": "DC",
  "Turtle Channels": "DC",
  "Keltner Channels": "KC",
  "Historical Volatility": "HV",
  "Chaikin Volatility": "CHV",
  "OBV (On Balance Volume)": "OBV",
  "Volume Weighted Average Price (VWAP)": "VWAP",
  "Accumulation/Distribution Line": "AD",
  "Chaikin Money Flow": "CMF",
  "Money Flow Index": "MFI",
  "Elder Force Index": "EFI",
  "Force Index": "EFI",
  "Ease of Movement": "EOM",
  Volume: "VOL",
  "Net Volume": "NETVOL",
  "Volume Oscillator": "VO",
};

export function indicatorChartAbbr(name: string): string | null {
  const mapped = CHART_ABBR_BY_NAME[name];
  if (mapped && LIVE_ABBRS.has(mapped as (typeof SUPPORTED_CHART_INDICATORS)[number]["abbr"])) {
    return mapped;
  }
  return mapped ?? null;
}

export type IndicatorCategory =
  | "Trend"
  | "Momentum"
  | "Volatility"
  | "Volume"
  | "Breadth"
  | "Fundamental"
  | "Drawing"
  | "Options"
  | "Technical";

function classifyCategory(name: string): IndicatorCategory {
  if (FUNDAMENTAL.has(name)) return "Fundamental";
  if (DRAWING.has(name)) return "Drawing";
  const n = name.toLowerCase();
  if (/(option|delta|gamma|theta|vega|put call|open interest|implied volatility|vix)/.test(n)) return "Options";
  if (/(advance|decline|breadth|mcclellan|trin|tick index|new high|nasdaq)/.test(n)) return "Breadth";
  if (/(obv|volume|vwap|chaikin money|accumulation|williams accumulation|price volume|cumulative delta|ease of movement|market facilitation|time segmented|net volume)/.test(n)) {
    return "Volume";
  }
  if (/(atr|bollinger|keltner|donchian|turtle|historical volatility|chaikin volatility|standard deviation|ulcer|envelope|acceleration bands|percent b)/.test(n)) {
    return "Volatility";
  }
  if (/(rsi|stochastic|macd|cci|williams %r|roc|momentum|awesome|trix|tsi|ultimate|kst|fisher|coppock|cmo|dpo|rvi|aroon|demarker|connors|qstick|ppo|force)/.test(n)) {
    return "Momentum";
  }
  if (/(sma|ema|tema|dema|hull|ichimoku|parabolic|supertrend|adx|dmi|zig zag|pivot|moving average|linear regression|alligator|xtl|golden cross)/.test(n)) {
    return "Trend";
  }
  return "Technical";
}

function complexityFor(name: string, index: number): number {
  if (FUNDAMENTAL.has(name)) return 2;
  if (DRAWING.has(name)) return 4;
  if (indicatorChartAbbr(name)) return Math.min(3, Math.max(1, 1 + (index % 3)));
  return Math.min(5, Math.max(1, Math.round(2 + ((index * 13) % 18) / 10)));
}

export type IndicatorRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: IndicatorCategory;
  complexity: number;
  hasLiveOverlay: boolean;
  tags: string[];
  img: string;
  chartAbbr: string | null;
  guide: IndicatorGuide;
};

export function buildIndicators(): IndicatorRecord[] {
  const items: IndicatorRecord[] = [];
  for (let i = 0; i < INDICATOR_NAMES.length; i++) {
    const name = INDICATOR_NAMES[i];
    const category = classifyCategory(name);
    const chartAbbr = indicatorChartAbbr(name);
    const img = indicatorImagePath(name);
    const description =
      INDICATOR_DESCRIPTIONS[name] ||
      (category === "Fundamental"
        ? `Macro-economic indicator tracking ${name} for growth, risk, and policy context.`
        : `Technical indicator used to analyze ${name} on price, volume, or volatility.`);

    const tags = [
      category.toLowerCase(),
      chartAbbr ? "live-overlay" : "study-card",
      category === "Fundamental" ? "macro" : category === "Volume" ? "volume" : category === "Volatility" ? "volatility" : "price",
    ];

    items.push({
      id: `ind${i + 1}`,
      name,
      slug: indicatorImageSlug(name),
      description,
      category,
      complexity: complexityFor(name, i),
      hasLiveOverlay: Boolean(chartAbbr),
      tags,
      img,
      chartAbbr,
      guide: getIndicatorGuide(name, category, chartAbbr),
    });
  }
  return items;
}

const INDICATOR_CACHE = buildIndicators();

export function allBuiltIndicators(): IndicatorRecord[] {
  return INDICATOR_CACHE;
}

export function findIndicatorBySlug(slug: string): IndicatorRecord | undefined {
  const key = slug.toLowerCase();
  return INDICATOR_CACHE.find((p) => p.slug === key);
}
