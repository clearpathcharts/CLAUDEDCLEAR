import { initializeApp, getApps, cert, applicationDefault, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let firestore: Firestore | null = null;
let initAttempted = false;
let adminApp: App | null = null;

/**
 * Only attempt Application Default Credentials when something real is present.
 * `applicationDefault()` does NOT fail synchronously in CI — it creates an app
 * that later throws uncaught "Could not load the default credentials" on first
 * Firestore write. Skip ADC unless we have an explicit key file / JSON, or we
 * are clearly on GCP (Cloud Run / GCE metadata).
 */
function canUseApplicationDefault(): boolean {
  if (process.env.FIREBASE_DISABLE_ADMIN === '1') return false;
  if ((process.env.GOOGLE_APPLICATION_CREDENTIALS || '').trim()) return true;
  // Cloud Run / Functions / GCE
  if (process.env.K_SERVICE || process.env.FUNCTION_TARGET || process.env.GCE_METADATA_HOST) {
    return true;
  }
  return false;
}

/** Initialize Firebase Admin once (Firestore + Auth). Returns null when no credentials. */
export function ensureAdminApp(): App | null {
  if (initAttempted) return adminApp;
  initAttempted = true;

  try {
    if (!getApps().length) {
      const serviceAccountJson = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();
      if (serviceAccountJson) {
        adminApp = initializeApp({
          credential: cert(JSON.parse(serviceAccountJson)),
          projectId: firebaseConfig.projectId,
        });
      } else if (canUseApplicationDefault()) {
        try {
          adminApp = initializeApp({
            credential: applicationDefault(),
            projectId: firebaseConfig.projectId,
          });
        } catch (adcError) {
          console.warn(
            '[Firebase Admin] ADC failed. Using local file fallback.',
            adcError
          );
          return null;
        }
      } else {
        console.warn(
          '[Firebase Admin] No credentials configured (FIREBASE_SERVICE_ACCOUNT / GOOGLE_APPLICATION_CREDENTIALS / Cloud Run). Using local file fallback.'
        );
        return null;
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
