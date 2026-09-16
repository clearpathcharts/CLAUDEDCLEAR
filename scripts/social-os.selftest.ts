/**
 * ClearPath Social OS self-test — no network, no platform tokens required.
 * Run: npx tsx scripts/social-os.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildTemplate } from '../src/server/socialOs/templates';
import {
  DEFAULT_POST_SLOTS,
  detectDueSlot,
  getPostSlots,
  getSocialTimezone,
  slotKey,
  zonedParts,
  markSlotFired,
  readCadenceState,
  getCadencePlatforms,
} from '../src/server/socialOs/cadence';
import { createPost, deletePost, listPosts, getPost } from '../src/server/socialOs/store';
import { getSocialOsConfig, publishPost, listPlatformReadiness } from '../src/server/socialOs/publisher';
import { ALL_PLATFORMS } from '../src/server/socialOs/platforms';

const DATA_DIR = path.join(process.cwd(), 'data', 'social-os');
const CADENCE_FILE = path.join(DATA_DIR, 'cadence.json');

async function main() {
  // Isolate test data
  process.env.SOCIAL_OS_DRY_RUN = '1';
  process.env.SOCIAL_OS_TIMEZONE = 'America/New_York';
  process.env.SOCIAL_OS_POST_SLOTS = '05:00,09:00,15:00,18:00';
  delete process.env.BUFFER_ACCESS_TOKEN;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(CADENCE_FILE)) fs.unlinkSync(CADENCE_FILE);

  assert.deepEqual(getPostSlots(), [...DEFAULT_POST_SLOTS]);
  assert.equal(getSocialTimezone(), 'America/New_York');
  assert.ok(ALL_PLATFORMS.includes('facebook'));
  assert.ok(ALL_PLATFORMS.includes('xing'));
  assert.ok(ALL_PLATFORMS.includes('researchgate'));
  assert.ok(ALL_PLATFORMS.length >= 29, `expected full catalog, got ${ALL_PLATFORMS.length}`);

  const readiness = listPlatformReadiness();
  assert.equal(readiness.length, ALL_PLATFORMS.length);
  assert.ok(readiness.every((r) => typeof r.credentialHint === 'string'));

  const tpl = buildTemplate('clarity_cta', 'x');
  assert.ok(tpl.body.includes('ClearPath'));
  assert.ok(tpl.linkUrl.includes('clearpathtrader.com'));

  const networkingTpl = buildTemplate('clarity_cta', 'wellfound');
  assert.ok(networkingTpl.body.length > 20);

  const parts = zonedParts(new Date('2026-07-27T13:00:00.000Z'), 'America/New_York');
  assert.equal(parts.dateKey.length, 10);
  assert.match(parts.timeKey, /^\d{2}:\d{2}$/);

  // Simulate 9:05 AM Eastern on a fixed instant: 2026-07-27 13:05 UTC = 9:05 AM EDT
  const nineAmWindow = new Date('2026-07-27T13:05:00.000Z');
  const due = detectDueSlot(nineAmWindow, 10);
  assert.ok(due, 'expected 09:00 slot to be due at 9:05 AM ET');
  assert.equal(due!.slot, '09:00');

  const key = slotKey(due!.dateKey, due!.slot);
  markSlotFired(key, 'selftest');
  const again = detectDueSlot(nineAmWindow, 10);
  assert.equal(again, null, 'same slot must not fire twice');

  const post = createPost({
    platform: 'x',
    body: 'ClearPath Social OS self-test post',
    linkUrl: 'https://clearpathtrader.com',
    status: 'draft',
    publishMode: 'dry_run',
    source: 'api',
  });
  assert.ok(post.id.startsWith('sos_'));
  assert.equal(getPost(post.id)?.body, post.body);

  const published = await publishPost(post);
  assert.equal(published.dryRun, true);
  assert.equal(published.mode, 'dry_run');

  // Package path when not dry-run and no credentials
  delete process.env.SOCIAL_OS_DRY_RUN;
  const packPost = createPost({
    platform: 'alignable',
    body: 'Package fallback self-test',
    status: 'draft',
    publishMode: 'direct',
    source: 'api',
  });
  const packed = await publishPost(packPost);
  assert.equal(packed.mode, 'package');
  assert.ok(packed.packagePath);
  assert.ok(fs.existsSync(packed.packagePath!));
  deletePost(packPost.id);

  process.env.SOCIAL_OS_DRY_RUN = '1';

  const cfg = getSocialOsConfig();
  assert.equal(cfg.siteUrl, 'https://clearpathtrader.com');
  assert.equal(cfg.dryRun, true);
  assert.equal(cfg.middlemen, 'none');
  assert.ok(cfg.platformsTotal >= 29);

  assert.ok(getCadencePlatforms().length >= 1);

  deletePost(post.id);
  assert.equal(getPost(post.id), null);

  assert.ok(fs.existsSync(DATA_DIR));
  assert.ok(readCadenceState().firedSlots.includes(key));

  console.log('social-os.selftest: OK');
  console.log(`  slots=${getPostSlots().join(',')}`);
  console.log(`  timezone=${getSocialTimezone()}`);
  console.log(`  catalog=${ALL_PLATFORMS.length}`);
  console.log(`  postsRemaining=${listPosts().length}`);
  console.log('  middlemen=none');
}

main().catch((err) => {
  console.error('social-os.selftest FAILED', err);
  process.exit(1);
});
