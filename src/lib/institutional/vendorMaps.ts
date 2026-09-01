/**
 * Honest vendor maps for the Institutional desk.
 * Never invent COT / options / short interest — only route a desk symbol to a
 * real FMP/Twelve Data/FRED identifier, or return null.
 */

import { getRegistryAsset } from '../../constants/assetRegistry';

/** Twelve Data has no clean SPX/NDX index quote (NDX resolves to Nordex ADR). */
export const HISTORY_ALIAS: Record<string, { provider: string; note: string }> = {
  SPX: { provider: 'SPY', note: 'SPY ETF proxy for S&P 500' },
  NDX: { provider: 'QQQ', note: 'QQQ ETF proxy for Nasdaq 100' },
};

/**
 * Desk / spot aliases → FMP `commitment-of-traders-report` contract codes.
 * CFTC numbers (e.g. copper 085692, lumber 058644) are resolved in `cotContract`.
 */
export const COT_SYMBOL: Record<string, string> = {
  XAUUSD: 'GC',
  XAU: 'GC',
  GOLD: 'GC',
  XAGUSD: 'SI',
  XAG: 'SI',
  SILVER: 'SI',
  WTI: 'CL',
  USOIL: 'CL',
  CRUDE: 'CL',
  DXY: 'DX',
  EURUSD: 'E6',
  '6E': 'E6',
  GBPUSD: 'B6',
  '6B': 'B6',
  USDJPY: 'J6',
  '6J': 'J6',
  SPX: 'ES',
  SPY: 'ES',
  NDX: 'NQ',
  QQQ: 'NQ',
  US10Y: 'ZN',
  AUDUSD: 'A6',
  '6A': 'A6',
  USDCAD: 'D6',
  '6C': 'D6',
  NZDUSD: 'N6',
  '6N': 'N6',
  USDCHF: 'S6',
  '6S': 'S6',
  HGUSD: 'HG',
  COPPER: 'HG',
  LUMBER: 'LBR',
  LB: 'LBR',
  NATGAS: 'NG',
  DJI: 'YM',
  DJIA: 'YM',
  IWM: 'RTY',
};

/** FMP COT contract ids that can be requested as-is when the chart root is already that code. */
const FMP_COT_IDENTITY = new Set([
  'GC', 'SI', 'HG', 'PL', 'PA',
  'CL', 'NG', 'HO', 'RB',
  'ES', 'NQ', 'YM', 'RTY', 'DX',
  'E6', 'B6', 'J6', 'A6', 'D6', 'N6', 'S6',
  'ZN', 'ZB', 'ZF', 'ZT', 'TN',
  'ZC', 'ZS', 'ZW', 'ZM', 'ZL',
  'KC', 'SB', 'CT', 'CC', 'OJ',
  'LE', 'HE', 'GF',
  'LBR',
]);

/**
 * CME/FMP root → CFTC Legacy contract-market code.
 * Official weekly prints: publicreporting.cftc.gov (no vendor key).
 */
export const CFTC_CODE_BY_CONTRACT: Record<string, string> = {
  GC: '088691',
  SI: '084691',
  HG: '085692',
  PL: '076651',
  PA: '075651',
  CL: '067651',
  NG: '023651',
  HO: '022651',
  RB: '111659',
  ES: '13874A',
  NQ: '209742',
  YM: '124603',
  RTY: '239742',
  DX: '098662',
  E6: '099741',
  B6: '096742',
  J6: '097741',
  A6: '232741',
  D6: '090741',
  N6: '112741',
  S6: '092741',
  ZN: '043602',
  ZB: '020601',
  ZF: '044601',
  ZT: '042601',
  ZC: '002602',
  ZS: '005602',
  ZW: '001602',
  LBR: '058644',
  KC: '083731',
  SB: '080732',
  CT: '033661',
  CC: '073732',
  LE: '057642',
  HE: '054642',
  GF: '061641',
  OJ: '040701',
};

const CFTC_CODE_TO_FMP: Record<string, string> = Object.fromEntries(
  Object.entries(CFTC_CODE_BY_CONTRACT).map(([root, code]) => [code, root]),
);

export function historySymbol(symbol: string): { symbol: string; note: string | null } {
  const alias = HISTORY_ALIAS[symbol.trim().toUpperCase()];
  if (alias) return { symbol: alias.provider, note: alias.note };
  return { symbol, note: null };
}

function normalizeCotKey(symbol: string): string {
  let key = symbol.trim().toUpperCase().replace(/[/:\-_]/g, '');
  key = key.replace(/=F$/, '');
  if (CFTC_CODE_TO_FMP[key]) return CFTC_CODE_TO_FMP[key];
  const stripped = key.replace(/[FGHJKMNQUVXZ]\d{1,4}$/, '');
  return stripped || key;
}

export function cotContract(symbol: string): string | null {
  const raw = symbol.trim().toUpperCase().replace(/\//g, '');
  if (COT_SYMBOL[raw]) return COT_SYMBOL[raw];
  const key = normalizeCotKey(symbol);
  if (COT_SYMBOL[key]) return COT_SYMBOL[key];
  if (FMP_COT_IDENTITY.has(key)) return key;
  return null;
}

/** CFTC Legacy contract-market code for a desk/chart symbol, or null if unmapped. */
export function cftcContractCode(symbol: string): string | null {
  const raw = symbol.trim().toUpperCase().replace(/[/:\-_]/g, '');
  if (CFTC_CODE_TO_FMP[raw]) return raw;
  const contract = cotContract(symbol);
  if (contract && CFTC_CODE_BY_CONTRACT[contract]) return CFTC_CODE_BY_CONTRACT[contract];
  return null;
}

export function isListedEquity(symbol: string): boolean {
  return getRegistryAsset(symbol)?.category === 'stocks';
}

export function fmpEquitySymbol(symbol: string): string | null {
  const asset = getRegistryAsset(symbol);
  if (asset?.category !== 'stocks') return null;
  return asset.symbol;
}

export type CotSnapshot = {
  contract: string;
  date: string | null;
  noncommercialLong: number | null;
  noncommercialShort: number | null;
  commercialLong: number | null;
  commercialShort: number | null;
  openInterest: number | null;
};

function num(...vals: unknown[]): number | null {
  for (const v of vals) {
    const n = typeof v === 'number' ? v : Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function pick(row: Record<string, unknown>, keys: string[]): unknown {
  const lower = Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase(), v]));
  for (const k of keys) {
    if (lower[k.toLowerCase()] != null) return lower[k.toLowerCase()];
  }
  return undefined;
}

function snapshotFromRow(row: Record<string, unknown>, contract: string): CotSnapshot | null {
  const snap: CotSnapshot = {
    contract,
    date: pick(row, ['date', 'reportDate', 'updated', 'report_date_as_yyyy_mm_dd']) != null
      ? String(pick(row, ['date', 'reportDate', 'updated', 'report_date_as_yyyy_mm_dd'])).slice(0, 10)
      : null,
    noncommercialLong: num(
      pick(row, [
        'noncommPositionsLongAll',
        'noncommercialLong',
        'longNoncommercial',
        'nonCommLong',
        'noncomm_positions_long_all',
      ]),
    ),
    noncommercialShort: num(
      pick(row, [
        'noncommPositionsShortAll',
        'noncommercialShort',
        'shortNoncommercial',
        'nonCommShort',
        'noncomm_positions_short_all',
      ]),
    ),
    commercialLong: num(
      pick(row, ['commPositionsLongAll', 'commercialLong', 'longCommercial', 'commLong', 'comm_positions_long_all']),
    ),
    commercialShort: num(
      pick(row, ['commPositionsShortAll', 'commercialShort', 'shortCommercial', 'commShort', 'comm_positions_short_all']),
    ),
    openInterest: num(pick(row, ['openInterestAll', 'openInterest', 'open_interest', 'oi'])),
  };
  const hasAny =
    snap.noncommercialLong != null ||
    snap.noncommercialShort != null ||
    snap.commercialLong != null ||
    snap.commercialShort != null ||
    snap.openInterest != null;
  return hasAny ? snap : null;
}

function cotRowDate(row: Record<string, unknown>): string {
  return String(pick(row, ['date', 'reportDate', 'updated', 'report_date_as_yyyy_mm_dd']) ?? '');
}

/** Every usable CFTC row, oldest first. Empty when no parseable rows. */
export function parseCotHistory(raw: unknown, contract: string): CotSnapshot[] {
  const envelope = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as { rows?: unknown; reports?: unknown }) : null;
  const payload = envelope?.reports ?? envelope?.rows ?? raw;
  const rows = Array.isArray(payload) ? payload : payload && typeof payload === 'object' ? [payload] : [];
  const objects = rows.filter((r) => r && typeof r === 'object') as Record<string, unknown>[];
  if (!objects.length) return [];
  objects.sort((a, b) => cotRowDate(a).localeCompare(cotRowDate(b)));
  const out: CotSnapshot[] = [];
  for (const row of objects) {
    const snap = snapshotFromRow(row, contract);
    if (snap) out.push(snap);
  }
  return out;
}

export function parseCotReport(raw: unknown, contract: string): CotSnapshot | null {
  const history = parseCotHistory(raw, contract);
  return history.length ? history[history.length - 1] : null;
}

export type OptionsSnapshot = {
  callsOi: number | null;
  putsOi: number | null;
  callsVolume: number | null;
  putsVolume: number | null;
  atmIv: number | null;
  callDelta: number | null;
  putDelta: number | null;
  gamma: number | null;
  gex: number | null;
  contracts: number;
};

function isCall(row: Record<string, unknown>): boolean {
  const t = String(pick(row, ['type', 'optionType', 'contractType', 'side']) ?? '').toLowerCase();
  return t.includes('call') || t === 'c';
}

function isPut(row: Record<string, unknown>): boolean {
  const t = String(pick(row, ['type', 'optionType', 'contractType', 'side']) ?? '').toLowerCase();
  return t.includes('put') || t === 'p';
}

export function parseOptionsChain(raw: unknown, spot: number | null): OptionsSnapshot | null {
  const rows = Array.isArray(raw) ? raw.filter((r) => r && typeof r === 'object') as Record<string, unknown>[] : [];
  if (!rows.length) return null;
  let callsOi = 0;
  let putsOi = 0;
  let callsVolume = 0;
  let putsVolume = 0;
  let gex = 0;
  let gammaSum = 0;
  let gammaN = 0;
  let bestIv: { dist: number; iv: number; callDelta: number | null; putDelta: number | null } | null = null;
  for (const row of rows) {
    const oi = num(pick(row, ['openInterest', 'open_interest', 'oi'])) ?? 0;
    const vol = num(pick(row, ['volume'])) ?? 0;
    const iv = num(pick(row, ['impliedVolatility', 'iv', 'implied_volatility']));
    const gamma = num(pick(row, ['gamma']));
    const delta = num(pick(row, ['delta']));
    const strike = num(pick(row, ['strike', 'strikePrice']));
    const call = isCall(row);
    const put = isPut(row);
    if (call) {
      callsOi += oi;
      callsVolume += vol;
    } else if (put) {
      putsOi += oi;
      putsVolume += vol;
    }
    if (gamma != null) {
      gammaSum += gamma;
      gammaN += 1;
      if (spot != null && spot > 0 && oi > 0) {
        const sign = call ? 1 : put ? -1 : 0;
        gex += sign * gamma * oi * 100 * spot;
      }
    }
    if (iv != null && strike != null && spot != null && spot > 0) {
      const dist = Math.abs(strike - spot);
      if (!bestIv || dist < bestIv.dist) {
        bestIv = {
          dist,
          iv,
          callDelta: call ? delta : bestIv?.callDelta ?? null,
          putDelta: put ? delta : bestIv?.putDelta ?? null,
        };
      }
    }
  }
  return {
    callsOi: callsOi || null,
    putsOi: putsOi || null,
    callsVolume: callsVolume || null,
    putsVolume: putsVolume || null,
    atmIv: bestIv ? (bestIv.iv <= 2 ? bestIv.iv * 100 : bestIv.iv) : null,
    callDelta: bestIv?.callDelta ?? null,
    putDelta: bestIv?.putDelta ?? null,
    gamma: gammaN ? gammaSum / gammaN : null,
    gex: gex || null,
    contracts: rows.length,
  };
}
