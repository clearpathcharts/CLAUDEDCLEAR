import fs from 'node:fs';
import { initializeApp, getApps, cert, applicationDefault, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let firestoreClient: Firestore | null = null;
let initAttempted = false;
let adminApp: App | null = null;
let adminMode: 'service_account' | 'adc' | 'none' = 'none';
let adminFailReason: string | undefined;
/** null = not probed yet; only `true` means durable writes are allowed. */
let firestoreProbeOk: boolean | null = null;

export type FirebaseAdminStatus = {
  configured: boolean;
  firestore: boolean;
  mode: 'service_account' | 'adc' | 'none';
  reason?: string;
  projectId?: string;
  probed?: boolean;
};

/**
 * True when we have an explicit credential path/json, or are clearly on GCP
 * where the metadata server can mint ADC. GitHub Actions / local CI must NOT
 * call applicationDefault() — it initializes a lazy client that later throws
 * uncaught "Could not load the default credentials" and kills self-tests.
 */
export function hasFirebaseAdminCredentials(): boolean {
  if (process.env.CLEARPATH_DISABLE_FIRESTORE_ADMIN === '1') return false;

  const serviceAccount = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();
  if (serviceAccount) return true;

  const adcPath = (process.env.GOOGLE_APPLICATION_CREDENTIALS || '').trim();
  if (adcPath && fs.existsSync(adcPath)) return true;

  // Cloud Run / Functions / App Engine — metadata server ADC is available.
  return Boolean(
    process.env.K_SERVICE ||
      process.env.FUNCTION_TARGET ||
      process.env.FUNCTION_NAME ||
      process.env.GAE_ENV ||
      process.env.GAE_SERVICE
  );
}

/** Initialize Firebase Admin once (Firestore + Auth). Returns null when no credentials. */
export function ensureAdminApp(): App | null {
  if (initAttempted) return adminApp;
  initAttempted = true;

  try {
    if (!hasFirebaseAdminCredentials()) {
      console.warn(
        '[Firebase Admin] No credentials configured (FIREBASE_SERVICE_ACCOUNT / ADC). Using local file fallback.'
      );
      return null;
    }

    if (!getApps().length) {
      const serviceAccountJson = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();
      if (serviceAccountJson) {
        try {
          adminApp = initializeApp({
            credential: cert(JSON.parse(serviceAccountJson)),
            projectId: firebaseConfig.projectId,
          });
          adminMode = 'service_account';
          adminFailReason = undefined;
        } catch (saError: any) {
          adminApp = null;
          adminMode = 'none';
          adminFailReason = `FIREBASE_SERVICE_ACCOUNT present but invalid: ${saError?.message || saError}`;
          console.warn('[Firebase Admin]', adminFailReason);
          return null;
        }
      } else {
<<<<<<< HEAD
        // Explicit ADC file or GCP runtime — safe to use application-default.
=======
        // Prefer GOOGLE_APPLICATION_CREDENTIALS, else gcloud / Cloud Run ADC.
>>>>>>> 56a30cf (Stop private accounts and waitlist from using ephemeral Cloud Run disk)
        try {
          adminApp = initializeApp({
            credential: applicationDefault(),
            projectId: firebaseConfig.projectId,
          });
          adminMode = 'adc';
          adminFailReason = undefined;
        } catch (adcError: any) {
          adminApp = null;
          adminMode = 'none';
          adminFailReason =
            'No credentials (set FIREBASE_SERVICE_ACCOUNT JSON, or attach a Cloud Run SA with Firestore + ADC). Registration will refuse durable writes in production.';
          console.warn(
<<<<<<< HEAD
            '[Firebase Admin] ADC init failed. Registration data will use local file fallback.',
            adcError
=======
            '[Firebase Admin] No credentials configured (FIREBASE_SERVICE_ACCOUNT / ADC). Registration data will use local file fallback in non-production only.',
            adcError?.message || adcError
>>>>>>> 56a30cf (Stop private accounts and waitlist from using ephemeral Cloud Run disk)
          );
          return null;
        }
      }
    } else {
      adminApp = getApps()[0]!;
      if (adminMode === 'none') {
        adminMode = process.env.FIREBASE_SERVICE_ACCOUNT ? 'service_account' : 'adc';
      }
    }
    console.info(`[Firebase Admin] App initialized (mode=${adminMode}).`);
  } catch (error: any) {
    console.warn('[Firebase Admin] Initialization failed:', error);
    adminApp = null;
    adminMode = 'none';
    adminFailReason = error?.message || String(error);
  }

  return adminApp;
}

function getOrCreateFirestoreClient(): Firestore | null {
  const app = ensureAdminApp();
  if (!app) return null;
  if (firestoreClient) return firestoreClient;

  try {
    const databaseId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
    firestoreClient = databaseId ? getFirestore(undefined, databaseId) : getFirestore();
    console.info('[Firebase Admin] Firestore client created.');
  } catch (error: any) {
    console.warn('[Firebase Admin] Firestore init failed:', error);
    firestoreClient = null;
    adminFailReason = error?.message || String(error);
  }

  return firestoreClient;
}

/**
 * Durable Firestore handle — null until `probeAdminFirestore()` succeeds.
 * Prevents ADC false-positives where initializeApp works but RPCs fail.
 */
export function getAdminFirestore(): Firestore | null {
  if (firestoreProbeOk !== true) return null;
  return getOrCreateFirestoreClient();
}

/** True only after a successful probeAdminFirestore(). */
export function isFirestoreDurableReady(): boolean {
  return firestoreProbeOk === true;
}

/**
 * Verify Firestore credentials actually work (ADC can initializeApp then fail on first RPC).
 * Call once at boot before private-account migrate/recover.
 */
export async function probeAdminFirestore(): Promise<boolean> {
  const db = getOrCreateFirestoreClient();
  if (!db) {
    firestoreProbeOk = false;
    return false;
  }
  try {
    await db.collection('private_accounts').limit(1).get();
    firestoreProbeOk = true;
    adminFailReason = undefined;
    console.info('[Firebase Admin] Firestore probe OK — durable private store available.');
    return true;
  } catch (error: any) {
    firestoreProbeOk = false;
    firestoreClient = null;
    adminFailReason =
      error?.message ||
      'Firestore probe failed (credentials/IAM/project). Private accounts will not use durable store.';
    console.warn('[Firebase Admin] Firestore probe FAILED — treating Admin as offline:', adminFailReason);
    return false;
  }
}

/** Boolean + reason diagnostics — never includes credential material. */
export function getFirebaseAdminStatus(): FirebaseAdminStatus {
  const app = ensureAdminApp();
  return {
    configured: Boolean(app),
    firestore: firestoreProbeOk === true,
    mode: adminMode,
    ...(adminFailReason
      ? { reason: adminFailReason }
      : firestoreProbeOk === null && app
        ? { reason: 'Firestore not probed yet — call probeAdminFirestore() at boot.' }
        : {}),
    projectId: firebaseConfig.projectId,
    probed: firestoreProbeOk !== null,
  };
}

/** Test-only: allow re-init after env changes. */
export function __resetFirebaseAdminForTests() {
  firestore = null;
  initAttempted = false;
  adminApp = null;
}
