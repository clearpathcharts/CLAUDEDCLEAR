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

console.log('auth-hardening.selftest: ok');
