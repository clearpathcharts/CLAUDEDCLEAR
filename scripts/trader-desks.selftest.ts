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
  deskCanonicalPath,
  deskIdFromHomeProfile,
  isDeskPaper,
  isDeskPath,
  isMemberHomePath,
  isSessionOpen,
  isTraderDeskId,
  memberHomeDeskHref,
  parseDeskPath,
  shouldStayOnPublicHome,
} from '../src/lib/traderDesks.ts';
import { analyzeInstitutionalStructure } from '../src/lib/institutional/analyzeStructure.ts';
import { pearsonCorrelation, reconstructBarTape } from '../src/lib/institutional/marketMath.ts';
import { parseHeldIds } from '../src/components/desks/deskHeldPanels.ts';
import {
  deskSectionOpen,
  NEURO_CHART_FIRST_HELD,
} from '../src/components/desks/heldMeta.ts';
import { DESK_SEO } from '../src/content/traderDesksCopy.ts';
import type { Candle } from '../src/types/indicators.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

assert.equal(TRADER_DESK_IDS.length, 4);
for (const id of TRADER_DESK_IDS) {
  assert.ok(TRADER_DESKS[id].href.startsWith('/desk/'));
  assert.ok(DESK_SEO[id].h1.endsWith('Trader Desk'));
  assert.match(DESK_SEO[id].title, /ClearPathTrader/);
  assert.ok(DESK_SEO[id].description.length <= 160);
  assert.ok(DESK_SEO[id].faqs.length >= 2);
}

assert.equal(parseDeskPath('/desk/institutional'), 'institutional');
assert.equal(parseDeskPath('/desk/INSTITUTIONAL?x=1'), 'institutional');
assert.equal(parseDeskPath('/fundamental'), 'fundamental');
assert.equal(parseDeskPath('/fundamental/NVDA'), 'fundamental');
assert.equal(parseDeskPath('/desk'), null);
assert.equal(parseDeskPath('/desk/unknown'), null);
assert.equal(deskCanonicalPath('/fundamental'), '/desk/fundamental');
assert.equal(deskCanonicalPath('/desk/institutional'), '/desk/institutional');
assert.equal(isDeskPath('/desk/retail'), true);
assert.equal(isDeskPath('/fundamental'), true);
assert.equal(isTraderDeskId('retail'), true);
assert.equal(isTraderDeskId('ceo'), false);

assert.equal(isMemberHomePath('/'), true);
assert.equal(isMemberHomePath('/login'), true);
assert.equal(isMemberHomePath('/activate'), true);
assert.equal(isMemberHomePath('/desk/retail'), false);
assert.equal(shouldStayOnPublicHome('?choose=1'), true);
assert.equal(shouldStayOnPublicHome('?home=1'), true);
assert.equal(shouldStayOnPublicHome('?profile=calm_focus'), false);
assert.equal(deskIdFromHomeProfile('calm_focus'), null);
assert.equal(deskIdFromHomeProfile('autism_predictable'), 'neurodivergent');
assert.equal(memberHomeDeskHref({}), '/desk/institutional');
assert.equal(memberHomeDeskHref({ remembered: 'retail' }), '/desk/retail');
assert.equal(
  memberHomeDeskHref({ search: '?profile=autism_predictable', remembered: 'retail' }),
  '/desk/neurodivergent?profile=autism_predictable',
);
assert.equal(
  memberHomeDeskHref({ search: '?profile=calm_focus', remembered: 'fundamental' }),
  '/desk/fundamental?profile=calm_focus',
);

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
assert.match(indexHtml, /interactive-widget=resizes-content/);
assert.match(indexHtml, /viewport-fit=cover/);

const indexCss = fs.readFileSync(path.join(root, 'src/index.css'), 'utf8');
assert.match(indexCss, /--font-ui:\s*"Inter"/);
assert.match(indexCss, /--font-mono:\s*"IBM Plex Mono"/);
assert.match(indexCss, /html:has\(\.desk-shell\)/);

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
  'src/components/desks/RetailTraderDesk.tsx',
  'src/components/desks/retail/RetailDashboard.tsx',
  'src/components/desks/retail/RetailEducationBento.tsx',
  'src/components/desks/retail/RetailSlideStrip.tsx',
  'src/components/desks/retail/AssetColorControls.tsx',
  'src/lib/assetColorPrefs.ts',
  'src/components/desks/retail/useRetailIntelligence.ts',
  'src/components/desks/retail/retailStore.ts',
  'src/components/CeoDashboard.tsx',
  'src/components/DailyOpsDesk.tsx',
  'src/components/DailyPatternReviewDesk.tsx',
  'src/components/desks/NeurodivergentTraderDesk.tsx',
  'src/components/desks/neuro/NeurodivergentDashboard.tsx',
  'src/components/desks/neuro/neuroProfile.ts',
  'src/components/desks/DeskRoute.tsx',
  'src/components/desks/TraderDeskChrome.tsx',
  'src/components/desks/DeskScreensMenu.tsx',
  'src/components/desks/DeskScreenWorkspace.tsx',
  'src/lib/deskMonitorTree.ts',
  'src/hooks/useDeskMonitorSync.ts',
  'src/components/desks/ColorChartPicker.tsx',
  'src/lib/deskColorChart.ts',
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
    assert.match(text, /user \? <DeskRoute pathname=\{currentPath\} \/> : <Auth \/>/);
    assert.match(text, /MemberDeskRedirect/);
    assert.match(text, /isMemberHomePath/);
    assert.match(text, /shouldStayOnPublicHome/);
    assert.match(text, /<CptBuddyWidget \/>/);
    assert.doesNotMatch(text, /!isAppShell && <CptBuddyWidget/);
  }
  if (rel === 'src/components/Auth.tsx') {
    assert.match(text, /rememberTraderDesk/);
    assert.match(text, /openPrivateLogin/);
    assert.match(text, /navigateToDesk\(deskId\)/);
    assert.match(text, /openMemberDesk/);
    assert.doesNotMatch(text, /enterChosenPath = \(profileId/);
    assert.match(text, /data-auth-chart-first/);
    assert.match(text, /order-1 md:order-2/);
  }
  if (rel === 'src/components/ChooseYourPath.tsx') {
    assert.match(text, /onChoosePath\(card\.id\)/);
    assert.match(text, /onChoosePath\('neurodivergent'\)/);
    assert.doesNotMatch(text, /PathEnter/);
    assert.doesNotMatch(text, />\s*Enter\s*</);
  }
  if (rel === 'src/components/desks/InstitutionalTraderDesk.tsx') {
    assert.match(text, /InstitutionalDashboard/);
    assert.match(text, /DeskHoldScope/);
    assert.match(text, /clearpath_held_institutional_v4/);
    assert.match(text, /defaultHeld=\{INSTITUTIONAL_CHART_FIRST_HELD\}/);
    assert.match(text, /INSTITUTIONAL_CHART_FIRST_HELD/);
    assert.doesNotMatch(text, /Pattern Scanner/);
  }
  if (rel === 'src/components/desks/institutional/InstitutionalDashboard.tsx') {
    assert.match(text, /data-institutional-door/);
    assert.match(text, /overflow-visible/);
    assert.doesNotMatch(text, /overflow-hidden p-2/);
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
    assert.match(text, /cotFeedChip/);
    assert.match(text, /NOT_CONFIGURED/);
    assert.match(text, /Weekly CFTC print/);
    assert.match(text, /newsFeedChip/);
    assert.doesNotMatch(text, /k="Short interest" v="DATA UNAVAILABLE"/);
    assert.match(text, /Risk Environment/);
    assert.match(text, /Earnings/);
    assert.match(text, /DeskChartFill/);
    assert.match(text, /height=\{layout === 1 \? 640 : 280\}/);
    assert.match(text, /embedMode/);
    assert.match(text, /holdId=/);
    assert.match(text, /data-desk-chart-room/);
    assert.match(text, /showNewsRow/);
    assert.match(text, /min-h-\[70vh\]/);
    assert.match(text, /analyzeInstitutionalStructure/);
    assert.match(text, /Information & analytics only/);
    assert.doesNotMatch(text, /Pattern Scanner/);
    assert.doesNotMatch(text, /order ticket|Place order|broker routing/i);
    assert.doesNotMatch(text, /2382/);
    assert.doesNotMatch(text, /104\.82/);
  }
  if (rel === 'src/components/desks/institutional/useInstitutionalIntelligence.ts') {
    assert.match(text, /fetchQuotesMap/);
    assert.match(text, /clientMarketCache/);
    assert.match(text, /\/api\/newsdata\/latest/);
    assert.match(text, /\/api\/fred\/observations/);
    assert.match(text, /\/api\/cot\/history/);
    assert.match(text, /cached: Boolean\(body\.cached\)/);
  }
  if (rel === 'src/components/desks/RetailTraderDesk.tsx') {
    assert.match(text, /RetailDashboard/);
    assert.match(text, /DeskHoldScope/);
    assert.match(text, /clearpath_held_retail_v4/);
    assert.match(text, /defaultHeld=\{RETAIL_CHART_FIRST_HELD\}/);
    assert.match(text, /RETAIL_CHART_FIRST_HELD/);
    assert.doesNotMatch(text, /study desk/);
  }
  if (rel === 'src/components/desks/retail/RetailDashboard.tsx') {
    assert.match(text, /data-retail-door/);
    assert.match(text, /overflow-visible/);
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
    assert.match(text, /LightweightCandles/);
    assert.match(text, /RetailEducationBento/);
    assert.match(text, /RetailSlideStrip/);
    assert.match(text, /AssetColorControls/);
    assert.match(text, /data-asset-colors-toggle/);
    assert.match(text, /PatternScannerPanel/);
    assert.match(text, /Pattern Scanner/);
    assert.match(text, /holdId=/);
    assert.match(text, /DeskChartFill/);
    assert.match(text, /useDedicatedPatternPanel/);
    assert.match(text, /showBelow/);
    assert.match(text, /deskSectionOpen/);
    assert.match(text, /min-h-\[70vh\]/);
    assert.match(text, /Information & analytics only/);
    assert.match(text, /DATA UNAVAILABLE/);
    assert.match(text, /PassThroughTradePanel/);
    assert.match(text, /useDedicatedPatternPanel=\{i === 0\}/);
    assert.match(text, /hidePatternOverlays=\{i !== 0\}/);
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
  if (rel === 'src/components/DailyPatternReviewDesk.tsx') {
    assert.match(text, /Daily structure briefing/);
    assert.match(text, /Market Prophets/);
    assert.match(text, /Approve & publish/);
    assert.match(text, /Weekly pattern/);
    assert.match(text, /scannerNote/);
    assert.match(text, /briefing-product-tiers/);
    assert.match(text, /DAILY_BRIEFING_BILLING_NOTE/);
    assert.match(text, /DATA UNAVAILABLE/);
    assert.match(text, /Not a[\s\S]*signal/);
    assert.doesNotMatch(text, /You should buy|Place order/i);
  }
  if (rel === 'src/components/CeoDashboard.tsx') {
    assert.match(text, /DailyOpsDesk/);
    assert.match(text, /DailyPatternReviewDesk/);
    assert.match(text, /CeoAlwaysOnMonitor/);
    assert.match(text, /userProfile\?\.email/);
    assert.match(text, /\/ceo/);
    assert.match(text, /data-ceo-kick-sessions/);
    assert.match(text, /data-ceo-kick-bar/);
    assert.match(text, /\/api\/admin\/auth\/kick-sessions/);
    assert.match(text, /Force everyone out/);
    assert.match(text, /kickEveryone=/);
    assert.doesNotMatch(text, /Pattern Scanner/);
  }
  if (rel === 'src/components/DailyOpsDesk.tsx') {
    assert.match(text, /kickEveryone\?/);
    assert.match(text, /data-ceo-kick-sessions/);
    assert.match(text, /Force everyone out/);
    assert.match(text, /Automated site checks/);
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
    assert.match(text, /fetchQuotesMap/);
    assert.match(text, /clientMarketCache/);
    assert.match(text, /\/api\/newsdata\/latest/);
    assert.match(text, /fetchEconomicNews/);
  }
  if (rel === 'src/components/desks/retail/retailStore.ts') {
    assert.match(text, /DEFAULT_WATCHLISTS/);
    assert.match(text, /clearpath_retail_watchlists_v1/);
  }
  if (rel === 'src/components/desks/NeurodivergentTraderDesk.tsx') {
    assert.match(text, /NeurodivergentDashboard/);
    assert.match(text, /DeskHoldScope/);
    assert.match(text, /clearpath_held_neuro_v4/);
    assert.match(text, /defaultHeld=\{NEURO_CHART_FIRST_HELD\}/);
    assert.match(text, /NEURO_CHART_FIRST_HELD/);
    assert.doesNotMatch(text, /navigateToDesk\('retail'\)/);
    assert.doesNotMatch(text, /href=\{`\/\?profile=/);
  }
  if (rel === 'src/components/desks/neuro/NeurodivergentDashboard.tsx') {
    assert.match(text, /data-neuro-door/);
    assert.match(text, /overflow-visible/);
    assert.match(text, /data-neuro-workstation/);
    assert.match(text, /DeskChartFill/);
    assert.match(text, /LightweightCandles/);
    assert.match(text, /readInitialNeuroProfile/);
    assert.match(text, /pollWorkspace:\s*false/);
    assert.match(text, /pollMovers:\s*false/);
    assert.match(text, /data=\{candles\}/);
    assert.match(text, /hidePatternOverlays/);
    assert.match(text, /NEURO_DESK_PROFILES/);
    assert.match(text, /NEURO_RIBBON/);
    assert.match(text, /applyNeuroProfile/);
    assert.match(text, /DATA UNAVAILABLE/);
    assert.match(text, /RetailEducationBento/);
    assert.match(text, /holdId=/);
    assert.match(text, /showBelow/);
    assert.match(text, /min-h-\[70vh\]/);
    assert.match(text, /WatchlistAddForm/);
    assert.match(text, /ChartSymbolSearch/);
    assert.doesNotMatch(text, /You should buy|Place order|broker routing/i);
    assert.doesNotMatch(text, /href=\{`\/\?profile=/);
  }
  if (rel === 'src/components/charts/LightweightCandles.tsx') {
    assert.match(text, /hidePatternOverlaysRef/);
    assert.match(text, /hidePatternOverlaysRef\.current/);
    assert.match(text, /disposedRef/);
    assert.match(text, /lockVisibleTimeRangeOnResize/);
    assert.match(text, /isEmptyVisibleRange/);
    assert.match(text, /parentHasBars/);
    assert.doesNotMatch(text, /incoming\.length === 0[\s\S]{0,80}CHART DATA UNAVAILABLE/);
  }
  if (rel === 'src/components/desks/neuro/neuroProfile.ts') {
    assert.match(text, /readInitialNeuroProfile/);
    assert.match(text, /readNeuroProfileFromUrl/);
    assert.match(text, /calm_focus/);
    assert.match(text, /adhd_hyperfocus/);
    assert.match(text, /BTCUSD/);
    assert.match(text, /clearpath-set-profile/);
  }
  if (rel === 'src/components/desks/TraderDeskChrome.tsx') {
    assert.match(text, /BrokerDeskChip/);
    assert.match(text, /replace\(' Traders', ''\)\.replace\(' Trader', ''\)/);
    assert.match(text, /White screen/);
    assert.match(text, /togglePaper/);
    assert.doesNotMatch(text, /data-ceo-ops-link/, 'CEO is not a fifth desk tab — founder uses /ceo from Home nav');
    assert.doesNotMatch(text, /href="\/ceo"/);
    assert.doesNotMatch(text, /isFounderSession/);
    assert.match(text, /ColorChartPicker/);
    assert.match(text, /data-color-chart-toggle/);
    assert.match(text, /DeskScreensMenu/);
    assert.match(text, /Screens/);
    assert.match(text, /\/\?choose=1/);
  }
  if (rel === 'src/components/desks/ColorChartPicker.tsx') {
    assert.match(text, /data-color-chart/);
    assert.match(text, /COLOR_CHART_HUE_GRID/);
    assert.match(text, /Opacity/);
    assert.match(text, /Save colors/);
    assert.match(text, /data-color-chart-save/);
  }
  if (rel === 'src/lib/deskMonitorTree.ts') {
    assert.match(text, /MONITOR_TREE_PRESETS/);
    assert.match(text, /parseDeskScreenPane/);
    assert.match(text, /getScreenDetails/);
    assert.match(text, /launchMonitorTree/);
  }
  if (rel === 'src/components/desks/DeskScreensMenu.tsx') {
    assert.match(text, /data-desk-screens-toggle/);
    assert.match(text, /\{p\.n\}-screen/);
    assert.match(text, /Pop out one panel/);
  }
  if (rel === 'src/hooks/useDeskMonitorSync.ts') {
    assert.match(text, /BroadcastChannel/);
    assert.match(text, /DESK_MONITOR_CHANNEL/);
  }
  if (rel === 'src/lib/deskColorChart.ts') {
    assert.match(text, /clearpath_desk_color_chart_v1/);
    assert.match(text, /candleUp/);
    assert.match(text, /indicator/);
    assert.match(text, /bento/);
  }
  if (rel === 'src/components/desks/FundamentalTraderDesk.tsx') {
    assert.match(text, /FundamentalDashboard/);
    assert.match(text, /data-fundamental-door/);
    assert.match(text, /DeskHoldScope/);
    assert.match(text, /clearpath_held_fundamental_v4/);
    assert.match(text, /defaultHeld=\{FUNDAMENTAL_CHART_FIRST_HELD\}/);
    assert.match(text, /FUNDAMENTAL_CHART_FIRST_HELD/);
    assert.doesNotMatch(text, /FundamentalsPanel/);
    assert.doesNotMatch(text, /LightweightCandles/);
  }
  if (rel === 'src/components/desks/DeskScreenWorkspace.tsx') {
    assert.match(text, /resolveQuotePrice/);
    assert.doesNotMatch(text, /data\?\.price \?\? data\?\.close/);
  }
  if (rel === 'src/components/desks/DeskRoute.tsx') {
    assert.match(text, /desk-shell/);
    assert.match(text, /min-h-\[100dvh\]/);
    assert.doesNotMatch(text, /flex h-\[100dvh\]/);
    assert.match(text, /overflow-visible/);
    assert.match(text, /data-desk-paper/);
    assert.match(text, /DeskAppearanceProvider/);
    assert.match(text, /deskId=\{deskId\}/);
    assert.match(text, /data-desk-color-bg/);
    assert.match(text, /heldFile\.css/);
    assert.match(text, /CptBuddyWidget/);
    assert.match(text, /parseDeskScreenPane/);
    assert.match(text, /DeskScreenWorkspace/);
    assert.match(text, /data-desk-satellite/);
    assert.match(text, /DeferredDeskBuddy/);
    assert.match(text, /satellitePane \? null : <DeferredDeskBuddy/);
  }
  if (rel === 'src/components/Dashboard.tsx') {
    assert.match(text, /CeoDashboard/);
    assert.match(text, /path === '\/ceo'/);
    assert.match(text, /case 'CeoDashboard': return <CeoDashboard/);
    assert.match(text, /nextTab === 'CeoDashboard' && !isFounder\(\)/);
    assert.match(text, /activeTab === 'CeoDashboard' && !isFounder\(\)/);
  }
  if (rel === 'server.ts') {
    assert.match(text, /\/desk\/:deskId/);
    assert.match(text, /\/desk\/:deskId\/screen\/:pane/);
    assert.match(text, /isDeskRoute/);
    assert.match(text, /\/api\/fmp\/lookup/);
    assert.match(text, /marketData: \{/);
    assert.match(text, /twelveDataConfigured/);
    assert.match(text, /twelveDataLiveQuotes/);
    assert.match(text, /twelveDataStatus/);
    assert.match(text, /hasKeys \? twelvedataHealth\.status : 'OFFLINE'/);
  }
}

const desksLib = fs.readFileSync(path.join(root, 'src/lib/traderDesks.ts'), 'utf8');
assert.match(desksLib, /function continueToRememberedDesk/);
assert.match(desksLib, /openMemberDesk\(\)/);
assert.doesNotMatch(desksLib, /assign\(pending \? TRADER_DESKS\[pending\]\.href : '\/'\)/);

const inst = fs.readFileSync(path.join(root, 'src/components/desks/institutional/InstitutionalDashboard.tsx'), 'utf8');
assert.match(inst, /does not evaluate|Not signals|Educational/i);

const heldCss = fs.readFileSync(path.join(root, 'src/components/desks/heldFile.css'), 'utf8');
assert.match(heldCss, /rt-bento-x/);
assert.match(heldCss, /rt-held-file/);
assert.match(heldCss, /data-desk-chart-room/);
assert.match(heldCss, /70vh/);
assert.match(heldCss, /safe-area-inset-bottom/);

const bento = fs.readFileSync(path.join(root, 'src/components/desks/institutional/Bento.tsx'), 'utf8');
assert.match(bento, /holdId/);
assert.match(bento, /rt-bento-x/);
assert.match(bento, /useDeskHold/);

const heldFile = fs.readFileSync(path.join(root, 'src/components/desks/DeskHeldFile.tsx'), 'utf8');
assert.match(heldFile, /data-desk-held-file/);
assert.match(heldFile, /Restore all/);

const fill = fs.readFileSync(path.join(root, 'src/components/desks/DeskChartFill.tsx'), 'utf8');
assert.match(fill, /min-h-\[70vh\]/);
assert.match(fill, /absolute inset-0/);

assert.deepEqual(parseHeldIds('["ribbon","nope"]', new Set(['ribbon', 'flow'])), ['ribbon']);
assert.deepEqual(parseHeldIds(null, new Set(['ribbon'])), []);
assert.equal(deskSectionOpen(undefined, ['news', 'education']), true);
assert.equal(deskSectionOpen((id) => id === 'news', ['news', 'education']), true);
assert.equal(
  deskSectionOpen((id) => NEURO_CHART_FIRST_HELD.includes(id), ['news', 'calendar', 'alerts', 'education', 'simulation']),
  false,
);

const r = pearsonCorrelation([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
assert.ok(r != null && Math.abs(r - 1) < 1e-9);
const tape = reconstructBarTape([
  { time: Date.parse('2026-01-01T08:42:01Z') / 1000, open: 10, high: 12, low: 9, close: 11.5, volume: 450 },
]);
assert.equal(tape[0].side, 'BUY-SIDE');
assert.equal(tape[0].reconstructed, true);

const buddyWidget = fs.readFileSync(path.join(root, 'src/components/CptBuddyWidget.tsx'), 'utf8');
assert.match(buddyWidget, /CptBuddyOpenPanel/);
assert.match(buddyWidget, /useChartVision\(true\)/);
assert.match(buddyWidget, /requestAnimationFrame\(\(\) => setIsOpen\(true\)\)/);
assert.match(buddyWidget, /visualViewport/);
assert.match(buddyWidget, /cpt-buddy-input/);
assert.match(buddyWidget, /enterKeyHint/);
const buddyCss = fs.readFileSync(path.join(root, 'src/components/CptBuddyWidget.css'), 'utf8');
assert.match(buddyCss, /font-size:\s*16px/);
assert.match(buddyCss, /min-height:\s*44px/);
const androidManifest = fs.readFileSync(path.join(root, 'android/app/src/main/AndroidManifest.xml'), 'utf8');
assert.match(androidManifest, /adjustResize/);

const assetSearch = fs.readFileSync(path.join(root, 'src/components/charts/ChartSymbolSearch.tsx'), 'utf8');
assert.match(assetSearch, /SUGGESTION_CAP = 25/);
assert.match(assetSearch, /useDeferredValue/);
assert.match(assetSearch, /searchEnabledAssets/);
assert.match(assetSearch, /data-asset-search/);
assert.doesNotMatch(assetSearch, /getProceduralStocks/);
assert.doesNotMatch(assetSearch, /searchAllData/);

const gatewaySrc = fs.readFileSync(path.join(root, 'src/server/marketDataGateway.ts'), 'utf8');
assert.match(gatewaySrc, /function markStale/);
assert.match(gatewaySrc, /stale: true/);
assert.match(gatewaySrc, /status: 'OFFLINE'/);

console.log('trader-desks.selftest: ok');
