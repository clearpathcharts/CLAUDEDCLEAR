/**
 * Extra-understanding overlays: every live nav tab has copy, no advice.
 * Run: npm run test:explain-nav
 */
import assert from 'node:assert/strict';
import {
  NAV_TAB_EXPLAIN_IDS,
  explainContentLibrary,
  getExplainContent,
} from '../src/components/explain/explainContent.ts';

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
assert.ok(Object.keys(explainContentLibrary).length >= NAV_IDS.length);

console.log('explain-nav.selftest: ok');
