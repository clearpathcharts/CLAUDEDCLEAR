/**
 * Seeds cpms_videos and cpms_channels in Firestore from the shared catalog.
 *
 * Requires Firebase Admin credentials:
 *   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
 *   or GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
 *
 * Usage:
 *   npm run cpms:seed
 *   npm run cpms:seed -- --force   # delete existing docs first
 */
import type { Firestore } from 'firebase-admin/firestore';
import 'dotenv/config';
import { getAdminFirestore } from '../src/server/firebaseAdmin.ts';
import {
  SAMPLE_LIBRARY_VIDEOS,
  STATIC_DEFAULT_CHANNELS,
  CPMS_CURATOR,
} from '../src/cpms/cpmsCatalog.ts';

const force = process.argv.includes('--force');

async function clearCollection(db: Firestore, name: string) {
  const snap = await db.collection(name).get();
  if (snap.empty) return 0;
  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  return snap.size;
}

async function seedVideos(db: Firestore) {
  const col = db.collection('cpms_videos');
  const existing = await col.limit(1).get();
  if (!existing.empty && !force) {
    const count = (await col.count().get()).data().count;
    console.log(`[cpms:seed] cpms_videos already has ${count} doc(s) — skip (use --force to replace)`);
    return;
  }
  if (force && !existing.empty) {
    const removed = await clearCollection(db, 'cpms_videos');
    console.log(`[cpms:seed] cleared ${removed} existing video(s)`);
  }
  const batch = db.batch();
  for (const item of SAMPLE_LIBRARY_VIDEOS) {
    batch.set(col.doc(), item);
  }
  await batch.commit();
  console.log(`[cpms:seed] wrote ${SAMPLE_LIBRARY_VIDEOS.length} video(s) to cpms_videos`);
}

async function seedChannels(db: Firestore) {
  const col = db.collection('cpms_channels');
  const existing = await col.limit(1).get();
  if (!existing.empty && !force) {
    const count = (await col.count().get()).data().count;
    console.log(`[cpms:seed] cpms_channels already has ${count} doc(s) — skip (use --force to replace)`);
    return;
  }
  if (force && !existing.empty) {
    const removed = await clearCollection(db, 'cpms_channels');
    console.log(`[cpms:seed] cleared ${removed} existing channel(s)`);
  }
  const now = new Date().toISOString();
  const batch = db.batch();
  for (const item of STATIC_DEFAULT_CHANNELS) {
    batch.set(col.doc(), {
      ...item,
      createdAt: now,
      createdBy: CPMS_CURATOR,
    });
  }
  await batch.commit();
  console.log(`[cpms:seed] wrote ${STATIC_DEFAULT_CHANNELS.length} channel(s) to cpms_channels`);
}

async function main() {
  const db = getAdminFirestore();
  if (!db) {
    console.error(
      '[cpms:seed] Firebase Admin not configured.\n' +
        'Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS, then retry.'
    );
    process.exit(1);
  }

  await seedVideos(db);
  await seedChannels(db);
  console.log('[cpms:seed] done.');
}

main().catch((err) => {
  console.error('[cpms:seed] failed:', err);
  process.exit(1);
});
