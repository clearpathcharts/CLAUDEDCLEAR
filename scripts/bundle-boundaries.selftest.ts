/**
 * Initial-load bundle boundaries for heavy optional runtimes.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const hls = fs.readFileSync(path.resolve('src/lib/cpms/hlsPlayer.ts'), 'utf8');
const vite = fs.readFileSync(path.resolve('vite.config.ts'), 'utf8');

assert.doesNotMatch(hls, /^import Hls from ['"]hls\.js['"]/m);
assert.match(hls, /import\(['"]hls\.js['"]\)/, 'hls.js must load only when an HLS stream plays.');
assert.match(hls, /cancelled/, 'late HLS imports must respect effect cleanup.');

for (const chunk of [
  'react-vendor',
  'hls-vendor',
  'motion-vendor',
  'firebase-vendor',
  'charts-vendor',
  'markdown-vendor',
  'd3-vendor',
  'date-vendor',
]) {
  assert.match(vite, new RegExp(`return ['"]${chunk}['"]`), `${chunk} boundary is missing.`);
}
assert.match(vite, /node_modules\/motion-dom\//);
assert.match(vite, /node_modules\/re2js\//);
assert.match(vite, /node_modules\/fancy-canvas\//);

console.log('bundle-boundaries.selftest: ok');
