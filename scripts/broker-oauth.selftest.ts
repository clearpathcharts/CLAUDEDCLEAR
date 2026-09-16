/**
 * Pass-through broker OAuth foundation — stub mode + shape checks.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildAlpacaAuthorizeUrl,
  createAlpacaOAuthState,
  alpacaConfiguredSummary,
} from '../src/server/broker/alpacaOAuth';
import { PASS_THROUGH_MODEL_ID, NEVER_BROKER_DEALER } from '../src/lib/passThroughBrokerModel';
import { brokerPublicStatus } from '../src/server/broker/registry';
import { encryptBrokerSecret, decryptBrokerSecret } from '../src/server/broker/tokenCrypto';
import { US_BROKER_CATALOG } from '../src/content/usBrokerCatalog';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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

function testUsBrokerNetworkPage() {
  assert.equal(US_BROKER_CATALOG.length, 9);
  assert.deepEqual(
    US_BROKER_CATALOG.map((broker) => broker.id),
    ['alpaca', 'schwab', 'tradier', 'tradestation', 'ibkr', 'tastytrade', 'etrade', 'webull', 'tradovate'],
  );
  assert.equal(US_BROKER_CATALOG.filter((broker) => broker.integration === 'available').length, 1);
  assert.equal(US_BROKER_CATALOG.find((broker) => broker.id === 'alpaca')?.integration, 'available');

  for (const broker of US_BROKER_CATALOG) {
    assert.match(broker.sourceUrl, /^https:\/\//);
    assert.ok(broker.assetClasses.length > 0);
    assert.ok(broker.note.length > 30);
    const assetPath = path.join(root, 'public', broker.logo.replace(/^\//, ''));
    assert.ok(fs.existsSync(assetPath), `${broker.name} official logo file is present`);
    const asset = fs.readFileSync(assetPath);
    assert.ok(asset.length > 500, `${broker.name} logo is not an empty placeholder`);
    if (assetPath.endsWith('.png')) {
      assert.equal(asset.subarray(1, 4).toString(), 'PNG', `${broker.name} file is a PNG`);
    } else {
      assert.match(asset.toString('utf8', 0, 300), /<svg/i, `${broker.name} file is an SVG`);
    }
  }

  const page = fs.readFileSync(path.join(root, 'src/components/broker/UsBrokerNetworkPage.tsx'), 'utf8');
  assert.match(page, /Your broker\./);
  assert.match(page, /useBrokerConnection\(true\)/);
  assert.match(page, /startAlpacaConnect\(PAGE_PATH\)/);
  assert.match(page, /broker\.integration === 'available'/);
  assert.match(page, /Every logo shown is an unmodified file/);
  assert.doesNotMatch(page, /start(?:Schwab|Tradier|TradeStation|Ibkr|Tastytrade|Etrade|Webull|Tradovate)Connect/);

  const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
  assert.match(app, /isBrokerNetworkPath/);
  assert.match(app, /<UsBrokerNetworkPage \/>/);

  const routes = fs.readFileSync(path.join(root, 'src/server/broker/brokerRoutes.ts'), 'utf8');
  assert.match(routes, /\(\?:brokers\|broker-connect\)/);

  const chip = fs.readFileSync(path.join(root, 'src/components/broker/BrokerDeskChip.tsx'), 'utf8');
  assert.match(chip, /href="\/brokers"/);
  assert.doesNotMatch(chip, /startAlpacaConnect/);
}

async function main() {
  testCanonicalCopy();
  testUsBrokerNetworkPage();
  await testStubModeWithoutEnv();
  await testAuthorizeUrlWhenConfigured();
  testTokenCryptoRoundTrip();
  console.log('broker-oauth.selftest: OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
