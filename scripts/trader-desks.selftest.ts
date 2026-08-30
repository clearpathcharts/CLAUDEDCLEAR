/**
 * Trader desks: four UIs, institutional structure engine, routing.
 * Run: npx tsx scripts/trader-desks.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import {
  DESK_PAPER_STORAGE_KEY,
  FX_SESSIONS,
  TRADER_DESK_IDS,
  TRADER_DESKS,
  isDeskPaper,
  isDeskPath,
  isSessionOpen,
  isTraderDeskId,
  parseDeskPath,
} from '../src/lib/traderDesks.ts';
import { analyzeInstitutionalStructure } from '../src/lib/institutional/analyzeStructure.ts';
import { pearsonCorrelation, reconstructBarTape } from '../src/lib/institutional/marketMath.ts';
import { DESK_SEO } from '../src/content/traderDesksCopy.ts';
import type { Candle } from '../src/types/indicators.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

assert.equal(TRADER_DESK_IDS.length, 4);
for (const id of TRADER_DESK_IDS) {
  assert.ok(TRADER_DESKS[id].href.startsWith('/desk/'));
  assert.ok(DESK_SEO[id].h1);
  assert.ok(DESK_SEO[id].description.includes('ClearPath') || DESK_SEO[id].title.includes('ClearPath'));
}

assert.equal(parseDeskPath('/desk/institutional'), 'institutional');
assert.equal(parseDeskPath('/desk/INSTITUTIONAL?x=1'), 'institutional');
assert.equal(parseDeskPath('/fundamental'), 'fundamental');
assert.equal(parseDeskPath('/fundamental/NVDA'), 'fundamental');
assert.equal(parseDeskPath('/desk'), null);
assert.equal(parseDeskPath('/desk/unknown'), null);
assert.equal(isDeskPath('/desk/retail'), true);
assert.equal(isDeskPath('/fundamental'), true);
assert.equal(isTraderDeskId('retail'), true);
assert.equal(isTraderDeskId('ceo'), false);

assert.equal(isSessionOpen(8, 7, 16), true);
assert.equal(isSessionOpen(16, 7, 16), false);
assert.equal(isSessionOpen(22, 21, 6), true);
assert.equal(isSessionOpen(10, 21, 6), false);
assert.ok(FX_SESSIONS.length === 4);
assert.equal(isDeskPaper('white'), true);
assert.equal(isDeskPaper('black'), true);
assert.equal(isDeskPaper('blue'), false);
assert.equal(DESK_PAPER_STORAGE_KEY, 'clearpath_desk_paper');

const themeCss = fs.readFileSync(path.join(root, 'src/components/desks/deskTheme.css'), 'utf8');
assert.match(themeCss, /font-weight: 700/);
assert.match(themeCss, /data-desk-paper='white'/);
assert.match(themeCss, /\[data-retail-door\]/);
assert.match(themeCss, /\[data-neuro-door\]/);
assert.match(themeCss, /font-weight: 800/);
assert.match(themeCss, /retail-bento/);
assert.match(themeCss, /retail-slide-handle/);
assert.match(themeCss, /#ff1493|#FF1493/);
assert.match(themeCss, /#6366f1/);
assert.match(themeCss, /IBM Plex Mono/);
assert.match(themeCss, /Inter/);

assert.equal(TRADER_DESKS.retail.accent.toLowerCase(), '#ff1493');

const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.match(indexHtml, /fonts\.googleapis\.com/);
assert.match(indexHtml, /family=Inter/);
assert.match(indexHtml, /family=IBM\+Plex\+Mono/);

const indexCss = fs.readFileSync(path.join(root, 'src/index.css'), 'utf8');
assert.match(indexCss, /--font-ui:\s*"Inter"/);
assert.match(indexCss, /--font-mono:\s*"IBM Plex Mono"/);

function candle(time: number, o: number, h: number, l: number, c: number, volume = 0): Candle {
  return { time, open: o, high: h, low: l, close: c, volume };
}

const fvgSeries: Candle[] = [
  candle(1, 10, 11, 9, 10.5),
  candle(2, 12, 13, 11.5, 12.5),
  candle(3, 14, 15, 13.5, 14.5),
];
const fvgReport = analyzeInstitutionalStructure(fvgSeries);
assert.ok(fvgReport.fvg.some((g) => g.type === 'BULLISH_FVG'));
assert.equal(fvgReport.volumeMode, 'range-proxy');

const withVol: Candle[] = fvgSeries.map((c) => ({ ...c, volume: 100 }));
assert.equal(analyzeInstitutionalStructure(withVol).volumeMode, 'vendor');

const srcFiles = [
  'src/components/desks/InstitutionalTraderDesk.tsx',
  'src/components/desks/institutional/InstitutionalDashboard.tsx',
  'src/components/desks/institutional/useInstitutionalIntelligence.ts',
  'src/components/desks/FundamentalTraderDesk.tsx',
  'src/components/fundamental/FundamentalDashboard.tsx',
  'src/components/desks/DeskTwelveDataChart.tsx',
  'src/components/desks/RetailTraderDesk.tsx',
  'src/components/desks/retail/RetailDashboard.tsx',
  'src/components/desks/retail/RetailEducationBento.tsx',
  'src/components/desks/retail/RetailSlideStrip.tsx',
  'src/components/desks/retail/AssetColorControls.tsx',
  'src/lib/assetColorPrefs.ts',
  'src/components/desks/retail/useRetailIntelligence.ts',
  'src/components/desks/retail/retailStore.ts',
  'src/components/CeoDashboard.tsx',
  'src/components/desks/NeurodivergentTraderDesk.tsx',
  'src/components/desks/neuro/NeurodivergentDashboard.tsx',
  'src/components/desks/neuro/neuroProfile.ts',
  'src/components/desks/DeskRoute.tsx',
  'src/components/desks/TraderDeskChrome.tsx',
  'src/components/Dashboard.tsx',
  'src/App.tsx',
  'src/components/Auth.tsx',
  'src/components/ChooseYourPath.tsx',
  'server.ts',
];
for (const rel of srcFiles) {
  const text = fs.readFileSync(path.join(root, rel), 'utf8');
  if (rel === 'src/App.tsx') {
    assert.match(text, /DeskRoute/);
    assert.match(text, /isDeskPath/);
  }
  if (rel === 'src/components/Auth.tsx') {
    assert.match(text, /navigateToDesk/);
    assert.doesNotMatch(text, /enterChosenPath = \(profileId/);
  }
  if (rel === 'src/components/ChooseYourPath.tsx') {
    assert.match(text, /onEnter\(card\.id\)/);
    assert.match(text, /onEnter\('neurodivergent'\)/);
  }
  if (rel === 'src/components/desks/InstitutionalTraderDesk.tsx') {
    assert.match(text, /InstitutionalDashboard/);
    assert.doesNotMatch(text, /Pattern Scanner/);
  }
  if (rel === 'src/components/desks/institutional/InstitutionalDashboard.tsx') {
    assert.match(text, /data-institutional-door/);
    assert.match(text, /Market Universe/);
    assert.match(text, /Global Markets/);
    assert.match(text, /Primary Market Workspace/);
    assert.match(text, /Market Flow/);
    assert.match(text, /Liquidity/);
    assert.match(text, /Time & Sales/);
    assert.match(text, /Market Structure \/ Technical Analytics/);
    assert.match(text, /Volume Analytics/);
    assert.match(text, /Volatility/);
    assert.match(text, /Options Intelligence/);
    assert.match(text, /Cross-Asset Correlation/);
    assert.match(text, /Macro Intelligence/);
    assert.match(text, /News Intelligence/);
    assert.match(text, /Economic Calendar/);
    assert.match(text, /Positioning/);
    assert.match(text, /Risk Environment/);
    assert.match(text, /Earnings/);
    assert.match(text, /embedMode/);
    assert.match(text, /DeskTwelveDataChart/);
    assert.match(text, /analyzeInstitutionalStructure/);
    assert.match(text, /Information & analytics only/);
    assert.doesNotMatch(text, /Pattern Scanner/);
    assert.doesNotMatch(text, /order ticket|Place order|broker routing/i);
    assert.doesNotMatch(text, /2382/);
    assert.doesNotMatch(text, /104\.82/);
  }
  if (rel === 'src/components/desks/institutional/useInstitutionalIntelligence.ts') {
    assert.match(text, /\/api\/quotes/);
    assert.match(text, /\/api\/newsdata\/latest/);
    assert.match(text, /\/api\/fred\/observations/);
  }
  if (rel === 'src/components/desks/RetailTraderDesk.tsx') {
    assert.match(text, /RetailDashboard/);
    assert.doesNotMatch(text, /study desk/);
  }
  if (rel === 'src/components/desks/retail/RetailDashboard.tsx') {
    assert.match(text, /data-retail-door/);
    assert.match(text, /Retail Market/);
    assert.match(text, /Global Market Ribbon/);
    assert.match(text, /My Watchlist/);
    assert.match(text, /Primary Chart/);
    assert.match(text, /Market Snapshot/);
    assert.match(text, /Market Context/);
    assert.match(text, /Volume \/ Price/);
    assert.match(text, /Market Movers/);
    assert.match(text, /Economic Calendar/);
    assert.match(text, /Alerts \/ Events/);
    assert.match(text, /What Changed/);
    assert.match(text, /Simulation Lab/);
    assert.match(text, /Focus mode/);
    assert.match(text, /Blackout/);
    assert.match(text, /DeskTwelveDataChart/);
    assert.match(text, /RetailEducationBento/);
    assert.match(text, /RetailSlideStrip/);
    assert.match(text, /AssetColorControls/);
    assert.match(text, /PatternScannerPanel/);
    assert.match(text, /Pattern Scanner/);
    assert.match(text, /useDedicatedPatternPanel/);
    assert.match(text, /Information & analytics only/);
    assert.match(text, /DATA UNAVAILABLE/);
    assert.doesNotMatch(text, /You should buy|You should sell|Place order|broker routing/i);
    assert.doesNotMatch(text, /Market Flow|Time & Sales|Options Intelligence/);
  }
  if (rel === 'src/components/desks/retail/AssetColorControls.tsx') {
    assert.match(text, /data-asset-color-controls/);
    assert.match(text, /Numerology/);
    assert.match(text, /RAINBOW_PRESETS/);
    assert.match(text, /type="color"/);
  }
  if (rel === 'src/lib/assetColorPrefs.ts') {
    assert.match(text, /clearpath_asset_colors_v1/);
    assert.match(text, /resolveAssetColors/);
    assert.match(text, /RAINBOW_PRESETS/);
  }
  if (rel === 'src/components/CeoDashboard.tsx') {
    assert.match(text, /DailyOpsDesk/);
    assert.match(text, /CeoAlwaysOnMonitor/);
    assert.match(text, /userProfile\?\.email/);
    assert.match(text, /\/ceo/);
    assert.doesNotMatch(text, /Pattern Scanner/);
  }
  if (rel === 'src/components/desks/retail/RetailSlideStrip.tsx') {
    assert.match(text, /data-retail-slide-strip/);
    assert.match(text, /clearpath_retail_slide_strip_px/);
    assert.match(text, /cursor-row-resize/);
    assert.match(text, /aria-orientation="horizontal"/);
  }
  if (rel === 'src/components/desks/retail/RetailEducationBento.tsx') {
    assert.match(text, /InstitutionalRegistry/);
    assert.match(text, /What am I looking at/);
    assert.match(text, /BOS|CHoCH|FVG/);
  }
  if (rel === 'src/components/desks/retail/useRetailIntelligence.ts') {
    assert.match(text, /\/api\/quotes/);
    assert.match(text, /\/api\/newsdata\/latest/);
    assert.match(text, /fetchEconomicNews/);
  }
  if (rel === 'src/components/desks/retail/retailStore.ts') {
    assert.match(text, /DEFAULT_WATCHLISTS/);
    assert.match(text, /clearpath_retail_watchlists_v1/);
  }
  if (rel === 'src/components/desks/NeurodivergentTraderDesk.tsx') {
    assert.match(text, /NeurodivergentDashboard/);
    assert.doesNotMatch(text, /navigateToDesk\('retail'\)/);
    assert.doesNotMatch(text, /href=\{`\/\?profile=/);
  }
  if (rel === 'src/components/desks/neuro/NeurodivergentDashboard.tsx') {
    assert.match(text, /data-neuro-door/);
    assert.match(text, /data-neuro-workstation/);
    assert.match(text, /DeskTwelveDataChart/);
    assert.match(text, /NEURO_DESK_PROFILES/);
    assert.match(text, /NEURO_RIBBON/);
    assert.match(text, /applyNeuroProfile/);
    assert.match(text, /DATA UNAVAILABLE/);
    assert.match(text, /RetailEducationBento/);
    assert.doesNotMatch(text, /You should buy|Place order|broker routing/i);
    assert.doesNotMatch(text, /href=\{`\/\?profile=/);
  }
  if (rel === 'src/components/desks/neuro/neuroProfile.ts') {
    assert.match(text, /calm_focus/);
    assert.match(text, /adhd_hyperfocus/);
    assert.match(text, /BTCUSD/);
    assert.match(text, /clearpath-set-profile/);
  }
  if (rel === 'src/components/desks/TraderDeskChrome.tsx') {
    assert.match(text, /replace\(' Traders', ''\)\.replace\(' Trader', ''\)/);
    assert.match(text, /White screen/);
    assert.match(text, /togglePaper/);
    assert.match(text, /data-ceo-ops-link/);
    assert.match(text, /\/ceo/);
    assert.match(text, /isFounderEmail/);
  }
  if (rel === 'src/components/desks/FundamentalTraderDesk.tsx') {
    assert.match(text, /FundamentalDashboard/);
    assert.match(text, /data-fundamental-door/);
    assert.doesNotMatch(text, /FundamentalsPanel/);
  }
  if (rel === 'src/components/fundamental/FundamentalDashboard.tsx') {
    assert.match(text, /DeskTwelveDataChart/);
    assert.match(text, /Twelve Data/);
  }
  if (rel === 'src/components/desks/DeskTwelveDataChart.tsx') {
    assert.match(text, /data-desk-twelvedata-chart/);
    assert.match(text, /userTier="VIP"/);
    assert.match(text, /\/api\/twelvedata\/config/);
    assert.match(text, /LightweightCandles/);
  }
  if (rel === 'src/components/desks/DeskRoute.tsx') {
    assert.match(text, /desk-shell/);
    assert.match(text, /data-desk-paper/);
    assert.match(text, /DeskAppearanceProvider/);
  }
  if (rel === 'src/components/Dashboard.tsx') {
    assert.match(text, /CeoDashboard/);
    assert.match(text, /path === '\/ceo'/);
    assert.match(text, /next === 'CeoDashboard' && !isFounder\(\)/);
    assert.doesNotMatch(text, /next === 'CeoDashboard' && !isFounderEmail\(authUser\?\.email\)/);
  }
  if (rel === 'server.ts') {
    assert.match(text, /\/desk\/:deskId/);
    assert.match(text, /isDeskRoute/);
    assert.match(text, /\/api\/fmp\/lookup/);
  }
}

const inst = fs.readFileSync(path.join(root, 'src/components/desks/institutional/InstitutionalDashboard.tsx'), 'utf8');
assert.match(inst, /does not evaluate|Not signals|Educational/i);

const r = pearsonCorrelation([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
assert.ok(r != null && Math.abs(r - 1) < 1e-9);
const tape = reconstructBarTape([
  { time: Date.parse('2026-01-01T08:42:01Z') / 1000, open: 10, high: 12, low: 9, close: 11.5, volume: 450 },
]);
assert.equal(tape[0].side, 'BUY-SIDE');
assert.equal(tape[0].reconstructed, true);

console.log('trader-desks.selftest: ok');
