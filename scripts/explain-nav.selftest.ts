/**
 * Extra-understanding overlays: every live nav tab has copy, no advice.
 * Run: npm run test:explain-nav
 */
import assert from 'node:assert/strict';
import {
  NAV_TAB_EXPLAIN_IDS,
  explainContentLibrary,
  getExplainContent,
  isPublicExplainDeskTab,
  tabIdForExplainQuery,
} from '../src/components/explain/explainContent.ts';
import {
  EXPLAIN_FLOW_SLOT_IDS,
  explainVideoSrc,
  hexToRgba,
  isExplainFlowSlotId,
} from '../src/components/explain/explainMedia.ts';

const NAV_IDS = [
  'Discovery',
  'Yours',
  'TheRiver',
  'StrictlyCharts',
  'News',
  'Membership',
  'Biography',
  'AffiliateNetwork',
  'CeoDashboard',
  'CpmsApk',
  'ClearPathEducation',
  'LiteracyOS',
  'Encyclopedia',
  'EncyclopediaOfIndicators',
];

for (const id of NAV_IDS) {
  assert.ok(NAV_TAB_EXPLAIN_IDS[id], `missing nav map for ${id}`);
  const content = getExplainContent(id);
  assert.ok(content, `missing explain copy for ${id}`);
  assert.ok(content.text.length > 40, `${id} copy is too short`);
  assert.equal(
    /buy now|sell now|place a trade for you|guaranteed profit/i.test(content.text),
    false,
    `${id} copy must not read as a trade instruction`,
  );
  assert.ok(content.color.startsWith('#'), `${id} needs a badge color`);
}

assert.equal(getExplainContent('river_genie')?.id, 'indacreator');
assert.equal(getExplainContent('charts')?.title, 'Charts');
assert.equal(tabIdForExplainQuery('charts'), 'StrictlyCharts');
assert.equal(tabIdForExplainQuery('strictlycharts'), 'StrictlyCharts');
assert.equal(tabIdForExplainQuery('home'), 'Discovery');
assert.equal(isPublicExplainDeskTab('StrictlyCharts'), true);
assert.equal(isPublicExplainDeskTab('CeoDashboard'), false);
assert.ok(Object.keys(explainContentLibrary).length >= NAV_IDS.length);

assert.equal(explainVideoSrc('charts'), '/explain-videos/charts.mp4');
assert.equal(explainVideoSrc('charts', 'https://cdn.example/x.mp4'), 'https://cdn.example/x.mp4');
assert.equal(EXPLAIN_FLOW_SLOT_IDS.length, 14);
assert.equal(isExplainFlowSlotId('charts'), true);
assert.equal(isExplainFlowSlotId('nope'), false);
assert.match(hexToRgba('#FF7B00', 0.2), /^rgba\(255,123,0,0\.2\)$/);

console.log('explain-nav.selftest: ok');
