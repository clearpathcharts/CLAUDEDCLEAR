/**
 * Extra-understanding overlays: every live nav tab has copy, no advice,
 * plus twelve separate 8.00s Google Flow jobs (96s stitch, fifth-grade VO).
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
  EXPLAIN_FLOW_CLIP_SECONDS,
  EXPLAIN_FLOW_NAV_ORDER,
  EXPLAIN_FLOW_SCRIPTS,
  EXPLAIN_FLOW_SHOT_COUNT,
  EXPLAIN_FLOW_TARGET_MAX,
  EXPLAIN_FLOW_TARGET_MIN,
  explainFlowShotSeconds,
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
  assert.equal(script.shots.length, EXPLAIN_FLOW_SHOT_COUNT, `${id} needs 12 floating 8s Flow jobs`);
  assert.ok(
    script.targetSeconds >= EXPLAIN_FLOW_TARGET_MIN &&
      script.targetSeconds <= EXPLAIN_FLOW_TARGET_MAX,
    `${id} targetSeconds ${script.targetSeconds} is not 96`,
  );
  const words = wordCount(script.narrationScript);
  assert.ok(words >= 250 && words <= 520, `${id} narration is ${words} words (want 250–520)`);
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
  for (const shot of script.shots) {
    assert.equal(
      explainFlowShotSeconds(shot),
      EXPLAIN_FLOW_CLIP_SECONDS,
      `${id} ${shot.id} must be exactly ${EXPLAIN_FLOW_CLIP_SECONDS}s`,
    );
    assert.ok(
      shot.flowPrompt.toLowerCase().includes('eight'),
      `${id} ${shot.id}: flowPrompt must lock eight seconds`,
    );
    assert.ok(
      shot.flowPrompt.toLowerCase().includes('do not fade'),
      `${id} ${shot.id}: flowPrompt must say do not fade`,
    );
    assert.ok(
      shot.flowPrompt.toLowerCase().includes('floating'),
      `${id} ${shot.id}: flowPrompt must say this job floats alone`,
    );
    assert.ok(
      shot.flowPrompt.length >= 900,
      `${id} ${shot.id}: flowPrompt too short (${shot.flowPrompt.length} chars)`,
    );
    const clipWords = wordCount(shot.narration);
    assert.ok(
      clipWords >= 18 && clipWords <= 55,
      `${id} ${shot.id}: narration is ${clipWords} words (want 18–55 for one 8s idea)`,
    );
  }
  const vtt = explainFlowToVtt(script);
  assert.match(vtt, /^WEBVTT/m);
  assert.match(vtt, /-->/);
}

console.log('explain-nav.selftest: ok');
