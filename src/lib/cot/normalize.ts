import type { CftcRawRow } from './cftcValidate';
import { netOf, type CotNormalizedRow, type CotSide } from './schema';

function num(row: CftcRawRow, keys: string[]): number | null {
  const lower = Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase(), v]));
  for (const k of keys) {
    const n = Number(lower[k.toLowerCase()]);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function str(row: CftcRawRow, keys: string[]): string | null {
  const lower = Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase(), v]));
  for (const k of keys) {
    const v = lower[k.toLowerCase()];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return null;
}

function side(row: CftcRawRow, longKeys: string[], shortKeys: string[]): CotSide {
  return { long: num(row, longKeys), short: num(row, shortKeys) };
}

export function reportDateOf(row: CftcRawRow): string | null {
  const d = str(row, ['report_date_as_yyyy_mm_dd', 'date', 'reportDate', 'updated']);
  if (!d) return null;
  const iso = d.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null;
}

function emptySide(): CotSide {
  return { long: null, short: null };
}

export function normalizeLegacyRow(row: CftcRawRow, cftcCode: string): CotNormalizedRow | null {
  const reportDate = reportDateOf(row);
  if (!reportDate) return null;
  return {
    reportDate,
    reportType: 'legacy',
    marketName: str(row, ['market_and_exchange_names', 'contract_market_name', 'commodity_name']),
    cftcContractCode: str(row, ['cftc_contract_market_code']) || cftcCode,
    openInterest: num(row, ['open_interest_all', 'openInterestAll', 'openInterest']),
    commercial: side(
      row,
      ['comm_positions_long_all', 'commPositionsLongAll', 'commercialLong'],
      ['comm_positions_short_all', 'commPositionsShortAll', 'commercialShort'],
    ),
    noncommercial: side(
      row,
      ['noncomm_positions_long_all', 'noncommPositionsLongAll', 'noncommercialLong'],
      ['noncomm_positions_short_all', 'noncommPositionsShortAll', 'noncommercialShort'],
    ),
    nonreportable: side(
      row,
      ['nonrept_positions_long_all', 'nonreptPositionsLongAll'],
      ['nonrept_positions_short_all', 'nonreptPositionsShortAll'],
    ),
    producerMerchant: emptySide(),
    swap: emptySide(),
    managedMoney: emptySide(),
    otherReportable: emptySide(),
  };
}

export function normalizeDisaggregatedRow(row: CftcRawRow, cftcCode: string): CotNormalizedRow | null {
  const reportDate = reportDateOf(row);
  if (!reportDate) return null;
  return {
    reportDate,
    reportType: 'disaggregated',
    marketName: str(row, ['market_and_exchange_names', 'contract_market_name', 'commodity_name']),
    cftcContractCode: str(row, ['cftc_contract_market_code']) || cftcCode,
    openInterest: num(row, ['open_interest_all', 'openInterestAll']),
    commercial: emptySide(),
    noncommercial: emptySide(),
    nonreportable: side(
      row,
      ['nonrept_positions_long_all'],
      ['nonrept_positions_short_all'],
    ),
    producerMerchant: side(
      row,
      ['prod_merc_positions_long_all', 'prod_merc_positions_long'],
      ['prod_merc_positions_short_all', 'prod_merc_positions_short'],
    ),
    swap: side(
      row,
      ['swap_positions_long_all'],
      ['swap__positions_short_all', 'swap_positions_short_all'],
    ),
    managedMoney: side(
      row,
      ['m_money_positions_long_all'],
      ['m_money_positions_short_all'],
    ),
    otherReportable: side(
      row,
      ['other_rept_positions_long_all', 'other_rept_positions_long'],
      ['other_rept_positions_short_all', 'other_rept_positions_short'],
    ),
  };
}

function mergeSides(a: CotSide, b: CotSide): CotSide {
  return {
    long: b.long ?? a.long,
    short: b.short ?? a.short,
  };
}

/** Overlay Disaggregated categories onto Legacy commercials/non-commercials by report date. */
export function mergeNormalized(
  legacy: CotNormalizedRow[],
  disagg: CotNormalizedRow[],
): CotNormalizedRow[] {
  const byDate = new Map<string, CotNormalizedRow>();
  for (const row of legacy) byDate.set(row.reportDate, { ...row });
  for (const row of disagg) {
    const prev = byDate.get(row.reportDate);
    if (!prev) {
      byDate.set(row.reportDate, { ...row, reportType: 'disaggregated' });
      continue;
    }
    byDate.set(row.reportDate, {
      ...prev,
      reportType: 'merged',
      marketName: prev.marketName || row.marketName,
      openInterest: prev.openInterest ?? row.openInterest,
      nonreportable: mergeSides(prev.nonreportable, row.nonreportable),
      producerMerchant: mergeSides(prev.producerMerchant, row.producerMerchant),
      swap: mergeSides(prev.swap, row.swap),
      managedMoney: mergeSides(prev.managedMoney, row.managedMoney),
      otherReportable: mergeSides(prev.otherReportable, row.otherReportable),
    });
  }
  return [...byDate.values()].sort((a, b) => a.reportDate.localeCompare(b.reportDate));
}

export function toLegacySnapshots(
  rows: CotNormalizedRow[],
  contract: string,
): Array<{
  contract: string;
  date: string;
  noncommercialLong: number | null;
  noncommercialShort: number | null;
  commercialLong: number | null;
  commercialShort: number | null;
  openInterest: number | null;
}> {
  return rows.map((r) => ({
    contract,
    date: r.reportDate,
    noncommercialLong: r.noncommercial.long,
    noncommercialShort: r.noncommercial.short,
    commercialLong: r.commercial.long,
    commercialShort: r.commercial.short,
    openInterest: r.openInterest,
  }));
}

export { netOf };
