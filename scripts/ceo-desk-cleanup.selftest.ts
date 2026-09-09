/**
 * CEO / Home desk cleanup:
 * - Seeking Alpha / breaking news ticker steps every 3 seconds
 * - dead Contacts rail is gone
 * - Appealing Additions + Free literacy boxes are off the Home desk chrome
 *
 * Run: npx tsx scripts/ceo-desk-cleanup.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

const ticker = read('src/components/BreakingNewsTicker.tsx');
assert.match(ticker, /export const BREAKING_NEWS_TICKER_INTERVAL_MS = 3000/);
assert.match(ticker, /setInterval/);
assert.doesNotMatch(ticker, /animate-\[marquee_50s/);
assert.doesNotMatch(ticker, /@keyframes marquee/);

const dashboard = read('src/components/Dashboard.tsx');
assert.doesNotMatch(dashboard, /No contacts yet/);
assert.doesNotMatch(dashboard, />Contacts</);
assert.doesNotMatch(dashboard, /Open live chat/);
assert.doesNotMatch(dashboard, /cp_contacts_sidebar_open/);
assert.doesNotMatch(dashboard, /cp_show_homepage_contacts/);

const home = read('src/components/DiscoveryFeed.tsx');
assert.doesNotMatch(home, /Appealing Additions/);
assert.doesNotMatch(home, /Free literacy certificates/);
assert.doesNotMatch(home, /Coming into the desk/);
assert.doesNotMatch(home, /id="certificate-desk"/);

const guides = read('src/sectionGuides/catalog.ts');
assert.doesNotMatch(guides, /id: '06-appealing-additions'/);
assert.match(guides, /id: '06-home-map'/);

console.log('ceo-desk-cleanup.selftest: ok');
