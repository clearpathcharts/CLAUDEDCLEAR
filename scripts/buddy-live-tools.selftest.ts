/**
 * C.P.T. Buddy live tools + encyclopedia search.
 * Run: npm run test:buddy-live-tools
 */
import assert from 'node:assert/strict';
import {
  BUDDY_LIVE_TOOLS,
  BUDDY_LIVE_TOOLS_PROMPT,
  describeClearPathLocation,
  executeBuddyTool,
  sanitizeBuddySymbol,
} from '../src/server/buddyLiveTools.ts';
import { searchEncyclopedia } from '../src/server/encyclopediaSearch.ts';

const names = BUDDY_LIVE_TOOLS.map((t) => t.function.name);
assert.deepEqual(names, [
  'get_quote',
  'get_cot',
  'read_open_charts',
  'where_am_i',
  'search_encyclopedia',
]);
assert.match(BUDDY_LIVE_TOOLS_PROMPT, /get_quote/);
assert.match(BUDDY_LIVE_TOOLS_PROMPT, /Never invent/);

assert.equal(sanitizeBuddySymbol('XAUUSD'), 'XAUUSD');
assert.equal(sanitizeBuddySymbol('BTC/USD'), 'BTC/USD');
assert.equal(sanitizeBuddySymbol('../../../etc'), null);
assert.equal(sanitizeBuddySymbol(''), null);

const inst = describeClearPathLocation('/desk/institutional');
assert.match(inst.surface, /Institutional/);
assert.match(inst.directions, /desk/i);

const home = describeClearPathLocation('/');
assert.match(home.surface, /Home/i);

const chartsEmpty = await executeBuddyTool('read_open_charts', '{}', { chartContext: '', pagePath: '/' });
assert.match(chartsEmpty, /empty":true/);

const chartsLive = await executeBuddyTool('read_open_charts', '{}', {
  chartContext: '=== LIVE CHART VISION ===\nXAUUSD 1H possible wedge',
  pagePath: '/desk/institutional',
});
assert.match(chartsLive, /possible wedge/);

const here = await executeBuddyTool('where_am_i', '{}', {
  chartContext: '',
  pagePath: '/desk/retail',
});
assert.match(here, /Retail/);

const badQuote = await executeBuddyTool('get_quote', '{"symbol":"nope!!!"}', { chartContext: '', pagePath: '/' });
assert.match(badQuote, /Invalid symbol/);

const inflation = searchEncyclopedia('inflation');
assert.ok(inflation.some((h) => /inflation/i.test(h.title) || /inflation/i.test(h.snippet)));
assert.ok(inflation.some((h) => h.source === 'finance'));

const rsi = searchEncyclopedia('RSI relative strength');
assert.ok(rsi.some((h) => h.source === 'indicator' && /RSI/i.test(h.title)));

const empty = searchEncyclopedia('??');
assert.equal(empty.length, 0);

const wiki = await executeBuddyTool('search_encyclopedia', '{"query":"federal reserve"}', {
  chartContext: '',
  pagePath: '/',
});
assert.match(wiki, /Federal Reserve|central bank/i);

console.log('buddy-live-tools.selftest: OK');
