/**
 * Self-test: Twelve Data gateway retries the other env spelling on HTTP 401
 * and then circuit-breaks so the live site stops hammering a rejected key.
 * Run: npm run test:twelvedata-gateway-auth
 */
import assert from 'node:assert/strict';
import {
  getMarketQuote,
  resetTwelveDataAuthStateForTests,
  twelvedataHealth,
} from '../src/server/marketDataGateway.ts';
import { resetTwelveDataSecretWarnForTests } from '../src/server/secrets.ts';

const TD_KEYS = ['TWELVEDATA_API_KEY', 'TWELVE_DATA_API_KEY'] as const;

function withEnv(vars: Record<string, string | undefined>, fn: () => Promise<void>): Promise<void> {
  const prev: Record<string, string | undefined> = {};
  for (const k of TD_KEYS) {
    prev[k] = process.env[k];
    delete process.env[k];
  }
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  resetTwelveDataSecretWarnForTests();
  resetTwelveDataAuthStateForTests();
  return fn().finally(() => {
    for (const k of TD_KEYS) {
      if (prev[k] === undefined) delete process.env[k];
      else process.env[k] = prev[k];
    }
    resetTwelveDataAuthStateForTests();
  });
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function keyFromRequest(url: string, headers: HeadersInit | undefined): string {
  const u = new URL(url);
  const q = u.searchParams.get('apikey') || '';
  const h = headers && typeof headers === 'object' && 'Authorization' in (headers as Record<string, string>)
    ? String((headers as Record<string, string>).Authorization || '').replace(/^apikey\s+/i, '')
    : '';
  return h || q;
}

await withEnv(
  {
    TWELVEDATA_API_KEY: 'stale-old-key',
    TWELVE_DATA_API_KEY: 'paid-new-longer-key',
  },
  async () => {
    const seen: string[] = [];
    const origFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const used = keyFromRequest(url, init?.headers);
      seen.push(used);
      if (used === 'stale-old-key') return jsonResponse(401, { status: 'error', code: 401, message: 'Unauthorized' });
      if (used === 'paid-new-longer-key') {
        return jsonResponse(200, {
          symbol: 'EUR/USD',
          name: 'Euro / US Dollar',
          close: '1.0850',
          previous_close: '1.0840',
          percent_change: '0.09',
        });
      }
      return jsonResponse(500, { status: 'error', message: `unexpected key` });
    }) as typeof fetch;

    try {
      const quote = await getMarketQuote('EUR/USD-AUTHTEST1', 'stale-old-key');
      assert.equal(String(quote.close), '1.0850');
      assert.ok(seen.includes('stale-old-key'), 'must try stale spelling first when caller passes it');
      assert.ok(seen.includes('paid-new-longer-key'), 'must retry the other Cloud Run spelling after 401');
      assert.equal(twelvedataHealth.status, 'HEALTHY');
    } finally {
      globalThis.fetch = origFetch;
    }
  },
);

await withEnv(
  {
    TWELVEDATA_API_KEY: 'dead-key-one',
    TWELVE_DATA_API_KEY: 'dead-key-two-longer',
  },
  async () => {
    let hits = 0;
    const origFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      hits += 1;
      return jsonResponse(401, { status: 'error', code: 401, message: 'Unauthorized' });
    }) as typeof fetch;

    try {
      await assert.rejects(
        () => getMarketQuote('EUR/USD-AUTHTEST2', 'dead-key-one'),
        /status 401/,
      );
      const afterFirst = hits;
      assert.ok(afterFirst >= 2, `should try both env keys, got ${afterFirst} hits`);

      await assert.rejects(
        () => getMarketQuote('EUR/USD-AUTHTEST3', 'dead-key-one'),
        /status 401/,
      );
      assert.equal(hits, afterFirst, '401 circuit breaker must not hammer Twelve Data again');
    } finally {
      globalThis.fetch = origFetch;
    }
  },
);

console.log('twelvedata-gateway-auth.selftest: ok');
