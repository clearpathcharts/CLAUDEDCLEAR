import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import { requireCatalogAdmin } from '../authGuards';
import {
  createPost,
  deletePost,
  getPost,
  listPosts,
  updatePost,
} from './store';
import { buildTemplate } from './templates';
import { getSocialOsConfig, publishPost } from './publisher';
import { cadenceStatus, tickSocialOsScheduler, runCadenceSlot } from './scheduler';
import { detectDueSlot, slotKey, zonedParts, getSocialTimezone, getPostSlots } from './cadence';
import { isBufferConfigured, listBufferProfiles } from './bufferClient';
import type { CreatePostInput, PublishMode, SocialPlatform, TemplateKind } from './types';

const PLATFORMS = new Set<SocialPlatform>([
  'x',
  'linkedin',
  'facebook',
  'instagram',
  'tiktok',
  'youtube',
  'reddit',
]);

const TEMPLATE_KINDS = new Set<TemplateKind>([
  'clarity_cta',
  'education_tip',
  'founder_story',
  'feature_highlight',
  'market_lesson',
]);

function asPlatform(value: unknown): SocialPlatform | null {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase() as SocialPlatform;
  return PLATFORMS.has(v) ? v : null;
}

function asPublishMode(value: unknown): PublishMode | undefined {
  if (typeof value !== 'string') return undefined;
  const v = value.trim().toLowerCase() as PublishMode;
  if (v === 'dry_run' || v === 'buffer') return v;
  return undefined;
}

export function createSocialOsRouter(): Router {
  const router = createRouter();

  router.get('/status', requireCatalogAdmin, (_req, res) => {
    const config = getSocialOsConfig();
    const cadence = cadenceStatus();
    const posts = listPosts();
    const byStatus = posts.reduce<Record<string, number>>((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});
    res.json({
      ok: true,
      product: 'ClearPath Social OS',
      site: config.siteUrl,
      note: 'Site-owned scheduler — posts at 5am / 9am / 3pm / 6pm via Buffer. No Zapier required.',
      config: {
        dryRun: config.dryRun,
        bufferConfigured: config.bufferConfigured,
        schedulerIntervalMs: config.schedulerIntervalMs,
        timezone: cadence.timezone,
        slots: cadence.slots,
        platforms: cadence.platforms,
      },
      cadence,
      counts: { total: posts.length, byStatus },
    });
  });

  router.get('/cadence', requireCatalogAdmin, (_req, res) => {
    res.json({ cadence: cadenceStatus(), dueNow: detectDueSlot() });
  });

  router.get('/posts', requireCatalogAdmin, (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const platform = asPlatform(req.query.platform);
    const posts = listPosts({
      status: status as never,
      platform: platform || undefined,
    });
    res.json({ posts });
  });

  router.get('/posts/:id', requireCatalogAdmin, (req, res) => {
    const post = getPost(req.params.id);
    if (!post) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json({ post });
  });

  router.post('/posts', requireCatalogAdmin, (req, res) => {
    try {
      const platform = asPlatform(req.body?.platform);
      if (!platform) {
        res.status(400).json({ error: 'Invalid platform' });
        return;
      }
      const body = typeof req.body?.body === 'string' ? req.body.body : '';
      if (!body.trim()) {
        res.status(400).json({ error: 'body is required' });
        return;
      }
      const input: CreatePostInput = {
        platform,
        body,
        title: typeof req.body?.title === 'string' ? req.body.title : undefined,
        linkUrl: typeof req.body?.linkUrl === 'string' ? req.body.linkUrl : undefined,
        mediaUrls: Array.isArray(req.body?.mediaUrls)
          ? req.body.mediaUrls.filter((u: unknown) => typeof u === 'string')
          : undefined,
        hashtags: Array.isArray(req.body?.hashtags)
          ? req.body.hashtags.filter((u: unknown) => typeof u === 'string')
          : undefined,
        scheduledAt:
          typeof req.body?.scheduledAt === 'string' && req.body.scheduledAt
            ? req.body.scheduledAt
            : null,
        status: req.body?.status === 'queued' ? 'queued' : 'draft',
        publishMode: asPublishMode(req.body?.publishMode) || (getSocialOsConfig().bufferConfigured ? 'buffer' : 'dry_run'),
        bufferProfileId:
          typeof req.body?.bufferProfileId === 'string' ? req.body.bufferProfileId : undefined,
        source: 'manual',
        meta: typeof req.body?.meta === 'object' && req.body.meta ? req.body.meta : undefined,
      };
      const post = createPost(input);
      res.status(201).json({ post });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  router.patch('/posts/:id', requireCatalogAdmin, (req, res) => {
    const patch: Record<string, unknown> = {};
    for (const key of [
      'body',
      'title',
      'linkUrl',
      'scheduledAt',
      'status',
      'publishMode',
      'bufferProfileId',
    ] as const) {
      if (req.body?.[key] !== undefined) patch[key] = req.body[key];
    }
    if (Array.isArray(req.body?.hashtags)) patch.hashtags = req.body.hashtags;
    if (Array.isArray(req.body?.mediaUrls)) patch.mediaUrls = req.body.mediaUrls;

    const post = updatePost(req.params.id, patch as never);
    if (!post) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json({ post });
  });

  router.delete('/posts/:id', requireCatalogAdmin, (req, res) => {
    const ok = deletePost(req.params.id);
    if (!ok) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json({ ok: true });
  });

  router.post('/posts/:id/queue', requireCatalogAdmin, (req, res) => {
    const scheduledAt =
      typeof req.body?.scheduledAt === 'string' && req.body.scheduledAt
        ? req.body.scheduledAt
        : new Date().toISOString();
    const post = updatePost(req.params.id, { status: 'queued', scheduledAt, lastError: undefined });
    if (!post) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json({ post });
  });

  router.post('/posts/:id/publish', requireCatalogAdmin, async (req, res) => {
    const existing = getPost(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    updatePost(existing.id, { status: 'publishing', lastError: undefined });
    try {
      const result = await publishPost(getPost(existing.id)!);
      const post = updatePost(existing.id, {
        status: 'published',
        publishedAt: new Date().toISOString(),
        publishMode: result.mode,
        externalIds: {
          bufferUpdateId: result.bufferUpdateIds?.[0],
        },
      });
      res.json({ result, post });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const post = updatePost(existing.id, { status: 'failed', lastError: message });
      res.status(502).json({ error: message, post });
    }
  });

  router.post('/templates/generate', requireCatalogAdmin, (req, res) => {
    const kind = (typeof req.body?.kind === 'string' ? req.body.kind : '') as TemplateKind;
    const platform = asPlatform(req.body?.platform) || 'x';
    if (!TEMPLATE_KINDS.has(kind)) {
      res.status(400).json({
        error: 'Invalid kind',
        allowed: [...TEMPLATE_KINDS],
      });
      return;
    }
    const draft = buildTemplate(kind, platform, {
      topic: typeof req.body?.topic === 'string' ? req.body.topic : undefined,
      feature: typeof req.body?.feature === 'string' ? req.body.feature : undefined,
    });
    const enqueue = Boolean(req.body?.enqueue);
    if (!enqueue) {
      res.json({ draft });
      return;
    }
    const post = createPost({
      platform: draft.platform,
      body: draft.body,
      title: draft.title,
      linkUrl: draft.linkUrl,
      hashtags: draft.hashtags,
      status: req.body?.status === 'queued' ? 'queued' : 'draft',
      scheduledAt: typeof req.body?.scheduledAt === 'string' ? req.body.scheduledAt : null,
      publishMode: asPublishMode(req.body?.publishMode) || (getSocialOsConfig().bufferConfigured ? 'buffer' : 'dry_run'),
      source: 'template',
      meta: { kind: draft.kind },
    });
    res.status(201).json({ draft, post });
  });

  router.post('/import/growth-batch', requireCatalogAdmin, (req, res) => {
    const batch = req.body?.batch || req.body;
    const items = extractGrowthItems(batch);
    if (items.length === 0) {
      res.status(400).json({
        error: 'No importable posts found. Pass Growth OS batch JSON with platform posts.',
      });
      return;
    }
    const created = items.map((item) =>
      createPost({
        platform: item.platform,
        body: item.body,
        title: item.title,
        linkUrl: item.linkUrl || 'https://clearpathtrader.com',
        hashtags: item.hashtags,
        status: 'draft',
        source: 'growth_os',
        meta: item.meta,
      })
    );
    res.status(201).json({ imported: created.length, posts: created });
  });

  router.post('/scheduler/tick', requireCatalogAdmin, async (_req, res) => {
    const result = await tickSocialOsScheduler();
    res.json({ ok: true, ...result });
  });

  /** Force-run a named slot (e.g. "09:00") for testing — still marks it fired for today. */
  router.post('/cadence/run', requireCatalogAdmin, async (req, res) => {
    const slot =
      typeof req.body?.slot === 'string' && /^\d{1,2}:\d{2}$/.test(req.body.slot)
        ? req.body.slot.padStart(5, '0')
        : getPostSlots()[0];
    const normalized = slot.length === 4 ? `0${slot}` : slot;
    const { dateKey } = zonedParts(new Date(), getSocialTimezone());
    const key = slotKey(dateKey, normalized);
    const result = await runCadenceSlot(normalized, key);
    res.json({ ok: true, ...result });
  });

  router.get('/buffer/profiles', requireCatalogAdmin, async (_req, res) => {
    if (!isBufferConfigured()) {
      res.status(503).json({
        error: 'BUFFER_ACCESS_TOKEN not configured',
        hint: 'Create a Buffer account, connect X/IG/FB/LinkedIn, then paste the access token into BUFFER_ACCESS_TOKEN.',
      });
      return;
    }
    try {
      const profiles = await listBufferProfiles();
      res.json({ profiles });
    } catch (err) {
      res.status(502).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  return router;
}

type GrowthItem = {
  platform: SocialPlatform;
  body: string;
  title?: string;
  linkUrl?: string;
  hashtags?: string[];
  meta?: Record<string, unknown>;
};

function extractGrowthItems(batch: unknown): GrowthItem[] {
  if (!batch || typeof batch !== 'object') return [];
  const root = batch as Record<string, unknown>;
  const candidates: unknown[] = [];

  for (const key of ['posts', 'items', 'content', 'assets', 'batch']) {
    const v = root[key];
    if (Array.isArray(v)) candidates.push(...v);
  }
  if (Array.isArray(batch)) candidates.push(...batch);

  for (const key of ['x', 'twitter', 'linkedin', 'instagram', 'tiktok', 'facebook', 'reddit']) {
    const v = root[key];
    if (typeof v === 'string' && v.trim()) {
      candidates.push({ platform: key === 'twitter' ? 'x' : key, body: v });
    } else if (v && typeof v === 'object') {
      const obj = v as Record<string, unknown>;
      if (typeof obj.body === 'string' || typeof obj.text === 'string' || typeof obj.content === 'string') {
        candidates.push({ platform: key === 'twitter' ? 'x' : key, ...obj });
      }
      if (Array.isArray(obj.posts)) {
        for (const p of obj.posts) {
          if (p && typeof p === 'object') {
            candidates.push({ platform: key === 'twitter' ? 'x' : key, ...(p as object) });
          }
        }
      }
    }
  }

  const out: GrowthItem[] = [];
  for (const raw of candidates) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Record<string, unknown>;
    const platform = asPlatform(item.platform) || asPlatform(item.channel);
    const body =
      (typeof item.body === 'string' && item.body) ||
      (typeof item.text === 'string' && item.text) ||
      (typeof item.content === 'string' && item.content) ||
      '';
    if (!platform || !body.trim()) continue;
    out.push({
      platform,
      body: body.trim(),
      title: typeof item.title === 'string' ? item.title : undefined,
      linkUrl:
        typeof item.linkUrl === 'string'
          ? item.linkUrl
          : typeof item.url === 'string'
            ? item.url
            : undefined,
      hashtags: Array.isArray(item.hashtags)
        ? item.hashtags.filter((h): h is string => typeof h === 'string')
        : undefined,
      meta: { importedFrom: 'growth_os' },
    });
  }
  return out;
}

export type SocialOsRequest = Request;
export type SocialOsResponse = Response;
