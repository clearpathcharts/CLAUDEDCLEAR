/**
 * Cross-shell navigation for logged-in members (Dashboard tabs vs trader desks).
 * Desks must use full page loads to `/?tab=` — pushState on `/desk/*` never mounts Dashboard.
 */
const RETIRED_TABS: Record<string, string> = {
  Screener: 'StrictlyCharts',
  Heatmap: 'StrictlyCharts',
  Journal: 'StrictlyCharts',
  CapitalFlow: 'News',
  Scanner: 'News',
  Intelligence: 'News',
  Leaderboard: 'News',
  ReferralDesk: 'Yours',
  Membership: 'StrictlyCharts',
  Founders: 'StrictlyCharts',
  CpmsApk: 'ClearPathEducation',
};

export function normalizeMemberTabId(tabId: string): string {
  return RETIRED_TABS[tabId] ?? tabId;
}

function profileQueryString(): string {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  const profile = params.get('profile');
  return profile ? `profile=${encodeURIComponent(profile)}` : '';
}

function assignWithProfile(path: string): void {
  const qs = profileQueryString();
  window.location.assign(qs && !path.includes('?') ? `${path}?${qs}` : path);
}

/** Same destinations as Dashboard `handleTabChange`, safe from `/desk/*`. */
export function navigateMemberTab(tabId: string): void {
  if (typeof window === 'undefined') return;
  if (tabId === 'Plans' || tabId === 'Membership' || /^membership$/i.test(tabId)) {
    window.location.assign('/plans');
    return;
  }
  if (tabId === 'MeetTheBoard' || normalizeMemberTabId(tabId) === 'MeetTheBoard') {
    assignWithProfile('/meet-the-board');
    return;
  }
  const nextTab = normalizeMemberTabId(tabId);
  if (nextTab === 'CeoDashboard') {
    assignWithProfile('/?tab=StrictlyCharts#StrictlyCharts');
    return;
  }
  if (nextTab === 'Diagnostics') {
    assignWithProfile('/?tab=StrictlyCharts#StrictlyCharts');
    return;
  }
  if (nextTab === 'Fundamentals') {
    const params = new URLSearchParams(window.location.search);
    params.delete('tab');
    const qs = params.toString();
    window.location.assign(qs ? `/desk/fundamental?${qs}` : '/desk/fundamental');
    return;
  }
  if (nextTab === 'EncyclopediaOfIndicators') {
    window.location.assign('/indicators');
    return;
  }
  if (nextTab === 'Encyclopedia') {
    window.location.assign('/encyclopedia');
    return;
  }
  const params = new URLSearchParams(window.location.search);
  params.set('tab', nextTab);
  const qs = params.toString();
  window.location.assign(`/?${qs}#${nextTab}`);
}
