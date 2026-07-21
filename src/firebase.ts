import { initializeApp, FirebaseApp } from 'firebase/app';
import * as fbAuth from 'firebase/auth';
import * as fbFirestore from 'firebase/firestore';
import * as fbStorage from 'firebase/storage';
import firebaseConfigJson from '../firebase-applet-config.json';

let _initialized = false;
let _app: FirebaseApp | null = null;
let _auth: any = null;
let _db: any = null;
let _storage: fbStorage.FirebaseStorage | null = null;

/** Firebase web API keys are public client identifiers — supply via VITE_FIREBASE_API_KEY (never commit live keys). */
function readPublicFirebaseEnv(name: string): string {
  const fromProcess =
    typeof process !== 'undefined' && process.env && typeof process.env[name] === 'string'
      ? String(process.env[name]).trim()
      : '';
  if (fromProcess) return fromProcess;
  try {
    // Vite injects import.meta.env in the browser bundle only.
    const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
    const v = env?.[name];
    return typeof v === 'string' ? v.trim() : '';
  } catch {
    return '';
  }
}

function resolveFirebaseConfig() {
  const apiKey =
    readPublicFirebaseEnv('VITE_FIREBASE_API_KEY') ||
    (firebaseConfigJson as { apiKey?: string }).apiKey ||
    '';
  return {
    ...firebaseConfigJson,
    apiKey,
    authDomain: readPublicFirebaseEnv('VITE_FIREBASE_AUTH_DOMAIN') || firebaseConfigJson.authDomain,
    projectId: readPublicFirebaseEnv('VITE_FIREBASE_PROJECT_ID') || firebaseConfigJson.projectId,
    appId: readPublicFirebaseEnv('VITE_FIREBASE_APP_ID') || firebaseConfigJson.appId,
    messagingSenderId:
      readPublicFirebaseEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || firebaseConfigJson.messagingSenderId,
    storageBucket:
      readPublicFirebaseEnv('VITE_FIREBASE_STORAGE_BUCKET') || firebaseConfigJson.storageBucket,
  };
}

function init() {
  if (_initialized) return { auth: _auth, db: _db, storage: _storage, app: _app };
  
  try {
    const firebaseConfig = resolveFirebaseConfig();
    if (!firebaseConfig.apiKey) {
      throw new Error('VITE_FIREBASE_API_KEY is not set');
    }
    const app = initializeApp(firebaseConfig);
    _app = app;
    _auth = fbAuth.getAuth(app);
    _db = fbFirestore.getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
    _storage = fbStorage.getStorage(app);
    console.info("Firebase connected.");
  } catch (e) {
    console.error("Firebase init failed, using mocks:", e);
    _auth = { currentUser: null }; // Basic mock
    _db = {}; // Basic mock
    _storage = null;
  }
  
  _initialized = true;
  return { auth: _auth, db: _db, storage: _storage, app: _app };
}

// Export functions that delegate to _auth/_db
export const getAuth = () => init().auth;
export const getDb = () => init().db;
export const getFirebaseStorage = () => init().storage;

// Proxy object for 'auth' to maintain compatibility
export const auth = {
  get currentUser() { return init().auth?.currentUser; },
  onAuthStateChanged: (...args: any[]) => init().auth?.onAuthStateChanged(...args),
  signInAnonymously: (...args: any[]) => init().auth?.signInAnonymously(...args),
  signOut: (...args: any[]) => init().auth?.signOut(...args),
};
export const loginAnonymously = () => {
  const { auth: resolvedAuth } = init();
  return fbAuth.signInAnonymously(resolvedAuth);
};
export const db = getDb(); // Still needs to be exported for older code

// Mock/Proxy factory for Firestore functions
const wrap = (fn: Function) => (...args: any[]) => {
  const { db } = init();
  if (db && typeof db === 'object' && !('empty' in db)) {
    // If it's the real firestore object
    try {
        return fn(...args);
    } catch(e) {
        console.error("Firestore operation failed:", e);
    }
  }
  return {}; // No-op for mock
};

// Explicit exports for modules
export const collection = wrap(fbFirestore.collection);
export const doc = wrap(fbFirestore.doc);
export const addDoc = wrap(fbFirestore.addDoc);
export const updateDoc = wrap(fbFirestore.updateDoc);
export const setDoc = wrap(fbFirestore.setDoc);
export const getDocs = wrap(fbFirestore.getDocs);
export const getDoc = wrap(fbFirestore.getDoc);
export const deleteDoc = wrap(fbFirestore.deleteDoc);
export const onSnapshot = wrap(fbFirestore.onSnapshot);
export const query = wrap(fbFirestore.query);
export const where = wrap(fbFirestore.where);
export const orderBy = wrap(fbFirestore.orderBy);
export const limit = wrap(fbFirestore.limit);
export const serverTimestamp = fbFirestore.serverTimestamp;
export const Timestamp = fbFirestore.Timestamp;
export const handleFirestoreError = (err: any, op: string, path: string) => { console.error(`Firestore Error [${op}] at ${path}:`, err); };
export const OperationType = { CREATE: 'create', UPDATE: 'update', DELETE: 'delete', LIST: 'list', GET: 'get', WRITE: 'write' };
