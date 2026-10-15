/**
 * Identity + plans + brokers pages must ship SSR metadata and bot HTML.
 * Run: npm run test:identity-pages-seo
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { enrichHtmlWithMetadata } from '../src/server/semanticDatabase.ts';
import { renderStaticIdentityPageForBots } from '../src/server/contentPages.ts';

const shell = '<html><head><title>x</title></head><body></body></html>';

const paths = [
  '/company',
  '/meet-the-board',
  '/founder',
  '/press',
  '/plans',
  '/brokers',
] as const;

for (const p of paths) {
  const bot = renderStaticIdentityPageForBots(p);
  assert.ok(bot, `missing bot HTML for ${p}`);
  assert.match(bot!, /<h1[^>]*>/i, `${p} needs h1 for crawlers`);
  const enriched = enrichHtmlWithMetadata(bot!, p);
  assert.match(enriched, /<title>[^<]+<\/title>/, `${p} title`);
  assert.match(enriched, /<meta\s+name="description"\s+content="[^"]+"/, `${p} description`);
  assert.match(enriched, /<link\s+rel="canonical"\s+href="https:\/\/clearpathtrader\.com/, `${p} canonical`);
  assert.match(enriched, /"@type": "Organization"/, `${p} organization schema`);
  assert.match(enriched, /"@type": "WebSite"/, `${p} website schema`);
  assert.doesNotMatch(enriched, /trading terminal/i, `${p} avoid stale terminal copy`);
}

const plansMeta = enrichHtmlWithMetadata(shell, '/plans');
assert.match(plansMeta, /Membership Plans \| ClearPath Trader/);
assert.match(plansMeta, /canonical"\s+href="https:\/\/clearpathtrader\.com\/plans"/);

const membershipAlias = enrichHtmlWithMetadata(shell, '/membership');
assert.match(membershipAlias, /canonical"\s+href="https:\/\/clearpathtrader\.com\/plans"/);

const board = enrichHtmlWithMetadata(shell, '/meet-the-board');
assert.match(board, /"@type": "Person"/);
assert.match(board, /Brian Weber/);

const server = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');
assert.match(server, /path: '\/plans'/);
assert.match(server, /path: '\/brokers'/);
assert.match(server, /redirect\(301, `\/plans/);

console.log('identity-pages-seo.selftest: ok');
