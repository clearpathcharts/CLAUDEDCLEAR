/**
 * Durable broker OAuth connections — Firestore + local file fallback.
 * Tokens are encrypted before persistence; never exposed in API responses.
 */
import fs from 'node:fs';
import path from 'node:path';
import { getAdminFirestore } from '../firebaseAdmin';
import type { BrokerConnectionRecord, BrokerId } from './types';

const DIR = path.join(process.cwd(), 'data', 'broker_connections');
const COLLECTION = 'broker_connections';

function ensureDir() {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
}

function docId(uid: string, brokerId: BrokerId): string {
  return `${String(uid).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128)}_${brokerId}`;
}

function fileFor(uid: string, brokerId: BrokerId) {
  return path.join(DIR, `${docId(uid, brokerId)}.json`);
}

function readLocal(uid: string, brokerId: BrokerId): BrokerConnectionRecord | null {
  ensureDir();
  const fp = fileFor(uid, brokerId);
  if (!fs.existsSync(fp)) return null;
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf8')) as BrokerConnectionRecord;
  } catch {
    return null;
  }
}

function writeLocal(record: BrokerConnectionRecord): void {
  ensureDir();
  fs.writeFileSync(fileFor(record.uid, record.brokerId), JSON.stringify(record, null, 2));
}

function deleteLocal(uid: string, brokerId: BrokerId): void {
  ensureDir();
  const fp = fileFor(uid, brokerId);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
}

export async function saveBrokerConnection(record: BrokerConnectionRecord): Promise<void> {
  writeLocal(record);
  const db = getAdminFirestore();
  if (!db) return;
  try {
    await db.collection(COLLECTION).doc(docId(record.uid, record.brokerId)).set(record);
  } catch (err) {
    console.warn('[brokerConnection] Firestore write failed (local copy saved)', err);
  }
}

export async function loadBrokerConnection(
  uid: string,
  brokerId: BrokerId,
): Promise<BrokerConnectionRecord | null> {
  const local = readLocal(uid, brokerId);
  const db = getAdminFirestore();
  if (!db) return local;

  try {
    const snap = await db.collection(COLLECTION).doc(docId(uid, brokerId)).get();
    if (!snap.exists) return local;
    const remote = snap.data() as BrokerConnectionRecord;
    if (remote?.uid && remote.accessTokenEnc) {
      if (!local || Date.parse(remote.updatedAt || '') >= Date.parse(local.updatedAt || '')) {
        writeLocal(remote);
        return remote;
      }
    }
  } catch (err) {
    console.warn('[brokerConnection] Firestore read failed; using local', err);
  }
  return local;
}

export async function deleteBrokerConnection(uid: string, brokerId: BrokerId): Promise<void> {
  deleteLocal(uid, brokerId);
  const db = getAdminFirestore();
  if (!db) return;
  try {
    await db.collection(COLLECTION).doc(docId(uid, brokerId)).delete();
  } catch {
    /* ignore */
  }
}

/** Boot hydration — pull Firestore connections into local cache. */
export async function hydrateBrokerConnectionsFromFirestore(): Promise<number> {
  const db = getAdminFirestore();
  if (!db) return 0;
  try {
    const snap = await db.collection(COLLECTION).limit(500).get();
    let n = 0;
    for (const doc of snap.docs) {
      const row = doc.data() as BrokerConnectionRecord;
      if (row?.uid && row.brokerId && row.accessTokenEnc) {
        writeLocal(row);
        n += 1;
      }
    }
    return n;
  } catch {
    return 0;
  }
}
