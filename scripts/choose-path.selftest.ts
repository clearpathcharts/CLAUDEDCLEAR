/**
 * Login "choose your path" images stay at native pixel size (no upscale).
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

const ui = fs.readFileSync(path.join(root, 'src/components/ChooseYourPath.tsx'), 'utf8');
assert.match(ui, /Welcome to ClearPathTrader\.com/i);
assert.match(ui, /Please choose your path/i);
assert.doesNotMatch(ui, /hover:scale/);
assert.match(ui, /maxWidth/);

for (const card of PATH_CARDS) {
  await assertNativeImage(card.png, card.width, card.height);
  await assertNativeImage(card.webp, card.width, card.height);
}
await assertNativeImage(NEURODIVERGENT_BANNER.png, NEURODIVERGENT_BANNER.width, NEURODIVERGENT_BANNER.height);
await assertNativeImage(NEURODIVERGENT_BANNER.webp, NEURODIVERGENT_BANNER.width, NEURODIVERGENT_BANNER.height);

console.log('choose-path.selftest: ok');
