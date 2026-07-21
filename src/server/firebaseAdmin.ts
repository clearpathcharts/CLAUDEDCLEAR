import { initializeApp, getApps, cert, applicationDefault, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let firestore: Firestore | null = null;
let initAttempted = false;
let adminApp: App | null = null;

/** Initialize Firebase Admin once (Firestore + Auth). Returns null when no credentials. */
export function ensureAdminApp(): App | null {
  if (initAttempted) return adminApp;
  initAttempted = true;

  try {
    if (!getApps().length) {
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (serviceAccountJson) {
        adminApp = initializeApp({
          credential: cert(JSON.parse(serviceAccountJson)),
          projectId: firebaseConfig.projectId,
        });
      } else {
        // Prefer GOOGLE_APPLICATION_CREDENTIALS, else gcloud application-default credentials.
        try {
          adminApp = initializeApp({
            credential: applicationDefault(),
            projectId: firebaseConfig.projectId,
          });
        } catch (adcError) {
          console.warn(
            '[Firebase Admin] No credentials configured (FIREBASE_SERVICE_ACCOUNT / ADC). Registration data will use local file fallback.',
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
