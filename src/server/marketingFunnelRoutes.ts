import { Router, type Request, type Response } from 'express';
import tierContentCatalog from '../../data/marketing/tier-content-catalog.json';
import { marketingEventLimiter } from './routeRateLimit';
import {
  encodeMarketingAttributionCookie,
  getMarketingAnalytics,
  MARKETING_ATTRIBUTION_COOKIE,
  recordPublicMarketingEvent,
  sanitizeMarketingAttribution,
} from './marketingFunnelService';
import { createMarketingIntelligenceRouter } from './marketingIntelligenceRoutes';

type FunnelTierId = 'basic' | 'silver' | 'gold' | 'platinum';

const FUNNEL_TIER_IDS = new Set<FunnelTierId>(['basic', 'silver', 'gold', 'platinum']);
const FUNNEL_CONNECTOR_SOURCES = new Set([
  ...tierContentCatalog.channels,
  'direct',
  'email',
  'qr',
]);
const FUNNEL_CONNECTOR_MEDIA = new Set([
  'organic_social',
  'paid_social',
  'community',
  'email',
  'offline',
  'referral',
]);

function cleanConnectorSlug(value: unknown, fallback: string): string {
  const cleaned = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
  return cleaned || fallback;
}

function defaultMedium(source: string): string {
  if (source === 'email') return 'email';
  if (source === 'qr') return 'offline';
  if (source === 'direct') return 'referral';
  if (source === 'discord' || source === 'telegram' || source === 'reddit') return 'community';
  return 'organic_social';
}

export function buildFunnelConnectorRedirect(
  params: { tier?: unknown; source?: unknown; creative?: unknown },
  query: { medium?: unknown } = {},
) {
  const requestedTier = cleanConnectorSlug(params.tier, 'basic');
  const tier = (FUNNEL_TIER_IDS.has(requestedTier as FunnelTierId)
    ? requestedTier
    : 'basic') as FunnelTierId;
  const requestedSource = cleanConnectorSlug(params.source, 'direct');
  const source = FUNNEL_CONNECTOR_SOURCES.has(requestedSource) ? requestedSource : 'direct';
  const creative = cleanConnectorSlug(params.creative, 'connector');
  const requestedMedium = cleanConnectorSlug(query.medium, defaultMedium(source));
  const medium = FUNNEL_CONNECTOR_MEDIA.has(requestedMedium)
    ? requestedMedium
    : defaultMedium(source);
  const catalogTier = tierContentCatalog.tiers.find((item) => item.id === tier);
  const destination = new URL(
    catalogTier?.destination || `/plans?offer=${tier}`,
    'https://clearpathtrader.com',
  );
  destination.searchParams.set('offer', tier);
  destination.searchParams.set('utm_source', source);
  destination.searchParams.set('utm_medium', medium);
  destination.searchParams.set('utm_campaign', tierContentCatalog.campaign);
  destination.searchParams.set('utm_content', `${tier}_${creative}`);
  const location = `${destination.pathname}${destination.search}`;
  const attribution = sanitizeMarketingAttribution({
    source,
    medium,
    campaign: tierContentCatalog.campaign,
    content: `${tier}_${creative}`,
    targetTier: tier,
    landingPath: location,
  });
  return { location, attribution };
}

export function createMarketingConnectorRouter(): Router {
  const router = Router();

  const redirectToFunnel = (req: Request, res: Response) => {
    const connector = buildFunnelConnectorRedirect(req.params, req.query);
    res.setHeader('Cache-Control', 'no-store');
    res.cookie(
      MARKETING_ATTRIBUTION_COOKIE,
      encodeMarketingAttributionCookie(connector.attribution),
      {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 90 * 24 * 60 * 60 * 1000,
        path: '/',
      },
    );
    res.redirect(302, connector.location);
  };

  router.get('/', (_req, res) => res.redirect(302, '/plans'));
  router.get('/:tier', redirectToFunnel);
  router.get('/:tier/:source', redirectToFunnel);
  router.get('/:tier/:source/:creative', redirectToFunnel);

  return router;
}

export function createPublicMarketingRouter(): Router {
  const router = Router();

  router.post('/event', marketingEventLimiter, async (req, res) => {
    const event = String(req.body?.event || '').trim();
    if (event !== 'visit' && event !== 'cta') {
      return res.status(400).json({ error: 'event must be visit or cta' });
    }
    try {
      const attribution = sanitizeMarketingAttribution({
        source: req.body?.source,
        medium: req.body?.medium,
        campaign: req.body?.campaign,
        content: req.body?.content,
        targetTier: req.body?.targetTier,
        landingPath: req.body?.landingPath,
      });
      const result = await recordPublicMarketingEvent(event, attribution);
      res.cookie(MARKETING_ATTRIBUTION_COOKIE, encodeMarketingAttributionCookie(attribution), {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 90 * 24 * 60 * 60 * 1000,
        path: '/',
      });
      res.status(result.recorded ? 202 : 503).json({
        ok: result.recorded,
        storage: result.storage,
        ...(result.recorded ? {} : { message: 'Durable marketing analytics storage is unavailable.' }),
      });
    } catch (error: any) {
      console.error('[marketing/event] Failed:', error);
      res.status(500).json({ error: 'Could not record marketing event.' });
    }
  });

  return router;
}

export function createAdminMarketingRouter(): Router {
  const router = Router();

  router.use('/intelligence', createMarketingIntelligenceRouter());

  router.get('/catalog', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ ok: true, catalog: tierContentCatalog });
  });

  router.get('/analytics', async (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-store');
      res.json(await getMarketingAnalytics(req.query.from, req.query.to));
    } catch (error: any) {
      console.error('[admin/marketing/analytics] Failed:', error);
      res.status(500).json({ error: error?.message || 'Marketing analytics unavailable.' });
    }
  });

  return router;
}
