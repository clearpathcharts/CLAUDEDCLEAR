import { Router } from 'express';
import tierContentCatalog from '../../data/marketing/tier-content-catalog.json';
import { marketingEventLimiter } from './routeRateLimit';
import {
  encodeMarketingAttributionCookie,
  getMarketingAnalytics,
  MARKETING_ATTRIBUTION_COOKIE,
  recordPublicMarketingEvent,
  sanitizeMarketingAttribution,
} from './marketingFunnelService';

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
