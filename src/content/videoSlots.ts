/**
 * Video slots — the contract between the CEO Dashboard and the public site.
 *
 * Each entry is one place a visitor can be shown a video: the little play icon
 * beside a nav button, or one clip inside a section's "Would you like to watch
 * a video?" walkthrough. The founder picks a video for a slot on the CEO page;
 * the player looks the slot up by id.
 *
 * `id` is written into durable storage, so it must never change and must never
 * be derived from array position or from the label. `label` is what the founder
 * reads in the dropdown, so it says the button he actually taps.
 *
 * Slots carry a `groupId` because there are around a hundred of them. The CEO
 * page pins the nav group first and collapses the rest, so the fifteen play
 * icons never get buried under eighty-four walkthrough clips.
 *
 * The CEO button deliberately has no slot and no play icon: nobody but the
 * founder ever sees the CEO dashboard, so there is nothing to explain to a
 * visitor. Any `nav.ceo` assignment left in storage fails `isVideoSlotId` and
 * is dropped on read.
 *
 * Adopting another play icon later is one entry in {@link NAV_VIDEO_SLOTS} plus
 * the matching id passed to the player. Walkthrough clips need no entry at all
 * — they are derived from `sectionGuides/catalog.ts`.
 */
import { SECTION_GUIDES, SECTION_GUIDE_TAB_IDS } from '../sectionGuides/catalog';

export type VideoSlot = {
  /** Stable storage key. Never renumber, never reuse. */
  id: string;
  /** Which collapsible section of the CEO list this row sits in. */
  groupId: string;
  /** Founder-facing name in the CEO dropdown. */
  label: string;
  /** Where the icon physically sits, in the founder's words. */
  where: string;
  /** Feeds the public `aria-label` so screen readers hear what the video covers. */
  explains: string;
};

export type VideoSlotGroup = {
  /** Stable key. Used for the collapse state, never stored against a video. */
  id: string;
  /** Heading on the collapsible panel. */
  label: string;
  /** One line under the heading saying where these videos surface. */
  blurb: string;
};

/** Slot ids for the Explain Mode play badges are `nav.<explain content id>`. */
export const NAV_VIDEO_SLOT_PREFIX = 'nav.';

/** Walkthrough clip ids are `guide.<section guide id>.<beat id>`. */
export const GUIDE_VIDEO_SLOT_PREFIX = 'guide.';

export const NAV_VIDEO_SLOT_GROUP_ID = 'nav';

export function navVideoSlotId(explainContentId: string): string {
  return `${NAV_VIDEO_SLOT_PREFIX}${explainContentId}`;
}

/** Both halves come from real catalog ids, never from array position. */
export function guideVideoSlotId(sectionGuideId: string, beatId: string): string {
  return `${GUIDE_VIDEO_SLOT_PREFIX}${sectionGuideId}.${beatId}`;
}

export function guideVideoSlotGroupId(sectionGuideId: string): string {
  return `${GUIDE_VIDEO_SLOT_PREFIX}${sectionGuideId}`;
}

/**
 * Split a walkthrough slot id back into the section and beat it came from.
 * Section ids never contain a dot and beat ids never contain one either, so the
 * first dot after the prefix is the only boundary.
 */
export function parseGuideVideoSlotId(
  id: string
): { sectionGuideId: string; beatId: string } | null {
  if (typeof id !== 'string' || !id.startsWith(GUIDE_VIDEO_SLOT_PREFIX)) return null;
  const rest = id.slice(GUIDE_VIDEO_SLOT_PREFIX.length);
  const boundary = rest.indexOf('.');
  if (boundary <= 0 || boundary >= rest.length - 1) return null;
  const beatId = rest.slice(boundary + 1);
  if (beatId.includes('.')) return null;
  return { sectionGuideId: rest.slice(0, boundary), beatId };
}

const NAV_BADGE = 'Play icon beside the';

export const NAV_VIDEO_SLOTS: VideoSlot[] = [
  {
    id: 'nav.home',
    groupId: NAV_VIDEO_SLOT_GROUP_ID,
    label: 'Nav play icon — HOME',
    where: `${NAV_BADGE} purple HOME button, top nav and mobile menu`,
    explains: 'what the Home hub is and where each card goes',
  },
  {
    id: 'nav.charts',
    groupId: NAV_VIDEO_SLOT_GROUP_ID,
    label: 'Nav play icon — CHARTS',
    where: `${NAV_BADGE} orange CHARTS button, top nav and mobile menu`,
    explains: 'how to read the live chart desk',
  },
  {
    id: 'nav.ywc',
    groupId: NAV_VIDEO_SLOT_GROUP_ID,
    label: 'Nav play icon — Y.W.C.',
    where: `${NAV_BADGE} Y.W.C. button, top nav and mobile menu`,
    explains: 'what Your World Connected puts on one page',
  },
  {
    id: 'nav.indacreator',
    groupId: NAV_VIDEO_SLOT_GROUP_ID,
    label: 'Nav play icon — INDACREATOR',
    where: `${NAV_BADGE} INDACREATOR button, top nav and mobile menu`,
    explains: 'how to bring a Pine Script indicator into ClearPath',
  },
  {
    id: 'nav.news',
    groupId: NAV_VIDEO_SLOT_GROUP_ID,
    label: 'Nav play icon — NEWS',
    where: `${NAV_BADGE} NEWS button, top nav and mobile menu`,
    explains: 'what the live news wire shows and what it does not',
  },
  {
    id: 'nav.memberships',
    groupId: NAV_VIDEO_SLOT_GROUP_ID,
    label: 'Nav play icon — PLANS / Memberships',
    where: `${NAV_BADGE} PLANS link and the Memberships page`,
    explains: 'how the membership tiers compare',
  },
  {
    id: 'nav.education',
    groupId: NAV_VIDEO_SLOT_GROUP_ID,
    label: 'Nav play icon — CLEARPATH EDUCATION',
    where: `${NAV_BADGE} CLEARPATH EDUCATION button`,
    explains: 'how schools, units, lessons and quizzes fit together',
  },
  {
    id: 'nav.literacy',
    groupId: NAV_VIDEO_SLOT_GROUP_ID,
    label: 'Nav play icon — LITERACY OS',
    where: `${NAV_BADGE} Literacy OS entry`,
    explains: 'what the Literacy OS study desk is for',
  },
  {
    id: 'nav.encyclopedia',
    groupId: NAV_VIDEO_SLOT_GROUP_ID,
    label: 'Nav play icon — ENCYCLOPEDIA',
    where: `${NAV_BADGE} Encyclopedia entry`,
    explains: 'how to use the finance library',
  },
  {
    id: 'nav.indicators',
    groupId: NAV_VIDEO_SLOT_GROUP_ID,
    label: 'Nav play icon — INDICATOR ENCYCLOPEDIA',
    where: `${NAV_BADGE} Encyclopedia of Indicators entry`,
    explains: 'what an indicator is in plain language',
  },
  {
    id: 'nav.cinema',
    groupId: NAV_VIDEO_SLOT_GROUP_ID,
    label: 'Nav play icon — CLEARPATH CINEMA',
    where: `${NAV_BADGE} CLEARPATH CINEMA button`,
    explains: 'how to find and play a title in Cinema',
  },
  {
    id: 'nav.profile',
    groupId: NAV_VIDEO_SLOT_GROUP_ID,
    label: 'Nav play icon — PROFILE',
    where: `${NAV_BADGE} pink PROFILE button`,
    explains: 'what lives in your account space',
  },
  {
    id: 'nav.affiliate',
    groupId: NAV_VIDEO_SLOT_GROUP_ID,
    label: 'Nav play icon — AFFILIATE',
    where: `${NAV_BADGE} AFFILIATE button`,
    explains: 'how the referral link works',
  },
  {
    id: 'nav.explain',
    groupId: NAV_VIDEO_SLOT_GROUP_ID,
    label: 'Nav play icon — NEED EXTRA UNDERSTANDING',
    where: `${NAV_BADGE} Explain Mode switch itself`,
    explains: 'what the play icons across the site do',
  },
  {
    id: 'nav.exit',
    groupId: NAV_VIDEO_SLOT_GROUP_ID,
    label: 'Nav play icon — LOG OUT',
    where: `${NAV_BADGE} log out control`,
    explains: 'what logging out does and does not delete',
  },
];

const NAV_GROUP: VideoSlotGroup = {
  id: NAV_VIDEO_SLOT_GROUP_ID,
  label: 'Nav play icons',
  blurb: 'The little play badges beside the nav buttons. These are the ones most visitors meet first.',
};

/**
 * One group and seven rows per section walkthrough, derived from the catalog so
 * a beat renamed there can never leave a stale row here.
 */
function buildGuideSlots(): { groups: VideoSlotGroup[]; slots: VideoSlot[] } {
  const groups: VideoSlotGroup[] = [];
  const slots: VideoSlot[] = [];

  for (const sectionGuideId of SECTION_GUIDE_TAB_IDS) {
    const guide = SECTION_GUIDES[sectionGuideId];
    const groupId = guideVideoSlotGroupId(sectionGuideId);
    const total = guide.beats.length;

    groups.push({
      id: groupId,
      label: `${guide.title} walkthrough`,
      blurb: `The “Would you like to watch a video?” offer on the ${guide.title} page — ${total} short clips that play one after another.`,
    });

    guide.beats.forEach((beat, index) => {
      slots.push({
        id: guideVideoSlotId(sectionGuideId, beat.id),
        groupId,
        label: `${guide.title} walkthrough — clip ${index + 1}: ${beat.title}`,
        where: `“Would you like to watch a video?” on the ${guide.title} page, clip ${index + 1} of ${total}`,
        explains: `the “${beat.title}” step of the ${guide.title} walkthrough`,
      });
    });
  }

  return { groups, slots };
}

const GUIDE = buildGuideSlots();

/** Nav group pinned first so the fifteen play icons stay at the top of the CEO list. */
export const VIDEO_SLOT_GROUPS: VideoSlotGroup[] = [NAV_GROUP, ...GUIDE.groups];

export const VIDEO_SLOTS: VideoSlot[] = [...NAV_VIDEO_SLOTS, ...GUIDE.slots];

export const VIDEO_SLOT_IDS: string[] = VIDEO_SLOTS.map((slot) => slot.id);

const SLOTS_BY_ID = new Map(VIDEO_SLOTS.map((slot) => [slot.id, slot]));
const GROUPS_BY_ID = new Map(VIDEO_SLOT_GROUPS.map((group) => [group.id, group]));

export function isVideoSlotId(value: unknown): boolean {
  return typeof value === 'string' && SLOTS_BY_ID.has(value);
}

export function getVideoSlot(id: string): VideoSlot | null {
  return SLOTS_BY_ID.get(id) ?? null;
}

export function getVideoSlotGroup(id: string): VideoSlotGroup | null {
  return GROUPS_BY_ID.get(id) ?? null;
}

/**
 * Which file a walkthrough clip should actually play.
 *
 * A founder assignment made on the CEO page wins, because that is the control
 * he can reach without a deploy. The catalog's own `videoUrl` is the fallback
 * for anything hard-coded later. Empty string means "no clip yet" and the
 * player shows its honest coming-soon frame.
 */
export function resolveGuideBeatVideoUrl(
  sectionGuideId: string,
  beat: { id: string; videoUrl: string },
  assignedSlotUrls: Record<string, string> | null | undefined
): string {
  const assigned = assignedSlotUrls?.[guideVideoSlotId(sectionGuideId, beat.id)];
  if (typeof assigned === 'string' && /^https:\/\/[^\s]+$/i.test(assigned.trim())) {
    return assigned.trim();
  }
  const fromCatalog = (beat.videoUrl || '').trim();
  return /^https?:\/\//i.test(fromCatalog) ? fromCatalog : '';
}
