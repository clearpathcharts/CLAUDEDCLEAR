/**
 * Keyword-to-route registry self-test.
 * Run: npx tsx scripts/marketing-route-registry.selftest.ts
 */
import assert from 'node:assert/strict';
import {
  assertMarketingRouteRegistryIntegrity,
  getAllKeywordRouteAssignments,
  getApprovedKeywordsForPath,
  mergeApprovedMarketingKeywords,
} from '../src/lib/marketingRouteRegistry';
import { enrichHtmlWithMetadata } from '../src/server/semanticDatabase';

assert.doesNotThrow(() => assertMarketingRouteRegistryIntegrity());

const assignments = getAllKeywordRouteAssignments();
const master = assignments.filter((assignment) => assignment.source === 'master');
const platform = assignments.filter((assignment) => assignment.source === 'platform');
const researchOnly = assignments.filter((assignment) => assignment.status === 'research_only');

assert.equal(master.length, 100, 'all 100 foundational terms must be represented');
assert.ok(platform.length >= 130, 'platform language records must remain represented');
assert.ok(
  master.every(
    (assignment) =>
      assignment.status === 'research_only' ||
      Boolean(assignment.canonicalPath && assignment.absoluteUrl),
  ),
  'every foundational term must be linked or explicitly held for review',
);
assert.ok(
  platform.every(
    (assignment) =>
      assignment.status === 'research_only' ||
      Boolean(assignment.canonicalPath && assignment.absoluteUrl),
  ),
  'every platform term must be linked or explicitly held for review',
);
assert.ok(researchOnly.length >= 14);
assert.ok(researchOnly.every((assignment) => !assignment.canonicalPath && !assignment.publicMeta));

const assignmentFor = (keyword: string, source: 'master' | 'neurodivergent' = 'master') =>
  assignments.find(
    (assignment) =>
      assignment.source === source && assignment.keyword.toLowerCase() === keyword.toLowerCase(),
  );

assert.equal(assignmentFor('stock trading')?.canonicalPath, '/stocks');
assert.equal(assignmentFor('forex trading')?.canonicalPath, '/forex');
assert.equal(assignmentFor('technical analysis')?.canonicalPath, '/indicators');
assert.equal(assignmentFor('company valuation')?.canonicalPath, '/learn/valuation');
assert.equal(assignmentFor('market microstructure')?.canonicalPath, '/learn/microstructure');
assert.equal(assignmentFor('liquidity analysis')?.canonicalPath, '/learn/liquidity');
assert.equal(
  assignmentFor('trading with ADHD', 'neurodivergent')?.canonicalPath,
  '/desk/neurodivergent',
);
assert.equal(assignmentFor('Level 2 market data')?.status, 'research_only');
assert.equal(assignmentFor('prime brokerage')?.status, 'research_only');
assert.equal(assignmentFor('high frequency trading')?.canonicalPath, null);

for (const path of [
  '/',
  '/stocks',
  '/forex',
  '/indicators',
  '/education',
  '/desk/institutional',
  '/desk/neurodivergent',
]) {
  assert.ok(getApprovedKeywordsForPath(path).length > 0, `${path} needs approved linked terms`);
  assert.ok(getApprovedKeywordsForPath(path).length <= 6, `${path} exceeds registry keyword limit`);
}

const merged = mergeApprovedMarketingKeywords(
  '/indicators',
  'ClearPath Trader, technical indicators, educational charts',
);
assert.ok(merged.split(',').length <= 12);
assert.match(merged, /technical analysis/i);
assert.doesNotMatch(merged, /Level 2|prime brokerage|high frequency/i);

const html = enrichHtmlWithMetadata(
  '<!doctype html><html><head><title>Placeholder</title></head><body></body></html>',
  '/indicators',
);
const keywordMeta = html.match(/<meta name="keywords" content="([^"]+)"/i)?.[1] || '';
assert.match(keywordMeta, /technical analysis/i);
assert.doesNotMatch(keywordMeta, /Level 2|prime brokerage|high frequency/i);
assert.ok(keywordMeta.split(',').length <= 12);

console.log('marketing-route-registry.selftest: ok');
