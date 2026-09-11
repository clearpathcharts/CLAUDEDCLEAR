/**
 * Pass-through broker OAuth foundation — stub mode + shape checks.
 */
import assert from 'node:assert/strict';
import {
  buildAlpacaAuthorizeUrl,
  createAlpacaOAuthState,
  alpacaConfiguredSummary,
} from '../src/server/broker/alpacaOAuth';
import { PASS_THROUGH_MODEL_ID, NEVER_BROKER_DEALER } from '../src/lib/passThroughBrokerModel';
import { brokerPublicStatus } from '../src/server/broker/registry';
import { encryptBrokerSecret, decryptBrokerSecret } from '../src/server/broker/tokenCrypto';

async function testStubModeWithoutEnv() {
  const summary = alpacaConfiguredSummary();
  assert.equal(summary.configured, false);
  assert.equal(summary.mode, 'stub');
  const status = await brokerPublicStatus(null);
  assert.equal(status.alpaca.mode, 'stub');
  assert.equal(status.alpaca.connected, false);
}

async function testAuthorizeUrlWhenConfigured() {
  const prev = {
    id: process.env.ALPACA_CLIENT_ID,
    secret: process.env.ALPACA_CLIENT_SECRET,
    enc: process.env.BROKER_TOKEN_ENCRYPTION_KEY,
  };
  process.env.ALPACA_CLIENT_ID = 'test-client-id';
  process.env.ALPACA_CLIENT_SECRET = 'test-client-secret';
  process.env.BROKER_TOKEN_ENCRYPTION_KEY = 'a'.repeat(64);

  try {
    const state = createAlpacaOAuthState('uid_test', '/?tab=Biography#Biography');
    const url = buildAlpacaAuthorizeUrl(state.state, 'http://localhost:3000/api/broker/alpaca/callback');
    assert.ok(url);
    assert.match(url!, /client_id=test-client-id/);
    assert.match(url!, /state=/);
    assert.match(url!, /redirect_uri=/);
  } finally {
    process.env.ALPACA_CLIENT_ID = prev.id ?? '';
    process.env.ALPACA_CLIENT_SECRET = prev.secret ?? '';
    process.env.BROKER_TOKEN_ENCRYPTION_KEY = prev.enc ?? '';
  }
}

function testTokenCryptoRoundTrip() {
  const prev = process.env.BROKER_TOKEN_ENCRYPTION_KEY;
  process.env.BROKER_TOKEN_ENCRYPTION_KEY = 'b'.repeat(64);
  try {
    const enc = encryptBrokerSecret('refresh-token-sample');
    assert.ok(enc.length > 16);
    assert.equal(decryptBrokerSecret(enc), 'refresh-token-sample');
  } finally {
    process.env.BROKER_TOKEN_ENCRYPTION_KEY = prev ?? '';
  }
}

function testCanonicalCopy() {
  assert.match(NEVER_BROKER_DEALER, /never/i);
  assert.match(NEVER_BROKER_DEALER, /broker-dealer/i);
  assert.equal(PASS_THROUGH_MODEL_ID, 'tradingview-pass-through-oauth');
}

async function main() {
  testCanonicalCopy();
  await testStubModeWithoutEnv();
  await testAuthorizeUrlWhenConfigured();
  testTokenCryptoRoundTrip();
  console.log('broker-oauth.selftest: OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
