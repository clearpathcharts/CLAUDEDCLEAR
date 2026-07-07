import { Candle } from '../../types/indicators';
import { IndicatorCategory } from '../../core/registry/CategoryRegistry';
import { getOssIndicators } from './client';
import {
  alignDualSeriesToTimes,
  alignSeriesToTimes,
  alignTripleSeriesToTimes,
  candleArrays,
} from './adapters';

export type OssRenderKind =
  | 'overlay-line'
  | 'oscillator-line'
  | 'dual-line'
  | 'bands-3'
  | 'fisher';

export interface OssSeriesLine {
  key: string;
  label: string;
  color?: string;
  lineWidth?: number;
  dashed?: boolean;
}

export interface OssIndicatorSpec {
  id: string;
  abbr: string;
  name: string;
  category: string;
  activeColor: string;
  parameters: Record<string, number>;
  render: OssRenderKind;
  series?: OssSeriesLine[];
  compute: (data: Candle[], params: Record<string, number>) => unknown;
}

function ta() {
  return getOssIndicators();
}

function hueColor(abbr: string): string {
  let h = 0;
  for (let i = 0; i < abbr.length; i++) h = (h * 31 + abbr.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360}, 72%, 56%)`;
}

function closeLine(
  fn: (closes: number[], period: number) => number[],
  periodKey = 'period',
) {
  return (data: Candle[], params: Record<string, number>) => {
    const { times, closes } = candleArrays(data);
    const period = params[periodKey] ?? 14;
    return alignSeriesToTimes(times, fn(closes, period));
  };
}

function hlcLine(
  fn: (high: number[], low: number[], close: number[], period: number) => number[],
  periodKey = 'period',
) {
  return (data: Candle[], params: Record<string, number>) => {
    const { times, highs, lows, closes } = candleArrays(data);
    const period = params[periodKey] ?? 14;
    return alignSeriesToTimes(times, fn(highs, lows, closes, period));
  };
}

/** OSS-backed indicators (batch 1 + all remaining batches). */
export const OSS_INDICATOR_SPECS: OssIndicatorSpec[] = [
  // --- batch 1 (migrated into catalog) ---
  {
    id: 'dema', abbr: 'DEMA', name: 'Double Exponential Moving Average',
    category: IndicatorCategory.Trend, activeColor: '#4CC9F0', parameters: { period: 20 },
    render: 'overlay-line',
    compute: closeLine((c, p) => ta().dema(c, p)),
  },
  {
    id: 'kama', abbr: 'KAMA', name: 'Kaufman Adaptive Moving Average',
    category: IndicatorCategory.Trend, activeColor: '#FB8500', parameters: { period: 20 },
    render: 'overlay-line',
    compute: closeLine((c, p) => ta().kama(c, p)),
  },
  {
    id: 'ultosc', abbr: 'ULTOSC', name: 'Ultimate Oscillator',
    category: IndicatorCategory.Momentum, activeColor: '#7209B7',
    parameters: { period1: 7, period2: 14, period3: 28 },
    render: 'oscillator-line',
    compute: (data, params) => {
      const { times, highs, lows, closes } = candleArrays(data);
      const values = ta().ultosc(
        highs, lows, closes,
        params.period1 ?? 7, params.period2 ?? 14, params.period3 ?? 28,
      );
      return alignSeriesToTimes(times, values);
    },
  },
  {
    id: 'aroon', abbr: 'AROON', name: 'Aroon',
    category: IndicatorCategory.Momentum, activeColor: '#2A9D8F', parameters: { period: 14 },
    render: 'dual-line',
    series: [
      { key: 'up', label: 'Aroon Up', color: '#2A9D8F' },
      { key: 'down', label: 'Aroon Down', color: '#E76F51' },
    ],
    compute: (data, params) => {
      const { times, highs, lows } = candleArrays(data);
      const period = params.period ?? 14;
      const [down, up] = ta().aroon(highs, lows, period);
      return alignDualSeriesToTimes(times, down, up).map(({ time, a, b }) => ({
        time, down: a, up: b,
      }));
    },
  },
  {
    id: 'fi', abbr: 'FI', name: 'Force Index',
    category: IndicatorCategory.Volume, activeColor: '#06AED5', parameters: { period: 13 },
    render: 'oscillator-line',
    compute: (data, params) => {
      const { times, closes, volumes } = candleArrays(data);
      const period = params.period ?? 13;
      return alignSeriesToTimes(times, ta().fi(closes, volumes, period));
    },
  },

  // --- batch 2: trend overlays ---
  {
    id: 'zlema', abbr: 'ZLEMA', name: 'Zero-Lag Exponential Moving Average',
    category: IndicatorCategory.Trend, activeColor: hueColor('ZLEMA'), parameters: { period: 20 },
    render: 'overlay-line',
    compute: closeLine((c, p) => ta().zlema(c, p)),
  },
  {
    id: 'trima', abbr: 'TRIMA', name: 'Triangular Moving Average',
    category: IndicatorCategory.Trend, activeColor: hueColor('TRIMA'), parameters: { period: 20 },
    render: 'overlay-line',
    compute: closeLine((c, p) => ta().trima(c, p)),
  },
  {
    id: 'alma', abbr: 'ALMA', name: 'Arnaud Legoux Moving Average',
    category: IndicatorCategory.Trend, activeColor: hueColor('ALMA'),
    parameters: { period: 9, offset: 0.85, sigma: 6 },
    render: 'overlay-line',
    compute: (data, params) => {
      const { times, closes } = candleArrays(data);
      const values = ta().alma(closes, params.period ?? 9, params.offset ?? 0.85, params.sigma ?? 6);
      return alignSeriesToTimes(times, values);
    },
  },
  {
    id: 'linreg', abbr: 'LINREG', name: 'Linear Regression',
    category: IndicatorCategory.Trend, activeColor: hueColor('LINREG'), parameters: { period: 14 },
    render: 'overlay-line',
    compute: closeLine((c, p) => ta().linreg(c, p)),
  },
  {
    id: 'linregslope', abbr: 'LINREGSLOPE', name: 'Linear Regression Slope',
    category: IndicatorCategory.Trend, activeColor: hueColor('LINREGSLOPE'), parameters: { period: 14 },
    render: 'oscillator-line',
    compute: closeLine((c, p) => ta().linregslope(c, p)),
  },
  {
    id: 'linregintercept', abbr: 'LINREGINT', name: 'Linear Regression Intercept',
    category: IndicatorCategory.Trend, activeColor: hueColor('LINREGINT'), parameters: { period: 14 },
    render: 'overlay-line',
    compute: closeLine((c, p) => ta().linregintercept(c, p)),
  },
  {
    id: 'tsf', abbr: 'TSF', name: 'Time Series Forecast',
    category: IndicatorCategory.Trend, activeColor: hueColor('TSF'), parameters: { period: 14 },
    render: 'overlay-line',
    compute: closeLine((c, p) => ta().tsf(c, p)),
  },
  {
    id: 'vwma', abbr: 'VWMA', name: 'Volume Weighted Moving Average',
    category: IndicatorCategory.Trend, activeColor: hueColor('VWMA'), parameters: { period: 14 },
    render: 'overlay-line',
    compute: (data, params) => {
      const { times, closes, volumes } = candleArrays(data);
      const period = params.period ?? 14;
      return alignSeriesToTimes(times, ta().vwma(closes, volumes, period));
    },
  },
  {
    id: 'wilders', abbr: 'SMMA', name: "Wilder's Smoothed Moving Average (SMMA)",
    category: IndicatorCategory.Trend, activeColor: hueColor('SMMA'), parameters: { period: 14 },
    render: 'overlay-line',
    compute: closeLine((c, p) => ta().wilders(c, p)),
  },

  // --- batch 3: momentum oscillators ---
  {
    id: 'aroonosc', abbr: 'AROONOSC', name: 'Aroon Oscillator',
    category: IndicatorCategory.Momentum, activeColor: hueColor('AROONOSC'), parameters: { period: 14 },
    render: 'oscillator-line',
    compute: hlcLine((h, l, _c, p) => ta().aroonosc(h, l, p)),
  },
  {
    id: 'cmo', abbr: 'CMO', name: 'Chande Momentum Oscillator',
    category: IndicatorCategory.Momentum, activeColor: hueColor('CMO'), parameters: { period: 14 },
    render: 'oscillator-line',
    compute: closeLine((c, p) => ta().cmo(c, p)),
  },
  {
    id: 'bop', abbr: 'BOP', name: 'Balance of Power',
    category: IndicatorCategory.Momentum, activeColor: hueColor('BOP'), parameters: {},
    render: 'oscillator-line',
    compute: (data) => {
      const { times, opens, highs, lows, closes } = candleArrays(data);
      const opensArr = data.map((d) => d.open);
      return alignSeriesToTimes(times, ta().bop(opensArr, highs, lows, closes));
    },
  },
  {
    id: 'apo', abbr: 'APO', name: 'Absolute Price Oscillator',
    category: IndicatorCategory.Momentum, activeColor: hueColor('APO'),
    parameters: { fastPeriod: 12, slowPeriod: 26 },
    render: 'oscillator-line',
    compute: (data, params) => {
      const { times, closes } = candleArrays(data);
      const values = ta().apo(closes, params.fastPeriod ?? 12, params.slowPeriod ?? 26);
      return alignSeriesToTimes(times, values);
    },
  },
  {
    id: 'ppo', abbr: 'PPO', name: 'Percentage Price Oscillator',
    category: IndicatorCategory.Momentum, activeColor: hueColor('PPO'),
    parameters: { fastPeriod: 12, slowPeriod: 26 },
    render: 'oscillator-line',
    compute: (data, params) => {
      const { times, closes } = candleArrays(data);
      const values = ta().ppo(closes, params.fastPeriod ?? 12, params.slowPeriod ?? 26);
      return alignSeriesToTimes(times, values);
    },
  },
  {
    id: 'mom', abbr: 'MOM', name: 'Momentum',
    category: IndicatorCategory.Momentum, activeColor: hueColor('MOM'), parameters: { period: 10 },
    render: 'oscillator-line',
    compute: closeLine((c, p) => ta().mom(c, p)),
  },
  {
    id: 'rocr', abbr: 'ROCR', name: 'Rate of Change Ratio',
    category: IndicatorCategory.Momentum, activeColor: hueColor('ROCR'), parameters: { period: 10 },
    render: 'oscillator-line',
    compute: closeLine((c, p) => ta().rocr(c, p)),
  },
  {
    id: 'tsi', abbr: 'TSI', name: 'True Strength Index',
    category: IndicatorCategory.Momentum, activeColor: hueColor('TSI'),
    parameters: { longPeriod: 25, shortPeriod: 13 },
    render: 'oscillator-line',
    compute: (data, params) => {
      const { times, closes } = candleArrays(data);
      const values = ta().tsi(closes, params.longPeriod ?? 25, params.shortPeriod ?? 13);
      return alignSeriesToTimes(times, values);
    },
  },
  {
    id: 'fosc', abbr: 'FOSC', name: 'Forecast Oscillator',
    category: IndicatorCategory.Momentum, activeColor: hueColor('FOSC'), parameters: { period: 14 },
    render: 'oscillator-line',
    compute: closeLine((c, p) => ta().fosc(c, p)),
  },
  {
    id: 'smi', abbr: 'SMI', name: 'Stochastic Momentum Index',
    category: IndicatorCategory.Momentum, activeColor: hueColor('SMI'),
    parameters: { period: 5, smoothK: 20, smoothD: 5 },
    render: 'oscillator-line',
    compute: (data, params) => {
      const { times, highs, lows, closes } = candleArrays(data);
      const values = ta().smi(
        highs, lows, closes,
        params.period ?? 5, params.smoothK ?? 20, params.smoothD ?? 5,
      );
      return alignSeriesToTimes(times, values);
    },
  },
  {
    id: 'rmi', abbr: 'RMI', name: 'Relative Momentum Index',
    category: IndicatorCategory.Momentum, activeColor: hueColor('RMI'),
    parameters: { period: 14, momentumPeriod: 5 },
    render: 'oscillator-line',
    compute: (data, params) => {
      const { times, closes } = candleArrays(data);
      const values = ta().rmi(closes, params.period ?? 14, params.momentumPeriod ?? 5);
      return alignSeriesToTimes(times, values);
    },
  },
  {
    id: 'qstick', abbr: 'QSTICK', name: 'Qstick Indicator',
    category: IndicatorCategory.Momentum, activeColor: hueColor('QSTICK'), parameters: { period: 14 },
    render: 'oscillator-line',
    compute: (data, params) => {
      const { times, closes } = candleArrays(data);
      const opensArr = data.map((d) => d.open);
      const period = params.period ?? 14;
      return alignSeriesToTimes(times, ta().qstick(opensArr, closes, period));
    },
  },
  {
    id: 'copp', abbr: 'COPP', name: 'Coppock Curve',
    category: IndicatorCategory.Momentum, activeColor: hueColor('COPP'),
    parameters: { longRoc: 11, shortRoc: 14, wmaPeriod: 10 },
    render: 'oscillator-line',
    compute: (data, params) => {
      const { times, closes } = candleArrays(data);
      const values = ta().copp(
        closes,
        params.longRoc ?? 11, params.shortRoc ?? 14, params.wmaPeriod ?? 10,
      );
      return alignSeriesToTimes(times, values);
    },
  },
  {
    id: 'vhf', abbr: 'VHF', name: 'Vertical Horizontal Filter',
    category: IndicatorCategory.Momentum, activeColor: hueColor('VHF'), parameters: { period: 14 },
    render: 'oscillator-line',
    compute: closeLine((c, p) => ta().vhf(c, p)),
  },
  {
    id: 'fisher', abbr: 'FISHER', name: 'Fisher Transform',
    category: IndicatorCategory.Momentum, activeColor: hueColor('FISHER'), parameters: { period: 9 },
    render: 'fisher',
    series: [
      { key: 'fisher', label: 'Fisher', color: '#8B5CF6' },
      { key: 'trigger', label: 'Fisher Trigger', color: '#F59E0B' },
    ],
    compute: (data, params) => {
      const { times, highs, lows } = candleArrays(data);
      const period = params.period ?? 9;
      const [fisher, trigger] = ta().fisher(highs, lows, period);
      return alignDualSeriesToTimes(times, fisher, trigger).map(({ time, a, b }) => ({
        time, fisher: a, trigger: b,
      }));
    },
  },

  // --- batch 4: volatility ---
  {
    id: 'natr', abbr: 'NATR', name: 'Normalized Average True Range',
    category: IndicatorCategory.Volatility, activeColor: hueColor('NATR'), parameters: { period: 14 },
    render: 'oscillator-line',
    compute: hlcLine((h, l, c, p) => ta().natr(h, l, c, p)),
  },
  {
    id: 'tr', abbr: 'TR', name: 'True Range',
    category: IndicatorCategory.Volatility, activeColor: hueColor('TR'), parameters: {},
    render: 'oscillator-line',
    compute: (data) => {
      const { times, highs, lows, closes } = candleArrays(data);
      return alignSeriesToTimes(times, ta().tr(highs, lows, closes));
    },
  },
  {
    id: 'stddev', abbr: 'STDDEV', name: 'Standard Deviation',
    category: IndicatorCategory.Volatility, activeColor: hueColor('STDDEV'), parameters: { period: 20 },
    render: 'oscillator-line',
    compute: closeLine((c, p) => ta().stddev(c, p)),
  },
  {
    id: 'volatility', abbr: 'HVOL', name: 'Historical Volatility',
    category: IndicatorCategory.Volatility, activeColor: hueColor('HVOL'), parameters: { period: 20 },
    render: 'oscillator-line',
    compute: closeLine((c, p) => ta().volatility(c, p)),
  },
  {
    id: 'abands', abbr: 'ABANDS', name: 'Acceleration Bands',
    category: IndicatorCategory.Volatility, activeColor: hueColor('ABANDS'), parameters: { period: 20 },
    render: 'bands-3',
    series: [
      { key: 'upper', label: 'AB upper', color: '#22C55E' },
      { key: 'lower', label: 'AB lower', color: '#EF4444' },
      { key: 'basis', label: 'AB mid', color: '#A78BFA' },
    ],
    compute: (data, params) => {
      const { times, highs, lows, closes } = candleArrays(data);
      const period = params.period ?? 20;
      const [upper, lower, basis] = ta().abands(highs, lows, closes, period);
      return alignTripleSeriesToTimes(times, upper, lower, basis).map(({ time, a, b, c }) => ({
        time, upper: a, lower: b, basis: c,
      }));
    },
  },

  // --- batch 5: volume ---
  {
    id: 'ad', abbr: 'AD', name: 'Accumulation/Distribution Line',
    category: IndicatorCategory.Volume, activeColor: hueColor('AD'), parameters: {},
    render: 'oscillator-line',
    compute: (data) => {
      const { times, highs, lows, closes, volumes } = candleArrays(data);
      return alignSeriesToTimes(times, ta().ad(highs, lows, closes, volumes));
    },
  },
  {
    id: 'adosc', abbr: 'ADOSC', name: 'Accumulation/Distribution Oscillator',
    category: IndicatorCategory.Volume, activeColor: hueColor('ADOSC'),
    parameters: { fastPeriod: 3, slowPeriod: 10 },
    render: 'oscillator-line',
    compute: (data, params) => {
      const { times, highs, lows, closes, volumes } = candleArrays(data);
      const values = ta().adosc(
        highs, lows, closes, volumes,
        params.fastPeriod ?? 3, params.slowPeriod ?? 10,
      );
      return alignSeriesToTimes(times, values);
    },
  },
  {
    id: 'emv', abbr: 'EMV', name: 'Ease of Movement',
    category: IndicatorCategory.Volume, activeColor: hueColor('EMV'), parameters: { period: 14 },
    render: 'oscillator-line',
    compute: (data, params) => {
      const { times, highs, lows, volumes } = candleArrays(data);
      const period = params.period ?? 14;
      return alignSeriesToTimes(times, ta().emv(highs, lows, volumes, period));
    },
  },
  {
    id: 'kvo', abbr: 'KVO', name: 'Klinger Volume Oscillator',
    category: IndicatorCategory.Volume, activeColor: hueColor('KVO'),
    parameters: { fastPeriod: 34, slowPeriod: 55 },
    render: 'oscillator-line',
    compute: (data, params) => {
      const { times, highs, lows, closes, volumes } = candleArrays(data);
      const values = ta().kvo(
        highs, lows, closes, volumes,
        params.fastPeriod ?? 34, params.slowPeriod ?? 55,
      );
      return alignSeriesToTimes(times, values);
    },
  },
  {
    id: 'marketfi', abbr: 'MARKETFI', name: 'Market Facilitation Index',
    category: IndicatorCategory.Volume, activeColor: hueColor('MARKETFI'), parameters: {},
    render: 'oscillator-line',
    compute: (data) => {
      const { times, highs, lows, volumes } = candleArrays(data);
      return alignSeriesToTimes(times, ta().marketfi(highs, lows, volumes));
    },
  },
  {
    id: 'pvi', abbr: 'PVI', name: 'Positive Volume Index',
    category: IndicatorCategory.Volume, activeColor: hueColor('PVI'), parameters: {},
    render: 'oscillator-line',
    compute: (data) => {
      const { times, closes, volumes } = candleArrays(data);
      return alignSeriesToTimes(times, ta().pvi(closes, volumes));
    },
  },
  {
    id: 'nvi', abbr: 'NVI', name: 'Negative Volume Index',
    category: IndicatorCategory.Volume, activeColor: hueColor('NVI'), parameters: {},
    render: 'oscillator-line',
    compute: (data) => {
      const { times, closes, volumes } = candleArrays(data);
      return alignSeriesToTimes(times, ta().nvi(closes, volumes));
    },
  },
  {
    id: 'vosc', abbr: 'VOSC', name: 'Volume Oscillator',
    category: IndicatorCategory.Volume, activeColor: hueColor('VOSC'),
    parameters: { fastPeriod: 5, slowPeriod: 10 },
    render: 'oscillator-line',
    compute: (data, params) => {
      const { times, volumes } = candleArrays(data);
      const values = ta().vosc(volumes, params.fastPeriod ?? 5, params.slowPeriod ?? 10);
      return alignSeriesToTimes(times, values);
    },
  },
];

export const OSS_SPEC_BY_ABBR: Record<string, OssIndicatorSpec> = Object.fromEntries(
  OSS_INDICATOR_SPECS.map((s) => [s.abbr, s]),
);

export const OSS_OSCILLATOR_ABBRS = new Set(
  OSS_INDICATOR_SPECS.filter((s) => s.render !== 'overlay-line').map((s) => s.abbr),
);

export function getOssSpec(abbr: string): OssIndicatorSpec | undefined {
  return OSS_SPEC_BY_ABBR[abbr.toUpperCase()];
}

export function computeOssIndicator(
  abbr: string,
  data: Candle[],
  settings?: Record<string, number>,
): unknown {
  const spec = getOssSpec(abbr);
  if (!spec) throw new Error(`Unknown OSS indicator: ${abbr}`);
  return spec.compute(data, { ...spec.parameters, ...settings });
}

export function buildOssRegistryEntries() {
  return OSS_INDICATOR_SPECS.map((s) => ({
    id: s.id,
    name: s.name,
    abbr: s.abbr,
    category: s.category,
    activeColor: s.activeColor,
    sourceFile: 'indicators/oss/catalog.ts',
    parameters: s.parameters,
  }));
}

export function buildOssIndicatorBank(): Record<string, Function> {
  const bank: Record<string, Function> = {};
  for (const spec of OSS_INDICATOR_SPECS) {
    bank[spec.abbr] = (data: Candle[], settings?: Record<string, number>) =>
      spec.compute(data, { ...spec.parameters, ...settings });
  }
  return bank;
}
