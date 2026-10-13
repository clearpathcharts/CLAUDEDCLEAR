/**
 * Public package aliases converge on one canonical /plans URL.
 * Run: npx tsx scripts/plans-routes.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  PLANS_CANONICAL_PATH,
  PLANS_LEGACY_PATHS,
  canonicalPlansPath,
  isPlansPath,
} from '../src/lib/plansRoutes.ts';

assert.equal(PLANS_CANONICAL_PATH, '/plans');
assert.deepEqual([...PLANS_LEGACY_PATHS], ['/pricing', '/membership']);
for (const route of ['/plans', '/pricing', '/membership', '/PRICING']) {
  assert.equal(isPlansPath(route), true, `${route} must resolve to the packages page.`);
}
assert.equal(isPlansPath('/api/membership/me'), false);
assert.equal(canonicalPlansPath('/pricing', '?package=gold'), '/plans?package=gold');
assert.equal(canonicalPlansPath('/membership', '?package=silver'), '/plans?package=silver');

const server = fs.readFileSync(path.resolve('server.ts'), 'utf8');
assert.match(server, /PLANS_LEGACY_PATHS\.includes/);
assert.match(server, /res\.redirect\(308, `\$\{PLANS_CANONICAL_PATH\}\$\{suffix\}`\)/);
assert.match(server, /\{ path: '\/plans', lastmod,/);

console.log('plans-routes.selftest: ok');
