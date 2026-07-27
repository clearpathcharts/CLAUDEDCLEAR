/**
 * ClearPath Social OS self-test — no network, no Buffer token required.
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
} from '../src/server/socialOs/cadence';
import { createPost, deletePost, listPosts, getPost } from '../src/server/socialOs/store';
import { getSocialOsConfig, publishPost } from '../src/server/socialOs/publisher';

const DATA_DIR = path.join(process.cwd(), 'data', 'social-os');

async function main() {
  // Isolate test data
  process.env.SOCIAL_OS_DRY_RUN = '1';
  process.env.SOCIAL_OS_TIMEZONE = 'America/New_York';
  process.env.SOCIAL_OS_POST_SLOTS = '05:00,09:00,15:00,18:00';

  assert.deepEqual(getPostSlots(), [...DEFAULT_POST_SLOTS]);
  assert.equal(getSocialTimezone(), 'America/New_York');

  const tpl = buildTemplate('clarity_cta', 'x');
  assert.ok(tpl.body.includes('ClearPath'));
  assert.ok(tpl.linkUrl.includes('clearpathtrader.com'));

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

  const cfg = getSocialOsConfig();
  assert.equal(cfg.siteUrl, 'https://clearpathtrader.com');
  assert.equal(cfg.dryRun, true);

  deletePost(post.id);
  assert.equal(getPost(post.id), null);

  // Keep cadence file from polluting too much — leave it; gitignored under data/social-os
  assert.ok(fs.existsSync(DATA_DIR));
  assert.ok(readCadenceState().firedSlots.includes(key));

  console.log('social-os.selftest: OK');
  console.log(`  slots=${getPostSlots().join(',')}`);
  console.log(`  timezone=${getSocialTimezone()}`);
  console.log(`  postsRemaining=${listPosts().length}`);
}

main().catch((err) => {
  console.error('social-os.selftest FAILED', err);
  process.exit(1);
});
