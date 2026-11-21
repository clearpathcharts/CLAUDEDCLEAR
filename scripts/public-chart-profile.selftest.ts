/**
 * Public (signed-out) chart neuro-profile wiring.
 *
 * Guards the bug fixed in PR #304: PublicLiveChart must never hardcode
 * profileId="calm_focus" on LightweightCandles. The front-page NeuroProfilePicker
 * was removed (profiles live on signed-in desks / UI Modes); the public chart
 * still reads clearpath_current_profile_id so a prior choice paints correctly.
 *
 * Run: npx tsx scripts/public-chart-profile.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { themeProfiles, type ThemeProfileId } from '../src/lib/theme/profiles.ts';

const root = path.resolve('.');
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

const PROFILE_KEY = 'clearpath_current_profile_id';
const publicChart = read('src/components/PublicLiveChart.tsx');
const picker = read('src/components/charts/NeuroProfilePicker.tsx');
const marketUi = read('src/components/markets/LightweightMarketUI.tsx');

/** Spans of every `try { … }` block, so we can prove storage access is guarded. */
function tryBlockRanges(source: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  const open = /\btry\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = open.exec(source))) {
    let depth = 0;
    for (let i = m.index + m[0].length - 1; i < source.length; i += 1) {
      if (source[i] === '{') depth += 1;
      else if (source[i] === '}') {
        depth -= 1;
        if (depth === 0) {
          ranges.push([m.index, i]);
          break;
        }
      }
    }
  }
  return ranges;
}

assert.doesNotMatch(
  publicChart,
  /profileId\s*=\s*["']/,
  'PublicLiveChart must not pass a quoted profileId literal to LightweightCandles.',
);
assert.doesNotMatch(
  publicChart,
  /profileId\s*=\s*\{\s*["']/,
  'PublicLiveChart must not pass a quoted profileId literal wrapped in braces either.',
);
assert.match(
  publicChart,
  /profileId=\{profileId\}/,
  'LightweightCandles must receive the profileId state variable.',
);
assert.match(
  publicChart,
  /useState<ThemeProfileId>/,
  'The active profile must live in PublicLiveChart state.',
);

assert.match(
  publicChart,
  new RegExp(`['"]${PROFILE_KEY}['"]`),
  `PublicLiveChart must use the shared ${PROFILE_KEY} key.`,
);
for (const rel of ['src/components/Auth.tsx', 'src/literacy/panels.tsx']) {
  assert.ok(
    read(rel).includes(PROFILE_KEY),
    `${rel} no longer uses ${PROFILE_KEY} — the public chart key must stay shared with the signed-in app.`,
  );
}
assert.match(
  publicChart,
  /localStorage\.getItem\(PROFILE_STORAGE_KEY\)/,
  'PublicLiveChart must READ the saved profile.',
);

assert.match(
  publicChart,
  /in themeProfiles/,
  'A stored profile id must be validated against themeProfiles before use.',
);
assert.match(
  publicChart,
  /return 'calm_focus'|return "calm_focus"/,
  'An unknown or missing stored profile must fall back to calm_focus.',
);

const guarded = tryBlockRanges(publicChart);
const storageHits = [...publicChart.matchAll(/localStorage\./g)].map((m) => m.index ?? -1);
assert.ok(storageHits.length >= 1, 'expected a localStorage read in PublicLiveChart');
for (const at of storageHits) {
  assert.ok(
    guarded.some(([start, end]) => at > start && at < end),
    'Every localStorage access in PublicLiveChart must sit inside a try/catch.',
  );
}
assert.match(publicChart, /catch\s*\{/, 'storage failures must be swallowed, not rethrown');

assert.doesNotMatch(
  publicChart,
  /import\s*\{[^}]*NeuroProfilePicker/,
  'PublicLiveChart must not import NeuroProfilePicker on the front page.',
);
assert.doesNotMatch(
  publicChart,
  /<NeuroProfilePicker/,
  'PublicLiveChart must not render NeuroProfilePicker on the front page.',
);
assert.match(
  marketUi,
  /<NeuroProfilePicker/,
  'NeuroProfilePicker must remain available on LightweightMarketUI (signed-in desks).',
);

const orderBlock = picker.match(/PROFILE_ORDER:\s*ThemeProfileId\[\]\s*=\s*\[([\s\S]*?)\]/);
assert.ok(orderBlock, 'NeuroProfilePicker must declare a PROFILE_ORDER array of ThemeProfileId.');
const offered = [...orderBlock[1].matchAll(/['"]([a-z0-9_]+)['"]/g)].map((m) => m[1]);
const known = Object.keys(themeProfiles) as ThemeProfileId[];
assert.equal(new Set(offered).size, offered.length, `PROFILE_ORDER has duplicate ids: ${offered.join(', ')}`);
assert.deepEqual(
  [...offered].sort(),
  [...known].sort(),
  `NeuroProfilePicker must offer exactly the profiles defined in src/lib/theme/profiles.ts.`,
);
assert.ok(known.length >= 13, `expected at least the 13 shipped neuro profiles, found ${known.length}`);
assert.match(picker, /PROFILE_ORDER\.map\(/, 'The picker must render a button per PROFILE_ORDER entry.');

assert.match(publicChart, /data-public-chart-title/, 'The prominent symbol + timeframe title must stay.');
const titleAt = publicChart.indexOf('data-public-chart-title');
const titleBlock = publicChart.slice(titleAt, titleAt + 700);
assert.match(titleBlock, /\{symbol\}/, 'the public chart title must print the live symbol');
assert.match(titleBlock, /\{timeframe\}/, 'the public chart title must print the active timeframe');
assert.doesNotMatch(titleBlock, /sr-only/, 'the symbol title must be visible, not screen-reader only');

console.log('public-chart-profile.selftest: ok');
