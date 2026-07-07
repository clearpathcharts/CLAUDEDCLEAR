import { IMPLEMENTED_CHART_ABBRS, IndicatorRegistry } from './IndicatorRegistry';

/** Exact encyclopedia directory names → live chart abbreviation. */
const ENCYCLOPEDIA_NAME_TO_ABBR: Record<string, string> = {
  'Acceleration Bands': 'ABANDS',
  'Accumulation/Distribution Line': 'AD',
  'ADX (Average Directional Index)': 'ADX',
  'Aroon Indicator': 'AROON',
  'Aroon Oscillator': 'AROONOSC',
  'ATR (Average True Range)': 'ATR',
  'Balance of Power': 'BOP',
  'Bollinger Bands': 'BB',
  'CCI (Commodity Channel Index)': 'CCI',
  'Chaikin Money Flow': 'CMF',
  'Chaikin Oscillator': 'ADOSC',
  'Chande Forecast Oscillator': 'FOSC',
  'Chande Momentum Oscillator': 'CMO',
  'Coppock Curve': 'COPP',
  'Detrended Price Oscillator': 'DPO',
  'DPO': 'DPO',
  'Donchian Channels': 'DC',
  'Ease of Movement': 'EMV',
  'EMA (Exponential Moving Average)': 'EMA',
  'Fisher Transform': 'FISHER',
  'Force Index': 'FI',
  'Historical Volatility': 'HVOL',
  'Hull Moving Average': 'HMA',
  'Ichimoku Cloud': 'ICHIMOKU',
  'Keltner Channels': 'KC',
  'Know Sure Thing (KST)': 'KST',
  'Linear Regression': 'LINREG',
  'MACD': 'MACD',
  'Market Facilitation Index': 'MARKETFI',
  'Momentum': 'MOM',
  'Money Flow Index': 'MFI',
  'Negative Volume Index': 'NVI',
  'OBV (On Balance Volume)': 'OBV',
  'Parabolic SAR': 'PSAR',
  'Pivot Points': 'PIVOT',
  'Positive Volume Index': 'PVI',
  'PPO': 'PPO',
  'Percent Price Oscillator': 'PPO',
  'Qstick Indicator': 'QSTICK',
  'Rate of Change': 'ROC',
  'ROC': 'ROC',
  'Relative Strength Index (RSI)': 'RSI',
  'SMA (Simple Moving Average)': 'SMA',
  'Smoothed Moving Average': 'SMMA',
  'Standard Deviation': 'STDDEV',
  'Stochastic Momentum Index': 'SMI',
  'Stochastic RSI': 'STOCHRSI',
  'SuperTrend': 'SUPERTREND',
  'TEMA': 'TEMA',
  'Triple EMA': 'TEMA',
  'True Strength Index': 'TSI',
  'Ultimate Oscillator': 'ULTOSC',
  'Vertical Horizontal Filter': 'VHF',
  'Volume Oscillator': 'VOSC',
  'Volume Weighted Average Price (VWAP)': 'VWAP',
  'Weighted Moving Average': 'WMA',
  'Williams %R': 'WPR',
  'Zero Lag EMA': 'ZLEMA',
  'ZLEMA': 'ZLEMA',
  'Fast Stochastic': 'STOCH',
  'Slow Stochastic': 'STOCH',
  'Awesome Oscillator': 'AO',
  'Trix': 'TRIX',
  'Double Exponential Moving Average (DEMA)': 'DEMA',
  'Kaufman Adaptive Moving Average (KAMA)': 'KAMA',
  'Triangular Moving Average (TRIMA)': 'TRIMA',
  'Arnaud Legoux Moving Average (ALMA)': 'ALMA',
  'Linear Regression Slope': 'LINREGSLOPE',
  'Linear Regression Intercept': 'LINREGINT',
  'Time Series Forecast (TSF)': 'TSF',
  'Volume Weighted Moving Average (VWMA)': 'VWMA',
  'Absolute Price Oscillator (APO)': 'APO',
  'Rate of Change Ratio (ROCR)': 'ROCR',
  'Relative Momentum Index (RMI)': 'RMI',
  'Normalized Average True Range (NATR)': 'NATR',
  'True Range (TR)': 'TR',
  'Klinger Volume Oscillator (KVO)': 'KVO',
  'Price Oscillator': 'APO',
  'Price Rate of Change': 'ROCR',
};

const LIVE_ABBR_SET = new Set(IMPLEMENTED_CHART_ABBRS.map((a) => a.toUpperCase()));

function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const REGISTRY_BY_NORM_NAME = new Map(
  IndicatorRegistry.map((ind) => [normalizeKey(ind.name), ind.abbr]),
);

/** Resolve an encyclopedia display name to a live chart abbr, if implemented. */
export function encyclopediaNameToLiveAbbr(name: string): string | undefined {
  const explicit = ENCYCLOPEDIA_NAME_TO_ABBR[name];
  if (explicit && LIVE_ABBR_SET.has(explicit)) return explicit;

  const byRegistry = REGISTRY_BY_NORM_NAME.get(normalizeKey(name));
  if (byRegistry && LIVE_ABBR_SET.has(byRegistry)) return byRegistry;

  const byAbbr = LIVE_ABBR_SET.has(name.toUpperCase()) ? name.toUpperCase() : undefined;
  return byAbbr;
}

export function isEncyclopediaNameLiveOnChart(name: string): boolean {
  return encyclopediaNameToLiveAbbr(name) !== undefined;
}

export const LIVE_CHART_INDICATOR_COUNT = IMPLEMENTED_CHART_ABBRS.length;
