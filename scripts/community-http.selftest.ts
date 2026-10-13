/**
 * Community HTTP authorization and throttling regression.
 * Run: npx tsx scripts/community-http.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import express from 'express';

const root = process.cwd();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'clearpath-community-http-'));
process.chdir(tmp);
process.env.NODE_ENV = 'development';
process.env.CLEARPATH_DISABLE_FIRESTORE_ADMIN = '1';

async function main() {
  const { createCommunityRouter } = await import('../src/server/communityRoutes.ts');
  const { writeProfile } = await import('../src/server/profileStore.ts');

  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    const uid = String(req.get('x-test-uid') || '').trim();
    if (uid) {
      req.session = {
        privateUser: {
          uid,
          email: `${uid}@example.com`,
          displayName: uid,
        },
      };
    }
    next();
  });
  app.use('/api/communities', createCommunityRouter());

  const listener = http.createServer(app);
  await new Promise<void>((resolve) => listener.listen(0, '127.0.0.1', resolve));
  const { port } = listener.address() as { port: number };
  const call = (route: string, init?: RequestInit) =>
    fetch(`http://127.0.0.1:${port}${route}`, init);

  try {
    const catalog = await call('/api/communities/');
    assert.equal(catalog.status, 200);
    const catalogBody = (await catalog.json()) as any;
    assert.equal(catalogBody.signedIn, false);
    assert.ok(catalogBody.rooms.every((room: any) => room.locked === true));

    assert.equal((await call('/api/communities/education/posts')).status, 401);
    assert.equal((await call('/api/communities/not-a-room/posts')).status, 404);

    writeProfile('basic-user', {
      launchTrial: { startedAt: '2020-01-01T00:00:00.000Z' },
    });
    const basicHeaders = { 'x-test-uid': 'basic-user' };
    assert.equal(
      (await call('/api/communities/education/posts', { headers: basicHeaders })).status,
      403,
      'Basic members must not enter Silver rooms.',
    );

    writeProfile('silver-user', {
      membership: { tier: 'silver', status: 'active' },
    });
    const silverHeaders = {
      'content-type': 'application/json',
      'x-test-uid': 'silver-user',
    };
    const created = await call('/api/communities/education/posts', {
      method: 'POST',
      headers: silverHeaders,
      body: JSON.stringify({ text: 'HTTP authorization works.' }),
    });
    assert.equal(created.status, 201);
    const createdBody = (await created.json()) as any;
    assert.equal(createdBody.post.mine, true);

    const throttled = await call('/api/communities/education/posts', {
      method: 'POST',
      headers: silverHeaders,
      body: JSON.stringify({ text: 'This second post is too soon.' }),
    });
    assert.equal(throttled.status, 429, 'Rapid repeat posts must be throttled.');

    const posts = await call('/api/communities/education/posts', { headers: silverHeaders });
    assert.equal(posts.status, 200);
    assert.equal(((await posts.json()) as any).posts.length, 1);
  } finally {
    await new Promise<void>((resolve) => listener.close(() => resolve()));
    process.chdir(root);
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  console.log('community-http.selftest: ok');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
