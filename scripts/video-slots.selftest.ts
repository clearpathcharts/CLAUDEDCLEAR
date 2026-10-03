/**
 * Explainer-video slots — putting a video behind a play icon:
 * - slot ids are unique, stable and cover every play icon on the site
 * - assignment routes stay founder-gated (401 unauthenticated, 403 without the header)
 * - the public read endpoint works with no auth and emits ONLY slot id -> URL
 * - assignments survive a cold start (durable store, local-file fallback in CI)
 * - an assignment whose video was deleted degrades to the honest "no clip" frame
 *
 * Run: npx tsx scripts/video-slots.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import express from 'express';

process.env.NODE_ENV = 'development';
process.env.CLEARPATH_DISABLE_FIRESTORE_ADMIN = '1';
process.env.CATALOG_ADMIN_SECRET = 'selftest-catalog-secret';
delete process.env.CEO_VIDEO_BUCKET;
delete process.env.FIREBASE_STORAGE_BUCKET;

const root = path.resolve('.');
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

// ---------------------------------------------------------------- static ----

const server = read('server.ts');
assert.match(
  server,
  /app\.use\(\s*'\/api\/videos',\s*createPublicVideoSlotRouter\(\)\s*\)/,
  'server.ts mounts the public slot router'
);
const ceoMount = server.match(/app\.use\(\s*'\/api\/ceo\/videos',[\s\S]{0,260}?\);/);
assert.ok(ceoMount, 'server.ts still mounts /api/ceo/videos');
assert.match(ceoMount![0], /requireFounderOrCatalogAdmin/, 'slot writes keep the founder gate');
assert.match(ceoMount![0], /requireFounderActionHeader/, 'slot writes keep the founder action header');

const publicRoutes = read('src/server/videoSlotRoutes.ts');
assert.doesNotMatch(
  publicRoutes,
  /listCeoVideos|getCeoVideoStorageStatus|ceoVideoMaxBytes/,
  'the public router must not reach into founder-only storage state'
);

const stage = read('src/components/explain/ExplainVideoStage.tsx');
assert.match(stage, /useVideoSlotUrl/, 'the public player reads its assigned video');
assert.match(stage, /onError=\{\(\) => setState\('empty'\)\}/, 'a dead URL falls back to the honest frame');
assert.match(stage, /aria-label=\{`Video explaining how \$\{title\} works`\}/, 'the video names what it explains');
assert.match(stage, /<track kind="captions"/, 'captions have a wired-up path');
assert.doesNotMatch(stage, /autoPlay/, 'explainer videos never autoplay');

const ui = read('src/components/CeoVideoLibrary.tsx');
assert.match(ui, /data-ceo-video-slots/, 'CEO page has the assignment section');
assert.match(ui, /data-ceo-video-slot-select/, 'each slot is a single dropdown');
assert.match(ui, /Nothing yet/, 'clearing a slot is one option in the same dropdown');
assert.match(ui, /data-ceo-video-copy/, 'Copy link survives alongside assignment');
assert.match(ui, /htmlFor=\{selectId\}/, 'every dropdown has a real label');

// ~100 rows only stay usable if the founder can fold, search and filter them.
assert.match(ui, /data-ceo-video-slot-group-toggle/, 'slot rows are grouped behind a toggle');
assert.match(ui, /aria-expanded=\{open\}/, 'the group toggle reports its state to screen readers');
assert.match(ui, /data-ceo-video-slot-search/, 'there is a search box over the slot list');
assert.match(ui, /htmlFor="video-slot-search"/, 'the search box has a real label');
assert.match(ui, /data-ceo-video-slot-unassigned-toggle/, 'there is a show-only-empty filter');
assert.match(ui, /\{assigned\} of \{all\.length\} filled/, 'each group shows an assigned/total count');
assert.match(
  ui,
  /groupOverrides\[groupId\] \?\? \(filtering \|\| groupId === NAV_GROUP_ID\)/,
  'nav is expanded by default and the walkthrough groups are not'
);
assert.match(ui, /\{open \? \(/, 'a collapsed group does not render its dropdowns at all');

const offer = read('src/components/sectionGuides/SectionGuideOffer.tsx');
assert.match(offer, /resolveGuideBeatVideoUrl/, 'the section walkthrough resolves its clips through the slot map');
assert.match(offer, /useVideoSlotUrls/, 'the walkthrough reads what the founder assigned');
assert.doesNotMatch(
  offer,
  /bindVideoSource\(el, beat\.videoUrl/,
  'the player must not bypass the founder assignment and play the catalog URL directly'
);
assert.doesNotMatch(offer, /kind="captions"|\.vtt/, 'captions are out of scope here');

// ----------------------------------------------------------- unit checks ----

async function main() {
  const registry = await import('../src/content/videoSlots.ts');
  const { EXPLAIN_FLOW_SLOT_IDS } = await import('../src/components/explain/explainMedia.ts');
  const { SECTION_GUIDES, SECTION_GUIDE_TAB_IDS, SECTION_GUIDE_BEAT_COUNT } = await import(
    '../src/sectionGuides/catalog.ts'
  );

  const ids = registry.VIDEO_SLOTS.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, 'slot ids must be unique across every group');
  for (const slot of registry.VIDEO_SLOTS) {
    assert.doesNotMatch(slot.id, /^slot_?\d+$/i, `${slot.id} must not be positional`);
    assert.ok(slot.label.length > 8, `${slot.id} needs a label the founder will recognise`);
    assert.ok(slot.where.length > 8, `${slot.id} needs to say where the icon is`);
    assert.ok(slot.explains.length > 8, `${slot.id} needs an aria description`);
    assert.ok(
      registry.getVideoSlotGroup(slot.groupId),
      `${slot.id} sits in group "${slot.groupId}" which is not on the group list`
    );
  }
  const labels = registry.VIDEO_SLOTS.map((s) => s.label);
  assert.equal(new Set(labels).size, labels.length, 'dropdown labels must be distinguishable');

  // ------------------------------------------------- groups stay findable ----

  const groupIds = registry.VIDEO_SLOT_GROUPS.map((g) => g.id);
  assert.equal(new Set(groupIds).size, groupIds.length, 'group ids must be unique');
  assert.equal(
    groupIds[0],
    registry.NAV_VIDEO_SLOT_GROUP_ID,
    'the nav play icons must be the first group so they are never buried'
  );
  assert.equal(
    groupIds.length,
    1 + SECTION_GUIDE_TAB_IDS.length,
    'one nav group plus one group per section walkthrough'
  );
  for (const group of registry.VIDEO_SLOT_GROUPS) {
    assert.ok(group.label.trim().length > 3, `${group.id} needs a readable heading`);
    assert.ok(
      registry.VIDEO_SLOTS.some((s) => s.groupId === group.id),
      `group ${group.id} has no rows — an empty collapsible panel is just noise`
    );
  }

  // ------------------------------------------------------- nav play icons ----

  const navSlots = registry.VIDEO_SLOTS.filter(
    (s) => s.groupId === registry.NAV_VIDEO_SLOT_GROUP_ID
  );
  assert.ok(navSlots.length >= 16, `expected at least 16 play-icon slots, got ${navSlots.length}`);
  for (const slot of navSlots) {
    assert.match(slot.id, /^nav\.[a-z0-9-]+$/, `${slot.id} is not a stable lowercase nav id`);
  }
  // Every play icon the site already renders must be adoptable.
  for (const explainId of EXPLAIN_FLOW_SLOT_IDS) {
    const slotId = registry.navVideoSlotId(explainId);
    assert.ok(registry.isVideoSlotId(slotId), `no slot registered for the ${explainId} play icon`);
  }
  assert.equal(registry.isVideoSlotId('nope'), false);
  assert.equal(registry.isVideoSlotId('../../etc/passwd'), false);
  assert.equal(registry.getVideoSlot('nav.charts')?.id, 'nav.charts');

  // ------------------------------------- walkthrough clips, both directions ----

  const guideSlots = registry.VIDEO_SLOTS.filter((s) =>
    s.id.startsWith(registry.GUIDE_VIDEO_SLOT_PREFIX)
  );
  assert.equal(
    guideSlots.length,
    SECTION_GUIDE_TAB_IDS.length * SECTION_GUIDE_BEAT_COUNT,
    'every section beat gets exactly one slot'
  );

  // No orphan slots: each guide id names a section and beat that really exist.
  for (const slot of guideSlots) {
    const parsed = registry.parseGuideVideoSlotId(slot.id);
    assert.ok(parsed, `${slot.id} does not parse back into a section and a beat`);
    const guide = (SECTION_GUIDES as Record<string, { beats: { id: string }[] }>)[
      parsed!.sectionGuideId
    ];
    assert.ok(guide, `${slot.id} names a section that is not in the catalog`);
    assert.ok(
      guide.beats.some((b) => b.id === parsed!.beatId),
      `${slot.id} names a beat that ${parsed!.sectionGuideId} does not have`
    );
    assert.equal(
      slot.groupId,
      registry.guideVideoSlotGroupId(parsed!.sectionGuideId),
      `${slot.id} is filed under the wrong section group`
    );
  }

  // No orphan beats: every beat in the catalog is reachable from the CEO page.
  for (const sectionGuideId of SECTION_GUIDE_TAB_IDS) {
    for (const beat of SECTION_GUIDES[sectionGuideId].beats) {
      const slotId = registry.guideVideoSlotId(sectionGuideId, beat.id);
      assert.ok(
        registry.isVideoSlotId(slotId),
        `catalog beat ${sectionGuideId}/${beat.id} has no slot the founder can fill`
      );
    }
  }

  // The id carries the real beat id, not the display text or an index.
  assert.equal(
    registry.guideVideoSlotId('StrictlyCharts', '02-neuro-profiles'),
    'guide.StrictlyCharts.02-neuro-profiles'
  );
  assert.deepEqual(registry.parseGuideVideoSlotId('guide.StrictlyCharts.02-neuro-profiles'), {
    sectionGuideId: 'StrictlyCharts',
    beatId: '02-neuro-profiles',
  });
  for (const junk of ['guide.', 'guide.Only', 'guide..x', 'guide.a.b.c', 'nav.charts', '']) {
    assert.equal(registry.parseGuideVideoSlotId(junk), null, `${junk} must not parse as a beat`);
  }

  // ------------------------------------------------- which file actually plays ----

  const catalogUrl = 'https://cdn.example.test/catalog-clip.mp4';
  const founderUrl = 'https://storage.googleapis.com/cp/founder-clip.mp4';
  const beat = { id: '02-neuro-profiles', videoUrl: '' };
  const slotId = registry.guideVideoSlotId('StrictlyCharts', beat.id);

  assert.equal(
    registry.resolveGuideBeatVideoUrl('StrictlyCharts', beat, {}),
    '',
    'no assignment and no catalog URL means the honest coming-soon frame'
  );
  assert.equal(
    registry.resolveGuideBeatVideoUrl('StrictlyCharts', { ...beat, videoUrl: catalogUrl }, {}),
    catalogUrl,
    'a catalog URL is the fallback when the founder has not assigned anything'
  );
  assert.equal(
    registry.resolveGuideBeatVideoUrl(
      'StrictlyCharts',
      { ...beat, videoUrl: catalogUrl },
      { [slotId]: founderUrl }
    ),
    founderUrl,
    'a founder assignment wins over the static catalog URL'
  );
  assert.equal(
    registry.resolveGuideBeatVideoUrl(
      'StrictlyCharts',
      { ...beat, videoUrl: catalogUrl },
      { [slotId]: 'javascript:alert(1)' }
    ),
    catalogUrl,
    'a non-https assignment is ignored rather than injected into <video src>'
  );
  assert.equal(
    registry.resolveGuideBeatVideoUrl('StrictlyCharts', beat, { 'guide.Other.01-x': founderUrl }),
    '',
    'another beat’s assignment must not leak into this one'
  );

  // Today every catalog beat is a placeholder, so the assignment is the only
  // thing that can light a clip up. If that ever changes, say so out loud.
  const hardCoded = SECTION_GUIDE_TAB_IDS.flatMap((id) =>
    SECTION_GUIDES[id].beats.filter((b) => b.videoUrl.trim())
  );
  assert.equal(hardCoded.length, 0, 'catalog videoUrls are placeholders; the CEO page is the only wire-up');

  // Storage lives under cwd; keep the repo's data/ directory out of this.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'clearpath-video-slots-'));
  process.chdir(tmp);

  try {
    await runStoreAndRouteChecks();
  } finally {
    process.chdir(root);
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  console.log('video-slots.selftest: ok');
}

async function runStoreAndRouteChecks() {
  const store = await import('../src/server/videoSlotStore.ts');

  const url = 'https://storage.googleapis.com/cp-explainers/ceo-videos/abc/clip.mp4';

  // --- durable round-trip, credential-less (Firestore returns null here) ---
  await store.setVideoSlotAssignment({ slotId: 'nav.charts', videoId: 'abc123', url });
  const file = path.join(process.cwd(), 'data', 'video-slots', 'assignments.json');
  assert.ok(fs.existsSync(file), 'assignment is written somewhere durable, not just memory');

  // Cold start: forget the warm cache, the assignment must come back.
  store.__resetVideoSlotCacheForTests();
  const reloaded = await store.getVideoSlotAssignments();
  assert.equal(reloaded['nav.charts']?.videoId, 'abc123', 'assignment survives a restart');
  assert.equal(reloaded['nav.charts']?.url, url);

  // --- refuses junk rather than writing a broken <video src> ---
  await assert.rejects(
    () => store.setVideoSlotAssignment({ slotId: 'nav.nope', videoId: 'abc123', url }),
    /unknown slot|non-https/i,
    'unknown slot ids are refused'
  );
  await assert.rejects(
    () =>
      store.setVideoSlotAssignment({
        slotId: 'nav.home',
        videoId: 'abc123',
        url: 'javascript:alert(1)',
      }),
    /unknown slot|non-https/i,
    'non-https URLs are refused'
  );

  // Hand-edited garbage on disk is dropped, not served.
  fs.writeFileSync(
    file,
    JSON.stringify({
      'nav.charts': { slotId: 'nav.charts', videoId: 'abc123', url, assignedAt: '2026-01-01' },
      'nav.evil': { slotId: 'nav.evil', videoId: 'x', url: 'https://x/y.mp4', assignedAt: '2026-01-01' },
      'nav.home': { slotId: 'nav.home', videoId: 'y', url: 'http://insecure/y.mp4', assignedAt: '2026-01-01' },
    }),
    'utf8'
  );
  store.__resetVideoSlotCacheForTests();
  const sanitized = await store.getVideoSlotAssignments();
  assert.deepEqual(Object.keys(sanitized), ['nav.charts'], 'unknown slots and non-https URLs are dropped on read');

  // --- a deleted video unwires its icons ---
  await store.setVideoSlotAssignment({ slotId: 'nav.home', videoId: 'abc123', url });
  const cleared = await store.clearAssignmentsForVideo('abc123');
  assert.deepEqual(cleared.sort(), ['nav.charts', 'nav.home'], 'deleting a video clears every slot using it');
  assert.deepEqual(await store.getVideoSlotAssignments(), {}, 'nothing points at the deleted video');

  // --- pruning catches objects removed outside the CEO page ---
  await store.setVideoSlotAssignment({ slotId: 'nav.news', videoId: 'gone999', url });
  assert.deepEqual(await store.pruneVideoSlotAssignments(['still-here']), ['nav.news']);
  assert.equal((await store.getVideoSlotAssignments())['nav.news'], undefined);

  // -------------------------------------------------------- live routes ----

  const { requireFounderOrCatalogAdmin, requireFounderActionHeader } = await import(
    '../src/server/authGuards.ts'
  );
  const { createCeoVideoRouter } = await import('../src/server/ceoVideoRoutes.ts');
  const { createPublicVideoSlotRouter } = await import('../src/server/videoSlotRoutes.ts');

  const app = express();
  app.use(express.json());
  app.use(
    '/api/ceo/videos',
    requireFounderOrCatalogAdmin,
    requireFounderActionHeader,
    createCeoVideoRouter()
  );
  app.use('/api/videos', createPublicVideoSlotRouter());

  const listener = http.createServer(app);
  await new Promise<void>((resolve) => listener.listen(0, '127.0.0.1', resolve));
  const { port } = listener.address() as { port: number };
  const base = `http://127.0.0.1:${port}`;
  const call = (p: string, init?: RequestInit) => fetch(`${base}${p}`, init);
  const founder = {
    'content-type': 'application/json',
    'x-catalog-admin-secret': 'selftest-catalog-secret',
    'x-clearpath-founder-action': '1',
  };

  try {
    // 1. Assignment routes are founder-only.
    for (const [method, route] of [
      ['PUT', '/api/ceo/videos/slots/nav.charts'],
      ['DELETE', '/api/ceo/videos/slots/nav.charts'],
    ] as const) {
      const res = await call(route, {
        method,
        headers: { 'content-type': 'application/json' },
        body: method === 'PUT' ? JSON.stringify({ videoId: 'abc123' }) : undefined,
      });
      assert.equal(res.status, 401, `${method} ${route} must be 401 without founder auth`);
    }

    const wrongSecret = await call('/api/ceo/videos/slots/nav.charts', {
      method: 'DELETE',
      headers: { 'x-catalog-admin-secret': 'nope', 'x-clearpath-founder-action': '1' },
    });
    assert.equal(wrongSecret.status, 401, 'a wrong secret must not move a video onto the site');

    const noHeader = await call('/api/ceo/videos/slots/nav.charts', {
      method: 'DELETE',
      headers: { 'x-catalog-admin-secret': 'selftest-catalog-secret' },
    });
    assert.equal(noHeader.status, 403, 'missing founder action header must be 403');

    // 2. Founder sees every slot, grouped, even with storage unconfigured.
    const registry = await import('../src/content/videoSlots.ts');
    const library = await call('/api/ceo/videos', { headers: founder });
    assert.equal(library.status, 200);
    const libraryBody = (await library.json()) as any;
    assert.ok(Array.isArray(libraryBody.slots), 'the CEO payload lists the slots');
    assert.equal(libraryBody.slots.length, registry.VIDEO_SLOTS.length);
    assert.ok(
      libraryBody.slots.every((s: any) => typeof s.label === 'string' && 'assignment' in s),
      'each slot says what it is and what is behind it'
    );
    assert.ok(Array.isArray(libraryBody.groups), 'the CEO payload carries the group order');
    assert.equal(libraryBody.groups[0]?.id, registry.NAV_VIDEO_SLOT_GROUP_ID, 'nav group comes first');
    const payloadGroupIds = new Set(libraryBody.groups.map((g: any) => g.id));
    for (const slot of libraryBody.slots) {
      assert.ok(payloadGroupIds.has(slot.groupId), `${slot.id} has no group to live in on the page`);
    }

    // 3. An unknown slot id is refused even for the founder.
    const badSlot = await call('/api/ceo/videos/slots/nav.not-a-slot', {
      method: 'PUT',
      headers: founder,
      body: JSON.stringify({ videoId: 'abc123' }),
    });
    assert.equal(badSlot.status, 404);
    assert.equal(((await badSlot.json()) as any).error, 'unknown_slot');

    // 3b. A walkthrough clip is assignable through the same founder-gated route.
    const guideSlotId = registry.guideVideoSlotId('StrictlyCharts', '02-neuro-profiles');
    const unauthGuide = await call(`/api/ceo/videos/slots/${encodeURIComponent(guideSlotId)}`, {
      method: 'DELETE',
    });
    assert.equal(unauthGuide.status, 401, 'walkthrough clips are founder-gated like every other slot');
    const badBeat = await call('/api/ceo/videos/slots/guide.StrictlyCharts.99-not-a-beat', {
      method: 'PUT',
      headers: founder,
      body: JSON.stringify({ videoId: 'abc123' }),
    });
    assert.equal(badBeat.status, 404, 'a beat that is not in the catalog is not a slot');

    // 4. The public endpoint needs no auth and leaks nothing founder-only.
    store.__resetVideoSlotCacheForTests();
    await store.setVideoSlotAssignment({ slotId: 'nav.charts', videoId: 'abc123', url });
    await store.setVideoSlotAssignment({ slotId: guideSlotId, videoId: 'abc123', url });

    const pub = await call('/api/videos/slots');
    assert.equal(pub.status, 200, 'visitors can read the slot map with no credentials');
    const pubBody = (await pub.json()) as any;
    assert.deepEqual(Object.keys(pubBody).sort(), ['ok', 'slots'], 'the public body has no extra fields');
    assert.deepEqual(
      pubBody.slots,
      { 'nav.charts': url, [guideSlotId]: url },
      'the public map is slot id -> URL only'
    );
    // ~100 registered slots must not mean ~100 keys on the wire: only the ones
    // the founder actually filled are published.
    assert.ok(
      Object.keys(pubBody.slots).length < registry.VIDEO_SLOTS.length,
      'the public map lists assignments, not the whole registry'
    );
    assert.doesNotMatch(
      JSON.stringify(pubBody),
      /flowPrompt|narrationScript|groupId|explains|label|where/,
      'registry copy and production notes stay off the public endpoint'
    );
    for (const value of Object.values(pubBody.slots)) {
      assert.equal(typeof value, 'string', 'a slot value is a bare URL, never an object of metadata');
    }
    // Scan everything except the URLs themselves — a bucket URL legitimately
    // contains words like "storage", but nothing else in the body may.
    const raw = JSON.stringify({ ...pubBody, slots: Object.keys(pubBody.slots) });
    for (const leak of [
      'videoId',
      'objectPath',
      'assignedAt',
      'originalName',
      'sizeBytes',
      'publicRead',
      'bucket',
      'credentials',
      'maxBytes',
      'uploadUrl',
      'storage',
    ]) {
      assert.equal(raw.includes(leak), false, `public slot map must not expose ${leak}`);
    }

    // 5. Delete the video: every icon and clip using it goes quiet instead of
    // serving a dead player. The walkthrough then shows its coming-soon frame.
    await store.clearAssignmentsForVideo('abc123');
    const after = await call('/api/videos/slots');
    const afterSlots = ((await after.json()) as any).slots;
    assert.deepEqual(afterSlots, {}, 'a deleted video leaves no slot behind');
    assert.equal(
      registry.resolveGuideBeatVideoUrl(
        'StrictlyCharts',
        { id: '02-neuro-profiles', videoUrl: '' },
        afterSlots
      ),
      '',
      'a clip whose video was deleted falls back to the honest coming-soon frame'
    );
  } finally {
    await new Promise<void>((resolve) => listener.close(() => resolve()));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
