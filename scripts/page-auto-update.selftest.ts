/**
 * usePageAutoUpdate must not re-subscribe when the Effect Event identity changes.
 * Run: npx tsx scripts/page-auto-update.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const src = fs.readFileSync(
  path.join(process.cwd(), 'src/hooks/usePageAutoUpdate.ts'),
  'utf8',
);

assert.match(src, /intentionally omitted from deps/);
assert.doesNotMatch(
  src,
  /}, \[intervalMs, immediate, enabled, visible, runUpdate\]\)/,
  'runUpdate must not be an effect dependency (causes fetch storms)',
);
assert.match(src, /noteRateLimited/);

console.log('page-auto-update.selftest: ok');
