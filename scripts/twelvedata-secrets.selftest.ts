/**
 * Self-test: Twelve Data env key resolution (no network, no real keys).
 * Run: npm run test:twelvedata-secrets
 */
import assert from 'node:assert/strict';
import {
  getTwelveDataApiKey,
  getTwelveDataApiKeySource,
  getTwelveDataKeyPresence,
  listTwelveDataApiKeyCandidates,
  resetTwelveDataSecretWarnForTests,
} from '../src/server/secrets.ts';

function withEnv(vars: Record<string, string | undefined>, fn: () => void): void {
  const keys = ['TWELVEDATA_API_KEY', 'TWELVE_DATA_API_KEY'] as const;
  const prev: Record<string, string | undefined> = {};
  for (const k of keys) {
    prev[k] = process.env[k];
    delete process.env[k];
  }
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    resetTwelveDataSecretWarnForTests();
    fn();
  } finally {
    for (const k of keys) {
      if (prev[k] === undefined) delete process.env[k];
      else process.env[k] = prev[k];
    }
  }
}

withEnv({}, () => {
  assert.equal(getTwelveDataApiKey(), '');
  assert.equal(getTwelveDataApiKeySource(), null);
  const p = getTwelveDataKeyPresence();
  assert.equal(p.TWELVEDATA_API_KEY, false);
  assert.equal(p.TWELVE_DATA_API_KEY, false);
  assert.equal(p.keyLength, 0);
  assert.equal(p.candidateCount, 0);
  assert.equal(p.bothSetAndDiffer, false);
});

withEnv({ TWELVEDATA_API_KEY: '  primary-key-value  ' }, () => {
  assert.equal(getTwelveDataApiKey(), 'primary-key-value');
  assert.equal(getTwelveDataApiKeySource(), 'TWELVEDATA_API_KEY');
});

withEnv({ TWELVE_DATA_API_KEY: '"alt-key-value"' }, () => {
  assert.equal(getTwelveDataApiKey(), 'alt-key-value');
  assert.equal(getTwelveDataApiKeySource(), 'TWELVE_DATA_API_KEY');
});

withEnv(
  {
    TWELVEDATA_API_KEY: 'short',
    TWELVE_DATA_API_KEY: 'much-longer-cloud-run-key',
  },
  () => {
    assert.equal(getTwelveDataApiKey(), 'much-longer-cloud-run-key');
    assert.equal(getTwelveDataApiKeySource(), 'TWELVE_DATA_API_KEY');
    const c = listTwelveDataApiKeyCandidates();
    assert.equal(c.length, 2);
    assert.equal(c[0].key, 'much-longer-cloud-run-key');
    assert.equal(c[1].key, 'short');
    assert.equal(getTwelveDataKeyPresence().bothSetAndDiffer, true);
  },
);

withEnv(
  {
    TWELVEDATA_API_KEY: 'same-length-old!!',
    TWELVE_DATA_API_KEY: 'same-length-new!!',
  },
  () => {
    // Equal length → prefer Cloud Run spelling, keep stale as retry candidate.
    assert.equal(getTwelveDataApiKey(), 'same-length-new!!');
    assert.equal(getTwelveDataApiKeySource(), 'TWELVE_DATA_API_KEY');
    assert.deepEqual(
      listTwelveDataApiKeyCandidates().map((x) => x.source),
      ['TWELVE_DATA_API_KEY', 'TWELVEDATA_API_KEY'],
    );
  },
);

withEnv(
  {
    TWELVEDATA_API_KEY: 'placeholder',
    TWELVE_DATA_API_KEY: '\uFEFFreal-key\u200B',
  },
  () => {
    assert.equal(getTwelveDataApiKey(), 'real-key');
    assert.equal(getTwelveDataApiKeySource(), 'TWELVE_DATA_API_KEY');
  },
);

withEnv(
  {
    TWELVEDATA_API_KEY: '{"TWELVEDATA_API_KEY":"json-wrapped-live-key"}',
  },
  () => {
    assert.equal(getTwelveDataApiKey(), 'json-wrapped-live-key');
  },
);

withEnv({ TWELVEDATA_API_KEY: 'apikey pasted-header-key' }, () => {
  assert.equal(getTwelveDataApiKey(), 'pasted-header-key');
});

console.log('twelvedata-secrets.selftest: ok');
