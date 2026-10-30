/**
 * Member inbox — founder → member notices (security, site updates, maintenance).
 * Firestore is authoritative in production; data/member-inbox/*.json is the local/dev fallback.
 * Message bodies are plain text and must be rendered as text (never HTML).
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { getAdminFirestore } from './firebaseAdmin';

export type InboxSeverity = 'security' | 'update' | 'info';
export type InboxAudience = 'all' | 'list';

export type InboxMessage = {
  id: string;
  subject: string;
  body: string;
  severity: InboxSeverity;
  audience: InboxAudience;
  /** Normalized emails; only for audience === 'list'. */
  recipients?: string[];
  createdAt: string;
  createdBy: string;
};

export type MemberInboxItem = Omit<InboxMessage, 'recipients' | 'createdBy' | 'audience'> & { read: boolean };

export const INBOX_LIMITS = {
  subject: 140,
  body: 8000,
  recipients: 5000,
  memberListSize: 50,
} as const;

const MESSAGES = 'member_messages';
const READS = 'member_message_reads';
const DIR = path.join(process.cwd(), 'data', 'member-inbox');
const LOCAL_MESSAGES = path.join(DIR, 'messages.json');
const LOCAL_READS = path.join(DIR, 'reads.json');

export class InboxError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export function normalizeInboxEmail(raw: unknown): string {
  return String(raw || '').trim().toLowerCase();
}

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254;
}

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

function writeJson(file: string, value: unknown): void {
  fs.mkdirSync(DIR, { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

/** Parse "a@x.com, b@y.com\nc@z.com" into a deduped list; throws on any invalid entry. */
export function parseRecipientList(raw: unknown): string[] {
  const parts = (Array.isArray(raw) ? raw : String(raw || '').split(/[\s,;]+/))
    .map(normalizeInboxEmail)
    .filter(Boolean);
  const bad = parts.filter((p) => !isEmail(p));
  if (bad.length) throw new InboxError(`Not valid email address${bad.length > 1 ? 'es' : ''}: ${bad.slice(0, 5).join(', ')}`);
  const unique = [...new Set(parts)];
  if (unique.length > INBOX_LIMITS.recipients) {
    throw new InboxError(`Too many recipients (max ${INBOX_LIMITS.recipients}).`);
  }
  return unique;
}

export function validateNewMessage(input: {
  subject?: unknown;
  body?: unknown;
  severity?: unknown;
  audience?: unknown;
  recipients?: unknown;
}): Omit<InboxMessage, 'id' | 'createdAt' | 'createdBy'> {
  const subject = String(input.subject || '').trim();
  const body = String(input.body || '').replace(/\r\n/g, '\n').trim();
  if (!subject) throw new InboxError('Subject is required.');
  if (subject.length > INBOX_LIMITS.subject) throw new InboxError(`Subject is too long (max ${INBOX_LIMITS.subject}).`);
  if (!body) throw new InboxError('Message is required.');
  if (body.length > INBOX_LIMITS.body) throw new InboxError(`Message is too long (max ${INBOX_LIMITS.body}).`);
  const severity: InboxSeverity =
    input.severity === 'security' || input.severity === 'update' ? input.severity : 'info';
  const audience: InboxAudience = input.audience === 'list' ? 'list' : 'all';
  if (audience === 'all') return { subject, body, severity, audience };
  const recipients = parseRecipientList(input.recipients);
  if (!recipients.length) throw new InboxError('Add at least one recipient email.');
  return { subject, body, severity, audience, recipients };
}

function newestFirst(a: InboxMessage, b: InboxMessage): number {
  return b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id);
}

export async function createInboxMessage(
  input: Parameters<typeof validateNewMessage>[0],
  createdBy: string,
): Promise<InboxMessage> {
  const now = Date.now();
  const msg: InboxMessage = {
    ...validateNewMessage(input),
    id: `${now.toString(36)}-${crypto.randomBytes(6).toString('hex')}`,
    createdAt: new Date(now).toISOString(),
    createdBy: createdBy || 'founder',
  };
  const db = getAdminFirestore();
  if (db) {
    await db.collection(MESSAGES).doc(msg.id).set(msg);
  } else {
    const all = readJson<InboxMessage[]>(LOCAL_MESSAGES, []);
    all.push(msg);
    writeJson(LOCAL_MESSAGES, all);
  }
  return msg;
}

export async function deleteInboxMessage(id: string): Promise<boolean> {
  const db = getAdminFirestore();
  if (db) {
    const ref = db.collection(MESSAGES).doc(id);
    if (!(await ref.get()).exists) return false;
    await ref.delete();
    return true;
  }
  const all = readJson<InboxMessage[]>(LOCAL_MESSAGES, []);
  const next = all.filter((m) => m.id !== id);
  if (next.length === all.length) return false;
  writeJson(LOCAL_MESSAGES, next);
  return true;
}

export async function listSentMessages(limit = 100): Promise<InboxMessage[]> {
  const db = getAdminFirestore();
  let rows: InboxMessage[];
  if (db) {
    const snap = await db.collection(MESSAGES).orderBy('createdAt', 'desc').limit(limit).get();
    rows = snap.docs.map((d) => d.data() as InboxMessage);
  } else {
    rows = readJson<InboxMessage[]>(LOCAL_MESSAGES, []);
  }
  return rows.sort(newestFirst).slice(0, limit);
}

async function messagesForEmail(email: string): Promise<InboxMessage[]> {
  const db = getAdminFirestore();
  if (db) {
    const [all, direct] = await Promise.all([
      db.collection(MESSAGES).where('audience', '==', 'all').limit(200).get(),
      db.collection(MESSAGES).where('recipients', 'array-contains', email).limit(200).get(),
    ]);
    const byId = new Map<string, InboxMessage>();
    for (const d of [...all.docs, ...direct.docs]) byId.set(d.id, d.data() as InboxMessage);
    return [...byId.values()];
  }
  return readJson<InboxMessage[]>(LOCAL_MESSAGES, []).filter(
    (m) => m.audience === 'all' || (m.recipients || []).includes(email),
  );
}

async function readIdsFor(email: string): Promise<Set<string>> {
  const db = getAdminFirestore();
  if (db) {
    const doc = await db.collection(READS).doc(email).get();
    return new Set(Object.keys((doc.data()?.readAt as Record<string, string>) || {}));
  }
  const all = readJson<Record<string, Record<string, string>>>(LOCAL_READS, {});
  return new Set(Object.keys(all[email] || {}));
}

export async function getMemberInbox(rawEmail: string): Promise<{ messages: MemberInboxItem[]; unread: number }> {
  const email = normalizeInboxEmail(rawEmail);
  if (!isEmail(email)) return { messages: [], unread: 0 };
  const [msgs, read] = await Promise.all([messagesForEmail(email), readIdsFor(email)]);
  const messages = msgs
    .sort(newestFirst)
    .slice(0, INBOX_LIMITS.memberListSize)
    .map(({ id, subject, body, severity, createdAt }) => ({
      id,
      subject,
      body,
      severity,
      createdAt,
      read: read.has(id),
    }));
  return { messages, unread: messages.filter((m) => !m.read).length };
}

/** Marks ids read only if the member can actually see them (no probing other members' messages). */
export async function markMemberMessagesRead(rawEmail: string, ids: string[] | 'all'): Promise<number> {
  const email = normalizeInboxEmail(rawEmail);
  if (!isEmail(email)) return 0;
  const visible = await messagesForEmail(email);
  const visibleIds = new Set(visible.map((m) => m.id));
  const target = ids === 'all' ? [...visibleIds] : ids.filter((id) => visibleIds.has(id));
  if (!target.length) return 0;
  const now = new Date().toISOString();
  const db = getAdminFirestore();
  if (db) {
    const readAt = Object.fromEntries(target.map((id) => [id, now]));
    await db.collection(READS).doc(email).set({ readAt }, { merge: true });
  } else {
    const all = readJson<Record<string, Record<string, string>>>(LOCAL_READS, {});
    all[email] = { ...(all[email] || {}), ...Object.fromEntries(target.map((id) => [id, now])) };
    writeJson(LOCAL_READS, all);
  }
  return target.length;
}
