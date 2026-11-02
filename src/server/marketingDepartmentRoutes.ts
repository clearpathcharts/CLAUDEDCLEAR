/**
 * CEO Marketing Department API.
 *
 * Mounted in server.ts behind `requireFounderOrCatalogAdmin` +
 * `requireFounderActionHeader` (same pair as the video library and the
 * disaster backup). This router adds no auth of its own and must never be
 * mounted without those guards.
 *
 * Every number it returns is measured (bucket listing, outbox rows, funnel
 * rollups, sitemap registry, IndexNow responses). Anything we cannot measure
 * is reported as DATA UNAVAILABLE / NOT CONFIGURED, never estimated.
 */
import { Router } from 'express';
import type { Request, Response } from 'express';
import { CeoVideoStorageError, getCeoVideoStorageStatus, listCeoVideos } from './ceoVideoStorage';
import {
  MARKETING_ASSET_TYPES,
  createMarketingAssetUploadSession,
  deleteMarketingAsset,
  finalizeMarketingAsset,
  listMarketingAssets,
  marketingAssetMaxBytes,
  type MarketingAsset,
} from './marketingAssets';
import {
  MARKETING_CHANNELS,
  OUTBOX_STATUSES,
  OutboxError,
  deleteOutboxPost,
  deleteOutboxPostsForAsset,
  listOutbox,
  outboxStorageMode,
  planOutboxPosts,
  platformKeywords,
  rewriteOutboxPost,
  platformLabel,
  updateOutboxPost,
  type OutboxPost,
} from './marketingOutbox';
import { SITEMAP_SECTIONS, listSiteUrls, priorityIndexNowUrls, siteSectionCounts } from './siteRegistry';
import { listSeoPings, recordSeoPing } from './seoPingLog';
import { resolveIndexNowKey, submitIndexNow } from './indexNow';
import { getMarketingAnalytics } from './marketingFunnelService';
import { MAX_SIMILARITY, defaultAiWriter } from './marketingCopywriter';

const SITEMAP_PAGE_SIZE = 100;

function callerOrigin(req: Request): string | undefined {
  const origin = (req.get('origin') || '').trim();
  if (/^https?:\/\/[^\s/]+$/.test(origin)) return origin;
  const host = (req.get('host') || '').trim();
  if (!host) return undefined;
  const proto = host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https';
  return `${proto}://${host}`;
}

function fail(res: Response, error: unknown): void {
  if (error instanceof CeoVideoStorageError || error instanceof OutboxError) {
    res.status(error.status).json({ error: error.code, message: error.message });
    return;
  }
  const message = (error as Error)?.message || 'Marketing Department request failed.';
  console.error('[ceo/marketing]', message);
  res.status(502).json({ error: 'request_failed', message });
}

export type LibraryAsset = Pick<
  MarketingAsset,
  'id' | 'title' | 'kind' | 'contentType' | 'sizeBytes' | 'uploadedAt' | 'url' | 'publicRead'
> & { source: 'marketing' | 'video-library' };

/** Marketing uploads plus the CEO explainer videos, so Flow clips already uploaded can be posted too. */
async function listLibrary(): Promise<LibraryAsset[]> {
  if (!getCeoVideoStorageStatus().configured) return [];
  const [assets, videos] = await Promise.all([listMarketingAssets(), listCeoVideos()]);
  return [
    ...assets.map<LibraryAsset>((a) => ({
      id: a.id,
      title: a.title,
      kind: a.kind,
      contentType: a.contentType,
      sizeBytes: a.sizeBytes,
      uploadedAt: a.uploadedAt,
      url: a.url,
      publicRead: a.publicRead,
      source: 'marketing',
    })),
    ...videos.map<LibraryAsset>((v) => ({
      id: v.id,
      title: v.originalName,
      kind: 'video',
      contentType: v.contentType,
      sizeBytes: v.sizeBytes,
      uploadedAt: v.uploadedAt,
      url: v.url,
      publicRead: v.publicRead,
      source: 'video-library',
    })),
  ].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

async function settle<T>(promise: Promise<T>): Promise<{ value: T | null; error: string | null }> {
  try {
    return { value: await promise, error: null };
  } catch (err) {
    return { value: null, error: (err as Error)?.message || 'failed' };
  }
}

function countBy<T>(rows: T[], key: (row: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of rows) out[key(row)] = (out[key(row)] || 0) + 1;
  return out;
}

function metricoolConfigured(): boolean {
  return Boolean(
    (process.env.METRICOOL_TOKEN || '').trim() &&
      (process.env.METRICOOL_USER_ID || '').trim() &&
      (process.env.METRICOOL_BLOG_ID || '').trim()
  );
}

function destinationsPayload(outbox: OutboxPost[]) {
  return MARKETING_CHANNELS.map((platform) => {
    const rows = outbox.filter((p) => p.platform === platform);
    const lastPosted = rows
      .filter((p) => p.status === 'posted' && p.postedAt)
      .sort((a, b) => String(b.postedAt).localeCompare(String(a.postedAt)))[0];
    return {
      platform,
      label: platformLabel(platform),
      mode: 'manual' as const,
      keywords: platformKeywords(platform),
      counts: {
        draft: rows.filter((p) => p.status === 'draft').length,
        approved: rows.filter((p) => p.status === 'approved').length,
        posted: rows.filter((p) => p.status === 'posted').length,
      },
      lastPostedAt: lastPosted?.postedAt || null,
      lastPostedUrl: lastPosted?.postedUrl || null,
    };
  });
}

export function createMarketingDepartmentRouter(): Router {
  const router = Router();

  router.get('/overview', async (_req, res) => {
    const storage = getCeoVideoStorageStatus();
    const sections = siteSectionCounts();
    const totalUrls = sections.reduce((sum, s) => sum + s.count, 0);

    const [libraryResult, outboxResult, analyticsResult, pings] = await Promise.all([
      settle(listLibrary()),
      settle(listOutbox()),
      settle(getMarketingAnalytics()),
      listSeoPings(),
    ]);

    const library = libraryResult.value ?? [];
    const outbox = outboxResult.value ?? [];
    const analytics = analyticsResult.value;

    res.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      storage: {
        assets: storage,
        outbox: outboxStorageMode(),
        outboxError: outboxResult.error,
        libraryError: libraryResult.error,
      },
      limits: {
        contentTypes: [...MARKETING_ASSET_TYPES],
        imageMaxBytes: marketingAssetMaxBytes('image'),
        videoMaxBytes: marketingAssetMaxBytes('video'),
      },
      assets: {
        total: library.length,
        images: library.filter((a) => a.kind === 'image').length,
        videos: library.filter((a) => a.kind === 'video').length,
      },
      outbox: {
        total: outbox.length,
        byStatus: Object.fromEntries(OUTBOX_STATUSES.map((s) => [s, outbox.filter((p) => p.status === s).length])),
        byPlatform: countBy(outbox, (p) => p.platform),
      },
      destinations: destinationsPayload(outbox),
      copywriter: {
        mode: defaultAiWriter() ? 'ai' : 'template',
        detail: defaultAiWriter()
          ? 'Each platform gets its own wording from the AI writer (approved facts only), checked so no two drafts overlap more than 35%.'
          : 'No AI key: wording is recombined from approved sentences, still checked so drafts do not repeat each other.',
        maxSimilarity: MAX_SIMILARITY,
      },
      publishing: {
        mode: 'manual',
        detail: 'Outbound auto-posting is off. Approve a post, copy it, post it yourself, then paste the live link back.',
        metricool: metricoolConfigured() ? 'CONFIGURED' : 'NOT CONFIGURED',
      },
      funnel: analytics
        ? { ok: true, from: analytics.from, to: analytics.to, storage: analytics.storage, totals: analytics.totals, tiers: analytics.tiers }
        : { ok: false, error: analyticsResult.error },
      externalReach: {
        status: 'DATA UNAVAILABLE',
        detail: 'Views, likes and follower counts live on each platform. They appear here only once a platform API (e.g. Metricool) is connected.',
      },
      sitemap: { totalUrls, sections, index: 'https://clearpathtrader.com/sitemap.xml' },
      searchEngines: {
        indexNowKey: Boolean(resolveIndexNowKey()),
        priorityUrls: priorityIndexNowUrls().length,
        pings: pings.slice(0, 10),
        google: {
          status: 'DATA UNAVAILABLE',
          detail: 'Google does not take IndexNow. Submit https://clearpathtrader.com/sitemap.xml once in Google Search Console; Google re-reads it on its own schedule.',
        },
      },
    });
  });

  router.get('/sitemap', (req, res) => {
    const section = String(req.query.section || '').trim();
    if (section && !SITEMAP_SECTIONS.some((s) => s.id === section)) {
      res.status(400).json({ error: 'bad_section', message: 'Unknown sitemap section.' });
      return;
    }
    const q = String(req.query.q || '').trim().toLowerCase().slice(0, 100);
    const page = Math.max(1, Number.parseInt(String(req.query.page || '1'), 10) || 1);
    let rows = listSiteUrls(section || undefined);
    if (q) rows = rows.filter((r) => r.path.toLowerCase().includes(q));
    const total = rows.length;
    const pages = Math.max(1, Math.ceil(total / SITEMAP_PAGE_SIZE));
    const start = (Math.min(page, pages) - 1) * SITEMAP_PAGE_SIZE;
    res.json({
      ok: true,
      section: section || null,
      q,
      page: Math.min(page, pages),
      pages,
      pageSize: SITEMAP_PAGE_SIZE,
      total,
      rows: rows.slice(start, start + SITEMAP_PAGE_SIZE),
    });
  });

  router.get('/assets', async (_req, res) => {
    try {
      res.json({ ok: true, storage: getCeoVideoStorageStatus(), assets: await listLibrary() });
    } catch (error) {
      fail(res, error);
    }
  });

  router.post('/assets/upload-url', async (req, res) => {
    try {
      const session = await createMarketingAssetUploadSession({
        filename: req.body?.filename,
        contentType: req.body?.contentType,
        sizeBytes: req.body?.sizeBytes,
        title: req.body?.title,
        origin: callerOrigin(req),
      });
      res.json({ ok: true, ...session });
    } catch (error) {
      fail(res, error);
    }
  });

  router.post('/assets/:id/finalize', async (req, res) => {
    try {
      res.json({ ok: true, asset: await finalizeMarketingAsset(String(req.params.id || '').toLowerCase()) });
    } catch (error) {
      fail(res, error);
    }
  });

  router.delete('/assets/:id', async (req, res) => {
    try {
      const id = String(req.params.id || '').toLowerCase();
      const result = await deleteMarketingAsset(id);
      const removedDrafts = await deleteOutboxPostsForAsset(id).catch(() => 0);
      res.json({ ok: true, ...result, removedDrafts });
    } catch (error) {
      fail(res, error);
    }
  });

  router.get('/outbox', async (_req, res) => {
    try {
      res.json({ ok: true, storage: outboxStorageMode(), posts: await listOutbox() });
    } catch (error) {
      fail(res, error);
    }
  });

  router.post('/outbox/plan', async (req, res) => {
    try {
      const assetId = String(req.body?.assetId || '').toLowerCase();
      const asset = (await listLibrary()).find((a) => a.id === assetId);
      if (!asset) {
        res.status(404).json({ error: 'asset_not_found', message: 'That asset is not in the library.' });
        return;
      }
      const posts = await planOutboxPosts({
        asset: { id: asset.id, kind: asset.kind, url: asset.url, title: asset.title },
        platforms: req.body?.platforms,
        tier: req.body?.tier,
      });
      res.json({ ok: true, posts });
    } catch (error) {
      fail(res, error);
    }
  });

  router.post('/outbox/:id/rewrite', async (req, res) => {
    try {
      res.json({ ok: true, post: await rewriteOutboxPost(String(req.params.id || '')) });
    } catch (error) {
      fail(res, error);
    }
  });

  router.patch('/outbox/:id', async (req, res) => {
    try {
      const post = await updateOutboxPost(String(req.params.id || ''), {
        status: req.body?.status,
        caption: req.body?.caption,
        postedUrl: req.body?.postedUrl,
      });
      res.json({ ok: true, post });
    } catch (error) {
      fail(res, error);
    }
  });

  router.delete('/outbox/:id', async (req, res) => {
    try {
      const removed = await deleteOutboxPost(String(req.params.id || ''));
      if (!removed) {
        res.status(404).json({ error: 'not_found', message: 'That post is not in the outbox.' });
        return;
      }
      res.json({ ok: true });
    } catch (error) {
      fail(res, error);
    }
  });

  router.post('/indexnow', async (_req, res) => {
    try {
      const result = await submitIndexNow(priorityIndexNowUrls());
      const entry = await recordSeoPing('manual', result);
      res.status(result.ok ? 200 : 502).json({ ok: result.ok, entry });
    } catch (error) {
      fail(res, error);
    }
  });

  return router;
}
