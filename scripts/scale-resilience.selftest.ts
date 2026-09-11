/**
 * Scale / resilience wiring smoke test — sessions, LRU, rate limits, durable stores.
 */
import assert from 'node:assert/strict';
import { LruMap } from '../src/lib/lruMap';
import { createSessionStore } from '../src/server/firestoreSessionStore';
import {
  authForgotPasswordLimiter,
  authLoginLimiter,
  authRegisterLimiter,
  aiChatLimiter,
  frontendErrorLimiter,
} from '../src/server/routeRateLimit';
import {
  appendChatRoomMessage,
  loadChatRoomHistory,
} from '../src/server/chatRoomStore';

function testLruMap() {
  const map = new LruMap<string, number>(3);
  map.set('a', 1);
  map.set('b', 2);
  map.set('c', 3);
  assert.equal(map.size, 3);
  map.get('a');
  map.set('d', 4);
  assert.equal(map.has('b'), false, 'oldest untouched key evicted');
  assert.equal(map.size, 3);
}

function testSessionStoreFactory() {
  const store = createSessionStore();
  assert.ok(store);
  assert.equal(typeof store.get, 'function');
  assert.equal(typeof store.set, 'function');
}

function testRateLimitersExport() {
  for (const limiter of [
    authLoginLimiter,
    authRegisterLimiter,
    authForgotPasswordLimiter,
    aiChatLimiter,
    frontendErrorLimiter,
  ]) {
    assert.equal(typeof limiter, 'function');
  }
}

async function testChatRoomMemoryFallback() {
  const msg = {
    id: 'chat_test_1',
    roomId: 'lobby',
    author: 'Selftest',
    text: 'hello',
    timestamp: Date.now(),
  };
  await appendChatRoomMessage(msg);
  const history = await loadChatRoomHistory('lobby', 10);
  assert.ok(history.some((m) => m.id === msg.id));
}

async function main() {
  testLruMap();
  testSessionStoreFactory();
  testRateLimitersExport();
  await testChatRoomMemoryFallback();
  console.log('scale-resilience.selftest: OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
