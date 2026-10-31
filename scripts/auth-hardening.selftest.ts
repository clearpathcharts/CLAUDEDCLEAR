/**
 * Guards: client IPs come from req.ip (never the spoofable left of X-Forwarded-For),
 * moderation strikes key on the server session (never a body uid),
 * and every founder Google gate requires a verified email.
 * Run: npx tsx scripts/auth-hardening.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

function serverSources(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) serverSources(rel, out);
    else if (/\.ts$/.test(entry.name)) out.push(rel);
  }
  return out;
}

for (const rel of ['server.ts', ...serverSources('src/server')]) {
  const code = read(rel).replace(/^\s*(\/\/|\*).*$/gm, '');
  assert.doesNotMatch(code, /\[['"]x-forwarded-for['"]\]/i, `${rel}: read client IP from req.ip, not X-Forwarded-For`);
}

assert.doesNotMatch(read('src/server/contentModeration.ts'), /actorKey\s*=\s*req\.body/, 'moderation actor must not come from the request body');

const founderGates: Array<[string, RegExp]> = [
  ['src/server/authGuards.ts', /decoded\.email_verified === true && isFounderEmail\(decoded\.email\)/],
  ['src/server/membershipAccess.ts', /decoded\.email_verified === true && isFounderEmail\(email\)/],
  ['server.ts', /decoded\.email_verified !== true \|\| !isFounderEmail\(founderEmail\)/],
];
for (const [rel, pattern] of founderGates) assert.match(read(rel), pattern, `${rel}: founder gate must require a verified email`);

const { siteOrigin, isOwnHost } = await import('../src/server/siteOrigin.ts');
const fakeReq = (host: string) => ({ protocol: 'https', get: (n: string) => (n.toLowerCase() === 'host' ? host : undefined) }) as any;
const savedEnv = { NODE_ENV: process.env.NODE_ENV, PUBLIC_SITE_URL: process.env.PUBLIC_SITE_URL, SITE_URL: process.env.SITE_URL };
delete process.env.PUBLIC_SITE_URL;
delete process.env.SITE_URL;
process.env.NODE_ENV = 'production';
assert.equal(siteOrigin(fakeReq('evil.example')), 'https://clearpathtrader.com', 'production links never follow the Host header');
process.env.NODE_ENV = savedEnv.NODE_ENV;
if (savedEnv.PUBLIC_SITE_URL !== undefined) process.env.PUBLIC_SITE_URL = savedEnv.PUBLIC_SITE_URL;
if (savedEnv.SITE_URL !== undefined) process.env.SITE_URL = savedEnv.SITE_URL;
assert.equal(isOwnHost('www.clearpathtrader.com'), true);
assert.equal(isOwnHost('clearpathtrader.com.evil.example'), false);
assert.equal(isOwnHost('evilclearpathtrader.com'), false);

const serverCode = read('server.ts');
assert.doesNotMatch(serverCode, /\$\{req\.protocol\}:\/\/\$\{req\.get\('host'\)\}/, 'build links with siteOrigin(req), not the Host header');

const { isValidReportId, resolveDailyPatternReviewReport } = await import('../src/server/dailyPatternReviewStore.ts');
assert.equal(isValidReportId('2026-10-29_premarket'), true);
for (const bad of ['../secrets', '..\\x', 'a/b', '', 'x'.repeat(65)]) assert.equal(isValidReportId(bad), false, bad);
assert.equal(await resolveDailyPatternReviewReport('../../package'), null);

const { grantFreshSession } = await import('../src/server/authSessionGeneration.ts');
const planted = { id: 'attacker-known', regenerate(cb: (err?: unknown) => void) { fakeLogin.session = { id: 'fresh' } as any; cb(); } };
const fakeLogin: { session: any } = { session: planted };
await grantFreshSession(fakeLogin, { uid: 'u1' }, { boardAccess: true });
assert.equal(fakeLogin.session.id, 'fresh', 'login must regenerate the session id');
assert.deepEqual(fakeLogin.session.privateUser, { uid: 'u1' });
assert.equal(fakeLogin.session.boardAccess, true);
assert.equal((planted as any).privateUser, undefined, 'the pre-login session never becomes authenticated');
assert.doesNotMatch(serverCode, /applyGrantedSession\(req\.session as any/, 'sign-in routes must use grantFreshSession');

const limiterAt = serverCode.indexOf('app.use([...MARKET_DATA_ROUTES], marketDataLimiter)');
assert.ok(limiterAt > 0, 'paid market-data routes need marketDataLimiter');
const { MARKET_DATA_ROUTES } = await import('../src/server/routeRateLimit.ts');
for (const route of MARKET_DATA_ROUTES) {
  const escaped = route.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  const re = new RegExp(`app\\.(get|post)\\('${escaped}(['/])`, 'g');
  for (const m of serverCode.matchAll(re)) {
    assert.ok((m.index ?? 0) > limiterAt, `${route} is registered before marketDataLimiter`);
  }
}

const { esc } = await import('../src/server/registrationEmail.ts');
assert.equal(esc(`<a href="https://evil.example">Rick's</a> & co`), '&lt;a href=&quot;https://evil.example&quot;&gt;Rick&#39;s&lt;/a&gt; &amp; co');
const mailSrc = read('src/server/registrationEmail.ts').replace(/\r\n/g, '\n');
const htmlBlocks = [...mailSrc.matchAll(/const html = `([\s\S]*?)`;|html: `([^`]*)`/g)].map((m) => m[1] ?? m[2]);
assert.ok(htmlBlocks.length >= 6, 'email html templates found');
for (const block of htmlBlocks) {
  for (const m of block.matchAll(/\$\{([^}]+)\}/g)) {
    assert.match(m[1].trim(), /^esc\(/, `email HTML must escape \${${m[1]}}`);
  }
}

const serverSrc = read('server.ts').replace(/\r\n/g, '\n');
for (const route of ["'/api/auth/private/reset-password'", "'/api/auth/private/change-password'", "'/api/admin/members/reset-password'"]) {
  const start = serverSrc.indexOf(`app.post(${route}`);
  assert.ok(start >= 0, `${route} route found`);
  const body = serverSrc.slice(start, serverSrc.indexOf('\n  });\n', start));
  assert.match(body, /purgeSessionsForEmail\(/, `${route} must sign the member out of every other session`);
}

assert.doesNotMatch(serverSrc, /\/api\/auth\/private\/lookup/, 'no public "does this email have an account?" endpoint');
const apiNotFound = serverSrc.indexOf("app.use('/api', (_req, res) => {");
assert.ok(apiNotFound > 0 && apiNotFound < serverSrc.indexOf('// 4. Vite / Static Serving'), 'unknown /api paths must 404 before the SPA shell');

const wsSrc = read('websockets.ts');
assert.doesNotMatch(wsSrc, /parsed\.(author|handle)/, 'chat author / post handle must come from the server identity, not the client message');
assert.doesNotMatch(serverSrc, /author:\s*author\s*\|\|/, 'catalog author must come from the session, not the request body');

const { purgeSessionsForEmail, createSessionStore } = await import('../src/server/firestoreSessionStore.ts');
const store = createSessionStore();
const put = (sid: string, email: string) =>
  new Promise<void>((resolve) => store.set(sid, { cookie: { maxAge: 60_000 }, privateUser: { uid: sid, email } } as any, () => resolve()));
const has = (sid: string) => new Promise<boolean>((resolve) => store.get(sid, (_e, s) => resolve(Boolean(s))));
await put('a1', 'Member@Example.com');
await put('a2', 'member@example.com');
await put('b1', 'other@example.com');
assert.equal(await purgeSessionsForEmail('member@example.com'), 2);
assert.equal(await has('a1'), false);
assert.equal(await has('a2'), false);
assert.equal(await has('b1'), true, 'other members stay signed in');

const { FOUNDER_SESSION_MAX_AGE_MS } = await import('../src/server/authSessionGeneration.ts');
const { FOUNDER_EMAILS } = await import('../src/lib/founder.ts');
const founderReq: any = { session: { cookie: { maxAge: 7 * 86400_000 } } };
await grantFreshSession(founderReq, { uid: 'f', email: FOUNDER_EMAILS[0] });
assert.equal(founderReq.session.cookie.maxAge, FOUNDER_SESSION_MAX_AGE_MS);
const memberReq: any = { session: { cookie: { maxAge: 7 * 86400_000 } } };
await grantFreshSession(memberReq, { uid: 'm', email: 'member@example.com' });
assert.equal(memberReq.session.cookie.maxAge, 7 * 86400_000);

console.log('auth-hardening.selftest: ok');
