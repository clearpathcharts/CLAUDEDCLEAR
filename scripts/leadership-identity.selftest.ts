/**
 * Public leadership / company identity routes and schema hooks.
 * Run: npx tsx scripts/leadership-identity.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { enrichHtmlWithMetadata } from '../src/server/semanticDatabase.ts';
import { PUBLIC_LEADERS } from '../src/content/leadershipPublic.ts';
import { ORG_INSTAGRAM_URL, ORG_LEGAL_NAME } from '../src/content/organizationPublic.ts';
import { isPublicIdentityPath } from '../src/lib/publicIdentityRoutes.ts';

const root = process.cwd();

for (const leader of PUBLIC_LEADERS) {
  assert.ok(leader.imageUrl.startsWith('/team/'), `${leader.id} image must be under /team/`);
}

for (const img of ['richard-floyd.jpg', 'brent.jpg', 'brian-weber.jpg', 'sarah-weber.jpg']) {
  const p = path.join(root, 'public/team', img);
  assert.ok(fs.existsSync(p) && fs.statSync(p).size > 1000, `missing ${img}`);
}
assert.ok(
  PUBLIC_LEADERS.some((l) => l.id === 'sarah-weber'),
  'Sarah Weber must appear on the public board',
);
assert.equal(
  PUBLIC_LEADERS.find((l) => l.id === 'sarah-weber')?.boardLoginName,
  undefined,
  'Sarah stays public-only until a board portal passcode is issued',
);

const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
assert.match(app, /currentPath === '\/company'/);
assert.match(app, /currentPath === '\/meet-the-board'/);
assert.ok(isPublicIdentityPath('/meet-the-board'));
assert.ok(isPublicIdentityPath('/leadership'));
assert.match(app, /currentPath === '\/founder'/);

const sitemap = fs.readFileSync(path.join(root, 'src/server/siteRegistry.ts'), 'utf8');
assert.match(sitemap, /\/company/);
assert.match(sitemap, /\/meet-the-board/);
assert.match(sitemap, /\/press/);

const html = '<html><head><title>x</title></head><body></body></html>';
const enriched = enrichHtmlWithMetadata(html, '/company');
assert.match(enriched, new RegExp(ORG_LEGAL_NAME.replace('.', '\\.')));
assert.match(enriched, /Clear Path Markets Science Corp/);
assert.match(enriched, /instagram\.com\/clearpathtrader/);
assert.match(enriched, /2026-05-12/);

const leadershipHtml = enrichHtmlWithMetadata(html, '/meet-the-board');
assert.match(leadershipHtml, /Brian Weber/);
assert.match(leadershipHtml, /Sarah Weber/);
assert.match(leadershipHtml, /Brent Miller/);
assert.match(leadershipHtml, /Chief Technology Officer/);
assert.match(leadershipHtml, /Embry-Riddle Aeronautical University/);
assert.match(leadershipHtml, /#brent-miller/);
assert.doesNotMatch(leadershipHtml, /Chief Communications Officer/);
assert.doesNotMatch(leadershipHtml, /Dustin/);

console.log('leadership-identity.selftest.ts: OK');
