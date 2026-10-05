/**
 * CEO explainer-video library:
 * - every route is founder-gated (401 unauthenticated, 403 without the action header)
 * - storage is durable-bucket only — no local-disk write path, in prod or anywhere
 * - filename / MIME / size validation holds
 * - "storage not configured" is an honest state, never a fake success
 *
 * Run: npx tsx scripts/ceo-videos.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
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
const mount = server.match(/app\.use\(\s*'\/api\/ceo\/videos',[\s\S]{0,260}?\);/);
assert.ok(mount, 'server.ts mounts /api/ceo/videos');
assert.match(mount![0], /requireFounderOrCatalogAdmin/, 'video routes keep the founder gate');
assert.match(mount![0], /requireFounderActionHeader/, 'video routes keep the founder action header');

const storageSrc = read('src/server/ceoVideoStorage.ts');
assert.doesNotMatch(storageSrc, /from\s+'(node:)?fs(\/promises)?'/, 'storage module must not import fs');
assert.doesNotMatch(storageSrc, /writeFile|createWriteStream|mkdir/, 'storage module must not write local disk');
assert.match(storageSrc, /createResumableUpload/, 'uploads go direct to the bucket');

const routesSrc = read('src/server/ceoVideoRoutes.ts');
assert.doesNotMatch(routesSrc, /from\s+'(node:)?fs(\/promises)?'/, 'route module must not import fs');

const ui = read('src/components/CeoVideoLibrary.tsx');
assert.match(ui, /data-ceo-video-copy/, 'one-click copy button exists');
assert.match(ui, /upload\.onprogress/, 'upload shows real progress, not a silent spinner');
assert.match(ui, /Tap again to delete/, 'delete has a confirmation step');
assert.match(ui, /data-ceo-video-not-configured/, 'honest storage-not-configured state');

const ceo = read('src/components/CeoDashboard.tsx');
assert.match(ceo, /CeoVideoLibrary/, 'CEO Dashboard renders the library');
assert.match(ceo, /data-ceo-videos-tab/, 'CEO Dashboard has the explainer videos tab');
const shortcutAt = ceo.indexOf('data-ceo-videos-shortcut');
assert.ok(shortcutAt > 0, 'CEO Dashboard has a top-of-page explainer videos shortcut');
for (const later of ['<ChooseYourPath', '<DailyOpsDesk', '<DailyPatternReviewDesk', 'data-ceo-tabs']) {
  assert.ok(ceo.indexOf(later) > shortcutAt, `videos shortcut sits above ${later} so the founder never scrolls to find it`);
}
assert.match(ceo, /data-ceo-videos-open[\s\S]{0,80}openVideoLibrary/, 'shortcut opens the video tab');
assert.match(ui, /data-ceo-video-upload-locked/, 'a disabled upload button always explains why');

const envExample = read('.env.example');
assert.match(envExample, /^CEO_VIDEO_BUCKET=/m, 'CEO_VIDEO_BUCKET documented');
assert.match(envExample, /^CEO_VIDEO_MAX_MB=/m, 'CEO_VIDEO_MAX_MB documented');
assert.doesNotMatch(envExample, /VITE_CEO_VIDEO/, 'bucket config is never a VITE_ client secret');

// ----------------------------------------------------------- unit checks ----

async function main() {
  const storage = await import('../src/server/ceoVideoStorage.ts');

  assert.equal(storage.sanitizeVideoFilename('../../etc/passwd'), 'passwd');
  assert.equal(storage.sanitizeVideoFilename('C:\\Users\\me\\My Clip.mp4'), 'My-Clip.mp4');
  assert.equal(storage.sanitizeVideoFilename(''), 'explainer-video.mp4');
  assert.ok(!storage.sanitizeVideoFilename('a/b/c.mp4').includes('/'));

  assert.equal(storage.isAllowedVideoContentType('video/mp4'), true);
  assert.equal(storage.isAllowedVideoContentType('video/mp4; codecs=avc1'), true);
  assert.equal(storage.isAllowedVideoContentType('text/html'), false);
  assert.equal(storage.isAllowedVideoContentType('application/x-msdownload'), false);

  process.env.CEO_VIDEO_MAX_MB = '64';
  assert.equal(storage.ceoVideoMaxBytes(), 64 * 1024 * 1024);
  delete process.env.CEO_VIDEO_MAX_MB;

  // Bucket name falls back to the Firebase config, but no credentials means the
  // library stays honestly unconfigured rather than claiming it can store anything.
  const unset = storage.getCeoVideoStorageStatus();
  assert.equal(unset.configured, false, 'no credentials -> not configured');
  assert.equal(unset.credentials, false);
  assert.ok((unset.reason || '').length > 0, 'unconfigured state explains itself');

  process.env.CEO_VIDEO_BUCKET = 'gs://clearpath-explainer-videos/';
  assert.equal(storage.getCeoVideoBucketName(), 'clearpath-explainer-videos', 'bucket name is normalised');
  delete process.env.CEO_VIDEO_BUCKET;

  // ------------------------------------------------------- live gating ----

  const { requireFounderOrCatalogAdmin, requireFounderActionHeader } = await import(
    '../src/server/authGuards.ts'
  );
  const { createCeoVideoRouter } = await import('../src/server/ceoVideoRoutes.ts');

  const app = express();
  app.use(express.json());
  app.use(
    '/api/ceo/videos',
    requireFounderOrCatalogAdmin,
    requireFounderActionHeader,
    createCeoVideoRouter()
  );

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
    // 1. No credentials at all — nothing is reachable.
    for (const [method, route] of [
      ['GET', '/api/ceo/videos'],
      ['POST', '/api/ceo/videos/upload-url'],
      ['POST', '/api/ceo/videos/abc/finalize'],
      ['DELETE', '/api/ceo/videos/abc'],
    ] as const) {
      const res = await call(route, { method });
      assert.equal(res.status, 401, `${method} ${route} must be 401 without founder auth`);
    }

    // 2. A wrong secret is still rejected.
    const wrong = await call('/api/ceo/videos', {
      headers: { 'x-catalog-admin-secret': 'nope', 'x-clearpath-founder-action': '1' },
    });
    assert.equal(wrong.status, 401, 'wrong admin secret must not open the library');

    // 3. Right secret but no action header — CSRF guard holds.
    const noHeader = await call('/api/ceo/videos', {
      headers: { 'x-catalog-admin-secret': 'selftest-catalog-secret' },
    });
    assert.equal(noHeader.status, 403, 'missing founder action header must be 403');

    // 4. Founder-authenticated, bucket unset — honest state, empty list, no fake success.
    const ok = await call('/api/ceo/videos', { headers: founder });
    assert.equal(ok.status, 200);
    const body = (await ok.json()) as any;
    assert.equal(body.storage.configured, false);
    assert.deepEqual(body.videos, []);
    assert.ok(body.limits.maxBytes > 0);
    const navRows = body.slots.filter((s: any) => s.groupId === 'nav');
    assert.equal(navRows.length, 15, 'the upload list has 15 nav play icons');
    assert.equal(
      body.slots.some((s: any) => String(s.id).startsWith('nav.ceo')),
      false,
      'no one but the founder sees the CEO dashboard, so it has no row on the upload list'
    );
    const ceoAssign = await call('/api/ceo/videos/slots/nav.ceo', {
      method: 'PUT',
      headers: founder,
      body: JSON.stringify({ videoId: 'abc123' }),
    });
    assert.equal(ceoAssign.status, 404, 'a nav.ceo assignment is refused');

    // 5. Minting an upload URL fails loudly instead of pretending it worked.
    const mint = await call('/api/ceo/videos/upload-url', {
      method: 'POST',
      headers: founder,
      body: JSON.stringify({ filename: 'a.mp4', contentType: 'video/mp4', sizeBytes: 1024 }),
    });
    assert.equal(mint.status, 503);
    const mintBody = (await mint.json()) as any;
    assert.equal(mintBody.error, 'storage_not_configured');
    assert.equal(mintBody.uploadUrl, undefined);
  } finally {
    await new Promise<void>((resolve) => listener.close(() => resolve()));
  }

  console.log('ceo-videos.selftest: ok');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
