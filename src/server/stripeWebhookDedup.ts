/**
 * Webhook idempotency — avoid double-crediting affiliates or flipping tiers on retries.
 * Prefers Firestore when admin is available; falls back to local file on dev.
 *
 * Claim is released if processing throws so Stripe retries can succeed.
 */
import fs from 'fs';
import path from 'path';
import { getAdminFirestore } from './firebaseAdmin';

const LOCAL_FILE = path.join(process.cwd(), 'data', 'stripe-webhook-events.json');
const MAX_LOCAL = 5000;
const STALE_PROCESSING_MS = 5 * 60 * 1000;

type LocalEntry = { status: 'processing' | 'done'; startedAt: string };

function readLocalMap(): Record<string, LocalEntry> {
  const dir = path.dirname(LOCAL_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  try {
    if (fs.existsSync(LOCAL_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8'));
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, LocalEntry>;
      }
    }
  } catch {
    /* fresh map */
  }
  return {};
}

function writeLocalMap(map: Record<string, LocalEntry>) {
  const ids = Object.keys(map);
  let trimmed = map;
  if (ids.length > MAX_LOCAL) {
    const keep = ids.sort().slice(-MAX_LOCAL);
    trimmed = Object.fromEntries(keep.map((id) => [id, map[id]!]));
  }
  fs.writeFileSync(LOCAL_FILE, JSON.stringify(trimmed), 'utf8');
}

function beginLocal(eventId: string): boolean {
  const map = readLocalMap();
  const prev = map[eventId];
  if (prev?.status === 'done') return false;
  if (prev?.status === 'processing') {
    const age = Date.now() - Date.parse(prev.startedAt);
    if (age < STALE_PROCESSING_MS) return false;
  }
  map[eventId] = { status: 'processing', startedAt: new Date().toISOString() };
  writeLocalMap(map);
  return true;
}

function completeLocal(eventId: string) {
  const map = readLocalMap();
  map[eventId] = { status: 'done', startedAt: map[eventId]?.startedAt || new Date().toISOString() };
  writeLocalMap(map);
}

function releaseLocal(eventId: string) {
  const map = readLocalMap();
  delete map[eventId];
  writeLocalMap(map);
}

/** @returns true when this worker should process the event. */
export async function beginStripeWebhookEvent(eventId: string): Promise<boolean> {
  const id = String(eventId || '').trim();
  if (!id) return false;
  const db = getAdminFirestore();
  if (db) {
    try {
      const ref = db.collection('stripe_webhook_events').doc(id);
      const snap = await ref.get();
      if (snap.exists) {
        const data = snap.data() as { status?: string; startedAt?: string } | undefined;
        if (data?.status === 'done') return false;
        if (data?.status === 'processing' && data.startedAt) {
          const age = Date.now() - Date.parse(data.startedAt);
          if (age < STALE_PROCESSING_MS) return false;
        }
      }
      await ref.set({ status: 'processing', startedAt: new Date().toISOString() });
      return true;
    } catch (err) {
      console.warn('[Stripe] Firestore webhook begin failed; using local file.', err);
    }
  }
  return beginLocal(id);
}

export async function completeStripeWebhookEvent(eventId: string): Promise<void> {
  const id = String(eventId || '').trim();
  if (!id) return;
  const db = getAdminFirestore();
  if (db) {
    try {
      await db.collection('stripe_webhook_events').doc(id).set({
        status: 'done',
        completedAt: new Date().toISOString(),
      });
      return;
    } catch (err) {
      console.warn('[Stripe] Firestore webhook complete failed; using local file.', err);
    }
  }
  completeLocal(id);
}

/** Drop processing lock so Stripe retries can run after a failed durable write. */
export async function releaseStripeWebhookEvent(eventId: string): Promise<void> {
  const id = String(eventId || '').trim();
  if (!id) return;
  const db = getAdminFirestore();
  if (db) {
    try {
      await db.collection('stripe_webhook_events').doc(id).delete();
      return;
    } catch (err) {
      console.warn('[Stripe] Firestore webhook release failed; using local file.', err);
    }
  }
  releaseLocal(id);
}

/** @deprecated use begin/complete/release */
export async function claimStripeWebhookEvent(eventId: string): Promise<boolean> {
  return beginStripeWebhookEvent(eventId);
}
