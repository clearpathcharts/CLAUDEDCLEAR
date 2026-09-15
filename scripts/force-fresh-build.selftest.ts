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
  applyCspNonceToScripts,
  jsonForInlineScript,
  readLiveBuildIdentity,
  sendUncachedHtml,
} from '../src/server/htmlCacheHeaders';
import { enrichHtmlWithMetadata } from '../src/server/semanticDatabase';
import { renderStaticContentPage } from '../src/server/contentPages';
import {
  AUTH_GENERATION_KEY,
  CACHE_BUST_PARAM,
  ORIGIN_REVISION_KEY,
  RELOADED_SESSION_KEY,
  runForceFreshBuild,
  shouldForceReload,
  shouldForceSessionKick,
  withCacheBustParam,
} from '../src/lib/forceFreshBuild';
import {
  DEFAULT_AUTH_SESSION_GENERATION,
  applyGrantedSession,
  dropStaleAuthSession,
  getAuthSessionGeneration,
  kickAllMemberSessions,
  resetAuthSessionGenerationForTests,
  sessionMatchesGeneration,
} from '../src/server/authSessionGeneration';

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

{
  const sent = new Map<string, string>();
  let statusCode = 0;
  let body = '';
  sendUncachedHtml(
    {
      setHeader: (name, value) => sent.set(name, value),
      removeHeader: (name) => sent.delete(name),
      status: (code) => {
        statusCode = code;
      },
      write: (chunk) => {
        body += chunk;
      },
      end: () => undefined,
    },
    '<html>ok</html>',
    200,
  );
  assert.equal(statusCode, 200);
  assert.equal(body, '<html>ok</html>');
  assert.equal(sent.has('ETag'), false);
  assert.equal(sent.get('CDN-Cache-Control'), 'no-store');
}

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

assert.equal(shouldForceSessionKick({ originGeneration: 2, seenGeneration: 1 }), true);
assert.equal(shouldForceSessionKick({ originGeneration: 2, seenGeneration: 2 }), false);
assert.equal(shouldForceSessionKick({ originGeneration: 2, seenGeneration: null }), false);

assert.equal(DEFAULT_AUTH_SESSION_GENERATION, 2);
{
  const prevGen = process.env.AUTH_SESSION_GENERATION;
  delete process.env.AUTH_SESSION_GENERATION;
  assert.equal(getAuthSessionGeneration(), 2);
  const stale = { privateUser: { uid: 'old' }, boardAccess: true };
  assert.equal(dropStaleAuthSession(stale), 'dropped');
  assert.equal(stale.privateUser, undefined);
  const granted: Record<string, unknown> = {};
  applyGrantedSession(granted, { uid: 'new' });
  assert.equal(granted.authGeneration, 2);
  assert.equal(sessionMatchesGeneration(granted), true);
  assert.equal(dropStaleAuthSession(granted), 'ok');
  process.env.AUTH_SESSION_GENERATION = '9';
  assert.equal(getAuthSessionGeneration(), 9);
  if (prevGen === undefined) delete process.env.AUTH_SESSION_GENERATION;
  else process.env.AUTH_SESSION_GENERATION = prevGen;
  resetAuthSessionGenerationForTests();
}

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

{
  let kickedTo = '';
  const kickStore = memoryStore({
    [ORIGIN_REVISION_KEY]: 'same-rev',
    [AUTH_GENERATION_KEY]: '1',
  });
  const kickResult = await runForceFreshBuild({
    fetchImpl: async () =>
      new Response(
        JSON.stringify({ cloudRun: { revision: 'same-rev' }, session: { generation: 2 } }),
        { status: 200 },
      ),
    storage: kickStore,
    session: memoryStore(),
    href: 'https://clearpathtrader.com/desk/retail',
    reload: (url) => {
      kickedTo = url;
    },
  });
  assert.equal(kickResult, 'reloaded');
  assert.equal(kickStore.data[AUTH_GENERATION_KEY], '2');
  assert.equal(kickedTo.includes('/desk/retail'), true);
}

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
  const withMeta = applyCspNonceToScripts(
    `${stamped}<meta http-equiv="Content-Security-Policy" content="script-src *"><script>window.x=1</script>`,
    'abc123',
  );
  assert.match(withMeta, /<script nonce="abc123">window\.__CLEARPATH_BUILD__/);
  assert.doesNotMatch(withMeta, /<script nonce="abc123">window\.x=1/);
  assert.match(withMeta, /<script>window\.x=1<\/script>/);
  assert.doesNotMatch(withMeta, /http-equiv="Content-Security-Policy"/);
  assert.equal(
    jsonForInlineScript({ url: 'https://clearpathtrader.com/</script><script>alert(1)' }),
    '{\n  "url": "https://clearpathtrader.com/\\u003c/script>\\u003cscript>alert(1)"\n}',
  );
  const poisoned = enrichHtmlWithMetadata(
    '<html><head><title>x</title></head><body></body></html>',
    '/"><script>alert(1)</script>',
    { cspNonce: 'deadbeef' },
  );
  assert.doesNotMatch(poisoned, /<script nonce="deadbeef">alert\(1\)/);
  assert.match(poisoned, /og:url" content="[^"]*&quot;/);
  assert.match(poisoned, /rel="canonical" href="[^"]*&quot;/);
  assert.doesNotMatch(poisoned, /<script>alert\(1\)<\/script>/);
  const calc = applyCspNonceToScripts(
    '<script>window.__CLEARPATH_POSITION_SIZE__=1;(function(){calc()})()</script>',
    'abc123',
  );
  assert.match(calc, /<script nonce="abc123">window\.__CLEARPATH_POSITION_SIZE__/);
  const posPage = renderStaticContentPage('/tools/position-size');
  assert.ok(posPage);
  const posHtml = enrichHtmlWithMetadata(posPage, '/tools/position-size', { cspNonce: 'abc123' });
  assert.match(posHtml, /<script nonce="abc123">[\s\S]*window\.__CLEARPATH_POSITION_SIZE__/);
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
  assert.doesNotMatch(body, /caches\.match\(|cache\.addAll\(/, `${rel} must not cache-match`);
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
assert.match(serverSrc, /sendUncachedHtml/);
assert.match(serverSrc, /readLiveBuildIdentity/);
assert.match(serverSrc, /dropStaleAuthSession/);
assert.match(serverSrc, /applyGrantedSession/);
assert.match(serverSrc, /generation: getAuthSessionGeneration\(\)/);
assert.match(serverSrc, /\/api\/admin\/auth\/kick-sessions/);
assert.match(serverSrc, /kickAllMemberSessions/);
assert.match(serverSrc, /keptFounderSession/);

{
  resetAuthSessionGenerationForTests();
  const before = getAuthSessionGeneration();
  const kicked = await kickAllMemberSessions({ kickedBy: 'selftest' });
  assert.equal(kicked.accountsDeleted, 0);
  assert.equal(kicked.generation, before + 1);
  assert.equal(getAuthSessionGeneration(), before + 1);
  const staleAfterKick = { privateUser: { uid: 'old' }, authGeneration: before };
  assert.equal(dropStaleAuthSession(staleAfterKick), 'dropped');
  resetAuthSessionGenerationForTests();
  try {
    fs.unlinkSync(path.join(root, 'data', 'auth-session-generation.json'));
  } catch {
    /* optional */
  }
}

const genSrc = fs.readFileSync(path.join(root, 'src/server/authSessionGeneration.ts'), 'utf8');
assert.match(genSrc, /purgeExpressSessionCookiesOnly/);
assert.match(genSrc, /accountsDeleted: 0/);
assert.doesNotMatch(genSrc, /private_accounts.*delete|collection\('private_accounts'\)\.doc/);

const storeSrc = fs.readFileSync(path.join(root, 'src/server/firestoreSessionStore.ts'), 'utf8');
assert.match(storeSrc, /EXPRESS_SESSIONS_COLLECTION = 'express_sessions'/);
assert.match(storeSrc, /Never touches private_accounts/);

console.log('force-fresh-build.selftest: ok');
