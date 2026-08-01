/**
 * ClearPath Trader — Bot Quarantine / Community Comms Lock
 * ----------------------------------------------------------------------------
 * When a member tries to inject or load bot/automation payloads into groups
 * or communities:
 *   1. Identify the user account (uid / private session / guest handle)
 *   2. Quarantine the offending code (stored for CEO review)
 *   3. Lock community/group communication for 90 days
 *
 * Locked members keep every other product feature (charts, education, tools).
 * They just cannot post or chat in groups/communities until the lock expires
 * or a founder lifts it from the CEO Dashboard.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const COMMUNITY_LOCK_DAYS = 90;
export const QUARANTINE_CODE_MAX_CHARS = 8_000;

export type BotQuarantineStatus = 'active' | 'expired' | 'lifted';
export type BotQuarantineSource = 'auto' | 'manual';

export type BotQuarantineRecord = {
  id: string;
  uid: string;
  email?: string;
  displayName?: string;
  handle?: string;
  ipAddress?: string;
  reason: string;
  quarantinedCode: string;
  detectionSignals: string[];
  source: BotQuarantineSource;
  channel?: string;
  createdAt: string;
  expiresAt: string;
  liftedAt?: string;
  liftedBy?: string;
  status: BotQuarantineStatus;
  /** Always true — product features remain available. */
  featuresAllowed: true;
  /** Community / group chat posts are blocked while active. */
  communityCommsLocked: boolean;
};

export type BotDetectionResult = {
  isBotPayload: boolean;
  signals: string[];
  score: number;
};

export type ScreenCommunityMessageInput = {
  uid?: string;
  email?: string;
  displayName?: string;
  handle?: string;
  ipAddress?: string;
  text: string;
  channel?: string;
};

export type ScreenCommunityMessageResult =
  | { allowed: true; uid: string }
  | {
      allowed: false;
      reason: 'community_locked' | 'bot_quarantined';
      uid: string;
      record: BotQuarantineRecord;
      message: string;
    };

const DATA_DIR = path.join(process.cwd(), 'data', 'bot_quarantine');
const STORE_FILE = path.join(DATA_DIR, 'quarantines.json');

let cache: BotQuarantineRecord[] | null = null;

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readStore(): BotQuarantineRecord[] {
  if (cache) return cache;
  ensureDir();
  if (!fs.existsSync(STORE_FILE)) {
    cache = [];
    return cache;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
    cache = Array.isArray(parsed) ? parsed : [];
  } catch {
    cache = [];
  }
  return cache;
}

function writeStore(records: BotQuarantineRecord[]) {
  ensureDir();
  cache = records;
  fs.writeFileSync(STORE_FILE, JSON.stringify(records, null, 2));
}

function nowIso() {
  return new Date().toISOString();
}

function plusDaysIso(days: number, from = Date.now()): string {
  return new Date(from + days * 24 * 60 * 60 * 1000).toISOString();
}

function newId(): string {
  return `bq_${crypto.randomBytes(8).toString('hex')}`;
}

function sanitizeCode(code: string): string {
  return String(code || '').slice(0, QUARANTINE_CODE_MAX_CHARS);
}

function refreshStatus(record: BotQuarantineRecord): BotQuarantineRecord {
  if (record.status === 'lifted') return record;
  if (Date.parse(record.expiresAt) <= Date.now()) {
    if (record.status !== 'expired') {
      record.status = 'expired';
      record.communityCommsLocked = false;
    }
  }
  return record;
}

export function resolveActorUid(input: {
  uid?: string;
  handle?: string;
  ipAddress?: string;
}): string {
  const uid = String(input.uid || '').trim();
  if (uid) return uid;
  const handle = String(input.handle || '').trim().toLowerCase();
  if (handle && handle !== 'guest') return `guest:${handle}`;
  const ip = String(input.ipAddress || '').trim();
  if (ip) return `ip:${ip}`;
  return 'guest:unknown';
}

/**
 * Heuristic scan for bot/automation injection attempts in community text.
 * Tuned to catch script injection and automation tooling — not normal trading chat.
 */
export function detectBotPayload(text: string): BotDetectionResult {
  const raw = String(text || '');
  const lower = raw.toLowerCase();
  const signals: string[] = [];
  let score = 0;

  const patterns: Array<{ re: RegExp; signal: string; points: number }> = [
    { re: /<\s*script\b/i, signal: 'script_tag', points: 80 },
    { re: /javascript\s*:/i, signal: 'javascript_uri', points: 70 },
    { re: /\bon\w+\s*=\s*["']/i, signal: 'inline_event_handler', points: 50 },
    { re: /\beval\s*\(/i, signal: 'eval_call', points: 70 },
    { re: /\bnew\s+Function\s*\(/i, signal: 'function_constructor', points: 70 },
    { re: /\bdocument\.(write|cookie)\b/i, signal: 'dom_write', points: 55 },
    { re: /\b(puppeteer|playwright|selenium|webdriver|chromedriver)\b/i, signal: 'browser_automation', points: 75 },
    { re: /\b(discord(?:app)?\.com\/api\/webhooks|hooks\.slack\.com\/services)\b/i, signal: 'webhook_injection', points: 80 },
    { re: /\b(child_process|execSync|spawnSync)\b/i, signal: 'process_exec', points: 85 },
    { re: /\b(require|import)\s*\(\s*['"]https?:/i, signal: 'remote_code_import', points: 80 },
    { re: /\b(mass\s*dm|auto[\s_-]?spam|spam\s*bot|bot\s*farm|load\s*bot|inject\s*bot)\b/i, signal: 'bot_intent_phrase', points: 65 },
    { re: /\b(telegram|tg)\s*(bot\s*)?api\b.*\b(token|bot)\b/i, signal: 'telegram_bot_api', points: 60 },
    { re: /data:text\/html/i, signal: 'data_html_uri', points: 70 },
    { re: /\batob\s*\(|\bBuffer\.from\s*\([^)]*base64/i, signal: 'encoded_payload', points: 45 },
  ];

  for (const p of patterns) {
    if (p.re.test(raw)) {
      signals.push(p.signal);
      score += p.points;
    }
  }

  // Dense hex / base64 blobs that look like smuggled scripts
  const compact = lower.replace(/\s+/g, '');
  if (compact.length >= 180) {
    const base64ish = compact.match(/[a-z0-9+/=]{160,}/i);
    if (base64ish && /[a-z]/i.test(base64ish[0]) && /\d/.test(base64ish[0])) {
      signals.push('opaque_blob');
      score += 40;
    }
  }

  // Link flooding typical of promo bots
  const linkCount = (raw.match(/https?:\/\//gi) || []).length;
  if (linkCount >= 4) {
    signals.push('link_flood');
    score += 35;
  }

  return {
    isBotPayload: score >= 60,
    signals,
    score,
  };
}

export function getQuarantineByUid(uid: string): BotQuarantineRecord | null {
  const key = String(uid || '').trim();
  if (!key) return null;
  const records = readStore().map(refreshStatus);
  const active = records
    .filter((r) => r.uid === key && r.status === 'active' && Date.parse(r.expiresAt) > Date.now())
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  // Persist any expired transitions
  writeStore(records);
  return active[0] || null;
}

export function isCommunityCommsLocked(uid: string): boolean {
  const record = getQuarantineByUid(uid);
  return Boolean(record?.communityCommsLocked && record.status === 'active');
}

export function quarantineBotAttempt(input: {
  uid: string;
  email?: string;
  displayName?: string;
  handle?: string;
  ipAddress?: string;
  reason: string;
  quarantinedCode: string;
  detectionSignals?: string[];
  source?: BotQuarantineSource;
  channel?: string;
  days?: number;
}): BotQuarantineRecord {
  const days = input.days ?? COMMUNITY_LOCK_DAYS;
  const records = readStore().map(refreshStatus);

  // If already active, refresh expiry and append newest code sample
  const existing = records.find(
    (r) => r.uid === input.uid && r.status === 'active' && Date.parse(r.expiresAt) > Date.now()
  );
  if (existing) {
    existing.expiresAt = plusDaysIso(days);
    existing.quarantinedCode = sanitizeCode(input.quarantinedCode || existing.quarantinedCode);
    existing.reason = input.reason || existing.reason;
    existing.detectionSignals = Array.from(
      new Set([...(existing.detectionSignals || []), ...(input.detectionSignals || [])])
    );
    if (input.email) existing.email = input.email;
    if (input.displayName) existing.displayName = input.displayName;
    if (input.handle) existing.handle = input.handle;
    if (input.ipAddress) existing.ipAddress = input.ipAddress;
    if (input.channel) existing.channel = input.channel;
    existing.communityCommsLocked = true;
    existing.featuresAllowed = true;
    writeStore(records);
    return existing;
  }

  const record: BotQuarantineRecord = {
    id: newId(),
    uid: input.uid,
    email: input.email,
    displayName: input.displayName,
    handle: input.handle,
    ipAddress: input.ipAddress,
    reason: input.reason,
    quarantinedCode: sanitizeCode(input.quarantinedCode),
    detectionSignals: input.detectionSignals || [],
    source: input.source || 'auto',
    channel: input.channel,
    createdAt: nowIso(),
    expiresAt: plusDaysIso(days),
    status: 'active',
    featuresAllowed: true,
    communityCommsLocked: true,
  };
  records.unshift(record);
  writeStore(records.slice(0, 2_000));
  return record;
}

export function liftQuarantine(id: string, liftedBy = 'founder'): BotQuarantineRecord | null {
  const records = readStore().map(refreshStatus);
  const record = records.find((r) => r.id === id);
  if (!record) return null;
  record.status = 'lifted';
  record.communityCommsLocked = false;
  record.liftedAt = nowIso();
  record.liftedBy = liftedBy;
  writeStore(records);
  return record;
}

export function listQuarantines(opts?: {
  status?: BotQuarantineStatus | 'all';
  limit?: number;
}): {
  records: BotQuarantineRecord[];
  counts: { active: number; expired: number; lifted: number; total: number };
} {
  const records = readStore().map(refreshStatus);
  writeStore(records);
  const counts = {
    active: records.filter((r) => r.status === 'active' && Date.parse(r.expiresAt) > Date.now()).length,
    expired: records.filter((r) => r.status === 'expired' || (r.status === 'active' && Date.parse(r.expiresAt) <= Date.now())).length,
    lifted: records.filter((r) => r.status === 'lifted').length,
    total: records.length,
  };
  // Re-read after expiry transitions
  const fresh = readStore();
  const status = opts?.status || 'all';
  let filtered =
    status === 'all'
      ? fresh
      : fresh.filter((r) => {
          refreshStatus(r);
          return r.status === status;
        });
  filtered = filtered.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const limit = Math.max(1, Math.min(opts?.limit ?? 100, 500));
  return { records: filtered.slice(0, limit), counts };
}

export function getPublicLockStatus(uid: string): {
  locked: boolean;
  expiresAt?: string;
  daysRemaining?: number;
  reason?: string;
  featuresAllowed: true;
  communityCommsLocked: boolean;
} {
  const record = getQuarantineByUid(uid);
  if (!record) {
    return { locked: false, featuresAllowed: true, communityCommsLocked: false };
  }
  const ms = Date.parse(record.expiresAt) - Date.now();
  const daysRemaining = Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
  return {
    locked: true,
    expiresAt: record.expiresAt,
    daysRemaining,
    reason: record.reason,
    featuresAllowed: true,
    communityCommsLocked: true,
  };
}

/**
 * Gate for community/group posts. If already locked → block.
 * If payload looks like bot injection → quarantine code + lock 90 days.
 */
export function screenCommunityMessage(
  input: ScreenCommunityMessageInput
): ScreenCommunityMessageResult {
  const uid = resolveActorUid(input);
  const existing = getQuarantineByUid(uid);
  if (existing) {
    return {
      allowed: false,
      reason: 'community_locked',
      uid,
      record: existing,
      message:
        `Community communication locked until ${new Date(existing.expiresAt).toLocaleDateString()}. ` +
        'Charts, education, and other features remain available.',
    };
  }

  const detection = detectBotPayload(input.text);
  if (!detection.isBotPayload) {
    return { allowed: true, uid };
  }

  const record = quarantineBotAttempt({
    uid,
    email: input.email,
    displayName: input.displayName,
    handle: input.handle,
    ipAddress: input.ipAddress,
    reason: `Bot/automation payload detected (${detection.signals.join(', ') || 'heuristic'})`,
    quarantinedCode: input.text,
    detectionSignals: detection.signals,
    source: 'auto',
    channel: input.channel,
  });

  return {
    allowed: false,
    reason: 'bot_quarantined',
    uid,
    record,
    message:
      'Bot injection attempt detected. Offending code was quarantined and community/group ' +
      `communication is locked for ${COMMUNITY_LOCK_DAYS} days. Other features remain available.`,
  };
}

/** Test helper — wipe in-memory + disk store. */
export function __resetBotQuarantineStoreForTests() {
  cache = [];
  ensureDir();
  if (fs.existsSync(STORE_FILE)) fs.unlinkSync(STORE_FILE);
}
