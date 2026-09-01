/**
 * First-party COT net commercials vs net non-commercials.
 * Run: npx tsx scripts/cot-indicator.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { cotContract, cftcContractCode, parseCotHistory, parseCotReport } from '../src/lib/institutional/vendorMaps.ts';
import {
  calculateCOT,
  netCommercialPositions,
  netNonCommercialPositions,
} from '../src/indicators/sentiment/COT.ts';
import { IndicatorBank } from '../src/core/engine/IndicatorBank.ts';
import { IndicatorEngine } from '../src/core/engine/IndicatorEngine.ts';
import { SUPPORTED_CHART_INDICATORS } from '../src/config/tradingViewIndicators.ts';
import { buildFmpStableLookupUrl } from '../src/server/secrets.ts';
import { validateCftcRows } from '../src/lib/cot/cftcValidate.ts';
import { normalizeDisaggregatedRow, normalizeLegacyRow, mergeNormalized } from '../src/lib/cot/normalize.ts';
import { buildCotAnalytics, priceCotDivergence } from '../src/lib/cot/analytics.ts';
import { cotAgeDays, cotFeedChip, formatCotAgeLabel, formatCotReportLabel, newsFeedChip, NOT_CONFIGURED } from '../src/lib/cot/status.ts';
import { cftcAnnualZipUrl } from '../src/server/cot/rawArchive.ts';
import {
  buildCftcLegacyUrl,
  clearCotCacheForTest,
  peekCotCache,
  seedCotCacheForTest,
} from '../src/server/cftcCot.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

assert.equal(cotContract('XAUUSD'), 'GC');
assert.equal(cotContract('GC'), 'GC');
assert.equal(cotContract('GCH26'), 'GC');
assert.equal(cotContract('EURUSD'), 'E6');
assert.equal(cotContract('6E'), 'E6');
assert.equal(cotContract('HG'), 'HG');
assert.equal(cotContract('COPPER'), 'HG');
assert.equal(cotContract('085692'), 'HG');
assert.equal(cotContract('LBR'), 'LBR');
assert.equal(cotContract('LUMBER'), 'LBR');
assert.equal(cotContract('058644'), 'LBR');
assert.equal(cotContract('NVDA'), null);
assert.equal(cftcContractCode('XAUUSD'), '088691');
assert.equal(cftcContractCode('GC'), '088691');
assert.equal(cftcContractCode('HG'), '085692');
assert.equal(cftcContractCode('085692'), '085692');
assert.equal(cftcContractCode('LBR'), '058644');
assert.equal(cftcContractCode('NVDA'), null);

const rows = [
  {
    date: '2026-08-19',
    noncommPositionsLongAll: 10,
    noncommPositionsShortAll: 4,
    commPositionsLongAll: 20,
    commPositionsShortAll: 80,
    openInterestAll: 100,
  },
  {
    date: '2026-08-26',
    noncommPositionsLongAll: 100,
    noncommPositionsShortAll: 40,
    commPositionsLongAll: 30,
    commPositionsShortAll: 90,
    openInterestAll: 500,
  },
];
const history = parseCotHistory(rows, 'GC');
assert.equal(history.length, 2);
assert.equal(history[0].date, '2026-08-19');
assert.equal(parseCotReport(rows, 'GC')?.noncommercialLong, 100);
assert.equal(netCommercialPositions(history[0]), 20 - 80);
assert.equal(netNonCommercialPositions(history[1]), 100 - 40);

const day = (iso: string) => Math.floor(Date.parse(`${iso}T00:00:00Z`) / 1000);
const candles = [
  { time: day('2026-08-10'), open: 1, high: 1, low: 1, close: 1 },
  { time: day('2026-08-20'), open: 1, high: 1, low: 1, close: 1 },
  { time: day('2026-08-27'), open: 1, high: 1, low: 1, close: 1 },
  { time: day('2026-08-28'), open: 1, high: 1, low: 1, close: 1 },
];

const stepped = calculateCOT(candles, {
  reports: history,
  hideCurrentWeek: false,
  nowSec: day('2026-08-28') + 3600,
  barDurationSec: 86400,
});
assert.equal(stepped.length, 3, 'bars before the first report stay blank');
assert.equal(stepped[0].time, day('2026-08-20'));
assert.equal(stepped[0].commercial, -60);
assert.equal(stepped[0].large, 6);
assert.equal(stepped[1].commercial, 30 - 90);
assert.equal(stepped[1].large, 60);
assert.equal(stepped[2].commercial, 30 - 90, 'holds last report as a step');

const hidden = calculateCOT(candles, {
  reports: history,
  hideCurrentWeek: true,
  nowSec: day('2026-08-28') + 3600,
  barDurationSec: 86400,
});
assert.ok(!hidden.some((p) => p.time === day('2026-08-28')), 'forming bar is blank when hideCurrentWeek');
assert.ok(hidden.some((p) => p.time === day('2026-08-27')));

assert.deepEqual(calculateCOT(candles, { reports: [] }), []);
assert.equal(typeof IndicatorBank.COT, 'function');
assert.equal(IndicatorEngine.calculate('COT', candles, { reports: [] }).length, 0);
assert.ok(SUPPORTED_CHART_INDICATORS.some((i) => i.abbr === 'COT'));

const cotUrl = buildFmpStableLookupUrl('cot', 'test-key', { symbol: 'HG' });
assert.match(String(cotUrl), /commitment-of-traders-report/);
assert.match(String(cotUrl), /symbol=HG/);
assert.match(String(cotUrl), /from=/);

const candlesSrc = fs.readFileSync(path.join(root, 'src/components/charts/LightweightCandles.tsx'), 'utf8');
assert.match(candlesSrc, /indAbbr === "COT"/);
assert.match(candlesSrc, /LineType\.WithSteps/);
assert.match(candlesSrc, /Commercials/);
assert.match(candlesSrc, /Large Traders/);
assert.doesNotMatch(candlesSrc, /LibraryCOT/);

const mathSrc = fs.readFileSync(path.join(root, 'src/indicators/sentiment/COT.ts'), 'utf8');
assert.match(mathSrc, /first-party/);
assert.match(mathSrc, /\/api\/cot\/history/);
assert.doesNotMatch(mathSrc, /import TradingView/);

const cftcGold = [
  {
    report_date_as_yyyy_mm_dd: '2026-08-25T00:00:00.000',
    noncomm_positions_long_all: '273133',
    noncomm_positions_short_all: '30921',
    comm_positions_long_all: '105433',
    comm_positions_short_all: '384794',
    open_interest_all: '644992',
    futonly_or_combined: 'Combined',
  },
  {
    report_date_as_yyyy_mm_dd: '2026-08-25T00:00:00.000',
    noncomm_positions_long_all: '1',
    noncomm_positions_short_all: '1',
    comm_positions_long_all: '1',
    comm_positions_short_all: '1',
    open_interest_all: '10',
    futonly_or_combined: 'FuturesOnly',
  },
  { junk: true },
  {
    report_date_as_yyyy_mm_dd: '2099-01-01T00:00:00.000',
    comm_positions_long_all: 1,
    comm_positions_short_all: 1,
  },
];
const checked = validateCftcRows(cftcGold, '2026-08-31');
assert.equal(checked.rows.length, 1);
assert.ok(checked.dropped >= 2);
assert.equal(Number(checked.rows[0].open_interest_all), 644992);
const fromCftc = parseCotHistory(checked.rows, 'GC');
assert.equal(fromCftc[0].date, '2026-08-25');
assert.equal(fromCftc[0].commercialLong, 105433);
assert.equal(netCommercialPositions(fromCftc[0]), 105433 - 384794);

const cftcUrl = buildCftcLegacyUrl('088691', 120);
assert.match(cftcUrl, /publicreporting\.cftc\.gov/);
assert.match(cftcUrl, /jun7-fc8e/);
assert.match(cftcUrl, /088691/);

clearCotCacheForTest();
const legacyNorm = normalizeLegacyRow(checked.rows[0], '088691');
assert.ok(legacyNorm);
const disaggNorm = normalizeDisaggregatedRow(
  {
    report_date_as_yyyy_mm_dd: '2026-08-25T00:00:00.000',
    prod_merc_positions_long: 25045,
    prod_merc_positions_short: 56385,
    swap_positions_long_all: 87849,
    swap__positions_short_all: 196574,
    m_money_positions_long_all: 109004,
    m_money_positions_short_all: 81105,
    other_rept_positions_long: 141206,
    other_rept_positions_short: 40818,
    open_interest_all: 644992,
  },
  '088691',
);
assert.ok(disaggNorm);
const merged = mergeNormalized([legacyNorm], [disaggNorm]);
assert.equal(merged[0].reportType, 'merged');
assert.equal(merged[0].managedMoney.long, 109004);
assert.equal(merged[0].commercial.long, 105433);

const rising = Array.from({ length: 20 }, (_, i) => ({
  ...legacyNorm,
  reportDate: new Date(Date.UTC(2026, 0, 6 + i * 7)).toISOString().slice(0, 10),
  commercial: { long: 10 + i, short: 100 },
  noncommercial: { long: 200 - i, short: 20 },
}));
const analytics = buildCotAnalytics(rising);
assert.equal(analytics.institutionalFlow, 'accumulation');
assert.ok(analytics.cotIndex52 != null && analytics.cotIndex52 > 80);
assert.equal(priceCotDivergence([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]), 'bearish');
assert.match(cftcAnnualZipUrl('legacy_fut', 2026), /deacot2026\.zip/);
assert.match(cftcAnnualZipUrl('disagg_fut', 2026), /fut_disagg_txt_2026\.zip/);

seedCotCacheForTest('088691', {
  source: 'cftc.gov',
  engine: 'ClearPath COT Data Engine',
  contract: 'GC',
  cftcCode: '088691',
  cached: false,
  fetchedAt: '2026-08-31T00:00:00.000Z',
  dropped: 0,
  reports: fromCftc,
  normalized: merged,
  analytics,
});
assert.equal(peekCotCache('088691')?.reports[0].commercialLong, 105433);
assert.equal(peekCotCache('088691')?.engine, 'ClearPath COT Data Engine');
clearCotCacheForTest();

const serverSrc = fs.readFileSync(path.join(root, 'server.ts'), 'utf8');
assert.match(serverSrc, /\/api\/cot\/history/);
assert.match(serverSrc, /fetchCftcLegacyHistory/);
assert.match(serverSrc, /ClearPath COT Data Engine/);

const chartCot = fs.readFileSync(path.join(root, 'src/indicators/sentiment/COT.ts'), 'utf8');
assert.match(chartCot, /\/api\/cot\/history/);
assert.doesNotMatch(chartCot, /from ['"]LibraryCOT['"]/);

assert.equal(formatCotReportLabel('2026-08-25'), 'Aug 25, 2026');
assert.equal(cotAgeDays('2026-08-25', new Date(Date.UTC(2026, 7, 31))), 6);
assert.equal(formatCotAgeLabel('2026-08-25', new Date(Date.UTC(2026, 7, 31))), '6 DAYS');
assert.equal(cotFeedChip({ status: 'ok', cached: true, note: 'CFTC.gov · GC · 088691' }), 'CACHED');
assert.equal(cotFeedChip({ status: 'ok', cached: false, note: 'CFTC.gov · GC · 088691' }), 'CFTC FETCH');
assert.equal(cotFeedChip({ status: 'unmapped', cached: false, note: 'NO CFTC MAP' }), 'NO CFTC MAP');
assert.equal(cotFeedChip({ status: 'unavailable', cached: false, note: 'loading' }), 'LOADING');
assert.equal(cotFeedChip({ status: 'unavailable', cached: false, note: 'CFTC UNAVAILABLE' }), 'PROVIDER ERROR');
assert.equal(newsFeedChip('News unavailable (HTTP 429)'), 'rate limited');
assert.equal(newsFeedChip(null), 'wire');
assert.equal(NOT_CONFIGURED, 'NOT CONFIGURED');

const dashSrc = fs.readFileSync(path.join(root, 'src/components/desks/institutional/InstitutionalDashboard.tsx'), 'utf8');
assert.match(dashSrc, /NOT_CONFIGURED/);
assert.doesNotMatch(dashSrc, /k="Short interest" v="DATA UNAVAILABLE"/);

console.log('cot-indicator.selftest: ok');
