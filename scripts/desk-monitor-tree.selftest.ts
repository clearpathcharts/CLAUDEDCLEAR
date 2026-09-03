/**
 * Multi-monitor desk tree: panes, presets, URLs, popup feature strings.
 * Does not invent screen placement — browsers cannot silently force monitor 2.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DESK_SCREEN_PANES,
  MONITOR_TREE_PRESETS,
  deskScreenHref,
  isDeskScreenPane,
  parseDeskScreenPane,
  popupFeaturesForScreen,
  readDeskMonitorQuery,
  staggerPopupFeatures,
} from '../src/lib/deskMonitorTree.ts';
import { parseDeskPath } from '../src/lib/traderDesks.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

assert.equal(DESK_SCREEN_PANES.length, 5);
assert.ok(isDeskScreenPane('chart'));
assert.ok(isDeskScreenPane('calendar'));
assert.equal(isDeskScreenPane('tape'), false);

assert.equal(parseDeskScreenPane('/desk/retail/screen/chart'), 'chart');
assert.equal(parseDeskScreenPane('/desk/institutional/screen/news'), 'news');
assert.equal(parseDeskScreenPane('/desk/retail/screen/nope'), null);
assert.equal(parseDeskScreenPane('/desk/retail'), null);
assert.equal(parseDeskPath('/desk/retail/screen/chart'), 'retail');
assert.equal(parseDeskPath('/desk/neurodivergent/screen/watchlist'), 'neurodivergent');

assert.deepEqual(MONITOR_TREE_PRESETS[2], ['chart', 'news']);
assert.deepEqual(MONITOR_TREE_PRESETS[3], ['chart', 'watchlist', 'news']);
assert.deepEqual(MONITOR_TREE_PRESETS[4], ['chart', 'watchlist', 'scanner', 'news']);

assert.equal(deskScreenHref('retail', 'chart', 'EURUSD', '1h'), '/desk/retail/screen/chart?symbol=EURUSD&tf=1h');
assert.equal(deskScreenHref('institutional', 'news'), '/desk/institutional/screen/news');

const q = readDeskMonitorQuery('?symbol=xauusd&tf=4h');
assert.equal(q.symbol, 'XAUUSD');
assert.equal(q.timeframe, '4h');

assert.match(popupFeaturesForScreen({ availLeft: 1920, availTop: 0, availWidth: 1600, availHeight: 900 }), /left=1920/);
assert.match(staggerPopupFeatures(2), /left=144/);

const chrome = fs.readFileSync(path.join(root, 'src/components/desks/TraderDeskChrome.tsx'), 'utf8');
assert.match(chrome, /DeskScreensMenu/);
assert.match(chrome, /Screens/);

const menu = fs.readFileSync(path.join(root, 'src/components/desks/DeskScreensMenu.tsx'), 'utf8');
assert.match(menu, /launchMonitorTree/);
assert.match(menu, /launchDeskPane/);
assert.match(menu, /Close satellites/);
assert.match(menu, /Window Management/);

const workspace = fs.readFileSync(path.join(root, 'src/components/desks/DeskScreenWorkspace.tsx'), 'utf8');
assert.match(workspace, /LightweightCandles/);
assert.match(workspace, /PatternScannerPanel/);
assert.match(workspace, /scheduleChartVisionImmediate/);
assert.match(workspace, /NewsPanel/);
assert.match(workspace, /EconomicCalendar/);
assert.match(workspace, /DATA UNAVAILABLE/);

const server = fs.readFileSync(path.join(root, 'server.ts'), 'utf8');
assert.match(server, /\/desk\/:deskId\/screen\/:pane/);

console.log('desk-monitor-tree.selftest: ok');
