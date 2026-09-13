/**
 * Extra-understanding overlays: every live nav tab has copy, no advice,
 * plus a 45–60s Google Flow script (six stitchable shots, fifth-grade VO).
 * Run: npm run test:explain-nav
 */
import assert from 'node:assert/strict';
import {
  NAV_TAB_EXPLAIN_IDS,
  explainContentLibrary,
  getExplainContent,
} from '../src/components/explain/explainContent.ts';
import {
  EXPLAIN_FLOW_SLOT_IDS,
  explainVideoSrc,
  hexToRgba,
  isExplainFlowSlotId,
} from '../src/components/explain/explainMedia.ts';
import {
  EXPLAIN_FLOW_NAV_ORDER,
  EXPLAIN_FLOW_SCRIPTS,
  EXPLAIN_FLOW_SHOT_COUNT,
  EXPLAIN_FLOW_TARGET_MAX,
  EXPLAIN_FLOW_TARGET_MIN,
  explainFlowToVtt,
  wordCount,
} from '../src/components/explain/flowScripts.ts';

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
  'ExplainMode',
  'Exit',
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
assert.equal(getExplainContent('ExplainMode')?.id, 'explain');
assert.equal(getExplainContent('Exit')?.id, 'exit');
assert.ok(Object.keys(explainContentLibrary).length >= NAV_IDS.length);

assert.equal(explainVideoSrc('charts'), '/explain-videos/charts.mp4');
assert.equal(explainVideoSrc('charts', 'https://cdn.example/x.mp4'), 'https://cdn.example/x.mp4');
assert.equal(EXPLAIN_FLOW_SLOT_IDS.length, 16);
assert.equal(isExplainFlowSlotId('charts'), true);
assert.equal(isExplainFlowSlotId('explain'), true);
assert.equal(isExplainFlowSlotId('exit'), true);
assert.equal(isExplainFlowSlotId('nope'), false);
assert.match(hexToRgba('#FF7B00', 0.2), /^rgba\(255,123,0,0\.2\)$/);

assert.equal(EXPLAIN_FLOW_NAV_ORDER.length, 13);
for (const id of EXPLAIN_FLOW_SLOT_IDS) {
  const script = EXPLAIN_FLOW_SCRIPTS[id];
  assert.ok(script, `missing Flow script for ${id}`);
  assert.equal(script.shots.length, EXPLAIN_FLOW_SHOT_COUNT, `${id} needs 6 shots`);
  assert.ok(
    script.targetSeconds >= EXPLAIN_FLOW_TARGET_MIN &&
      script.targetSeconds <= EXPLAIN_FLOW_TARGET_MAX,
    `${id} targetSeconds ${script.targetSeconds} is not 45–60`,
  );
  const words = wordCount(script.narrationScript);
  assert.ok(words >= 110 && words <= 220, `${id} narration is ${words} words (want 110–220)`);
  assert.match(
    script.narrationScript,
    /click|Click|button|Button/,
    `${id} must tell a fifth grader to click a button`,
  );
  assert.equal(
    /buy now|sell now|guaranteed profit|last chance/i.test(script.narrationScript),
    false,
    `${id} narration must not read as a trade pitch`,
  );
  assert.equal(script.shots[0].startSeconds, 0);
  assert.equal(script.shots[script.shots.length - 1].endSeconds, script.targetSeconds);
  for (let i = 1; i < script.shots.length; i++) {
    assert.equal(
      script.shots[i].startSeconds,
      script.shots[i - 1].endSeconds,
      `${id} shot ${i} should start when the previous shot ends`,
    );
  }
  const vtt = explainFlowToVtt(script);
  assert.match(vtt, /^WEBVTT/m);
  assert.match(vtt, /-->/);
}

console.log('explain-nav.selftest: ok');
