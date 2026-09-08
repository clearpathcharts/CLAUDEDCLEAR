/**
 * Fundamental Trader Door: research workstation, no execution, no fabricated figures.
 * Run: npx tsx scripts/fundamental-door.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { runScenario } from '../src/fundamental/scenario.ts';
import { surpriseVsConsensus, yoyGrowth, cagr, formatCompactUsd } from '../src/fundamental/format.ts';
import { parseDeskPath, symbolFromDeskPath } from '../src/lib/traderDesks.ts';
import { FMP_ALLOWED_ENDPOINTS, FMP_LOOKUP_KINDS, buildFmpStableLookupUrl, buildFmpStableSymbolUrl } from '../src/server/secrets.ts';
import { searchIdentityCatalog } from '../src/fundamental/searchCatalog.ts';
import { coverageExposure, concentrationBand, asPercent } from '../src/fundamental/viz.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

assert.equal(parseDeskPath('/fundamental/NVDA'), 'fundamental');
assert.equal(symbolFromDeskPath('/fundamental/NVDA'), 'NVDA');
assert.equal(symbolFromDeskPath('/desk/fundamental/AAPL'), 'AAPL');

const files = [
  'src/components/fundamental/FundamentalDashboard.tsx',
  'src/components/fundamental/ResearchPanels.tsx',
  'src/components/fundamental/FundamentalContext.tsx',
  'src/fundamental/service.ts',
  'src/fundamental/format.ts',
  'src/components/fundamental/BentoWorkspace.tsx',
  'src/components/fundamental/BentoPrimitives.tsx',
];
const joined = files.map((rel) => fs.readFileSync(path.join(root, rel), 'utf8')).join('\n');

assert.match(joined, /DATA UNAVAILABLE/);
assert.match(joined, /DEMO DATA — NOT LIVE|DATA DELAYED|DATA UNAVAILABLE/);
assert.match(joined, /INFORMATION|Information & analytics only|no trade execution/i);
assert.match(joined, /EPS ACTUAL: ABOVE CONSENSUS/);
assert.doesNotMatch(joined, />\s*(Buy|Sell|Long|Short)\s*</);
assert.doesNotMatch(joined, /Strong Buy|Strong Sell|Enter Trade|Order Ticket|Trade Ticket/);
assert.doesNotMatch(joined, /You should buy|You should sell|Good entry|Take profit|Stop loss/);
assert.doesNotMatch(joined, /fmp\/rating/);
assert.doesNotMatch(joined, /calculatePE\(/);

assert.ok(!FMP_ALLOWED_ENDPOINTS.has('rating'));
assert.ok(FMP_ALLOWED_ENDPOINTS.has('income-statement'));
assert.ok(FMP_LOOKUP_KINDS.has('search'));

const dash = fs.readFileSync(path.join(root, 'src/components/fundamental/FundamentalDashboard.tsx'), 'utf8');
assert.match(dash, /ClearPath Fundamental|Equity research workstation/);
assert.match(dash, /AssetSearchBox/);
assert.match(dash, /ResearchRail/);
assert.match(dash, /BentoWorkspace/);

const fundBento = fs.readFileSync(path.join(root, 'src/components/fundamental/BentoPrimitives.tsx'), 'utf8');
assert.match(fundBento, /rt-bento-x/);
assert.match(fundBento, /useDeskHold/);

const fundDesk = fs.readFileSync(path.join(root, 'src/components/desks/FundamentalTraderDesk.tsx'), 'utf8');
assert.match(fundDesk, /DeskHoldScope/);

const bento = fs.readFileSync(path.join(root, 'src/components/fundamental/BentoWorkspace.tsx'), 'utf8');
assert.match(bento, /Business model/);
assert.match(bento, /Revenue engine/);
assert.match(bento, /Capital allocation/);
assert.match(bento, /Geographic exposure/);
assert.match(bento, /Macro exposure/);
assert.doesNotMatch(bento, /Company Health/);
assert.doesNotMatch(bento, /UNDERVALUED|OVERVALUED/);

const svc = fs.readFileSync(path.join(root, 'src/fundamental/service.ts'), 'utf8');
assert.match(svc, /\/api\/fmp\//);
assert.match(svc, /\/api\/fred\/observations/);
assert.doesNotMatch(svc, /simulated/);
assert.doesNotMatch(svc, /Math\.random/);

const out = runScenario({
  revenueBase: 100,
  revenueHigh: 120,
  revenueLow: 80,
  marginBase: 0.2,
  marginHigh: 0.25,
  marginLow: 0.1,
  fcfConversionBase: 0.5,
  fcfConversionHigh: 0.6,
  fcfConversionLow: 0.4,
});
assert.equal(out.ebitBase, 20);
assert.equal(out.fcfHigh, 18);

const beat = surpriseVsConsensus(1.2, 1.0);
assert.equal(beat.label, 'EPS ACTUAL: ABOVE CONSENSUS');
assert.equal(yoyGrowth(120, 100), 20);
assert.ok(Math.abs((cagr(100, 121, 2) ?? 0) - 10) < 0.01);
assert.equal(formatCompactUsd(null), 'DATA UNAVAILABLE');
assert.match(formatCompactUsd(2.5e12), /T/);

assert.ok(Math.abs((asPercent(0.55) ?? 0) - 55) < 1e-9);
assert.equal(coverageExposure(2)?.band, 'HIGH');
assert.equal(coverageExposure(10)?.band, 'LOW');
assert.equal(concentrationBand(80)?.band, 'HIGH');

const nvda = searchIdentityCatalog('NVDA', 8);
assert.ok(nvda.some((h) => h.ticker === 'NVDA'));
assert.ok(nvda[0].assetType);

const server = fs.readFileSync(path.join(root, 'server.ts'), 'utf8');
const secrets = fs.readFileSync(path.join(root, 'src/server/secrets.ts'), 'utf8');
assert.match(server, /\/api\/fmp\/lookup/);
assert.match(secrets, /opts\?\.period === 'annual' \|\| opts\?\.period === 'quarter'/);
assert.match(server, /buildFmpStableSymbolUrl/);
assert.match(server, /buildFmpStableLookupUrl/);
assert.doesNotMatch(server, /financialmodelingprep\.com\/api\/v3/);
assert.match(server, /app\.get\(\['\/fundamental', '\/fundamental\/:symbol'\]/);
assert.match(server, /res\.redirect\(301, `\$\{dest\}/);

const quoteUrl = buildFmpStableSymbolUrl('quote', 'AAPL', 'test-key');
assert.match(String(quoteUrl), /financialmodelingprep\.com\/stable\/quote\?/);
assert.match(String(quoteUrl), /symbol=AAPL/);
assert.doesNotMatch(String(quoteUrl), /\/api\/v3\//);
const searchUrl = buildFmpStableLookupUrl('search', 'test-key', { q: 'NVDA' });
assert.match(String(searchUrl), /\/stable\/search-symbol\?/);

console.log('fundamental-door.selftest: ok');
