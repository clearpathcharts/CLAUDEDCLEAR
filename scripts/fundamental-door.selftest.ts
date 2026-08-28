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
import { FMP_ALLOWED_ENDPOINTS, FMP_LOOKUP_KINDS } from '../src/server/secrets.ts';
import { searchIdentityCatalog } from '../src/fundamental/searchCatalog.ts';

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
  'src/components/desks/FundamentalTraderDesk.tsx',
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
assert.match(dash, /Fundamental Market Intelligence/);
assert.match(dash, /AssetSearchBox/);
assert.match(dash, /ResearchNav/);

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

const nvda = searchIdentityCatalog('NVDA', 8);
assert.ok(nvda.some((h) => h.ticker === 'NVDA'));
assert.ok(nvda[0].assetType);

const server = fs.readFileSync(path.join(root, 'server.ts'), 'utf8');
assert.match(server, /\/api\/fmp\/lookup/);
assert.match(server, /period === 'annual' \|\| period === 'quarter'/);

console.log('fundamental-door.selftest: ok');
