import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

assert.match(read('src/App.tsx'), /isPitchPath/, 'App must route /pitch');
assert.match(read('src/App.tsx'), /InvestorPitchDeck/, 'App must mount pitch deck');
const data = read('src/pitch/pitchDeckData.ts');
assert.match(data, /export const PITCH_SLIDES/, 'pitch slides defined');
const slideCount = (data.match(/^\s+id: '/gm) || []).length;
assert.ok(slideCount >= 10, `expected 10 pitch slides, saw ${slideCount}`);
assert.match(data, /\$1\.5M seed financing via SAFE/, 'raise slide must include SAFE');
assert.match(read('src/components/pitch/InvestorPitchDeck.tsx'), /BrandMark/, 'deck must use flame brand mark');

console.log('pitch-deck.selftest: ok');
