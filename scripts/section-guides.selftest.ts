/**
 * Smoke test for section guide catalog + dismiss storage.
 * Run: npm run test:section-guides
 */
import assert from 'node:assert/strict';

async function main() {
  const { SECTION_GUIDES, SECTION_GUIDE_TAB_IDS, getSectionGuide, sectionGuideHasVideo } =
    await import('../src/sectionGuides/catalog.ts');
  const storage = await import('../src/sectionGuides/storage.ts');

  assert.ok(SECTION_GUIDE_TAB_IDS.length >= 10);
  for (const id of SECTION_GUIDE_TAB_IDS) {
    const g = SECTION_GUIDES[id];
    assert.equal(g.tabId, id);
    assert.ok(g.title.trim());
    assert.ok(g.blurb.trim());
    assert.ok(g.targetSeconds > 0 && g.targetSeconds <= 180);
    assert.ok(g.flowPrompt.length > 40);
    assert.ok(g.narrationScript.length > 40);
    assert.equal(sectionGuideHasVideo(g), Boolean(g.videoUrl));
  }

  assert.equal(getSectionGuide('StrictlyCharts')?.title, 'Charts');
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
