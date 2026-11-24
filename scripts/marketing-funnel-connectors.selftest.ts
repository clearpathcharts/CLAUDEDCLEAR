/**
 * Public funnel URL connector self-test.
 * Run: npx tsx scripts/marketing-funnel-connectors.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import tierContentCatalog from '../data/marketing/tier-content-catalog.json';
import { buildFunnelConnectorRedirect } from '../src/server/marketingFunnelRoutes';

const root = path.resolve('.');
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const tiers = ['basic', 'silver', 'gold', 'platinum'];

for (const tier of tiers) {
  for (const source of tierContentCatalog.channels) {
    const connector = buildFunnelConnectorRedirect(
      { tier, source, creative: 'poster' },
      {},
    );
    const destination = new URL(connector.location, 'https://clearpathtrader.com');
    assert.equal(destination.pathname, '/plans');
    assert.equal(destination.searchParams.get('offer'), tier);
    assert.equal(destination.searchParams.get('utm_source'), source);
    assert.equal(destination.searchParams.get('utm_campaign'), tierContentCatalog.campaign);
    assert.equal(destination.searchParams.get('utm_content'), `${tier}_poster`);
    assert.equal(connector.attribution.targetTier, tier);
    assert.equal(connector.attribution.source, source);
  }
}

const paid = buildFunnelConnectorRedirect(
  { tier: 'gold', source: 'instagram', creative: 'launch poster' },
  { medium: 'paid_social' },
);
const paidUrl = new URL(paid.location, 'https://clearpathtrader.com');
assert.equal(paidUrl.searchParams.get('utm_medium'), 'paid_social');
assert.equal(paidUrl.searchParams.get('utm_content'), 'gold_launch_poster');

const hostile = buildFunnelConnectorRedirect(
  {
    tier: 'https://evil.example',
    source: 'x',
    creative: '../../redirect=https://evil.example',
  },
  { medium: 'javascript:alert(1)' },
);
const hostileUrl = new URL(hostile.location, 'https://clearpathtrader.com');
assert.equal(hostileUrl.origin, 'https://clearpathtrader.com');
assert.equal(hostileUrl.pathname, '/plans');
assert.equal(hostileUrl.searchParams.get('offer'), 'basic');
assert.equal(hostileUrl.searchParams.get('utm_source'), 'direct');
assert.equal(hostileUrl.searchParams.get('utm_medium'), 'referral');
assert.ok(!hostile.location.includes('evil.example'));
assert.ok(!tierContentCatalog.channels.includes('x'));

const server = read('server.ts');
assert.match(server, /app\.use\('\/go', createMarketingConnectorRouter\(\)\)/);
const dashboard = read('src/components/MarketingFunnelDashboard.tsx');
assert.match(dashboard, /Funnel URL connector/);
assert.match(dashboard, /https:\/\/clearpathtrader\.com\/go\//);
assert.match(dashboard, /Copy URL/);

console.log('marketing-funnel-connectors.selftest: ok');
