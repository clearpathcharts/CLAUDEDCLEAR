import { netOf, ratioOf, type CotNormalizedRow } from './schema';

export type CotExtreme = 'extended_long' | 'extended_short' | 'neutral';
export type CotFlow = 'accumulation' | 'distribution' | 'unchanged';
export type CotDivergence = 'bearish' | 'bullish' | 'none';

export type CotAnalytics = {
  reportDate: string | null;
  openInterest: number | null;
  netCommercial: number | null;
  netLarge: number | null;
  netManagedMoney: number | null;
  netProducerMerchant: number | null;
  netChangeCommercial: number | null;
  netChangeLarge: number | null;
  pctOiCommercial: number | null;
  pctOiLarge: number | null;
  longShortRatioCommercial: number | null;
  longShortRatioLarge: number | null;
  /** 0–100 stochastic of commercial net over 52 reports. */
  cotIndex52: number | null;
  percentile52Commercial: number | null;
  percentile156Commercial: number | null;
  percentile52Large: number | null;
  percentile156Large: number | null;
  extremeCommercial: CotExtreme;
  extremeLarge: CotExtreme;
  institutionalFlow: CotFlow;
  priceCotDivergence: CotDivergence | null;
};

function pctile(series: number[], value: number): number | null {
  if (!series.length) return null;
  const below = series.filter((v) => v <= value).length;
  return (below / series.length) * 100;
}

function stoch(series: number[], value: number): number | null {
  if (series.length < 2) return null;
  const lo = Math.min(...series);
  const hi = Math.max(...series);
  if (hi === lo) return 50;
  return (100 * (value - lo)) / (hi - lo);
}

function extremeFromPercentile(p: number | null): CotExtreme {
  if (p == null) return 'neutral';
  if (p >= 90) return 'extended_long';
  if (p <= 10) return 'extended_short';
  return 'neutral';
}

function lastN(values: number[], n: number): number[] {
  return values.slice(Math.max(0, values.length - n));
}

function pctOfOi(net: number | null, oi: number | null): number | null {
  if (net == null || oi == null || oi === 0) return null;
  return (net / oi) * 100;
}

/**
 * Price vs large-spec net: higher price highs with lower spec nets = bearish;
 * lower price lows with higher spec nets = bullish.
 */
export function priceCotDivergence(
  closes: number[],
  largeNets: number[],
): CotDivergence {
  if (closes.length < 8 || largeNets.length < 8) return 'none';
  const n = Math.min(closes.length, largeNets.length);
  const px = closes.slice(-n);
  const nt = largeNets.slice(-n);
  const mid = Math.floor(n / 2);
  const pxHi1 = Math.max(...px.slice(0, mid));
  const pxHi2 = Math.max(...px.slice(mid));
  const ntHi1 = Math.max(...nt.slice(0, mid));
  const ntHi2 = Math.max(...nt.slice(mid));
  const pxLo1 = Math.min(...px.slice(0, mid));
  const pxLo2 = Math.min(...px.slice(mid));
  const ntLo1 = Math.min(...nt.slice(0, mid));
  const ntLo2 = Math.min(...nt.slice(mid));
  if (pxHi2 > pxHi1 && ntHi2 < ntHi1) return 'bearish';
  if (pxLo2 < pxLo1 && ntLo2 > ntLo1) return 'bullish';
  return 'none';
}

export function buildCotAnalytics(
  rows: CotNormalizedRow[],
  opts?: { closes?: number[] },
): CotAnalytics {
  const empty: CotAnalytics = {
    reportDate: null,
    openInterest: null,
    netCommercial: null,
    netLarge: null,
    netManagedMoney: null,
    netProducerMerchant: null,
    netChangeCommercial: null,
    netChangeLarge: null,
    pctOiCommercial: null,
    pctOiLarge: null,
    longShortRatioCommercial: null,
    longShortRatioLarge: null,
    cotIndex52: null,
    percentile52Commercial: null,
    percentile156Commercial: null,
    percentile52Large: null,
    percentile156Large: null,
    extremeCommercial: 'neutral',
    extremeLarge: 'neutral',
    institutionalFlow: 'unchanged',
    priceCotDivergence: null,
  };
  if (!rows.length) return empty;

  const sorted = [...rows].sort((a, b) => a.reportDate.localeCompare(b.reportDate));
  const commNets = sorted.map((r) => netOf(r.commercial)).filter((v): v is number => v != null);
  const largeNets = sorted.map((r) => netOf(r.noncommercial)).filter((v): v is number => v != null);
  const last = sorted[sorted.length - 1];
  const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null;
  const netCommercial = netOf(last.commercial);
  const netLarge = netOf(last.noncommercial);
  const prevComm = prev ? netOf(prev.commercial) : null;
  const prevLarge = prev ? netOf(prev.noncommercial) : null;
  const p52c = netCommercial != null ? pctile(lastN(commNets, 52), netCommercial) : null;
  const p156c = netCommercial != null ? pctile(lastN(commNets, 156), netCommercial) : null;
  const p52l = netLarge != null ? pctile(lastN(largeNets, 52), netLarge) : null;
  const p156l = netLarge != null ? pctile(lastN(largeNets, 156), netLarge) : null;
  const deltaComm =
    netCommercial != null && prevComm != null ? netCommercial - prevComm : null;

  return {
    reportDate: last.reportDate,
    openInterest: last.openInterest,
    netCommercial,
    netLarge,
    netManagedMoney: netOf(last.managedMoney),
    netProducerMerchant: netOf(last.producerMerchant),
    netChangeCommercial: deltaComm,
    netChangeLarge: netLarge != null && prevLarge != null ? netLarge - prevLarge : null,
    pctOiCommercial: pctOfOi(netCommercial, last.openInterest),
    pctOiLarge: pctOfOi(netLarge, last.openInterest),
    longShortRatioCommercial: ratioOf(last.commercial),
    longShortRatioLarge: ratioOf(last.noncommercial),
    cotIndex52: netCommercial != null ? stoch(lastN(commNets, 52), netCommercial) : null,
    percentile52Commercial: p52c,
    percentile156Commercial: p156c,
    percentile52Large: p52l,
    percentile156Large: p156l,
    extremeCommercial: extremeFromPercentile(p52c),
    extremeLarge: extremeFromPercentile(p52l),
    institutionalFlow:
      deltaComm == null ? 'unchanged' : deltaComm > 0 ? 'accumulation' : deltaComm < 0 ? 'distribution' : 'unchanged',
    priceCotDivergence: opts?.closes?.length && largeNets.length
      ? priceCotDivergence(opts.closes, largeNets)
      : null,
  };
}
