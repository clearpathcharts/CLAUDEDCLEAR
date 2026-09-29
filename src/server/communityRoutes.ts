import { Router } from 'express';
import crypto from 'node:crypto';
import { isFounderEmail } from '../lib/founder';
import {
  COMMUNITY_ROOMS,
  canAccessCommunityRoom,
  communityRoomById,
  communityRoomPlanLabel,
  sanitizeCommunityPost,
} from '../lib/communityRooms';
import { canonicalizePlanId } from '../lib/planCatalog';
import { getPrivateSessionUser } from './authGuards';
import { addCommunityPost, deleteCommunityPost, listCommunityPosts } from './communityStore';
import { refreshProfileFromDurable } from './profileStore';
import { getMembershipStatus } from './stripeService';

const postGap = new Map<string, number>();
const POST_GAP_MS = 8_000;

async function viewer(req: Parameters<typeof getPrivateSessionUser>[0]) {
  const user = getPrivateSessionUser(req);
  if (!user?.uid) return null;
  await refreshProfileFromDurable(user.uid);
  const status = getMembershipStatus(user.uid);
  const tier = status.active ? canonicalizePlanId(status.tier) : 'basic';
  const founder = isFounderEmail(user.email);
  const authorName = publicName(user.displayName, user.email);
  return { user, tier, founder, authorName };
}

function publicName(displayName?: string, email?: string): string {
  const name = (displayName || '').trim();
  if (name && !name.includes('@')) return name.slice(0, 40);
  const local = (email || '').split('@')[0]?.replace(/[^\w.-]/g, '') || 'Member';
  return (local || 'Member').slice(0, 24);
}

export function createCommunityRouter(): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    const who = await viewer(req);
    res.json({
      ok: true,
      signedIn: Boolean(who),
      plan: who?.tier ?? null,
      rooms: COMMUNITY_ROOMS.map((room) => ({
        ...room,
        planLabel: communityRoomPlanLabel(room),
        locked: who ? !canAccessCommunityRoom(who.tier, room.id, who.founder) : true,
      })),
    });
  });

  router.get('/:roomId/posts', async (req, res) => {
    const room = communityRoomById(req.params.roomId);
    if (!room) return res.status(404).json({ error: 'Unknown community.' });
    const who = await viewer(req);
    if (!who) return res.status(401).json({ error: 'Sign in to read this community.' });
    if (!canAccessCommunityRoom(who.tier, room.id, who.founder)) {
      return res.status(403).json({ error: `This room opens on ${communityRoomPlanLabel(room)}.` });
    }
    const posts = await listCommunityPosts(room.id);
    res.json({
      ok: true,
      posts: posts.map((p) => ({
        id: p.id,
        authorName: p.authorName,
        text: p.text,
        createdAt: p.createdAt,
        mine: p.authorUid === who.user.uid,
      })),
    });
  });

  router.post('/:roomId/posts', async (req, res) => {
    const room = communityRoomById(req.params.roomId);
    if (!room) return res.status(404).json({ error: 'Unknown community.' });
    const who = await viewer(req);
    if (!who) return res.status(401).json({ error: 'Sign in to post.' });
    if (!canAccessCommunityRoom(who.tier, room.id, who.founder)) {
      return res.status(403).json({ error: `This room opens on ${communityRoomPlanLabel(room)}.` });
    }
    const cleaned = sanitizeCommunityPost(req.body?.text);
    if (!cleaned.ok) return res.status(400).json({ error: cleaned.error });
    const last = postGap.get(who.user.uid) || 0;
    if (Date.now() - last < POST_GAP_MS) {
      return res.status(429).json({ error: 'Wait a few seconds before the next post.' });
    }
    postGap.set(who.user.uid, Date.now());
    const post = await addCommunityPost({
      id: crypto.randomBytes(9).toString('hex'),
      roomId: room.id,
      authorUid: who.user.uid,
      authorName: who.authorName,
      text: cleaned.text,
      createdAt: Date.now(),
    });
    res.status(201).json({
      ok: true,
      post: { id: post.id, authorName: post.authorName, text: post.text, createdAt: post.createdAt, mine: true },
    });
  });

  router.delete('/:roomId/posts/:postId', async (req, res) => {
    const room = communityRoomById(req.params.roomId);
    if (!room) return res.status(404).json({ error: 'Unknown community.' });
    const who = await viewer(req);
    if (!who) return res.status(401).json({ error: 'Sign in to remove a post.' });
    if (!canAccessCommunityRoom(who.tier, room.id, who.founder)) {
      return res.status(403).json({ error: `This room opens on ${communityRoomPlanLabel(room)}.` });
    }
    const removed = await deleteCommunityPost(room.id, req.params.postId, who.user.uid, who.founder);
    if (!removed) return res.status(404).json({ error: 'Post not found, or it is not yours.' });
    res.json({ ok: true });
  });

  return router;
}
