/**
 * Brent Communications / investor outreach API — separate from /api/ceo/marketing.
 */
import { Router } from 'express';
import { requireFounderActionHeader } from './authGuards';
import {
  brentOutreachStatus,
  buildBrentOutreachDraft,
  listBrentInvestorTargets,
  listBrentOutreachSendLog,
  sendBrentOutreachEmail,
} from './brentOutreachService';

export function createBrentOutreachRouter(): Router {
  const router = Router();

  router.get('/status', (_req, res) => {
    res.json({ ok: true, ...brentOutreachStatus() });
  });

  router.get('/investors', (req, res) => {
    const limit = Number(req.query.limit || 200);
    res.json({ ok: true, investors: listBrentInvestorTargets(Number.isFinite(limit) ? limit : 200) });
  });

  /** CEO bento feed: who Brent emailed, what was said, grouped by Pacific day. */
  router.get('/sent-log', async (req, res) => {
    try {
      const dayKey = typeof req.query.day === 'string' ? req.query.day : undefined;
      const limitDays = Number(req.query.limitDays || 30);
      const log = await listBrentOutreachSendLog({
        dayKey,
        limitDays: Number.isFinite(limitDays) ? limitDays : 30,
      });
      res.json(log);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Send log failed' });
    }
  });

  router.get('/draft/:investorId', (req, res) => {
    try {
      const draft = buildBrentOutreachDraft(String(req.params.investorId || ''));
      res.json({ ok: true, draft });
    } catch (err: any) {
      const status = err?.status || 500;
      res.status(status).json({ error: err?.message || 'Draft failed' });
    }
  });

  /** Preview (confirmSend false) or send (confirmSend true + founder action header). */
  router.post('/send', requireFounderActionHeader, async (req, res) => {
    try {
      const investorId = typeof req.body?.investorId === 'string' ? req.body.investorId : '';
      const toOverride = typeof req.body?.to === 'string' ? req.body.to : undefined;
      const confirmSend = req.body?.confirmSend === true;
      if (!investorId) return res.status(400).json({ error: 'investorId required' });
      const result = await sendBrentOutreachEmail({ investorId, toOverride, confirmSend });
      const status = result.ok ? 200 : result.reason === 'recipient_email_required' ? 400 : 503;
      res.status(status).json(result);
    } catch (err: any) {
      const status = err?.status || 500;
      res.status(status).json({ error: err?.message || 'Send failed' });
    }
  });

  return router;
}
