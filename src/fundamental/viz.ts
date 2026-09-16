import { num } from './service';
import { statementLabel } from './format';
import type { SegmentRow, StatementPeriod } from './types';

export function seriesFrom(
  rows: Record<string, unknown>[] | null | undefined,
  key: string,
  period: 'annual' | 'quarter',
): { label: string; value: number | null }[] {
  if (!rows?.length) return [];
  return [...rows].reverse().map((row) => ({
    label: statementLabel(row, period),
    value: num(row, key),
  }));
}

export function parseSegments(raw: unknown): SegmentRow[] {
  if (!raw) return [];
  const rows = Array.isArray(raw) ? raw : [raw];
  const latest = rows[0];
  if (!latest || typeof latest !== 'object') return [];
  const obj = latest as Record<string, unknown>;
  const nested = obj.data && typeof obj.data === 'object' ? (obj.data as Record<string, unknown>) : obj;
  const skip = new Set([
    'date',
    'symbol',
    'calendarYear',
    'period',
    'reportedCurrency',
    'cik',
    'fillingDate',
    'acceptedDate',
    'link',
    'finalLink',
  ]);
  const entries = Object.entries(nested).filter(([k, v]) => !skip.has(k) && typeof v !== 'object');
  const total = entries.reduce((s, [, v]) => s + (typeof v === 'number' ? v : 0), 0);
  return entries.map(([segment, v]) => {
    const revenue = typeof v === 'number' ? v : Number(v);
    return {
      segment,
      revenue: Number.isFinite(revenue) ? revenue : null,
      growth: null,
      operatingMargin: null,
      contribution: Number.isFinite(revenue) && total ? (revenue / total) * 100 : null,
    };
  });
}

/** FMP ratios are often 0–1; statement *Ratio fields vary. */
export function asPercent(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return Math.abs(value) <= 5 ? value * 100 : value;
}

export function stmtPeriod(period: StatementPeriod): 'annual' | 'quarter' {
  return period === 'quarter' ? 'quarter' : 'annual';
}

/**
 * Documented band from a reported coverage ratio — not an AI risk score.
 * HIGH = coverage < 3x; MEDIUM = < 8x; LOW = ≥ 8x.
 */
export function coverageExposure(coverage: number | null): {
  band: 'LOW' | 'MEDIUM' | 'HIGH';
  note: string;
} | null {
  if (coverage == null || !Number.isFinite(coverage)) return null;
  const band = coverage < 3 ? 'HIGH' : coverage < 8 ? 'MEDIUM' : 'LOW';
  return {
    band,
    note: `Derived from reported interest coverage ${coverage.toFixed(2)}× (operating profit / interest). HIGH < 3×, MEDIUM < 8×, LOW ≥ 8×.`,
  };
}

export function concentrationBand(maxSharePct: number | null): {
  band: 'LOW' | 'MEDIUM' | 'HIGH';
  note: string;
} | null {
  if (maxSharePct == null || !Number.isFinite(maxSharePct)) return null;
  const band = maxSharePct >= 70 ? 'HIGH' : maxSharePct >= 40 ? 'MEDIUM' : 'LOW';
  return {
    band,
    note: `Largest reported slice is ${maxSharePct.toFixed(1)}% of the disclosed mix. HIGH ≥ 70%, MEDIUM ≥ 40%, LOW < 40%.`,
  };
}
