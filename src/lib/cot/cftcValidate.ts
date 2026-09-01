/**
 * Validate official CFTC Legacy rows before they enter the COT cache.
 * Drops junk, future dates, and duplicate report weeks — never invents prints.
 */

export type CftcRawRow = Record<string, unknown>;

export type CftcValidation = {
  ok: boolean;
  rows: CftcRawRow[];
  dropped: number;
  reasons: string[];
};

const CFTC_MIN_DATE = '1986-01-01';
const DATE_KEYS = ['report_date_as_yyyy_mm_dd', 'date', 'reportDate', 'updated'];
const POSITION_KEYS = [
  'noncomm_positions_long_all',
  'noncommPositionsLongAll',
  'noncommercialLong',
  'noncomm_positions_short_all',
  'noncommPositionsShortAll',
  'noncommercialShort',
  'comm_positions_long_all',
  'commPositionsLongAll',
  'commercialLong',
  'comm_positions_short_all',
  'commPositionsShortAll',
  'commercialShort',
  'open_interest_all',
  'openInterestAll',
  'openInterest',
  'prod_merc_positions_long',
  'prod_merc_positions_long_all',
  'swap_positions_long_all',
  'm_money_positions_long_all',
  'other_rept_positions_long',
];

function asDateKey(row: CftcRawRow): string | null {
  for (const k of DATE_KEYS) {
    const v = row[k] ?? row[k.toLowerCase()];
    if (v == null) continue;
    const d = String(v).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  }
  return null;
}

function hasPosition(row: CftcRawRow): boolean {
  const lower = Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase(), v]));
  for (const k of POSITION_KEYS) {
    const n = Number(lower[k.toLowerCase()]);
    if (Number.isFinite(n)) return true;
  }
  return false;
}

function isCombined(row: CftcRawRow): boolean {
  return String(row.futonly_or_combined ?? '').toLowerCase() === 'combined';
}

function openInterest(row: CftcRawRow): number {
  const n = Number(row.open_interest_all ?? row.openInterestAll ?? row.openInterest ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function tomorrowUtc(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Schema / date / duplicate check for CFTC Legacy JSON.
 * Keeps one row per report date (prefers Combined, then higher open interest).
 */
export function validateCftcRows(raw: unknown, nowIsoDate?: string): CftcValidation {
  const reasons: string[] = [];
  if (!Array.isArray(raw)) {
    return { ok: false, rows: [], dropped: 0, reasons: ['payload is not an array'] };
  }

  const maxDate = nowIsoDate ?? tomorrowUtc();
  const usable: { date: string; row: CftcRawRow }[] = [];
  let dropped = 0;

  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      dropped += 1;
      reasons.push('non-object row');
      continue;
    }
    const row = item as CftcRawRow;
    const date = asDateKey(row);
    if (!date) {
      dropped += 1;
      reasons.push('missing report date');
      continue;
    }
    if (date < CFTC_MIN_DATE || date > maxDate) {
      dropped += 1;
      reasons.push(`date out of range ${date}`);
      continue;
    }
    if (!hasPosition(row)) {
      dropped += 1;
      reasons.push(`no positioning fields ${date}`);
      continue;
    }
    usable.push({ date, row });
  }

  const byDate = new Map<string, CftcRawRow>();
  for (const item of usable) {
    const prev = byDate.get(item.date);
    if (!prev) {
      byDate.set(item.date, item.row);
      continue;
    }
    dropped += 1;
    reasons.push(`duplicate ${item.date}`);
    const preferNew =
      (isCombined(item.row) && !isCombined(prev)) ||
      (isCombined(item.row) === isCombined(prev) && openInterest(item.row) > openInterest(prev));
    if (preferNew) byDate.set(item.date, item.row);
  }

  const rows = [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, row]) => row);

  const uniqueReasons = [...new Set(reasons)].slice(0, 8);
  return { ok: rows.length > 0, rows, dropped, reasons: uniqueReasons };
}
