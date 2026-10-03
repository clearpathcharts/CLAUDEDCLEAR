/**
 * Public, unauthenticated read side of the explainer-video slots.
 *
 * This is the only part of the video library a visitor can reach, and it emits
 * exactly one thing: slot id → playable URL. No video ids, filenames, sizes,
 * upload times, bucket names or storage state — all of that is founder-only and
 * stays behind `/api/ceo/videos`.
 */
import { Router } from 'express';
import { getVideoSlotAssignments, toPublicSlotUrlMap } from './videoSlotStore';

export function createPublicVideoSlotRouter(): Router {
  const router = Router();

  router.get('/slots', async (_req, res) => {
    try {
      const slots = toPublicSlotUrlMap(await getVideoSlotAssignments());
      // Short cache: a swapped video should show up without a redeploy.
      res.set('Cache-Control', 'public, max-age=60');
      res.json({ ok: true, slots });
    } catch (error) {
      console.warn('[videos/slots]', (error as Error)?.message || error);
      // An unassigned site and a broken store look the same to a visitor: no
      // video. The player falls back to the written explanation either way.
      res.json({ ok: true, slots: {} });
    }
  });

  return router;
}
