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
import { analyzeInstitutionalStructure, closeLocationFlow } from '../src/lib/institutional/analyzeStructure.ts';
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
assert.equal(parseDeskPath('/desk'), null);
assert.equal(parseDeskPath('/desk/unknown'), null);
assert.equal(isDeskPath('/desk/retail'), true);
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
const flowBars: Candle[] = [
  candle(1, 10, 11, 9, 10.8),
  candle(2, 10.8, 12, 10.5, 11.7),
  candle(3, 11.7, 13, 11.4, 12.8),
  candle(4, 12.8, 14, 12.5, 13.7),
  candle(5, 13.7, 15, 13.4, 14.6),
];
const flow = closeLocationFlow(flowBars, 20);
assert.ok(flow && flow.bars === 5 && flow.buyPct > 50);

const srcFiles = [
  'src/components/desks/InstitutionalTraderDesk.tsx',
  'src/components/desks/FundamentalTraderDesk.tsx',
  'src/components/desks/RetailTraderDesk.tsx',
  'src/components/desks/NeurodivergentTraderDesk.tsx',
  'src/components/desks/DeskRoute.tsx',
  'src/components/desks/TraderDeskChrome.tsx',
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
    assert.match(text, /Watchlists/);
    assert.match(text, /Market universe/);
    assert.match(text, /Level II market depth/);
    assert.match(text, /Time & sales/);
    assert.match(text, /analyzeInstitutionalStructure/);
    assert.match(text, /\/api\/quotes/);
    assert.match(text, /\/api\/newsdata\/latest/);
    assert.match(text, /Information &amp; analytics only/);
    assert.match(text, /not subscribe to exchange Level II/);
    assert.match(text, /CFTC Commitment of Traders is not connected/);
    assert.doesNotMatch(text, /2382/);
    assert.doesNotMatch(text, /104\.82/);
    assert.doesNotMatch(text, /56\.2% Buy/);
  }
  if (rel === 'src/components/desks/DeskRoute.tsx') {
    assert.match(text, /desk-shell/);
    assert.match(text, /data-desk-paper/);
    assert.match(text, /DeskAppearanceProvider/);
  }
  if (rel.endsWith('TraderDeskChrome.tsx')) {
    assert.match(text, /replace\(' Traders', ''\)\.replace\(' Trader', ''\)/);
    assert.match(text, /White screen/);
    assert.match(text, /togglePaper/);
  }
  if (rel === 'server.ts') {
    assert.match(text, /\/desk\/:deskId/);
    assert.match(text, /isDeskRoute/);
  }
}

const inst = fs.readFileSync(path.join(root, 'src/components/desks/InstitutionalTraderDesk.tsx'), 'utf8');
assert.match(inst, /no trade execution|Not bid\/ask tape|analytics only/i);

console.log('trader-desks.selftest: ok');
