/**
 * Private Login copies the MIT sci-fi CodePen look, but auth stays email + password.
 * Path cards still say Enter (guest). Reduced motion is required.
 *
 * Run: npx tsx scripts/private-login-scifi.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const license = read('legal/third-party/puma-murca-scifi-login-MIT.txt');
assert.match(license, /MIT License/);
assert.match(license, /Puma Murca/);
assert.match(license, /codepen\.io\/Puma-Murca\/pen\/gbOMMXp/);
assert.match(license, /email \+ password/);

const css = read('src/components/privateLoginSciFi.css');
assert.match(css, /codepen\.io\/Puma-Murca\/pen\/gbOMMXp/);
assert.match(css, /\.cp-scifi-login/);
assert.match(css, /cp-scifi-flicker/);
assert.match(css, /cp-scifi-glitch/);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /data-reduced-sensory/);
assert.doesNotMatch(css, /transform:\s*scale\(/);
assert.match(css, /Orbitron/);

const desk = read('src/components/PrivateLoginDesk.tsx');
assert.match(desk, /privateLoginSciFi\.css/);
assert.match(desk, /data-testid="private-login-scifi"/);
assert.match(desk, /Access Terminal/);
assert.match(desk, /SYSTEM ONLINE/);
assert.match(desk, /cp-scifi-login-body/);
assert.match(css, /\.cp-scifi-login-body/);
assert.doesNotMatch(
  css,
  /\.cp-scifi-login-panel \{[^}]*overflow-y:\s*auto/,
  'panel overflow must stay visible so [ SYSTEM ONLINE ] is not clipped',
);
assert.match(desk, /type="email"/);
assert.match(desk, /type=\{showPassword \? 'text' : 'password'\}/);
assert.match(desk, /loginPrivateAccount/);
assert.doesNotMatch(
  desk,
  /placeholder=["']Username["']/,
  'login must not copy the CodePen username-only field',
);

const choose = read('src/components/ChooseYourPath.tsx');
assert.match(choose, />\s*Enter\s*</);
assert.doesNotMatch(choose, />\s*Login\s*</);

const indexHtml = read('index.html');
const linkHref = indexHtml.match(/href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)"/);
assert.ok(linkHref, 'must have a single Google Fonts css2 stylesheet link');
assert.match(linkHref[1], /family=Orbitron:wght@400;700/);
assert.match(linkHref[1], /family=Inter/);
assert.match(linkHref[1], /family=IBM\+Plex\+Mono/);
assert.equal(
  (indexHtml.match(/fonts\.googleapis\.com\/css2/g) || []).length,
  1,
  'Orbitron must join the existing css2 link, not a second Google Fonts stylesheet',
);

console.log('private-login-scifi.selftest: ok');
