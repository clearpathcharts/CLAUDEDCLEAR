/**
 * Login choose-your-path: heading, no guest Enter (Private Login only),
 * public full-size chart with search, manifesto copy must not remain on login.
 *
 * Run: npx tsx scripts/choose-path.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { NEURODIVERGENT_BANNER, PATH_CARDS } from '../src/content/chooseYourPath.ts';

const root = path.resolve('.');

async function assertNativeImage(rel: string, width: number, height: number) {
  const abs = path.join(root, 'public', rel.replace(/^\//, ''));
  assert.ok(fs.existsSync(abs), `missing ${rel}`);
  const meta = await sharp(abs).metadata();
  assert.equal(meta.width, width, `${rel} width`);
  assert.equal(meta.height, height, `${rel} height`);
}

const auth = fs.readFileSync(path.join(root, 'src/components/Auth.tsx'), 'utf8');
assert.match(auth, /ChooseYourPath/);
assert.match(auth, /#choose-path/);
assert.match(auth, /enterChosenPath/);
assert.match(auth, /rememberTraderDesk/);
assert.match(auth, /openPrivateLogin\('login'\)/);
assert.match(auth, /if \(user\) \{\s*navigateToDesk\(deskId\)/);
assert.doesNotMatch(auth, /loginChosenPath/);
assert.match(auth, /PublicLiveChart/);
assert.match(auth, /#public-chart/);
assert.match(auth, /data-auth-chart-first/);
assert.match(auth, /order-1 md:order-2/);
assert.match(auth, /Site menu/);
assert.doesNotMatch(auth, /Some people see patterns/);
assert.doesNotMatch(auth, /KNOWLEDGE BEFORE EXECUTION/);
assert.doesNotMatch(auth, /Charts should adapt to people/);
assert.doesNotMatch(auth, /CONNECTED REALM/);
assert.doesNotMatch(auth, /THE CLEARPATH GLOBAL NETWORK/);
assert.doesNotMatch(auth, /EXPERIENCE THE LIVING NETWORK/);
assert.doesNotMatch(auth, /DISCOVER SWARMS/);
assert.doesNotMatch(auth, /COGNITIVE 2D WORLD MAP/);
assert.doesNotMatch(auth, /MediaGrid/);
assert.doesNotMatch(auth, /GlobalNetworkGlobe/);
assert.doesNotMatch(auth, /globe_country_configs/);
assert.doesNotMatch(auth, /CEO Rollout Wave Mission-Control/);
assert.doesNotMatch(auth, /SOFT LAUNCH STARTS IN/);
assert.doesNotMatch(auth, /Your Private Login Desk/);
assert.doesNotMatch(auth, /id=["']ecosystem["']/);
assert.doesNotMatch(auth, /id=["']soft-launch["']/);
assert.doesNotMatch(auth, /The Ecosystem/);
assert.doesNotMatch(auth, /Soft Launch/);

const ui = fs.readFileSync(path.join(root, 'src/components/ChooseYourPath.tsx'), 'utf8');
assert.match(ui, /Welcome to ClearPath Trader Please choose your path/);
assert.match(ui, /onChoosePath/);
assert.match(ui, /Private Login to open/);
assert.doesNotMatch(ui, />\s*Enter\s*</);
assert.doesNotMatch(ui, /PathEnter/);
assert.doesNotMatch(ui, />\s*Login\s*</);
assert.match(ui, /grid-cols-3/);
assert.match(ui, /justify-center/);
assert.doesNotMatch(ui, /hover:scale/);
assert.match(ui, /maxWidth/);

const about = fs.readFileSync(path.join(root, 'src/components/ExternalAboutPage.tsx'), 'utf8');
assert.match(about, /ABOUT_MANIFESTO_LEAD/);

const publicChart = fs.readFileSync(path.join(root, 'src/components/PublicLiveChart.tsx'), 'utf8');
assert.match(publicChart, /id=["']public-chart["']/);
assert.match(publicChart, /ChartSymbolSearch/);
assert.match(publicChart, /LightweightCandles/);
assert.match(publicChart, /min-h-\[85vh\]/);

for (const card of PATH_CARDS) {
  await assertNativeImage(card.png, card.width, card.height);
  await assertNativeImage(card.webp, card.width, card.height);
}
await assertNativeImage(NEURODIVERGENT_BANNER.png, NEURODIVERGENT_BANNER.width, NEURODIVERGENT_BANNER.height);
await assertNativeImage(NEURODIVERGENT_BANNER.webp, NEURODIVERGENT_BANNER.width, NEURODIVERGENT_BANNER.height);

console.log('choose-path.selftest: ok');
