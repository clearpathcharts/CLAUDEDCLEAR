/**
 * Chart pulse: scheduled educational price snapshots via email or SMS.
 * Not a trade signal. SMTP / Twilio must be configured for delivery;
 * Cloud Run disk is ephemeral so subscriptions also live in memory.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { isSmtpConfigured, sendTransactionalEmail } from './registrationEmail';
import { getTwelveDataApiKey } from './secrets';
import { getMarketQuote } from './marketDataGateway';
import { getAdminFirestore } from './firebaseAdmin';
import { tryAcquireSchedulerLock } from './durableLeaderLock';

export const CHART_PULSE_INTERVALS = [5, 10, 15, 30] as const;
export type ChartPulseInterval = (typeof CHART_PULSE_INTERVALS)[number];
export type ChartPulseChannel = 'email' | 'sms';
export type ChartPulseDelivery = 'sent' | 'queued_no_transport' | 'failed';

export type ChartPulseSubscription = {
  id: string;
  ownerKey: string;
  slotId: string;
  symbol: string;
  intervalMinutes: ChartPulseInterval;
  channel: ChartPulseChannel;
  email?: string;
  phone?: string;
  createdAt: string;
  nextFireAt: string;
  lastFiredAt?: string;
  lastError?: string;
  lastDelivery?: ChartPulseDelivery;
};

export type ChartPulsePublicSub = Omit<ChartPulseSubscription, 'ownerKey'> & {
  phoneMasked?: string;
};

const DATA_DIR = path.join(process.cwd(), 'data', 'chart-pulse');
const FILE = path.join(DATA_DIR, 'subscriptions.json');
const FIRESTORE_COLLECTION = 'chart_pulse_subscriptions';
const MAX_SUBS_PER_OWNER = 12;
const SLOT_ID_RE = /^[a-zA-Z0-9._:-]{1,64}$/;
const SYMBOL_RE = /^[A-Z0-9./:_-]{2,24}$/;

let cache: ChartPulseSubscription[] | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let firing = false;

export function isPulseInterval(value: unknown): value is ChartPulseInterval {
  return CHART_PULSE_INTERVALS.includes(Number(value) as ChartPulseInterval);
}

export function isTwilioSmsConfigured(): boolean {
  return Boolean(
    (process.env.TWILIO_ACCOUNT_SID || '').trim() &&
      (process.env.TWILIO_AUTH_TOKEN || '').trim() &&
      twilioFromNumber(),
  );
}

function twilioFromNumber(): string {
  return (process.env.TWILIO_FROM || process.env.TWILIO_PHONE_NUMBER || '').trim();
}

export function getChartPulseDeliveryStatus() {
  return {
    emailConfigured: isSmtpConfigured(),
    smsConfigured: isTwilioSmsConfigured(),
    quoteConfigured: Boolean(getTwelveDataApiKey()),
  };
}

export function normalizePulseEmail(raw: string): string | null {
  const email = String(raw || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) return null;
  return email;
}

/** E.164. Bare 10-digit US numbers become +1XXXXXXXXXX. */
export function normalizePulsePhone(raw: string): string | null {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/[^\d+]/g, '');
  let e164 = digits;
  if (/^\d{10}$/.test(digits)) e164 = `+1${digits}`;
  if (/^\d{11}$/.test(digits) && digits.startsWith('1')) e164 = `+${digits}`;
  if (!/^\+[1-9]\d{7,14}$/.test(e164)) return null;
  return e164;
}

export function maskPhone(phone: string | undefined): string | undefined {
  if (!phone) return undefined;
  if (phone.length <= 4) return '****';
  return `${phone.slice(0, 2)}…${phone.slice(-4)}`;
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadAll(): ChartPulseSubscription[] {
  if (cache) return cache;
  try {
    if (!fs.existsSync(FILE)) {
      cache = [];
      return cache;
    }
    const parsed = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    cache = Array.isArray(parsed) ? parsed : [];
  } catch {
    cache = [];
  }
  return cache;
}

function persist() {
  ensureDir();
  const rows = loadAll();
  fs.writeFileSync(FILE, JSON.stringify(rows, null, 2), 'utf8');
  void persistSubscriptionsToFirestore(rows);
}

async function persistSubscriptionsToFirestore(rows: ChartPulseSubscription[]): Promise<void> {
  const db = getAdminFirestore();
  if (!db) return;
  try {
    const batch = db.batch();
    const snap = await db.collection(FIRESTORE_COLLECTION).limit(500).get();
    snap.docs.forEach((d) => batch.delete(d.ref));
    for (const row of rows.slice(0, 500)) {
      batch.set(db.collection(FIRESTORE_COLLECTION).doc(row.id), row);
    }
    await batch.commit();
  } catch (err) {
    console.warn('[ChartPulse] Firestore persist failed (local file kept)', err);
  }
}

export async function hydrateChartPulseFromFirestore(): Promise<number> {
  const db = getAdminFirestore();
  if (!db) return 0;
  try {
    const snap = await db.collection(FIRESTORE_COLLECTION).limit(500).get();
    if (snap.empty) return 0;
    cache = snap.docs.map((d) => d.data() as ChartPulseSubscription).filter((r) => r?.id);
    persist();
    return cache.length;
  } catch (err) {
    console.warn('[ChartPulse] Firestore hydrate failed', err);
    return 0;
  }
}

function toPublic(sub: ChartPulseSubscription): ChartPulsePublicSub {
  const { ownerKey: _owner, ...rest } = sub;
  return {
    ...rest,
    phone: undefined,
    phoneMasked: maskPhone(sub.phone),
    email: sub.email,
  };
}

export function listSubscriptionsForOwner(ownerKey: string): ChartPulsePublicSub[] {
  return loadAll()
    .filter((row) => row.ownerKey === ownerKey)
    .map(toPublic);
}

export type UpsertPulseInput = {
  ownerKey: string;
  slotId: string;
  symbol: string;
  intervalMinutes: ChartPulseInterval;
  channel: ChartPulseChannel;
  email?: string;
  phone?: string;
  now?: number;
};

export function upsertSubscription(
  input: UpsertPulseInput,
): { ok: true; subscription: ChartPulsePublicSub } | { ok: false; error: string } {
  const slotId = String(input.slotId || '')
    .trim()
    .replace(/[^a-zA-Z0-9._:-]/g, '-')
    .slice(0, 64);
  if (!SLOT_ID_RE.test(slotId)) return { ok: false, error: 'Invalid chart slot.' };

  const symbol = String(input.symbol || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
  if (!SYMBOL_RE.test(symbol)) return { ok: false, error: 'Load a chart symbol first.' };

  if (!isPulseInterval(input.intervalMinutes)) {
    return { ok: false, error: 'Interval must be 5, 10, 15, or 30 minutes.' };
  }
  if (input.channel !== 'email' && input.channel !== 'sms') {
    return { ok: false, error: 'Choose email or text.' };
  }

  const email = input.channel === 'email' ? normalizePulseEmail(input.email || '') : undefined;
  const phone = input.channel === 'sms' ? normalizePulsePhone(input.phone || '') : undefined;
  if (input.channel === 'email' && !email) return { ok: false, error: 'A valid email is required.' };
  if (input.channel === 'sms' && !phone) {
    return { ok: false, error: 'A phone number with country code is required (e.g. +15551234567).' };
  }

  const rows = loadAll();
  const ownerRows = rows.filter((r) => r.ownerKey === input.ownerKey);
  const existing = ownerRows.find(
    (r) =>
      r.slotId === slotId &&
      r.intervalMinutes === input.intervalMinutes &&
      r.channel === input.channel,
  );

  const now = input.now ?? Date.now();
  if (!existing && ownerRows.length >= MAX_SUBS_PER_OWNER) {
    return { ok: false, error: 'Too many pulses on this desk — turn one off first.' };
  }

  if (existing) {
    existing.symbol = symbol;
    existing.email = email;
    existing.phone = phone;
    persist();
    return { ok: true, subscription: toPublic(existing) };
  }

  const sub: ChartPulseSubscription = {
    id: crypto.randomBytes(8).toString('hex'),
    ownerKey: input.ownerKey,
    slotId,
    symbol,
    intervalMinutes: input.intervalMinutes,
    channel: input.channel,
    email,
    phone,
    createdAt: new Date(now).toISOString(),
    nextFireAt: new Date(now + input.intervalMinutes * 60_000).toISOString(),
  };
  rows.push(sub);
  persist();
  return { ok: true, subscription: toPublic(sub) };
}

export function removeSubscription(input: {
  ownerKey: string;
  slotId: string;
  intervalMinutes: ChartPulseInterval;
  channel?: ChartPulseChannel;
}): { removed: number } {
  const rows = loadAll();
  const before = rows.length;
  cache = rows.filter((r) => {
    if (r.ownerKey !== input.ownerKey) return true;
    if (r.slotId !== input.slotId) return true;
    if (r.intervalMinutes !== input.intervalMinutes) return true;
    if (input.channel && r.channel !== input.channel) return true;
    return false;
  });
  persist();
  return { removed: before - cache.length };
}

export type PulseFireDeps = {
  fetchQuote?: (symbol: string) => Promise<{ price?: number | string; close?: number | string } | null>;
  sendEmail?: (payload: { to: string; subject: string; html: string; text: string }) => Promise<boolean>;
  sendSms?: (to: string, body: string) => Promise<boolean>;
};

function formatQuoteLine(symbol: string, quote: { price?: number | string; close?: number | string } | null): string {
  const raw = quote?.price ?? quote?.close;
  const num = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(num) || num <= 0) {
    return `${symbol} — live quote unavailable on this pulse`;
  }
  return `${symbol} last ${num}`;
}

export async function sendChartPulseSms(to: string, body: string): Promise<boolean> {
  const sid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
  const token = (process.env.TWILIO_AUTH_TOKEN || '').trim();
  const from = twilioFromNumber();
  if (!sid || !token || !from) return false;
  try {
    const auth = Buffer.from(`${sid}:${token}`).toString('base64');
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ From: from, To: to, Body: body }).toString(),
    });
    if (!res.ok) {
      console.warn('[ChartPulse] Twilio SMS failed', res.status);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[ChartPulse] Twilio SMS error', err);
    return false;
  }
}

async function defaultFetchQuote(symbol: string) {
  const key = getTwelveDataApiKey();
  if (!key) return null;
  try {
    const data = await getMarketQuote(symbol, key);
    if (!data || data.status === 'error') return null;
    return data as { price?: number | string; close?: number | string };
  } catch {
    return null;
  }
}

export async function fireDueSubscriptions(
  now = Date.now(),
  deps: PulseFireDeps = {},
): Promise<{ fired: number }> {
  const rows = loadAll();
  const fetchQuote = deps.fetchQuote || defaultFetchQuote;
  const sendEmail = deps.sendEmail || sendTransactionalEmail;
  const sendSms = deps.sendSms || sendChartPulseSms;
  let fired = 0;

  for (const sub of rows) {
    const due = Date.parse(sub.nextFireAt);
    if (!Number.isFinite(due) || due > now) continue;

    const quote = await fetchQuote(sub.symbol);
    const line = formatQuoteLine(sub.symbol, quote);
    const text = [
      `ClearPath chart pulse · every ${sub.intervalMinutes}m`,
      line,
      '',
      'Educational price snapshot you scheduled on your chart. Not a trade recommendation.',
    ].join('\n');
    const html = `
      <div style="font-family:Arial,sans-serif;background:#050505;color:#fff;padding:24px">
        <p style="color:#D4AF37;letter-spacing:2px;text-transform:uppercase;font-size:12px">Chart pulse · ${sub.intervalMinutes}m</p>
        <h1 style="color:#00FFFF;font-size:20px">${line}</h1>
        <p style="color:#aaa;font-size:13px">Educational price snapshot you scheduled on your chart. Not a trade recommendation.</p>
        <p style="color:#666;font-size:12px">— ClearPath Trader</p>
      </div>
    `;

    let delivery: ChartPulseDelivery = 'failed';
    let lastError: string | undefined;

    if (sub.channel === 'email') {
      if (!isSmtpConfigured() && !deps.sendEmail) {
        delivery = 'queued_no_transport';
        lastError = 'SMTP is not configured on this host.';
      } else if (sub.email) {
        const ok = await sendEmail({
          to: sub.email,
          subject: `ClearPath chart pulse · ${sub.symbol} · ${sub.intervalMinutes}m`,
          text,
          html,
        });
        delivery = ok ? 'sent' : 'failed';
        if (!ok) lastError = 'Email send failed.';
      }
    } else {
      if (!isTwilioSmsConfigured() && !deps.sendSms) {
        delivery = 'queued_no_transport';
        lastError = 'Twilio SMS is not configured (need TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM).';
      } else if (sub.phone) {
        const ok = await sendSms(sub.phone, text);
        delivery = ok ? 'sent' : 'failed';
        if (!ok) lastError = 'SMS send failed.';
      }
    }

    sub.lastFiredAt = new Date(now).toISOString();
    sub.lastDelivery = delivery;
    sub.lastError = lastError;
    // Catch up if the process was asleep — never skip more than one interval behind.
    const step = sub.intervalMinutes * 60_000;
    let next = due + step;
    while (next <= now) next += step;
    sub.nextFireAt = new Date(next).toISOString();
    fired += 1;
  }

  if (fired) persist();
  return { fired };
}

export function startChartPulseScheduler() {
  if (timer) return;
  console.log('[ChartPulse] Scheduler armed — 5/10/15/30m educational snapshots');
  timer = setInterval(() => {
    if (firing) return;
    firing = true;
    void (async () => {
      try {
        if (!(await tryAcquireSchedulerLock('chart_pulse_scheduler', 45_000))) return;
        await fireDueSubscriptions();
      } catch (err) {
        console.warn('[ChartPulse] tick failed', err);
      } finally {
        firing = false;
      }
    })();
  }, 30_000);
}

export function stopChartPulseScheduler() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

/** Test helper — drop in-memory cache so a temp cwd reload works. */
export function resetChartPulseCacheForTests() {
  cache = null;
}
