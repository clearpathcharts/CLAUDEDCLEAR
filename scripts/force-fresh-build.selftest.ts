/**
 * Public visitors must pick up a new Cloud Run revision without clearing history.
 * Run: npm run test:force-fresh-build
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'path';
import {
  applyHtmlNoStore,
  HTML_NO_STORE_HEADERS,
  injectBuildStamp,
  readLiveBuildIdentity,
} from '../src/server/htmlCacheHeaders';
import {
  CACHE_BUST_PARAM,
  ORIGIN_REVISION_KEY,
  RELOADED_SESSION_KEY,
  runForceFreshBuild,
  shouldForceReload,
  withCacheBustParam,
} from '../src/lib/forceFreshBuild';

assert.equal(HTML_NO_STORE_HEADERS['Cache-Control'].includes('no-store'), true);
assert.equal(HTML_NO_STORE_HEADERS['CDN-Cache-Control'], 'no-store');
assert.equal(HTML_NO_STORE_HEADERS['Surrogate-Control'], 'no-store');

const headers = new Map<string, string>();
applyHtmlNoStore({
  setHeader: (name, value) => headers.set(name, value),
  removeHeader: (name) => headers.delete(name),
});
assert.equal(headers.get('Cache-Control'), HTML_NO_STORE_HEADERS['Cache-Control']);
assert.equal(headers.has('ETag'), false);

assert.equal(
  shouldForceReload({
    originRevision: 'clear-path-markets-science-00555-abc',
    seenRevision: 'clear-path-markets-science-00554-5sp',
    alreadyReloadedFor: null,
  }),
  true,
);
assert.equal(
  shouldForceReload({
    originRevision: 'rev-a',
    seenRevision: null,
    alreadyReloadedFor: null,
  }),
  false,
  'first visit stores the revision — no reload loop',
);
assert.equal(
  shouldForceReload({
    originRevision: 'rev-b',
    seenRevision: 'rev-a',
    alreadyReloadedFor: 'rev-b',
  }),
  false,
  'already reloaded for this origin — do not loop',
);
assert.equal(
  shouldForceReload({
    originRevision: 'rev-a',
    seenRevision: 'rev-a',
    alreadyReloadedFor: null,
  }),
  false,
);

const busted = withCacheBustParam('https://clearpathtrader.com/desk/retail?foo=1#charts', 'rev-b');
assert.equal(busted.includes(`${CACHE_BUST_PARAM}=rev-b`), true);
assert.equal(busted.includes('foo=1'), true);
assert.equal(busted.endsWith('#charts'), true);

function memoryStore(init: Record<string, string> = {}) {
  const data = { ...init };
  return {
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
    data,
  };
}

const storage = memoryStore({ [ORIGIN_REVISION_KEY]: 'old-rev' });
const session = memoryStore();
let reloadedTo = '';
const result = await runForceFreshBuild({
  fetchImpl: async () =>
    new Response(JSON.stringify({ cloudRun: { revision: 'new-rev' } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  storage,
  session,
  href: 'https://clearpathtrader.com/desk/institutional',
  reload: (url) => {
    reloadedTo = url;
  },
});
assert.equal(result, 'reloaded');
assert.equal(storage.data[ORIGIN_REVISION_KEY], 'new-rev');
assert.equal(session.data[RELOADED_SESSION_KEY], 'new-rev');
assert.equal(reloadedTo.includes(`${CACHE_BUST_PARAM}=new-rev`), true);

const firstVisit = await runForceFreshBuild({
  fetchImpl: async () =>
    new Response(JSON.stringify({ cloudRun: { revision: 'only-rev' } }), { status: 200 }),
  storage: memoryStore(),
  session: memoryStore(),
  href: '/',
  reload: () => {
    throw new Error('must not reload on first visit');
  },
});
assert.equal(firstVisit, 'stored');

const prevK = process.env.K_REVISION;
const prevS = process.env.K_SERVICE;
process.env.K_SERVICE = 'clear-path-markets-science';
process.env.K_REVISION = 'clear-path-markets-science-00555-abc';
try {
  const identity = readLiveBuildIdentity();
  assert.equal(identity.service, 'clear-path-markets-science');
  assert.equal(identity.revision, 'clear-path-markets-science-00555-abc');
  const stamped = injectBuildStamp('<html><head></head><body></body></html>');
  assert.match(stamped, /clearpath-build clear-path-markets-science clear-path-markets-science-00555-abc/);
  assert.match(stamped, /window\.__CLEARPATH_BUILD__/);
} finally {
  if (prevK === undefined) delete process.env.K_REVISION;
  else process.env.K_REVISION = prevK;
  if (prevS === undefined) delete process.env.K_SERVICE;
  else process.env.K_SERVICE = prevS;
}

const root = process.cwd();
const killSwitches = [
  'public/sw.js',
  'public/learn/service-worker.js',
  'public/tv/sw.js',
];
for (const rel of killSwitches) {
  const body = fs.readFileSync(path.join(root, rel), 'utf8');
  assert.match(body, /registration\.unregister/);
  assert.match(body, /caches\.delete/);
  assert.doesNotMatch(body, /cache-first|caches\.match|cache\.addAll/);
}

const learnMain = fs.readFileSync(path.join(root, 'public/learn/assets/js/main.js'), 'utf8');
assert.doesNotMatch(learnMain, /serviceWorker\.register/);

const tvRegister = fs.readFileSync(path.join(root, 'public/tv/js/pwa-register.js'), 'utf8');
assert.doesNotMatch(tvRegister, /serviceWorker\.register/);

const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.match(indexHtml, /caches\.keys/);
assert.match(indexHtml, /serviceWorker\.getRegistrations/);

const serverSrc = fs.readFileSync(path.join(root, 'server.ts'), 'utf8');
assert.match(serverSrc, /applyHtmlNoStore/);
assert.match(serverSrc, /readLiveBuildIdentity/);

console.log('force-fresh-build.selftest: ok');
