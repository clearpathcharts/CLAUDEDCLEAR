/**
 * On-site communities, one room per paid feature.
 * Basic sees the doors. A room opens only when the member's plan includes that feature.
 */
import { hasFeatureForRank, tierRankOf, TIER_LABEL, type FeatureKey, type PlanTier } from './entitlements';

export type CommunityRoom = {
  id: string;
  label: string;
  feature: FeatureKey;
  minTier: Exclude<PlanTier, 'basic'>;
  blurb: string;
};

export const COMMUNITY_ROOMS: readonly CommunityRoom[] = [
  {
    id: 'education',
    label: 'Education',
    feature: 'education',
    minTier: 'silver',
    blurb: 'How the lessons work. Questions about the path, not trade calls.',
  },
  {
    id: 'encyclopedia',
    label: 'Encyclopedia',
    feature: 'encyclopedia',
    minTier: 'silver',
    blurb: 'Terms, structures, and what a page is actually saying.',
  },
  {
    id: 'affiliate',
    label: 'Affiliate',
    feature: 'affiliate',
    minTier: 'silver',
    blurb: 'Share codes and how credit is counted. No spam.',
  },
  {
    id: 'gold-bar',
    label: 'Gold Bar',
    feature: 'goldBar',
    minTier: 'silver',
    blurb: 'The Gold Bar study tool. What the highlight means, not a signal service.',
  },
  {
    id: 'patterns',
    label: 'Pattern Overlay',
    feature: 'patternOverlay',
    minTier: 'gold',
    blurb: 'Chart patterns the overlay marked. Study, not a prediction.',
  },
  {
    id: 'indacreator',
    label: 'IndaCreator',
    feature: 'indaCreator',
    minTier: 'gold',
    blurb: 'Scripts you are building in the River. Help with the tool, not copy-trading.',
  },
  {
    id: 'ai-scanner',
    label: 'AI Pattern Scanner',
    feature: 'aiScanner',
    minTier: 'platinum',
    blurb: 'What the scanner labeled, and what it did not check.',
  },
  {
    id: 'bots',
    label: 'Bots',
    feature: 'bots',
    minTier: 'platinum',
    blurb: 'Workspace automation. What a bot is allowed to do here.',
  },
] as const;

const BY_ID = new Map(COMMUNITY_ROOMS.map((room) => [room.id, room]));

export function communityRoomById(id: string | null | undefined): CommunityRoom | null {
  if (!id) return null;
  return BY_ID.get(id) ?? null;
}

export function canAccessCommunityRoom(
  tier: string | null | undefined,
  roomId: string,
  founder = false,
): boolean {
  if (founder) return communityRoomById(roomId) != null;
  const room = communityRoomById(roomId);
  if (!room) return false;
  return hasFeatureForRank(tierRankOf(tier), room.feature);
}

export function communityRoomPlanLabel(room: CommunityRoom): string {
  return TIER_LABEL[room.minTier];
}

const MAX_POST_CHARS = 800;

export function sanitizeCommunityPost(raw: unknown): { ok: true; text: string } | { ok: false; error: string } {
  if (typeof raw !== 'string') return { ok: false, error: 'Write a message.' };
  const text = raw.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
  if (text.length < 2) return { ok: false, error: 'Write a message.' };
  if (text.length > MAX_POST_CHARS) return { ok: false, error: `Keep it under ${MAX_POST_CHARS} characters.` };
  return { ok: true, text };
}
