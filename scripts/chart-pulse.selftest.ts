/**
 * Chart pulse: local-time intervals, email/SMS validation, fire path.
 * Run: npm run test:chart-pulse
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

process.env.CLEARPATH_DISABLE_FIRESTORE_ADMIN = '1';
delete process.env.FIREBASE_SERVICE_ACCOUNT;
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
delete process.env.SMTP_HOST;
delete process.env.SMTP_USER;
delete process.env.SMTP_PASS;
delete process.env.TWILIO_ACCOUNT_SID;
delete process.env.TWILIO_AUTH_TOKEN;
delete process.env.TWILIO_FROM;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cp-pulse-'));
process.chdir(tmp);

async function main() {
  const pulse = await import('../src/server/chartPulseService.ts');

  assert.equal(pulse.isPulseInterval(5), true);
  assert.equal(pulse.isPulseInterval(7), false);
  assert.equal(pulse.normalizePulseEmail('Rick@ClearPathTrader.com'), 'rick@clearpathtrader.com');
  assert.equal(pulse.normalizePulseEmail('nope'), null);
  assert.equal(pulse.normalizePulsePhone('5551234567'), '+15551234567');
  assert.equal(pulse.normalizePulsePhone('+44 7700 900123'), '+447700900123');
  assert.equal(pulse.normalizePulsePhone('12'), null);

  const status = pulse.getChartPulseDeliveryStatus();
  assert.equal(status.emailConfigured, false);
  assert.equal(status.smsConfigured, false);

  const bad = pulse.upsertSubscription({
    ownerKey: 'uid:test',
    slotId: 'market-0',
    symbol: '',
    intervalMinutes: 5,
    channel: 'email',
    email: 'rick@example.com',
  });
  assert.equal(bad.ok, false);

  const armed = pulse.upsertSubscription({
    ownerKey: 'uid:test',
    slotId: 'market-0',
    symbol: 'XAUUSD',
    intervalMinutes: 5,
    channel: 'email',
    email: 'rick@example.com',
    now: Date.now() - 10 * 60_000,
  });
  assert.equal(armed.ok, true);
  if (!armed.ok) throw new Error('expected subscribe');
  assert.equal(armed.subscription.symbol, 'XAUUSD');
  assert.equal(armed.subscription.intervalMinutes, 5);

  const listed = pulse.listSubscriptionsForOwner('uid:test');
  assert.equal(listed.length, 1);
  assert.equal(listed[0].email, 'rick@example.com');

  const otherOwner = pulse.listSubscriptionsForOwner('uid:other');
  assert.equal(otherOwner.length, 0);

  const sends: string[] = [];
  const fired = await pulse.fireDueSubscriptions(Date.now(), {
    fetchQuote: async () => ({ price: 4647.65 }),
    sendEmail: async (payload) => {
      sends.push(payload.to);
      assert.match(payload.subject, /XAUUSD/);
      assert.match(payload.text, /4647\.65/);
      assert.match(payload.text, /Not a trade recommendation/);
      return true;
    },
  });
  assert.equal(fired.fired, 1);
  assert.deepEqual(sends, ['rick@example.com']);

  const after = pulse.listSubscriptionsForOwner('uid:test');
  assert.equal(after[0].lastDelivery, 'sent');

  const sms = pulse.upsertSubscription({
    ownerKey: 'uid:test',
    slotId: 'market-1',
    symbol: 'EURUSD',
    intervalMinutes: 15,
    channel: 'sms',
    phone: '4155550100',
    now: Date.now() - 20 * 60_000,
  });
  assert.equal(sms.ok, true);

  const smsSends: string[] = [];
  const firedSms = await pulse.fireDueSubscriptions(Date.now(), {
    fetchQuote: async () => ({ close: '1.0850' }),
    sendSms: async (to, body) => {
      smsSends.push(to);
      assert.match(body, /EURUSD/);
      return true;
    },
  });
  assert.ok(firedSms.fired >= 1);
  assert.deepEqual(smsSends, ['+14155550100']);

  const off = pulse.removeSubscription({
    ownerKey: 'uid:test',
    slotId: 'market-0',
    intervalMinutes: 5,
    channel: 'email',
  });
  assert.equal(off.removed, 1);
  assert.equal(pulse.listSubscriptionsForOwner('uid:test').length, 1);

  const noTransport = pulse.upsertSubscription({
    ownerKey: 'uid:test',
    slotId: 'market-2',
    symbol: 'USDJPY',
    intervalMinutes: 10,
    channel: 'email',
    email: 'ops@example.com',
    now: Date.now() - 15 * 60_000,
  });
  assert.equal(noTransport.ok, true);
  const queued = await pulse.fireDueSubscriptions(Date.now(), {
    fetchQuote: async () => null,
  });
  assert.ok(queued.fired >= 1);
  const queuedRow = pulse.listSubscriptionsForOwner('uid:test').find((r) => r.slotId === 'market-2');
  assert.equal(queuedRow?.lastDelivery, 'queued_no_transport');

  console.log('chart-pulse.selftest: ok');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
