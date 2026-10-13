/**
 * Webhook idempotency — avoid double-crediting affiliates or flipping tiers on retries.
 * Prefers Firestore when admin is available; falls back to local file on dev.
 */
import fs from 'fs';
import path from 'path';
import { getAdminFirestore } from './firebaseAdmin';

const LOCAL_FILE = path.join(process.cwd(), 'data', 'stripe-webhook-events.json');
const MAX_LOCAL = 5000;

function claimLocal(eventId: string): boolean {
  const dir = path.dirname(LOCAL_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  let ids: string[] = [];
  try {
    if (fs.existsSync(LOCAL_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8'));
      if (Array.isArray(parsed)) ids = parsed.filter((x) => typeof x === 'string');
    }
  } catch {
    ids = [];
  }
  if (ids.includes(eventId)) return false;
  ids.push(eventId);
  if (ids.length > MAX_LOCAL) ids = ids.slice(-MAX_LOCAL);
  fs.writeFileSync(LOCAL_FILE, JSON.stringify(ids), 'utf8');
  return true;
}

export async function claimStripeWebhookEvent(eventId: string): Promise<boolean> {
  const id = String(eventId || '').trim();
  if (!id) return false;
  const db = getAdminFirestore();
  if (db) {
    try {
      const ref = db.collection('stripe_webhook_events').doc(id);
      const snap = await ref.get();
      if (snap.exists) return false;
      await ref.set({ receivedAt: new Date().toISOString() });
      return true;
    } catch (err) {
      console.warn('[Stripe] Firestore webhook dedup failed; using local file.', err);
    }
  }
  return claimLocal(id);
}
