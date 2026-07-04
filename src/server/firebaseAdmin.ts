import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let firestore: Firestore | null = null;
let initAttempted = false;

export function getAdminFirestore(): Firestore | null {
  if (initAttempted) return firestore;
  initAttempted = true;

  try {
    if (!getApps().length) {
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (serviceAccountJson) {
        initializeApp({
          credential: cert(JSON.parse(serviceAccountJson)),
          projectId: firebaseConfig.projectId,
        });
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        initializeApp({
          credential: applicationDefault(),
          projectId: firebaseConfig.projectId,
        });
      } else {
        console.warn('[Firebase Admin] No credentials configured. Registration data will use local file fallback.');
        return null;
      }
    }
    const databaseId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
    firestore = databaseId ? getFirestore(undefined, databaseId) : getFirestore();
    console.info('[Firebase Admin] Firestore connected for registration pipeline.');
  } catch (error) {
    console.warn('[Firebase Admin] Initialization failed:', error);
    firestore = null;
  }

  return firestore;
}
