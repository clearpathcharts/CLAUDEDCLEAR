/**
 * ClearPath COT Data Engine
 * CFTC Official Data → validate → raw archive → normalized store → analytics
 * Traders never hit CFTC.gov; this process does, once, then serves the cache.
 */
import { cftcContractCode, cotContract, type CotSnapshot } from '../../lib/institutional/vendorMaps';
import { validateCftcRows, type CftcRawRow } from '../../lib/cot/cftcValidate';
import {
  mergeNormalized,
  normalizeDisaggregatedRow,
  normalizeLegacyRow,
  toLegacySnapshots,
} from '../../lib/cot/normalize';
import { buildCotAnalytics, type CotAnalytics } from '../../lib/cot/analytics';
import type { CotNormalizedRow } from '../../lib/cot/schema';
import {
  readNormalizedCache,
  writeNormalizedCache,
  writeRawArchive,
} from './rawArchive';

export const CFTC_DATASETS = {
  legacy_combined: 'https://publicreporting.cftc.gov/resource/jun7-fc8e.json',
  disaggregated_combined: 'https://publicreporting.cftc.gov/resource/kh3c-gbw2.json',
} as const;

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const DEFAULT_LIMIT = 160;
const FETCH_MS = 12_000;

export type CotEnginePack = {
  source: 'cftc.gov';
  engine: 'ClearPath COT Data Engine';
  contract: string;
  cftcCode: string;
  cached: boolean;
  fetchedAt: string;
  dropped: number;
  reports: CotSnapshot[];
  normalized: CotNormalizedRow[];
  analytics: CotAnalytics;
};

/** @deprecated Use CotEnginePack — same object. */
export type CotHistoryPack = CotEnginePack;

type MemEntry = { at: number; pack: CotEnginePack };
const mem = new Map<string, MemEntry>();

export function buildCftcDatasetUrl(
  dataset: keyof typeof CFTC_DATASETS,
  cftcCode: string,
  limit = DEFAULT_LIMIT,
): string {
  const params = new URLSearchParams({
    $limit: String(Math.min(Math.max(limit, 1), 500)),
    $order: 'report_date_as_yyyy_mm_dd DESC',
    cftc_contract_market_code: cftcCode,
  });
  return `${CFTC_DATASETS[dataset]}?${params.toString()}`;
}

export function resolveCotRequest(symbol: string): { contract: string; cftcCode: string } | null {
  const cftcCode = cftcContractCode(symbol);
  const contract = cotContract(symbol);
  if (!cftcCode || !contract) return null;
  return { contract, cftcCode };
}

export function peekCotCache(cftcCode: string): CotEnginePack | null {
  const hit = mem.get(cftcCode);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    mem.delete(cftcCode);
    return null;
  }
  return { ...hit.pack, cached: true };
}

export function seedCotCacheForTest(cftcCode: string, pack: CotEnginePack): void {
  mem.set(cftcCode, { at: Date.now(), pack });
}

export function clearCotCacheForTest(): void {
  mem.clear();
}

const UA = {
  Accept: 'application/json',
  'User-Agent': 'ClearPathTrader/1.0 (COT engine; +https://clearpathtrader.com)',
} as const;

async function fetchDataset(
  dataset: keyof typeof CFTC_DATASETS,
  cftcCode: string,
  limit: number,
): Promise<{ rows: CftcRawRow[]; dropped: number } | { error: string }> {
  const url = buildCftcDatasetUrl(dataset, cftcCode, limit);
  try {
    const res = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(FETCH_MS), headers: UA });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const raw = await res.json();
    const year = new Date().getUTCFullYear();
    writeRawArchive(year, dataset, `${cftcCode}.json`, JSON.stringify(raw));
    const checked = validateCftcRows(raw);
    return { rows: checked.rows, dropped: checked.dropped };
  } catch {
    return { error: 'fetch failed' };
  }
}

function packFromNormalized(
  resolved: { contract: string; cftcCode: string },
  normalized: CotNormalizedRow[],
  dropped: number,
  cached: boolean,
): CotEnginePack {
  const reports = toLegacySnapshots(normalized, resolved.contract);
  return {
    source: 'cftc.gov',
    engine: 'ClearPath COT Data Engine',
    contract: resolved.contract,
    cftcCode: resolved.cftcCode,
    cached,
    fetchedAt: new Date().toISOString(),
    dropped,
    reports,
    normalized,
    analytics: buildCotAnalytics(normalized),
  };
}

export async function loadCotEngine(
  symbol: string,
  opts?: { limit?: number; force?: boolean },
): Promise<CotEnginePack | { error: string; message: string; status: number }> {
  const resolved = resolveCotRequest(symbol);
  if (!resolved) {
    return {
      status: 404,
      error: 'NO CFTC MAP',
      message: 'No CFTC contract-market code for this symbol.',
    };
  }

  if (!opts?.force) {
    const hot = peekCotCache(resolved.cftcCode);
    if (hot) return hot;
    const disk = readNormalizedCache(resolved.cftcCode, CACHE_TTL_MS);
    if (disk) {
      try {
        const parsed = JSON.parse(disk) as CotEnginePack;
        if (Array.isArray(parsed.normalized) && parsed.normalized.length) {
          const pack = { ...parsed, cached: true };
          mem.set(resolved.cftcCode, { at: Date.now(), pack });
          return pack;
        }
      } catch {
        /* fall through to live fetch */
      }
    }
  }

  const limit = opts?.limit ?? DEFAULT_LIMIT;
  const [legacy, disagg] = await Promise.all([
    fetchDataset('legacy_combined', resolved.cftcCode, limit),
    fetchDataset('disaggregated_combined', resolved.cftcCode, limit),
  ]);

  const legacyRows = 'rows' in legacy ? legacy.rows : [];
  const disaggRows = 'rows' in disagg ? disagg.rows : [];
  const dropped = ('dropped' in legacy ? legacy.dropped : 0) + ('dropped' in disagg ? disagg.dropped : 0);

  const normalized = mergeNormalized(
    legacyRows
      .map((r) => normalizeLegacyRow(r, resolved.cftcCode))
      .filter((r): r is CotNormalizedRow => r != null),
    disaggRows
      .map((r) => normalizeDisaggregatedRow(r, resolved.cftcCode))
      .filter((r): r is CotNormalizedRow => r != null),
  );

  if (!normalized.length) {
    const liveFail = 'error' in legacy && 'error' in disagg;
    return {
      status: liveFail ? 502 : 404,
      error: liveFail ? 'CFTC UNAVAILABLE' : 'NO COT ROWS',
      message: liveFail
        ? 'CFTC.gov request failed or timed out.'
        : `CFTC.gov returned no usable rows for ${resolved.cftcCode}.`,
    };
  }

  const pack = packFromNormalized(resolved, normalized, dropped, false);
  mem.set(resolved.cftcCode, { at: Date.now(), pack });
  writeNormalizedCache(resolved.cftcCode, JSON.stringify(pack));
  return pack;
}

/** Chart/Positioning compatibility name — same engine, same cache. */
export async function fetchCftcLegacyHistory(
  symbol: string,
  opts?: { limit?: number; force?: boolean },
): Promise<CotEnginePack | { error: string; message: string; status: number }> {
  return loadCotEngine(symbol, opts);
}

export function buildCftcLegacyUrl(cftcCode: string, limit = DEFAULT_LIMIT): string {
  return buildCftcDatasetUrl('legacy_combined', cftcCode, limit);
}
