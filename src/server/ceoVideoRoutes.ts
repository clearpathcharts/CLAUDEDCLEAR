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
  type CeoVideo,
} from './ceoVideoStorage';
import { VIDEO_SLOTS, getVideoSlot } from '../content/videoSlots';
import {
  clearAssignmentsForVideo,
  clearVideoSlotAssignment,
  getVideoSlotAssignments,
  pruneVideoSlotAssignments,
  setVideoSlotAssignment,
  type VideoSlotAssignmentMap,
} from './videoSlotStore';

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

/**
 * Every play icon, plus whichever video is currently behind it. Slots are
 * always listed in full so the CEO page can show empty ones as empty rather
 * than hiding them.
 */
function slotsPayload(assignments: VideoSlotAssignmentMap) {
  return VIDEO_SLOTS.map((slot) => ({
    ...slot,
    assignment: assignments[slot.id] ?? null,
  }));
}

export function createCeoVideoRouter(): Router {
  const router = Router();

  /** Library + slot assignments + honest storage state in one call. */
  router.get('/', async (_req, res) => {
    const storage = getCeoVideoStorageStatus();
    const limits = { maxBytes: ceoVideoMaxBytes(), contentTypes: [...CEO_VIDEO_CONTENT_TYPES] };
    if (!storage.configured) {
      const assignments = await getVideoSlotAssignments();
      res.json({ ok: true, storage, limits, videos: [], slots: slotsPayload(assignments) });
      return;
    }
    try {
      const videos = await listCeoVideos();
      // An object removed outside this page must not keep a dead slot wired up.
      await pruneVideoSlotAssignments(videos.map((v) => v.id));
      res.json({
        ok: true,
        storage,
        limits,
        videos,
        slots: slotsPayload(await getVideoSlotAssignments()),
      });
    } catch (error) {
      fail(res, error);
    }
  });

  /** Put a video behind one play icon. */
  router.put('/slots/:slotId', async (req, res) => {
    const slot = getVideoSlot(String(req.params.slotId));
    if (!slot) {
      res.status(404).json({ error: 'unknown_slot', message: 'That play icon is not on the list.' });
      return;
    }
    const videoId = String(req.body?.videoId || '').trim();
    if (!videoId) {
      res.status(400).json({ error: 'missing_video', message: 'Pick a video first.' });
      return;
    }
    try {
      // Resolve the URL from the library rather than trusting the browser, so a
      // founder-gated route can never be talked into pointing a slot anywhere else.
      const videos: CeoVideo[] = await listCeoVideos();
      const video = videos.find((v) => v.id === videoId);
      if (!video) {
        res.status(404).json({ error: 'not_found', message: 'That video is no longer in the library.' });
        return;
      }
      const assignment = await setVideoSlotAssignment({
        slotId: slot.id,
        videoId: video.id,
        url: video.url,
      });
      res.json({ ok: true, assignment });
    } catch (error) {
      fail(res, error);
    }
  });

  /** Take the video back off a play icon. */
  router.delete('/slots/:slotId', async (req, res) => {
    const slot = getVideoSlot(String(req.params.slotId));
    if (!slot) {
      res.status(404).json({ error: 'unknown_slot', message: 'That play icon is not on the list.' });
      return;
    }
    try {
      res.json({ ok: true, cleared: await clearVideoSlotAssignment(slot.id) });
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
      const id = String(req.params.id);
      const result = await deleteCeoVideo(id);
      // Unwire it everywhere before replying, so no icon is left pointing at a
      // file that is gone.
      const clearedSlots = await clearAssignmentsForVideo(id);
      res.json({ ok: true, ...result, clearedSlots });
    } catch (error) {
      fail(res, error);
    }
  });

  return router;
}
