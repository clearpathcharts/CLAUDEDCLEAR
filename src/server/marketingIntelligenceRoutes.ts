import { Router } from 'express';
import { aiChatLimiter } from './routeRateLimit';
import {
  createGeminiMarketingPlan,
  createMarketingContentBrief,
  getGeminiPlannerStatus,
  getMarketingCapabilities,
  getMarketingIntelligenceReport,
  matchMarketingKeyword,
} from './marketingIntelligence';

function cleanText(value: unknown, max = 80): string {
  return String(value || '').trim().slice(0, max);
}

export function createMarketingIntelligenceRouter(): Router {
  const router = Router();

  router.get('/', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json(
      getMarketingIntelligenceReport({
        capability: cleanText(req.query.capability, 12),
        canonicalPath: cleanText(req.query.path, 120),
        platform: cleanText(req.query.platform, 40),
        limit: Number(req.query.limit) || 50,
      }),
    );
  });

  router.get('/capabilities', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      ok: true,
      registry: getMarketingCapabilities(),
      geminiPlanner: getGeminiPlannerStatus(),
    });
  });

  router.get('/keywords', (req, res) => {
    const query = cleanText(req.query.query, 120);
    if (!query) return res.status(400).json({ error: 'query is required' });
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      ok: true,
      query,
      matches: matchMarketingKeyword(query, {
        platform: cleanText(req.query.platform, 40),
        limit: Number(req.query.limit) || 10,
      }),
    });
  });

  router.post('/brief', (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-store');
      res.json(
        createMarketingContentBrief({
          canonicalPath: cleanText(req.body?.canonicalPath, 120),
          platform: cleanText(req.body?.platform, 40),
        }),
      );
    } catch (error: any) {
      res.status(400).json({ error: error?.message || 'Could not create marketing brief.' });
    }
  });

  router.post('/plan', aiChatLimiter, async (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-store');
      res.json(
        await createGeminiMarketingPlan({
          canonicalPath: cleanText(req.body?.canonicalPath, 120),
          platform: cleanText(req.body?.platform, 40),
        }),
      );
    } catch (error: any) {
      const message = error?.message || 'Could not create Gemini marketing plan.';
      res.status(/not configured/i.test(message) ? 503 : 400).json({ error: message });
    }
  });

  return router;
}
