/**
 * Smoke test for section guide multi-beat catalog + dismiss storage.
 * Run: npm run test:section-guides
 */
import assert from 'node:assert/strict';

async function main() {
  const {
    SECTION_GUIDES,
    SECTION_GUIDE_TAB_IDS,
    SECTION_GUIDE_BEAT_COUNT,
    SECTION_GUIDE_BEAT_TARGET_SECONDS,
    getSectionGuide,
    getSectionGuideBeat,
    sectionGuideBeatHasVideo,
    sectionGuideHasVideo,
    sectionGuideReadyBeatCount,
  } = await import('../src/sectionGuides/catalog.ts');
  const storage = await import('../src/sectionGuides/storage.ts');

  assert.equal(SECTION_GUIDE_BEAT_COUNT, 7);
  assert.equal(SECTION_GUIDE_BEAT_TARGET_SECONDS, 10);
  assert.ok(SECTION_GUIDE_TAB_IDS.length >= 10);

  const expectedTabs = [
    'Discovery',
    'StrictlyCharts',
    'TheRiver',
    'Yours',
    'News',
    'Membership',
    'ClearPathEducation',
    'LiteracyOS',
    'Encyclopedia',
    'CpmsApk',
    'Biography',
    'AffiliateNetwork',
  ];
  for (const id of expectedTabs) {
    assert.ok(SECTION_GUIDE_TAB_IDS.includes(id as any), `missing tab ${id}`);
  }

  for (const id of SECTION_GUIDE_TAB_IDS) {
    const g = SECTION_GUIDES[id];
    assert.equal(g.tabId, id);
    assert.ok(g.title.trim());
    assert.ok(g.blurb.trim());
    assert.equal(g.beats.length, SECTION_GUIDE_BEAT_COUNT);
    assert.ok(g.targetSeconds > 0 && g.targetSeconds <= 180);
    assert.equal(
      g.targetSeconds,
      g.beats.reduce((n, b) => n + b.targetSeconds, 0)
    );

    const ids = new Set<string>();
    for (const beat of g.beats) {
      assert.ok(beat.id.trim());
      assert.ok(!ids.has(beat.id), `duplicate beat id ${beat.id} in ${id}`);
      ids.add(beat.id);
      assert.ok(beat.title.trim());
      assert.ok(beat.targetSeconds >= 8 && beat.targetSeconds <= 15);
      assert.ok(beat.flowPrompt.length > 40);
      assert.ok(beat.narrationScript.length > 20);
      assert.equal(typeof beat.videoUrl, 'string');
      // Do not invent live hosted files — empty until Flow exports are uploaded.
      assert.equal(beat.videoUrl, '');
      assert.equal(sectionGuideBeatHasVideo(beat), false);
    }

    assert.equal(sectionGuideHasVideo(g), false);
    assert.equal(sectionGuideReadyBeatCount(g), 0);
    assert.equal(getSectionGuideBeat(g, 0)?.id, g.beats[0].id);
    assert.equal(getSectionGuideBeat(g, 99), null);
  }

  assert.equal(getSectionGuide('StrictlyCharts')?.title, 'Charts');
  assert.equal(getSectionGuide('StrictlyCharts')?.beats[0]?.title, 'What Charts is');
  assert.equal(getSectionGuide('NotATab'), null);

  // jsdom-less storage: polyfill localStorage for node
  const mem = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
    setItem: (k: string, v: string) => {
      mem.set(k, String(v));
    },
    removeItem: (k: string) => {
      mem.delete(k);
    },
  };

  assert.equal(storage.isSectionGuideOfferSnoozed('Discovery'), false);
  storage.snoozeSectionGuideOffer('Discovery', 72);
  assert.equal(storage.isSectionGuideOfferSnoozed('Discovery'), true);
  storage.clearSectionGuideOfferDismiss('Discovery');
  assert.equal(storage.isSectionGuideOfferSnoozed('Discovery'), false);

  storage.snoozeSectionGuideOffer('TheRiver', 0);
  assert.equal(storage.isSectionGuideOfferSnoozed('TheRiver'), true);

  console.log('section-guides.selftest: OK');
}

main().catch((err) => {
  console.error('section-guides.selftest FAILED:', err);
  process.exit(1);
});
