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
  assert.doesNotMatch(leader.displayName, /Miller/i, 'public Brent must not expose surname');
}

for (const img of ['richard-floyd.jpg', 'brent.jpg', 'brian-weber.jpg']) {
  const p = path.join(root, 'public/team', img);
  assert.ok(fs.existsSync(p) && fs.statSync(p).size > 1000, `missing ${img}`);
}

const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
assert.match(app, /currentPath === '\/company'/);
assert.match(app, /currentPath === '\/meet-the-board'/);
assert.ok(isPublicIdentityPath('/meet-the-board'));
assert.ok(isPublicIdentityPath('/leadership'));
assert.match(app, /currentPath === '\/founder'/);

const sitemap = fs.readFileSync(path.join(root, 'server.ts'), 'utf8');
assert.match(sitemap, /path: '\/company'/);
assert.match(sitemap, /path: '\/meet-the-board'/);
assert.match(sitemap, /path: '\/press'/);

const html = '<html><head><title>x</title></head><body></body></html>';
const enriched = enrichHtmlWithMetadata(html, '/company');
assert.match(enriched, new RegExp(ORG_LEGAL_NAME.replace('.', '\\.')));
assert.match(enriched, /Clear Path Markets Science Corp/);
assert.match(enriched, /instagram\.com\/clearpathtrader/);
assert.match(enriched, /2026-05-12/);

const leadershipHtml = enrichHtmlWithMetadata(html, '/meet-the-board');
assert.match(leadershipHtml, /Brian Weber/);
assert.match(leadershipHtml, /Chief Communications Officer/);
assert.match(leadershipHtml, /#brent-cco/);
assert.doesNotMatch(leadershipHtml, /Brent Miller/);
assert.doesNotMatch(leadershipHtml, /Dustin/);

console.log('leadership-identity.selftest.ts: OK');
