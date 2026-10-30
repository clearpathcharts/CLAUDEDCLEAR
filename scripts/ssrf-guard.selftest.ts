/**
 * SSRF guard: private ranges (incl. IPv6 encodings), URL rules, connect-time DNS check,
 * and that every caller-supplied fetch goes through safePublicFetch.
 * Run: npx tsx scripts/ssrf-guard.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertSafePublicUrl,
  guardedLookupForTests,
  isPrivateIp,
  parsePublicUrl,
  safePublicFetch,
} from '../src/server/safePublicFetch.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const ip of [
  '127.0.0.1', '10.1.2.3', '172.20.0.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '224.0.0.1',
  '::1', '::', 'fe80::1', 'fd00::1', '::ffff:169.254.169.254', '::ffff:a9fe:a9fe', '::ffff:7f00:1',
  '64:ff9b::a9fe:a9fe', '2002:a9fe:a9fe::1', 'not-an-ip',
]) {
  assert.equal(isPrivateIp(ip), true, `${ip} must be blocked`);
}
for (const ip of ['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111', '::ffff:8.8.8.8']) {
  assert.equal(isPrivateIp(ip), false, `${ip} is public`);
}

for (const bad of [
  'file:///etc/passwd', 'gopher://x', 'http://user:pw@example.com/', 'http://example.com:22/',
  'http://localhost/', 'http://metadata.google.internal/', 'http://[::1]/', 'http://169.254.169.254/', 'nope',
]) {
  assert.throws(() => parsePublicUrl(bad), undefined, bad);
}
assert.equal(parsePublicUrl('https://example.com/feed.xml').hostname, 'example.com');
await assert.rejects(assertSafePublicUrl('http://127.0.0.1:8080/'));

await new Promise<void>((resolve) => {
  guardedLookupForTests('localhost', {}, (err: unknown) => {
    assert.ok(err, 'connect-time lookup must reject names that resolve to private addresses');
    resolve();
  });
});

const local = http.createServer((_req, res) => res.end('internal secret'));
await new Promise<void>((r) => local.listen(0, '127.0.0.1', () => r()));
const port = (local.address() as { port: number }).port;
await assert.rejects(safePublicFetch(`http://127.0.0.1:${port}/`), 'loopback literal is refused');
await assert.rejects(safePublicFetch(`http://localhost:8080/`), 'localhost is refused');
local.close();

const server = fs.readFileSync(path.join(root, 'server.ts'), 'utf8');
assert.doesNotMatch(server, /function isPrivateIp|async function assertSafePublicUrl/, 'one SSRF guard, in safePublicFetch.ts');
const streamProxy = server.slice(server.indexOf("app.get('/api/stream-proxy'"), server.indexOf("app.get('/api/stream-proxy'") + 3000);
assert.match(streamProxy, /safePublicFetch\(url/);
assert.doesNotMatch(streamProxy, /await fetch\(url/);
for (const rel of ['src/server/safeFeedFetch.ts', 'src/server/literacyService.ts']) {
  const code = fs.readFileSync(path.join(root, rel), 'utf8');
  assert.match(code, /safePublicFetch\(/, `${rel} must use safePublicFetch`);
  assert.doesNotMatch(code, /await fetch\(url/, `${rel} must not fetch caller URLs directly`);
}

console.log('ssrf-guard.selftest: ok');
