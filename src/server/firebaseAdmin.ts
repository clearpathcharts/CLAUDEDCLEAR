import fs from 'node:fs';
import { initializeApp, getApps, cert, applicationDefault, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let firestore: Firestore | null = null;
let initAttempted = false;
let adminApp: App | null = null;

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
        adminApp = initializeApp({
          credential: cert(JSON.parse(serviceAccountJson)),
          projectId: firebaseConfig.projectId,
        });
      } else {
        // Explicit ADC file or GCP runtime — safe to use application-default.
        try {
          adminApp = initializeApp({
            credential: applicationDefault(),
            projectId: firebaseConfig.projectId,
          });
        } catch (adcError) {
          console.warn(
            '[Firebase Admin] ADC init failed. Registration data will use local file fallback.',
            adcError
          );
          return null;
        }
      }
    } else {
      adminApp = getApps()[0]!;
    }
    console.info('[Firebase Admin] App initialized.');
  } catch (error) {
    console.warn('[Firebase Admin] Initialization failed:', error);
    adminApp = null;
  }

  return adminApp;
}

export function getAdminFirestore(): Firestore | null {
  const app = ensureAdminApp();
  if (!app) return null;
  if (firestore) return firestore;

  try {
    const databaseId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
    firestore = databaseId ? getFirestore(undefined, databaseId) : getFirestore();
    console.info('[Firebase Admin] Firestore connected for registration pipeline.');
  } catch (error) {
    console.warn('[Firebase Admin] Firestore init failed:', error);
    firestore = null;
  }

  return firestore;
}

/** Test-only: allow re-init after env changes. */
export function __resetFirebaseAdminForTests() {
  firestore = null;
  initAttempted = false;
  adminApp = null;
}
