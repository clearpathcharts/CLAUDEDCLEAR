/**
 * Public (signed-out) chart neuro-profile wiring.
 *
 * Guards the bug fixed in PR #304: PublicLiveChart passed
 * profileId="calm_focus" to <LightweightCandles> as a hardcoded string
 * literal, so the public chart was pinned to one palette, the other twelve
 * neuro-adaptive profiles were unreachable, the saved
 * clearpath_current_profile_id was ignored, and the White/Black/THEME control
 * looked like a dead button (THEME only means "background follows the active
 * profile", and that is already its default).
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

// 1. The profile must come from component state, never a literal. A quoted id
//    on the profileId prop is exactly how the public chart got pinned before.
assert.doesNotMatch(
  publicChart,
  /profileId\s*=\s*["']/,
  'PublicLiveChart must not pass a quoted profileId literal to LightweightCandles (the PR #304 bug: profileId="calm_focus" pinned the public chart to one palette).',
);
assert.doesNotMatch(
  publicChart,
  /profileId\s*=\s*\{\s*["']/,
  'PublicLiveChart must not pass a quoted profileId literal wrapped in braces either — same pinned-palette bug.',
);
assert.match(
  publicChart,
  /profileId=\{profileId\}/,
  'LightweightCandles must receive the profileId state variable so every neuro profile can paint the public chart.',
);
assert.match(
  publicChart,
  /useState<ThemeProfileId>/,
  'The active profile must live in PublicLiveChart state so the picker can change it.',
);

// 2. Same storage key as the desks / Auth / literacy panels, so a choice made
//    while signed out survives sign-in.
assert.match(
  publicChart,
  new RegExp(`['"]${PROFILE_KEY}['"]`),
  `PublicLiveChart must use the shared ${PROFILE_KEY} key so a signed-out profile choice survives sign-in.`,
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
  'PublicLiveChart must READ the saved profile; ignoring it was part of the PR #304 bug.',
);
assert.match(
  publicChart,
  /localStorage\.setItem\(PROFILE_STORAGE_KEY,/,
  'PublicLiveChart must PERSIST a picked profile so it survives a reload and sign-in.',
);

// 3. A stored value is untrusted input: validate against themeProfiles and fall
//    back to calm_focus instead of handing an unknown id to the chart.
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

// 4. Blocked / private-mode storage must not throw the public chart off screen.
const guarded = tryBlockRanges(publicChart);
const storageHits = [...publicChart.matchAll(/localStorage\./g)].map((m) => m.index ?? -1);
assert.ok(storageHits.length >= 2, 'expected both a localStorage read and write in PublicLiveChart');
for (const at of storageHits) {
  assert.ok(
    guarded.some(([start, end]) => at > start && at < end),
    'Every localStorage access in PublicLiveChart must sit inside a try/catch — private-mode or blocked storage must never break the signed-out chart.',
  );
}
assert.match(publicChart, /catch\s*\{/, 'storage failures must be swallowed, not rethrown');

// 5. The picker must actually be mounted on the public chart, otherwise the
//    unlocked profiles are still unreachable for signed-out visitors.
assert.match(
  publicChart,
  /import \{ NeuroProfilePicker \} from '\.\/charts\/NeuroProfilePicker'/,
  'PublicLiveChart must import NeuroProfilePicker.',
);
assert.match(
  publicChart,
  /<NeuroProfilePicker/,
  'PublicLiveChart must render NeuroProfilePicker, or signed-out visitors cannot switch profiles.',
);
assert.match(
  publicChart,
  /activeProfileId=\{profileId\}/,
  'The picker must be told which profile is active.',
);
assert.match(
  publicChart,
  /onProfileChange=\{changeProfile\}/,
  'Picking a profile must run the handler that updates state and persists the choice.',
);

// 6. Every profile in src/lib/theme/profiles.ts must be offered by the picker.
//    Counts are derived from both real sources, never hardcoded twice.
const orderBlock = picker.match(/PROFILE_ORDER:\s*ThemeProfileId\[\]\s*=\s*\[([\s\S]*?)\]/);
assert.ok(orderBlock, 'NeuroProfilePicker must declare a PROFILE_ORDER array of ThemeProfileId.');
const offered = [...orderBlock[1].matchAll(/['"]([a-z0-9_]+)['"]/g)].map((m) => m[1]);
const known = Object.keys(themeProfiles) as ThemeProfileId[];
assert.equal(
  new Set(offered).size,
  offered.length,
  `PROFILE_ORDER has duplicate ids: ${offered.join(', ')}`,
);
assert.deepEqual(
  [...offered].sort(),
  [...known].sort(),
  `NeuroProfilePicker must offer exactly the profiles defined in src/lib/theme/profiles.ts. Offered ${offered.length}, defined ${known.length}. A missing id is unreachable from the UI — that is the bug this test exists for.`,
);
assert.ok(
  known.length >= 13,
  `expected at least the 13 shipped neuro profiles, found ${known.length}`,
);
assert.match(
  picker,
  /PROFILE_ORDER\.map\(/,
  'The picker must render a button per PROFILE_ORDER entry.',
);

// 7. Second founder-reported bug: the signed-out chart had no visible symbol.
//    The big symbol + timeframe heading must stay.
assert.match(
  publicChart,
  /data-public-chart-title/,
  'The prominent symbol + timeframe title must stay on the public chart (founder-reported: visitors could not tell what they were looking at).',
);
const titleAt = publicChart.indexOf('data-public-chart-title');
const titleBlock = publicChart.slice(titleAt, titleAt + 700);
assert.match(titleBlock, /\{symbol\}/, 'the public chart title must print the live symbol');
assert.match(titleBlock, /\{timeframe\}/, 'the public chart title must print the active timeframe');
assert.doesNotMatch(titleBlock, /sr-only/, 'the symbol title must be visible, not screen-reader only');

console.log('public-chart-profile.selftest: ok');
