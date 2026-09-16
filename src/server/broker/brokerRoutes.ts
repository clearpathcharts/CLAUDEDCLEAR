/**
 * Pass-through broker OAuth routes — Alpaca-first.
 * ClearPath is the interface; the licensed broker holds funds and effects trades.
 */
import { Router, type Request, type Response } from 'express';
import { getPrivateSessionUser, requirePrivateSession } from '../authGuards';
import {
  brokerOAuthCallbackLimiter,
  brokerOAuthStartLimiter,
  brokerOrderLimiter,
  brokerProxyLimiter,
} from '../routeRateLimit';
import { BROKER_STATUS_NOTE, PASS_THROUGH_MODEL_ID } from '../../lib/passThroughBrokerModel';
import {
  buildAlpacaAuthorizeUrl,
  createAlpacaOAuthState,
  exchangeAlpacaCode,
  isAlpacaOAuthStateValid,
  persistAlpacaConnection,
  alpacaRedirectUri,
} from './alpacaOAuth';
import { deleteBrokerConnection, loadBrokerConnection } from './brokerConnectionStore';
import {
  fetchAlpacaAccountSummary,
  fetchAlpacaPositions,
  listAlpacaOrders,
  submitAlpacaOrder,
} from './alpacaProxy';
import { brokerPublicStatus } from './registry';
import type { AlpacaOAuthPendingState } from './types';

type SessionWithBroker = {
  brokerOAuth?: AlpacaOAuthPendingState;
};

function safeBrokerReturnTo(raw: unknown): string {
  if (typeof raw !== 'string') return '/?tab=Biography#Biography';
  const candidate = raw.trim();
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('://')) {
    return '/?tab=Biography#Biography';
  }
  if (/^\/(?:\?tab=[A-Za-z0-9_-]+)?(?:#[A-Za-z0-9_-]+)?$/.test(candidate)) return candidate;
  if (/^\/desk(?:\/[a-z-]+)?\/?$/.test(candidate)) return candidate;
  if (/^\/(?:brokers|broker-connect)\/?$/.test(candidate)) return candidate;
  return '/?tab=Biography#Biography';
}

function hostFromReq(req: Request): string | undefined {
  return String(req.get('x-forwarded-host') || req.get('host') || '').split(',')[0]?.trim() || undefined;
}

export function createBrokerRouter(): Router {
  const router = Router();

  router.get('/status', async (req, res) => {
    try {
      const uid = getPrivateSessionUser(req)?.uid ?? null;
      const brokers = await brokerPublicStatus(uid);
      res.json({
        ok: true,
        model: PASS_THROUGH_MODEL_ID,
        note: BROKER_STATUS_NOTE,
        brokers,
      });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Broker status failed' });
    }
  });

  router.get('/alpaca/authorize', requirePrivateSession, brokerOAuthStartLimiter, (req, res) => {
    const uid = getPrivateSessionUser(req)?.uid;
    if (!uid) return res.status(401).json({ error: 'Sign in required.' });

    const redirectUri = alpacaRedirectUri(hostFromReq(req));
    const returnTo = safeBrokerReturnTo(req.query.returnTo);
    const pending = createAlpacaOAuthState(uid, returnTo);
    (req.session as SessionWithBroker).brokerOAuth = pending;

    const url = buildAlpacaAuthorizeUrl(pending.state, redirectUri);
    if (!url) {
      return res.status(503).json({
        error: 'Alpaca OAuth not configured',
        message:
          'Set ALPACA_CLIENT_ID, ALPACA_CLIENT_SECRET, ALPACA_REDIRECT_URI, and BROKER_TOKEN_ENCRYPTION_KEY on the Cloud Run service.',
        mode: 'stub',
      });
    }

    return res.redirect(url);
  });

  router.get('/alpaca/callback', brokerOAuthCallbackLimiter, async (req, res) => {
    const code = String(req.query.code || '');
    const state = String(req.query.state || '');
    const oauthErr = String(req.query.error || '');

    if (oauthErr) {
      const base = safeBrokerReturnTo('/?tab=Biography#Biography');
      return res.redirect(`${base}${base.includes('?') ? '&' : '?'}broker=error`);
    }

    const pending = (req.session as SessionWithBroker).brokerOAuth;
    if (!isAlpacaOAuthStateValid(pending) || pending!.state !== state) {
      return res.status(400).type('html').send('<h1>Invalid or expired OAuth state</h1><p>Close this tab and try Connect again.</p>');
    }

    const uid = pending!.uid;
    const returnTo = pending!.returnTo;
    delete (req.session as SessionWithBroker).brokerOAuth;

    if (!code) {
      return res.redirect(`${returnTo}${returnTo.includes('?') ? '&' : '?'}broker=denied`);
    }

    try {
      const redirectUri = alpacaRedirectUri(hostFromReq(req));
      const tokens = await exchangeAlpacaCode(code, redirectUri);
      await persistAlpacaConnection({
        uid,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        scope: tokens.scope,
      });
      return res.redirect(`${returnTo}${returnTo.includes('?') ? '&' : '?'}broker=alpaca_connected`);
    } catch (err: unknown) {
      console.warn('[broker/alpaca/callback]', err);
      return res.redirect(`${returnTo}${returnTo.includes('?') ? '&' : '?'}broker=error`);
    }
  });

  router.post('/alpaca/disconnect', requirePrivateSession, async (req, res) => {
    const uid = getPrivateSessionUser(req)?.uid;
    if (!uid) return res.status(401).json({ error: 'Sign in required.' });
    await deleteBrokerConnection(uid, 'alpaca');
    res.json({ ok: true, disconnected: true });
  });

  router.get('/alpaca/account', requirePrivateSession, brokerProxyLimiter, async (req, res) => {
    const uid = getPrivateSessionUser(req)?.uid;
    if (!uid) return res.status(401).json({ error: 'Sign in required.' });

    const row = await loadBrokerConnection(uid, 'alpaca');
    if (!row) {
      return res.status(404).json({ error: 'Alpaca not connected', code: 'BROKER_NOT_CONNECTED' });
    }

    try {
      const account = await fetchAlpacaAccountSummary(uid);
      res.json({ ok: true, account, environment: row.environment });
    } catch (err: unknown) {
      res.status(502).json({ error: err instanceof Error ? err.message : 'Alpaca account unavailable' });
    }
  });

  router.get('/alpaca/orders', requirePrivateSession, brokerProxyLimiter, async (req, res) => {
    const uid = getPrivateSessionUser(req)?.uid;
    if (!uid) return res.status(401).json({ error: 'Sign in required.' });

    const row = await loadBrokerConnection(uid, 'alpaca');
    if (!row) {
      return res.status(404).json({ error: 'Alpaca not connected', code: 'BROKER_NOT_CONNECTED' });
    }

    try {
      const orders = await listAlpacaOrders(uid);
      res.json({ ok: true, orders, environment: row.environment, executedBy: 'alpaca' });
    } catch (err: unknown) {
      res.status(502).json({ error: err instanceof Error ? err.message : 'Alpaca orders unavailable' });
    }
  });

  router.post('/alpaca/orders', requirePrivateSession, brokerOrderLimiter, async (req, res) => {
    const uid = getPrivateSessionUser(req)?.uid;
    if (!uid) return res.status(401).json({ error: 'Sign in required.' });

    if (req.body?.passThroughAcknowledged !== true) {
      return res.status(400).json({
        error: 'Pass-through acknowledgment required',
        message: 'Confirm that your licensed broker executes the order, not ClearPath.',
      });
    }

    const row = await loadBrokerConnection(uid, 'alpaca');
    if (!row) {
      return res.status(404).json({ error: 'Alpaca not connected', code: 'BROKER_NOT_CONNECTED' });
    }

    const side = req.body?.side === 'sell' ? 'sell' : 'buy';
    const type = req.body?.type === 'limit' ? 'limit' : 'market';
    const tif = req.body?.time_in_force === 'gtc' ? 'gtc' : 'day';

    try {
      const order = await submitAlpacaOrder(uid, {
        symbol: String(req.body?.symbol || ''),
        qty: Number(req.body?.qty),
        side,
        type,
        limit_price: req.body?.limit_price != null ? Number(req.body.limit_price) : undefined,
        time_in_force: tif,
      });
      res.json({
        ok: true,
        order,
        executedBy: 'alpaca',
        passThrough: true,
        note: 'Order sent to your connected licensed broker. ClearPath is not the broker-dealer.',
      });
    } catch (err: unknown) {
      res.status(502).json({ error: err instanceof Error ? err.message : 'Order submission failed' });
    }
  });

  router.get('/alpaca/positions', requirePrivateSession, brokerProxyLimiter, async (req, res) => {
    const uid = getPrivateSessionUser(req)?.uid;
    if (!uid) return res.status(401).json({ error: 'Sign in required.' });

    const row = await loadBrokerConnection(uid, 'alpaca');
    if (!row) {
      return res.status(404).json({ error: 'Alpaca not connected', code: 'BROKER_NOT_CONNECTED' });
    }

    try {
      const positions = await fetchAlpacaPositions(uid);
      res.json({ ok: true, positions, environment: row.environment });
    } catch (err: unknown) {
      res.status(502).json({ error: err instanceof Error ? err.message : 'Alpaca positions unavailable' });
    }
  });

  return router;
}
