/** Legacy in-dashboard Membership tab URLs — canonical billing lives at /plans. */

export function isLegacyMembershipDashboardUrl(search?: string, hash?: string): boolean {
  const params = new URLSearchParams(search ?? (typeof window !== 'undefined' ? window.location.search : ''));
  const tab = params.get('tab') || '';
  const h = (hash ?? (typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '')).trim();
  return /^membership$/i.test(tab) || /^membership$/i.test(h);
}

/** @returns true when a redirect was started */
export function redirectLegacyMembershipDashboardUrl(): boolean {
  if (typeof window === 'undefined') return false;
  if (!isLegacyMembershipDashboardUrl()) return false;
  window.location.replace('/plans');
  return true;
}
