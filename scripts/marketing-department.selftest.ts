/**
 * CEO Marketing Department:
 * - the page list it shows is the exact list the XML sitemaps serve
 * - every route is founder-gated (401 / 403)
 * - unconnected sources report DATA UNAVAILABLE / NOT CONFIGURED, never a number
 * - drafts carry the tracked link and required disclaimer and fit platform limits
 * - "posted" requires a real https link; nothing auto-posts
 * - every platform gets its own wording; AI output with claims, invented
 *   numbers or repeated phrasing is rejected
 *
 * Run: npx tsx scripts/marketing-department.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import express from 'express';

process.env.NODE_ENV = 'development';
process.env.CLEARPATH_DISABLE_FIRESTORE_ADMIN = '1';
process.env.CATALOG_ADMIN_SECRET = 'selftest-catalog-secret';
delete process.env.CEO_VIDEO_BUCKET;
delete process.env.FIREBASE_STORAGE_BUCKET;
delete process.env.METRICOOL_TOKEN;
delete process.env.GROQ_API_KEY;

const root = path.resolve('.');
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');
const outboxDir = path.join(root, 'data', 'marketing-outbox');
const outboxExisted = fs.existsSync(outboxDir);

// ---------------------------------------------------------------- static ----

const server = read('server.ts');
const mount = server.match(/app\.use\(\s*'\/api\/ceo\/marketing',[\s\S]{0,260}?\);/);
assert.ok(mount, 'server.ts mounts /api/ceo/marketing');
assert.match(mount![0], /requireFounderOrCatalogAdmin/, 'marketing routes keep the founder gate');
assert.match(mount![0], /requireFounderActionHeader/, 'marketing routes keep the founder action header');
assert.match(server, /for \(const section of SITEMAP_SECTIONS\)/, 'XML sitemap routes come from the shared registry');
assert.doesNotMatch(server, /app\.get\('\/sitemap-pages\.xml'/, 'no second hand-written copy of the page list');

const assetsSrc = read('src/server/marketingAssets.ts');
assert.doesNotMatch(assetsSrc, /from\s+'(node:)?fs(\/promises)?'/, 'asset storage never touches local disk');
assert.match(assetsSrc, /createResumableUpload/, 'uploads go direct to the bucket');

const outboxSrc = read('src/server/marketingOutbox.ts');
assert.doesNotMatch(outboxSrc, /fetch\(|axios|graph\.facebook|api\.metricool/i, 'outbox never posts anywhere by itself');
const copySrc = read('src/server/marketingCopywriter.ts');
const fetchTargets = [...copySrc.matchAll(/fetch\('([^']+)'/g)].map((m) => m[1]);
assert.deepEqual(fetchTargets, ['https://api.groq.com/openai/v1/chat/completions'], 'copywriter only talks to the AI writer, never to a social platform');

const ui = read('src/components/marketing/MarketingDepartment.tsx');
assert.doesNotMatch(ui, /Math\.random/, 'no invented numbers in the UI');
for (const marker of ['data-mkt-pipeline', 'data-mkt-upload', 'data-mkt-library', 'data-mkt-outbox', 'data-mkt-destinations', 'data-mkt-search', 'data-mkt-sitemap']) {
  assert.match(ui, new RegExp(marker), `${marker} bento exists`);
}
assert.match(ui, /upload\.onprogress/, 'uploads show real progress');

const ceo = read('src/components/CeoDashboard.tsx');
assert.match(ceo, /<MarketingDepartment getHeaders=\{founderApiHeaders\}/, 'CEO Dashboard renders the department with founder headers');
assert.match(ceo, /data-ceo-marketing-tab/, 'CEO tab exists');
assert.match(ceo, /#marketing/, 'deep link #marketing works');

async function main() {
  // ------------------------------------------------------- registry ----
  const registry = await import('../src/server/siteRegistry.ts');
  const all = registry.listSiteUrls();
  let xmlTotal = 0;
  for (const section of registry.SITEMAP_SECTIONS) {
    const xml = registry.sectionXml(section);
    const count = (xml.match(/<url>/g) || []).length;
    assert.equal(count, section.entries().length, `${section.file} XML matches its registry entries`);
    xmlTotal += count;
  }
  assert.equal(all.length, xmlTotal, 'dashboard page list equals the XML sitemap URL count');
  assert.ok(all.length > 2000, `site has its full catalog (${all.length} URLs)`);
  const index = registry.sitemapIndexXml();
  for (const section of registry.SITEMAP_SECTIONS) {
    assert.ok(index.includes(`https://clearpathtrader.com/${section.file}`), `${section.file} is in sitemap.xml`);
  }
  assert.ok(registry.priorityIndexNowUrls().every((u: string) => u.startsWith('https://clearpathtrader.com/')));

  // ---------------------------------------------------------- outbox ----
  const outbox = await import('../src/server/marketingOutbox.ts');
  const catalog = JSON.parse(read('data/marketing/tier-content-catalog.json'));
  const asset = { id: 'a'.repeat(16), kind: 'image' as const, url: 'https://storage.googleapis.com/x/y.png', title: 'Start with the chart' };
  const drafts = await outbox.planOutboxPosts({ asset, platforms: outbox.MARKETING_CHANNELS, tier: 'gold', ai: null });
  assert.equal(drafts.length, outbox.MARKETING_CHANNELS.length, 'one draft per destination');
  for (const d of drafts) {
    assert.equal(d.status, 'draft', 'new posts start as drafts, never posted');
    assert.equal(d.trackedLink, `https://clearpathtrader.com/go/gold/${d.platform}/${asset.id}`);
    assert.ok(d.caption.includes(d.trackedLink), `${d.platform} caption carries the tracked link`);
    assert.ok(d.caption.includes(catalog.requiredDisclaimer), `${d.platform} caption carries the disclaimer`);
  }
  const copy = await import('../src/server/marketingCopywriter.ts');
  for (let i = 0; i < drafts.length; i += 1) {
    assert.equal(drafts[i]!.copySource, 'template', 'no AI key -> built-in writer');
    for (let j = i + 1; j < drafts.length; j += 1) {
      const overlap = copy.similarity(drafts[i]!.body!, drafts[j]!.body!);
      assert.ok(overlap <= copy.MAX_SIMILARITY, `${drafts[i]!.platform} vs ${drafts[j]!.platform} overlap ${overlap.toFixed(2)} is too similar`);
    }
  }
  assert.equal(new Set(drafts.map((d) => d.body)).size, drafts.length, 'no two platforms get the same wording');

  const rewritten = await outbox.rewriteOutboxPost(drafts[1]!.id, null);
  assert.notEqual(rewritten.body, drafts[1]!.body, 'Rewrite produces new wording');
  assert.ok(rewritten.caption.includes(catalog.requiredDisclaimer) && rewritten.caption.includes(rewritten.trackedLink));

  const facts = copy.factsFor('gold', 'Start with the chart');
  const voice = copy.PLATFORM_VOICES.instagram!;
  assert.match(String(copy.validateBody('Guaranteed profits every week with Gold.', facts, voice)), /claim/);
  assert.match(String(copy.validateBody('Gold users hit a 70% win rate.', facts, voice)), /claim|number/);
  assert.match(String(copy.validateBody('Gold is only $4.99 this week.', facts, voice)), /price/);
  assert.match(String(copy.validateBody('Join 50000 traders on Gold today.', facts, voice)), /number/);
  assert.equal(copy.validateBody('Gold is $9.93/mo and lets you study chart patterns.', facts, voice), null, 'real price from the plan sheet is allowed');

  // AI that makes claims or repeats itself is thrown out; clean unique AI copy is kept.
  const liar = async () => 'Guaranteed returns with our signals!';
  const liarOut = await copy.writeUniqueBodies({ platforms: ['instagram'], facts, recent: [], ai: liar });
  assert.equal(liarOut.instagram!.source, 'template', 'AI claims are rejected');
  const parrot = async () => 'Study chart patterns on Gold and bring your own indicator logic into a ten chart workspace today.';
  const parrotOut = await copy.writeUniqueBodies({ platforms: ['instagram', 'facebook'], facts, recent: [], ai: parrot });
  assert.equal(parrotOut.instagram!.source, 'ai');
  assert.equal(parrotOut.facebook!.source, 'template', 'AI repeating itself is rejected for the next platform');
  let n = 0;
  const fresh = async () =>
    [
      'Gold marks supported chart patterns so you can study structure right on the chart.',
      'Curious how indicator logic you already wrote looks on a ClearPath chart? Gold lets you try it.',
    ][n++ % 2]!;
  const freshOut = await copy.writeUniqueBodies({ platforms: ['instagram', 'facebook'], facts, recent: [], ai: fresh });
  assert.equal(freshOut.instagram!.source, 'ai');
  assert.equal(freshOut.facebook!.source, 'ai', 'distinct clean AI copy is kept');

  const bluesky = drafts.find((d) => d.platform === 'bluesky')!;
  assert.ok(bluesky.caption.length <= 300, 'Bluesky caption fits 300 chars');
  assert.equal(drafts.find((d) => d.platform === 'reddit')!.hashtags.length, 0, 'no hashtags on Reddit');
  await assert.rejects(
    outbox.planOutboxPosts({ asset, platforms: ['myspace'], tier: 'gold' }),
    /destination/,
    'unknown platforms are refused'
  );

  const first = drafts[0]!;
  await assert.rejects(outbox.updateOutboxPost(first.id, { status: 'posted' }), /live post link/, 'posted needs a real link');
  await assert.rejects(outbox.updateOutboxPost(first.id, { postedUrl: 'javascript:alert(1)' }), /https/, 'only https links');
  await assert.rejects(outbox.updateOutboxPost(first.id, { caption: 'Buy now!' }), /disclaimer/, 'disclaimer cannot be edited out');
  const approved = await outbox.updateOutboxPost(first.id, { status: 'approved' });
  assert.ok(approved.approvedAt);
  const posted = await outbox.updateOutboxPost(first.id, { postedUrl: 'https://example.com/p/1', status: 'posted' });
  assert.equal(posted.status, 'posted');
  for (const d of drafts) await outbox.deleteOutboxPost(d.id);

  // ----------------------------------------------------- live gating ----
  const { requireFounderOrCatalogAdmin, requireFounderActionHeader } = await import('../src/server/authGuards.ts');
  const { createMarketingDepartmentRouter } = await import('../src/server/marketingDepartmentRoutes.ts');
  const app = express();
  app.use(express.json());
  app.use('/api/ceo/marketing', requireFounderOrCatalogAdmin, requireFounderActionHeader, createMarketingDepartmentRouter());
  const listener = http.createServer(app);
  await new Promise<void>((resolve) => listener.listen(0, '127.0.0.1', resolve));
  const { port } = listener.address() as { port: number };
  const base = `http://127.0.0.1:${port}`;
  const call = (p: string, init?: RequestInit) => fetch(`${base}${p}`, init);
  const founder = {
    'content-type': 'application/json',
    'x-catalog-admin-secret': 'selftest-catalog-secret',
    'x-clearpath-founder-action': '1',
  };

  try {
    for (const [method, route] of [
      ['GET', '/api/ceo/marketing/overview'],
      ['GET', '/api/ceo/marketing/sitemap'],
      ['GET', '/api/ceo/marketing/assets'],
      ['POST', '/api/ceo/marketing/assets/upload-url'],
      ['DELETE', '/api/ceo/marketing/assets/abc'],
      ['GET', '/api/ceo/marketing/outbox'],
      ['POST', '/api/ceo/marketing/outbox/plan'],
      ['POST', '/api/ceo/marketing/indexnow'],
    ] as const) {
      const res = await call(route, { method });
      assert.equal(res.status, 401, `${method} ${route} must be 401 without founder auth`);
    }
    const noHeader = await call('/api/ceo/marketing/overview', { headers: { 'x-catalog-admin-secret': 'selftest-catalog-secret' } });
    assert.equal(noHeader.status, 403, 'missing founder action header must be 403');

    const ov = await call('/api/ceo/marketing/overview', { headers: founder });
    assert.equal(ov.status, 200);
    const body = (await ov.json()) as any;
    assert.equal(body.sitemap.totalUrls, all.length, 'overview total equals the sitemap registry');
    assert.equal(body.storage.assets.configured, false, 'no bucket -> honestly not configured');
    assert.equal(body.assets.total, 0);
    assert.equal(body.externalReach.status, 'DATA UNAVAILABLE', 'platform reach is never invented');
    assert.equal(body.searchEngines.google.status, 'DATA UNAVAILABLE', 'Google index status is never invented');
    assert.equal(body.publishing.metricool, 'NOT CONFIGURED');
    assert.equal(body.publishing.mode, 'manual');
    assert.equal(body.destinations.length, outbox.MARKETING_CHANNELS.length);

    const sm = (await (await call('/api/ceo/marketing/sitemap?section=guides', { headers: founder })).json()) as any;
    assert.equal(sm.total, registry.listSiteUrls('guides').length);
    const bad = await call('/api/ceo/marketing/sitemap?section=nope', { headers: founder });
    assert.equal(bad.status, 400);
    const paged = (await (await call('/api/ceo/marketing/sitemap?page=2', { headers: founder })).json()) as any;
    assert.equal(paged.page, 2);
    assert.equal(paged.rows.length, 100);

    const exe = await call('/api/ceo/marketing/assets/upload-url', {
      method: 'POST',
      headers: founder,
      body: JSON.stringify({ filename: 'x.exe', contentType: 'application/x-msdownload', sizeBytes: 10 }),
    });
    assert.equal(exe.status, 415, 'non-media uploads are refused');
    const png = await call('/api/ceo/marketing/assets/upload-url', {
      method: 'POST',
      headers: founder,
      body: JSON.stringify({ filename: 'poster.png', contentType: 'image/png', sizeBytes: 1024 }),
    });
    assert.equal(png.status, 503, 'no bucket -> honest 503, no fake upload URL');
    const huge = await call('/api/ceo/marketing/assets/upload-url', {
      method: 'POST',
      headers: founder,
      body: JSON.stringify({ filename: 'poster.png', contentType: 'image/png', sizeBytes: 60 * 1024 * 1024 }),
    });
    assert.equal(huge.status, 413, 'oversize images are refused');

    const plan = await call('/api/ceo/marketing/outbox/plan', {
      method: 'POST',
      headers: founder,
      body: JSON.stringify({ assetId: 'b'.repeat(16), platforms: ['instagram'] }),
    });
    assert.equal(plan.status, 404, 'cannot plan posts for an asset that is not in the library');

    assert.equal(body.assets.tierPosters, 4, 'overview reports the four funnel posters separately');
    const lib = (await (await call('/api/ceo/marketing/assets', { headers: founder })).json()) as any;
    const posters = lib.assets.filter((a: any) => a.source === 'tier-poster');
    assert.deepEqual(
      posters.map((a: any) => a.tier),
      ['basic', 'silver', 'gold', 'platinum'],
      'all four tier posters are in the library even without a bucket',
    );
    for (const p of posters) {
      assert.match(p.url, /^https:\/\/clearpathtrader\.com\/marketing\/posters\/[a-z0-9-]+\.jpg$/);
      assert.ok(fs.existsSync(path.join(process.cwd(), 'public', new URL(p.url).pathname)), `${p.id} file ships with the site`);
    }
    const delPoster = await call('/api/ceo/marketing/assets/poster-gold', { method: 'DELETE', headers: founder });
    assert.equal(delPoster.status, 400, 'tier posters cannot be deleted from the bucket route');
    const posterPlan = await call('/api/ceo/marketing/outbox/plan', {
      method: 'POST',
      headers: founder,
      body: JSON.stringify({ assetId: 'poster-gold', tier: 'gold', platforms: ['instagram', 'linkedin'] }),
    });
    assert.equal(posterPlan.status, 200, 'a tier poster can be planned');
    const planned = ((await posterPlan.json()) as any).posts as Array<{ id: string; tier: string; trackedLink: string; mediaUrl: string }>;
    assert.equal(planned.length, 2);
    for (const post of planned) {
      assert.equal(post.tier, 'gold');
      assert.match(post.trackedLink, /\/go\/gold\/(instagram|linkedin)\/poster-gold$/);
      assert.equal(post.mediaUrl, 'https://clearpathtrader.com/marketing/posters/gold-see-the-pattern.jpg');
      await outbox.deleteOutboxPost(post.id);
    }
  } finally {
    await new Promise<void>((resolve) => listener.close(() => resolve()));
    if (!outboxExisted) fs.rmSync(outboxDir, { recursive: true, force: true });
  }

  console.log(`marketing-department.selftest: ok (${all.length} URLs)`);
}

main().catch((err) => {
  console.error(err);
  if (!outboxExisted) fs.rmSync(outboxDir, { recursive: true, force: true });
  process.exit(1);
});
