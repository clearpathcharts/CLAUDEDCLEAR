/** ClearPath internal COT schema. Official CFTC remains the source of truth. */

export type CotReportType = 'legacy' | 'disaggregated' | 'merged';

export type CotSide = {
  long: number | null;
  short: number | null;
};

export type CotNormalizedRow = {
  reportDate: string;
  reportType: CotReportType;
  marketName: string | null;
  cftcContractCode: string;
  openInterest: number | null;
  /** Legacy commercials (hedgers). */
  commercial: CotSide;
  /** Legacy non-commercials (large specs). */
  noncommercial: CotSide;
  nonreportable: CotSide;
  producerMerchant: CotSide;
  swap: CotSide;
  managedMoney: CotSide;
  otherReportable: CotSide;
};

export function netOf(side: CotSide): number | null {
  if (side.long == null && side.short == null) return null;
  return (side.long ?? 0) - (side.short ?? 0);
}

export function ratioOf(side: CotSide): number | null {
  if (side.long == null || side.short == null || side.short === 0) return null;
  return side.long / side.short;
}
