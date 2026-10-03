/**
 * Founder-only explainer-video library API.
 *
 * Every route in this router is mounted behind `requireFounderOrCatalogAdmin`
 * + `requireFounderActionHeader` in server.ts — the same pair that guards the
 * disaster backup download. The router itself adds no auth of its own and must
 * never be mounted without those guards.
 */
import { Router } from 'express';
import type { Request, Response } from 'express';
import {
  CEO_VIDEO_CONTENT_TYPES,
  CeoVideoStorageError,
  ceoVideoMaxBytes,
  createCeoVideoUploadSession,
  deleteCeoVideo,
  finalizeCeoVideo,
  getCeoVideoStorageStatus,
  listCeoVideos,
} from './ceoVideoStorage';

/** Bind the resumable session to the calling site, not to an arbitrary page. */
function callerOrigin(req: Request): string | undefined {
  const origin = (req.get('origin') || '').trim();
  if (/^https?:\/\/[^\s/]+$/.test(origin)) return origin;
  const host = (req.get('host') || '').trim();
  if (!host) return undefined;
  const proto = host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https';
  return `${proto}://${host}`;
}

function fail(res: Response, error: unknown): void {
  if (error instanceof CeoVideoStorageError) {
    res.status(error.status).json({ error: error.code, message: error.message });
    return;
  }
  const message = (error as Error)?.message || 'Video library request failed.';
  console.error('[ceo/videos]', message);
  res.status(502).json({ error: 'storage_failed', message });
}

export function createCeoVideoRouter(): Router {
  const router = Router();

  /** Library + honest storage state in one call. */
  router.get('/', async (_req, res) => {
    const storage = getCeoVideoStorageStatus();
    const limits = { maxBytes: ceoVideoMaxBytes(), contentTypes: [...CEO_VIDEO_CONTENT_TYPES] };
    if (!storage.configured) {
      res.json({ ok: true, storage, limits, videos: [] });
      return;
    }
    try {
      res.json({ ok: true, storage, limits, videos: await listCeoVideos() });
    } catch (error) {
      fail(res, error);
    }
  });

  /** Mint a direct-to-bucket resumable upload URL. Nothing is streamed through Express. */
  router.post('/upload-url', async (req, res) => {
    try {
      const session = await createCeoVideoUploadSession({
        filename: req.body?.filename,
        contentType: req.body?.contentType,
        sizeBytes: req.body?.sizeBytes,
        origin: callerOrigin(req),
      });
      res.status(201).json({ ok: true, ...session });
    } catch (error) {
      fail(res, error);
    }
  });

  /** Confirm the finished upload, enforce the real size/type, publish, report truthfully. */
  router.post('/:id/finalize', async (req, res) => {
    try {
      res.json({ ok: true, video: await finalizeCeoVideo(String(req.params.id)) });
    } catch (error) {
      fail(res, error);
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      res.json({ ok: true, ...(await deleteCeoVideo(String(req.params.id))) });
    } catch (error) {
      fail(res, error);
    }
  });

  return router;
}
