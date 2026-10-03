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

// ----------------------------------------------------------- unit checks ----

async function main() {
  const registry = await import('../src/content/videoSlots.ts');
  const { EXPLAIN_FLOW_SLOT_IDS } = await import('../src/components/explain/explainMedia.ts');

  const ids = registry.VIDEO_SLOTS.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, 'slot ids must be unique');
  assert.ok(ids.length >= 16, `expected at least 16 play-icon slots, got ${ids.length}`);
  for (const slot of registry.VIDEO_SLOTS) {
    assert.match(slot.id, /^[a-z]+\.[a-z0-9-]+$/, `${slot.id} is not a stable lowercase id`);
    assert.doesNotMatch(slot.id, /^slot_?\d+$/i, `${slot.id} must not be positional`);
    assert.ok(slot.label.length > 8, `${slot.id} needs a label the founder will recognise`);
    assert.ok(slot.where.length > 8, `${slot.id} needs to say where the icon is`);
    assert.ok(slot.explains.length > 8, `${slot.id} needs an aria description`);
  }
  const labels = registry.VIDEO_SLOTS.map((s) => s.label);
  assert.equal(new Set(labels).size, labels.length, 'dropdown labels must be distinguishable');

  // Every play icon the site already renders must be adoptable.
  for (const explainId of EXPLAIN_FLOW_SLOT_IDS) {
    const slotId = registry.navVideoSlotId(explainId);
    assert.ok(registry.isVideoSlotId(slotId), `no slot registered for the ${explainId} play icon`);
  }
  assert.equal(registry.isVideoSlotId('nope'), false);
  assert.equal(registry.isVideoSlotId('../../etc/passwd'), false);
  assert.equal(registry.getVideoSlot('nav.charts')?.id, 'nav.charts');

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

    // 2. Founder sees every slot, even with storage unconfigured.
    const library = await call('/api/ceo/videos', { headers: founder });
    assert.equal(library.status, 200);
    const libraryBody = (await library.json()) as any;
    assert.ok(Array.isArray(libraryBody.slots), 'the CEO payload lists the slots');
    assert.equal(libraryBody.slots.length, (await import('../src/content/videoSlots.ts')).VIDEO_SLOTS.length);
    assert.ok(
      libraryBody.slots.every((s: any) => typeof s.label === 'string' && 'assignment' in s),
      'each slot says what it is and what is behind it'
    );

    // 3. An unknown slot id is refused even for the founder.
    const badSlot = await call('/api/ceo/videos/slots/nav.not-a-slot', {
      method: 'PUT',
      headers: founder,
      body: JSON.stringify({ videoId: 'abc123' }),
    });
    assert.equal(badSlot.status, 404);
    assert.equal(((await badSlot.json()) as any).error, 'unknown_slot');

    // 4. The public endpoint needs no auth and leaks nothing founder-only.
    store.__resetVideoSlotCacheForTests();
    await store.setVideoSlotAssignment({ slotId: 'nav.charts', videoId: 'abc123', url });

    const pub = await call('/api/videos/slots');
    assert.equal(pub.status, 200, 'visitors can read the slot map with no credentials');
    const pubBody = (await pub.json()) as any;
    assert.deepEqual(Object.keys(pubBody).sort(), ['ok', 'slots'], 'the public body has no extra fields');
    assert.deepEqual(pubBody.slots, { 'nav.charts': url }, 'the public map is slot id -> URL only');
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

    // 5. Delete the video: the icon goes quiet instead of serving a dead player.
    await store.clearAssignmentsForVideo('abc123');
    const after = await call('/api/videos/slots');
    assert.deepEqual(((await after.json()) as any).slots, {}, 'a deleted video leaves no slot behind');
  } finally {
    await new Promise<void>((resolve) => listener.close(() => resolve()));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
