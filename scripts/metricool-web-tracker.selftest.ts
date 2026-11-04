/**
 * Metricool web tracker injection + CSP nonce.
 * Run: npx tsx scripts/metricool-web-tracker.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { enrichHtmlWithMetadata } from '../src/server/semanticDatabase.ts';
import { injectMetricoolWebTracker, resolveMetricoolWebTrackerHash } from '../src/server/metricoolWebTracker.ts';

const shell = fs.readFileSync('index.html', 'utf8');

delete process.env.METRICOOL_WEB_TRACKER_HASH;
assert.ok(resolveMetricoolWebTrackerHash(), 'default hash resolves');

const injected = injectMetricoolWebTracker('<html><head></head><body></body></html>', 'testnonce123');
assert.match(injected, /tracker\.metricool\.com\/resources\/be\.js/);
assert.match(injected, /nonce="testnonce123"/);
assert.match(injected, /87d90095f246ade12a9caaf38296b391/);

process.env.METRICOOL_WEB_TRACKER_HASH = '0';
assert.equal(resolveMetricoolWebTrackerHash(), null);
assert.equal(injectMetricoolWebTracker(shell), shell);

delete process.env.METRICOOL_WEB_TRACKER_HASH;
const enriched = enrichHtmlWithMetadata(shell, '/', { cspNonce: 'abc123def456' });
assert.match(enriched, /beTracker\.t\(\{hash:/);
assert.match(enriched, /nonce="abc123def456"/);

const serverSrc = fs.readFileSync('server.ts', 'utf8');
assert.match(serverSrc, /tracker\.metricool\.com/, 'prod CSP must allow Metricool tracker scripts');

console.log('metricool-web-tracker.selftest: ok');
