/**
 * Video slots — the contract between the CEO Dashboard and the public site.
 *
 * Each entry is one "little play icon" a visitor can tap. The founder picks a
 * video for a slot on the CEO page; the public player looks the slot up by id.
 *
 * `id` is written into durable storage, so it must never change and must never
 * be derived from array position or from the label. `label` is what the founder
 * reads in the dropdown, so it says the button he actually taps.
 *
 * Adopting another play icon later is one entry in {@link VIDEO_SLOTS} plus the
 * matching id passed to the player.
 */

export type VideoSlot = {
  /** Stable storage key. Never renumber, never reuse. */
  id: string;
  /** Founder-facing name in the CEO dropdown. */
  label: string;
  /** Where the icon physically sits, in the founder's words. */
  where: string;
  /** Feeds the public `aria-label` so screen readers hear what the video covers. */
  explains: string;
};

/** Slot ids for the Explain Mode play badges are `nav.<explain content id>`. */
export const NAV_VIDEO_SLOT_PREFIX = 'nav.';

export function navVideoSlotId(explainContentId: string): string {
  return `${NAV_VIDEO_SLOT_PREFIX}${explainContentId}`;
}

const NAV_BADGE = 'Play icon beside the';

export const VIDEO_SLOTS: VideoSlot[] = [
  {
    id: 'nav.home',
    label: 'Nav play icon — HOME',
    where: `${NAV_BADGE} purple HOME button, top nav and mobile menu`,
    explains: 'what the Home hub is and where each card goes',
  },
  {
    id: 'nav.charts',
    label: 'Nav play icon — CHARTS',
    where: `${NAV_BADGE} orange CHARTS button, top nav and mobile menu`,
    explains: 'how to read the live chart desk',
  },
  {
    id: 'nav.ywc',
    label: 'Nav play icon — Y.W.C.',
    where: `${NAV_BADGE} Y.W.C. button, top nav and mobile menu`,
    explains: 'what Your World Connected puts on one page',
  },
  {
    id: 'nav.indacreator',
    label: 'Nav play icon — INDACREATOR',
    where: `${NAV_BADGE} INDACREATOR button, top nav and mobile menu`,
    explains: 'how to bring a Pine Script indicator into ClearPath',
  },
  {
    id: 'nav.news',
    label: 'Nav play icon — NEWS',
    where: `${NAV_BADGE} NEWS button, top nav and mobile menu`,
    explains: 'what the live news wire shows and what it does not',
  },
  {
    id: 'nav.memberships',
    label: 'Nav play icon — PLANS / Memberships',
    where: `${NAV_BADGE} PLANS link and the Memberships page`,
    explains: 'how the membership tiers compare',
  },
  {
    id: 'nav.education',
    label: 'Nav play icon — CLEARPATH EDUCATION',
    where: `${NAV_BADGE} CLEARPATH EDUCATION button`,
    explains: 'how schools, units, lessons and quizzes fit together',
  },
  {
    id: 'nav.literacy',
    label: 'Nav play icon — LITERACY OS',
    where: `${NAV_BADGE} Literacy OS entry`,
    explains: 'what the Literacy OS study desk is for',
  },
  {
    id: 'nav.encyclopedia',
    label: 'Nav play icon — ENCYCLOPEDIA',
    where: `${NAV_BADGE} Encyclopedia entry`,
    explains: 'how to use the finance library',
  },
  {
    id: 'nav.indicators',
    label: 'Nav play icon — INDICATOR ENCYCLOPEDIA',
    where: `${NAV_BADGE} Encyclopedia of Indicators entry`,
    explains: 'what an indicator is in plain language',
  },
  {
    id: 'nav.cinema',
    label: 'Nav play icon — CLEARPATH CINEMA',
    where: `${NAV_BADGE} CLEARPATH CINEMA button`,
    explains: 'how to find and play a title in Cinema',
  },
  {
    id: 'nav.profile',
    label: 'Nav play icon — PROFILE',
    where: `${NAV_BADGE} pink PROFILE button`,
    explains: 'what lives in your account space',
  },
  {
    id: 'nav.affiliate',
    label: 'Nav play icon — AFFILIATE',
    where: `${NAV_BADGE} AFFILIATE button`,
    explains: 'how the referral link works',
  },
  {
    id: 'nav.explain',
    label: 'Nav play icon — NEED EXTRA UNDERSTANDING',
    where: `${NAV_BADGE} Explain Mode switch itself`,
    explains: 'what the play icons across the site do',
  },
  {
    id: 'nav.exit',
    label: 'Nav play icon — LOG OUT',
    where: `${NAV_BADGE} log out control`,
    explains: 'what logging out does and does not delete',
  },
  {
    id: 'nav.ceo',
    label: 'Nav play icon — CEO (founder only)',
    where: `${NAV_BADGE} CEO button — only you ever see this one`,
    explains: 'what the CEO dashboard is for',
  },
];

export const VIDEO_SLOT_IDS: string[] = VIDEO_SLOTS.map((slot) => slot.id);

const SLOTS_BY_ID = new Map(VIDEO_SLOTS.map((slot) => [slot.id, slot]));

export function isVideoSlotId(value: unknown): boolean {
  return typeof value === 'string' && SLOTS_BY_ID.has(value);
}

export function getVideoSlot(id: string): VideoSlot | null {
  return SLOTS_BY_ID.get(id) ?? null;
}
