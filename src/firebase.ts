import { initializeApp, FirebaseApp } from 'firebase/app';
import * as fbAuth from 'firebase/auth';
import * as fbFirestore from 'firebase/firestore';
import * as fbStorage from 'firebase/storage';
import firebaseConfigJson from '../firebase-applet-config.json';

let _initialized = false;
let _mockMode = false;
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

const emptySnapshot = {
  empty: true,
  docs: [] as any[],
  size: 0,
  forEach: (_cb: (doc: any) => void) => {},
  data: () => undefined,
  exists: () => false,
  id: '',
};

function createMockAuth() {
  return {
    currentUser: null,
    onAuthStateChanged: (callback: (user: any) => void) => {
      try {
        callback(null);
      } catch (e) {
        console.error('[Firebase mock] onAuthStateChanged callback failed:', e);
      }
      return () => {};
    },
    signInAnonymously: async () => ({ user: null }),
    signOut: async () => {},
  };
}

function init() {
  if (_initialized) return { auth: _auth, db: _db, storage: _storage, app: _app, mock: _mockMode };

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
    _mockMode = false;
    console.info('Firebase connected.');
  } catch (e) {
    // Must never crash the SPA. Broken mocks previously black-screened production
    // when Cloud Run shipped without VITE_FIREBASE_* (onSnapshot / auth were not functions).
    console.error('Firebase init failed, using safe offline mocks:', e);
    _app = null;
    _auth = createMockAuth();
    _db = { __isClearPathMock: true };
    _storage = null;
    _mockMode = true;
  }

  _initialized = true;
  return { auth: _auth, db: _db, storage: _storage, app: _app, mock: _mockMode };
}

export const isFirebaseMockMode = () => init().mock === true;

// Export functions that delegate to _auth/_db
export const getAuth = () => init().auth;
export const getDb = () => init().db;
export const getFirebaseStorage = () => init().storage;

// Proxy object for 'auth' to maintain compatibility
export const auth = {
  get currentUser() {
    return init().auth?.currentUser ?? null;
  },
  onAuthStateChanged: (...args: any[]) => {
    const a = init().auth;
    if (typeof a?.onAuthStateChanged === 'function') {
      return a.onAuthStateChanged(...args);
    }
    const cb = args[0];
    if (typeof cb === 'function') cb(null);
    return () => {};
  },
  signInAnonymously: (...args: any[]) => {
    const a = init().auth;
    if (typeof a?.signInAnonymously === 'function') return a.signInAnonymously(...args);
    return Promise.resolve({ user: null });
  },
  signOut: (...args: any[]) => {
    const a = init().auth;
    if (typeof a?.signOut === 'function') return a.signOut(...args);
    return Promise.resolve();
  },
};

export const loginAnonymously = () => {
  const { auth: resolvedAuth, mock } = init();
  if (mock || !resolvedAuth) {
    return Promise.reject(new Error('Firebase auth unavailable (missing VITE_FIREBASE_API_KEY)'));
  }
  return fbAuth.signInAnonymously(resolvedAuth);
};

export const db = getDb();

/**
 * Wrap Firestore modular APIs. In mock mode, NEVER call the real Firebase SDK
 * with a fake db — that throws and blacks out the site.
 */
const wrap =
  (fn: Function, mockReturn: () => any = () => ({})) =>
  (...args: any[]) => {
    const { db, mock } = init();
    if (mock || !db || (db as any).__isClearPathMock) {
      return mockReturn();
    }
    try {
      return fn(...args);
    } catch (e) {
      console.error('Firestore operation failed:', e);
      return mockReturn();
    }
  };

const mockUnsub = () => () => {};
const mockQueryRef = () => ({ __isClearPathMockRef: true });

export const collection = wrap(fbFirestore.collection, mockQueryRef);
export const doc = wrap(fbFirestore.doc, mockQueryRef);
export const addDoc = wrap(fbFirestore.addDoc, async () => ({ id: 'mock' }));
export const updateDoc = wrap(fbFirestore.updateDoc, async () => undefined);
export const setDoc = wrap(fbFirestore.setDoc, async () => undefined);
export const getDocs = wrap(fbFirestore.getDocs, async () => emptySnapshot);
export const getDoc = wrap(fbFirestore.getDoc, async () => emptySnapshot);
export const deleteDoc = wrap(fbFirestore.deleteDoc, async () => undefined);
export const onSnapshot = wrap(fbFirestore.onSnapshot, mockUnsub);
export const query = wrap(fbFirestore.query, mockQueryRef);
export const where = wrap(fbFirestore.where, mockQueryRef);
export const orderBy = wrap(fbFirestore.orderBy, mockQueryRef);
export const limit = wrap(fbFirestore.limit, mockQueryRef);
export const serverTimestamp = fbFirestore.serverTimestamp;
export const Timestamp = fbFirestore.Timestamp;
export const handleFirestoreError = (err: any, op: string, path: string) => {
  console.error(`Firestore Error [${op}] at ${path}:`, err);
};
export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
};
