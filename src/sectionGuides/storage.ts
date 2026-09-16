/** localStorage helpers for section-guide video offers (dismiss / snooze). */

const PREFIX = 'clearpath_section_guide_offer_';

export type SectionGuideDismissState = {
  dismissedAt: number;
  /** If set, offer stays hidden until this timestamp. */
  snoozeUntil?: number;
};

function key(tabId: string): string {
  return `${PREFIX}${tabId}`;
}

export function readSectionGuideDismiss(tabId: string): SectionGuideDismissState | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key(tabId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SectionGuideDismissState;
    if (!parsed || typeof parsed.dismissedAt !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isSectionGuideOfferSnoozed(tabId: string, now = Date.now()): boolean {
  const state = readSectionGuideDismiss(tabId);
  if (!state) return false;
  if (typeof state.snoozeUntil === 'number' && state.snoozeUntil > now) return true;
  // Permanent dismiss (no snoozeUntil) — hide until storage cleared.
  if (state.dismissedAt && state.snoozeUntil == null) return true;
  return false;
}

/** Hide for `hours` (default 72). Pass hours <= 0 for permanent dismiss on this device. */
export function snoozeSectionGuideOffer(tabId: string, hours = 72): void {
  if (typeof localStorage === 'undefined') return;
  const dismissedAt = Date.now();
  const payload: SectionGuideDismissState =
    hours > 0
      ? { dismissedAt, snoozeUntil: dismissedAt + hours * 60 * 60 * 1000 }
      : { dismissedAt };
  try {
    localStorage.setItem(key(tabId), JSON.stringify(payload));
  } catch {
    /* ignore quota */
  }
}

export function clearSectionGuideOfferDismiss(tabId: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(key(tabId));
  } catch {
    /* ignore */
  }
}
