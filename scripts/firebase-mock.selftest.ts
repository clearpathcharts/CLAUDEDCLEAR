/**
 * Ensures Firebase mock mode never exposes broken onSnapshot/auth APIs
 * (root cause of production black screen when VITE_FIREBASE_API_KEY is missing).
 *
 * Run: npx tsx scripts/firebase-mock.selftest.ts
 */
import assert from 'node:assert/strict';

// Force missing key before module init
process.env.VITE_FIREBASE_API_KEY = '';

async function main() {
  const fb = await import('../src/firebase.ts');

  assert.equal(fb.isFirebaseMockMode(), true, 'expected mock mode without API key');

  const auth = fb.getAuth();
  assert.equal(typeof auth.onAuthStateChanged, 'function', 'mock auth needs onAuthStateChanged');

  let sawNull = false;
  const unsubAuth = auth.onAuthStateChanged((u: unknown) => {
    sawNull = u === null;
  });
  assert.equal(sawNull, true, 'mock auth should call back with null');
  assert.equal(typeof unsubAuth, 'function', 'onAuthStateChanged must return unsubscribe');
  unsubAuth();

  const unsub = fb.onSnapshot(fb.collection(fb.getDb(), 'globe_country_configs'), () => {
    throw new Error('mock onSnapshot should not invoke listener');
  });
  assert.equal(typeof unsub, 'function', 'onSnapshot must return unsubscribe in mock mode');
  unsub();

  const docs = await fb.getDocs(fb.collection(fb.getDb(), 'x'));
  assert.equal(docs.empty, true);

  console.log('firebase-mock.selftest: ok');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
