import { Candle } from "../../types/indicators";
import {
  cotContract,
  parseCotHistory,
  type CotSnapshot,
} from "../../lib/institutional/vendorMaps";

/**
 * ClearPath COT net commercials vs net non-commercials (large specs).
 *
 * This is first-party math on CFTC Legacy-style long/short fields — not a
 * TradingView LibraryCOT import. Nets match the public CFTC definition:
 *   net commercial     = commercial long − commercial short
 *   net non-commercial = noncommercial long − noncommercial short
 *
 * Values are held as a step until the next weekly report. They cannot be
 * derived from OHLC; callers must pass `reports` from the CFTC.gov cache
 * (`GET /api/cot/history`).
 */

export type CotNetPoint = {
  time: number;
  commercial: number | null;
  large: number | null;
};

export type CotSettings = {
  reports?: CotSnapshot[];
  hideCurrentWeek?: boolean;
  showCommercials?: boolean;
  showLarge?: boolean;
  nowSec?: number;
  barDurationSec?: number;
};

export function netCommercialPositions(snap: CotSnapshot): number | null {
  if (snap.commercialLong == null && snap.commercialShort == null) return null;
  return (snap.commercialLong ?? 0) - (snap.commercialShort ?? 0);
}

export function netNonCommercialPositions(snap: CotSnapshot): number | null {
  if (snap.noncommercialLong == null && snap.noncommercialShort == null) return null;
  return (snap.noncommercialLong ?? 0) - (snap.noncommercialShort ?? 0);
}

function reportTimeSec(date: string | null): number | null {
  if (!date) return null;
  const iso = date.includes("T") ? date : `${date.slice(0, 10)}T00:00:00Z`;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  return Math.floor(ms / 1000);
}

type DatedReport = {
  time: number;
  commercial: number | null;
  large: number | null;
};

function datedReports(reports: CotSnapshot[]): DatedReport[] {
  const dated: DatedReport[] = [];
  for (const snap of reports) {
    const time = reportTimeSec(snap.date);
    if (time == null) continue;
    dated.push({
      time,
      commercial: netCommercialPositions(snap),
      large: netNonCommercialPositions(snap),
    });
  }
  dated.sort((a, b) => a.time - b.time);
  return dated;
}

/**
 * Step-align weekly CFTC nets onto candle times.
 * `hideCurrentWeek` (default true) blanks bars that have not closed yet
 * (`now < time + barDuration`) — the forming bar, matching the usual COT
 * “don’t plot the incomplete print” convention. The original Pine input of
 * the same name accidentally plotted `na` when false; we plot the full series.
 */
export function calculateCOT(data: Candle[], settings?: CotSettings): CotNetPoint[] {
  const reports = settings?.reports ?? [];
  if (data.length === 0 || reports.length === 0) return [];

  const hideCurrentWeek = settings?.hideCurrentWeek !== false;
  const showCommercials = settings?.showCommercials !== false;
  const showLarge = settings?.showLarge !== false;
  const nowSec = settings?.nowSec ?? Date.now() / 1000;
  const barDurationSec = settings?.barDurationSec && settings.barDurationSec > 0
    ? settings.barDurationSec
    : inferBarDurationSec(data);

  const dated = datedReports(reports);
  if (!dated.length) return [];

  const out: CotNetPoint[] = [];
  let i = -1;
  for (const candle of data) {
    if (!Number.isFinite(candle.time)) continue;
    while (i + 1 < dated.length && dated[i + 1].time <= candle.time) i += 1;
    if (i < 0) continue;
    if (hideCurrentWeek && nowSec < candle.time + barDurationSec) continue;
    const row = dated[i];
    out.push({
      time: candle.time,
      commercial: showCommercials ? row.commercial : null,
      large: showLarge ? row.large : null,
    });
  }
  return out;
}

function inferBarDurationSec(data: Candle[]): number {
  if (data.length < 2) return 86400;
  const dt = data[data.length - 1].time - data[data.length - 2].time;
  return dt > 0 ? dt : 86400;
}

export async function fetchCotReportsForChart(symbol: string): Promise<{
  contract: string | null;
  reports: CotSnapshot[];
  note: string;
}> {
  const contract = cotContract(symbol);
  if (!contract) {
    return { contract: null, reports: [], note: "NO CFTC MAP" };
  }
  try {
    const res = await fetch(`/api/cot/history?symbol=${encodeURIComponent(symbol)}`);
    const body = (await res.json().catch(() => null)) as {
      error?: string;
      message?: string;
      contract?: string;
      cftcCode?: string;
      reports?: CotSnapshot[];
    } | null;
    if (!res.ok) {
      return {
        contract,
        reports: [],
        note: body?.error || body?.message || `COT HTTP ${res.status}`,
      };
    }
    const reports = parseCotHistory(body, body?.contract || contract);
    if (!reports.length) {
      return { contract, reports: [], note: `NO COT ROWS (${contract})` };
    }
    return {
      contract: body?.contract || contract,
      reports,
      note: `CFTC.gov · ${body?.cftcCode || contract}`,
    };
  } catch {
    return { contract, reports: [], note: "COT REQUEST FAILED" };
  }
}
