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

console.log('auth-hardening.selftest: ok');
