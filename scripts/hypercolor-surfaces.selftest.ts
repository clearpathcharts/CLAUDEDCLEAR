/**
 * Hypercolor regression contract for the public and member surfaces refreshed
 * during the October visual pass.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  BRAND_GRADIENT,
  HYPERCOLOR_BRAND_STOPS,
  SEQUENCE_ACCENTS,
  TIER_GRADIENT,
} from '../src/lib/tierGradients.ts';

const read = (relative: string) => fs.readFileSync(path.resolve(relative), 'utf8');

assert.deepEqual([...HYPERCOLOR_BRAND_STOPS], ['#5B00FF', '#FF007F', '#FF6A00']);
for (const stop of HYPERCOLOR_BRAND_STOPS) {
  assert.match(BRAND_GRADIENT.toUpperCase(), new RegExp(stop));
}
assert.equal(SEQUENCE_ACCENTS.length, 4);
assert.equal(TIER_GRADIENT.basic.from, '#00E5FF');
assert.equal(TIER_GRADIENT.gold.to, '#FFD700');
assert.equal(TIER_GRADIENT.platinum.from, '#FF007F');

const contracts: Array<[string, RegExp[]]> = [
  ['src/components/community/CommunityHub.tsx', [/tierGradient\.css/, /tierAccentVars/, /cp-grad-panel/]],
  ['src/components/NewsPanel.tsx', [/tierGradient\.css/, /cp-grad-title/, /cp-grad-panel/]],
  ['src/components/ProfileHub.tsx', [/tierGradient\.css/, /sequenceAccentVars/, /cp-grad-edge/]],
  ['src/components/profile/AffiliateDashboard.tsx', [/tierGradient\.css/, /cp-grad-edge/]],
  ['src/components/membership/MembershipPricingPage.tsx', [/tierAccentVars/, /membership-plan-card/]],
  ['src/education/ClearPathEducation.tsx', [/accentSurface/, /accentHeading/]],
  ['src/components/broker/UsBrokerNetworkPage.tsx', [/broker-card--\$\{state\}/, /broker-hero/]],
  ['src/components/ExternalAboutPage.tsx', [/BrandMark/, /lava-hot-text/, /lava-hot-gradient/]],
  ['src/components/PublicMemberProfile.tsx', [/from-\[#ff2ea6\]/, /to-\[#00e5ff\]/]],
];

for (const [file, patterns] of contracts) {
  const source = read(file);
  for (const pattern of patterns) {
    assert.match(source, pattern, `${file} lost its hypercolor contract ${pattern}.`);
  }
}

const membershipCss = read('src/components/membership/membershipPricing.css');
const brokerCss = read('src/components/broker/usBrokerNetwork.css');
for (const [name, source] of [
  ['Plans', membershipCss],
  ['Brokers', brokerCss],
] as const) {
  assert.match(source, /linear-gradient/i, `${name} must keep its gradient surface treatment.`);
  assert.match(source, /#5b00ff/i, `${name} must retain the purple brand stop.`);
  assert.match(source, /#ff007f/i, `${name} must retain the pink brand stop.`);
  assert.match(source, /#ff6a00/i, `${name} must retain the orange brand stop.`);
}

console.log('hypercolor-surfaces.selftest: ok');
