import { initializeApp, FirebaseApp } from 'firebase/app';
import * as fbAuth from 'firebase/auth';
import * as fbFirestore from 'firebase/firestore';
import * as fbStorage from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

let _initialized = false;
let _app: FirebaseApp | null = null;
let _auth: any = null;
let _db: any = null;
let _storage: fbStorage.FirebaseStorage | null = null;

function init() {
  if (_initialized) return { auth: _auth, db: _db, storage: _storage, app: _app };
  
  try {
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
