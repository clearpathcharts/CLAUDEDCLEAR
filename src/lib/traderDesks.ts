export const TRADER_DESK_IDS = [
  'institutional',
  'fundamental',
  'retail',
  'neurodivergent',
] as const;

export type TraderDeskId = (typeof TRADER_DESK_IDS)[number];

export type TraderDeskMeta = {
  id: TraderDeskId;
  title: string;
  tagline: string;
  accent: string;
  href: string;
};

export const TRADER_DESKS: Record<TraderDeskId, TraderDeskMeta> = {
  institutional: {
    id: 'institutional',
    title: 'Institutional Trader',
    tagline: 'Give me the information',
    accent: '#FF1493',
    href: '/desk/institutional',
  },
  fundamental: {
    id: 'fundamental',
    title: 'Fundamental Trader',
    tagline: 'What is this business doing financially?',
    accent: '#FF7A00',
    href: '/desk/fundamental',
  },
  retail: {
    id: 'retail',
    title: 'Retail Trader',
    tagline: 'Make trading understandable',
    accent: '#FF1493',
    href: '/desk/retail',
  },
  neurodivergent: {
    id: 'neurodivergent',
    title: 'Neurodivergent Traders',
    tagline: 'Built for different minds. Made for real traders.',
    accent: '#B026FF',
    href: '/desk/neurodivergent',
  },
};

export const TRADER_DESK_STORAGE_KEY = 'clearpath_trader_desk';

export function isTraderDeskId(value: string | null | undefined): value is TraderDeskId {
  return !!value && (TRADER_DESK_IDS as readonly string[]).includes(value);
}

export function parseDeskPath(pathname: string): TraderDeskId | null {
  const p = pathname.toLowerCase().split('?')[0].replace(/\/$/, '') || '/';
  if (p === '/fundamental' || p.startsWith('/fundamental/')) return 'fundamental';
  if (p === '/desk') return null;
  if (!p.startsWith('/desk/')) return null;
  const id = p.slice('/desk/'.length).split('/')[0];
  return isTraderDeskId(id) ? id : null;
}

/** Hub URL crawlers should index. Aliases and satellite screens collapse here. */
export function deskCanonicalPath(pathname: string): string | null {
  const p = pathname.toLowerCase().split('?')[0].replace(/\/$/, '') || '/';
  if (p === '/desk') return '/desk';
  const id = parseDeskPath(p);
  return id ? TRADER_DESKS[id].href : null;
}

export function isDeskPath(pathname: string): boolean {
  const p = pathname.toLowerCase().split('?')[0].replace(/\/$/, '') || '/';
  return p === '/desk' || p.startsWith('/desk/') || p === '/fundamental' || p.startsWith('/fundamental/');
}

export function symbolFromDeskPath(pathname: string): string | undefined {
  const p = pathname.split('?')[0].replace(/\/$/, '');
  const m = p.match(/\/(?:desk\/)?fundamental\/([A-Za-z0-9.^-]{1,16})$/i);
  return m?.[1]?.toUpperCase();
}

export function rememberTraderDesk(id: TraderDeskId): void {
  try {
    localStorage.setItem(TRADER_DESK_STORAGE_KEY, id);
  } catch {
    /* quota / private mode */
  }
}

export function readRememberedTraderDesk(): TraderDeskId | null {
  try {
    const saved = localStorage.getItem(TRADER_DESK_STORAGE_KEY);
    return isTraderDeskId(saved) ? saved : null;
  } catch {
    return null;
  }
}

export function navigateToDesk(id: TraderDeskId): void {
  if (typeof window === 'undefined') return;
  rememberTraderDesk(id);
  const next = TRADER_DESKS[id].href;
  window.history.pushState({}, '', next);
  window.dispatchEvent(new Event('clearpath-location'));
}

/** Logged-in `/` used to mount the old Dashboard. These paths now open a desk. */
export function isMemberHomePath(pathname: string): boolean {
  const p = pathname.toLowerCase().split('?')[0].replace(/\/$/, '') || '/';
  return p === '/' || p === '/login' || p === '/activate' || p === '/join' || p === '/home';
}

/** Desk chrome Home uses this so logged-in members can still see Choose Your Path. */
export function shouldStayOnPublicHome(search: string): boolean {
  const raw = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(raw);
  return params.get('choose') === '1' || params.get('home') === '1';
}

/**
 * `/?tab=Yours` is a deliberate Dashboard tab pick (the Dashboard nav pushes
 * `/?tab=X#X` from `/ceo`). The member-home redirect must not fire on it, or
 * the founder is bounced straight back to `/ceo` on every click.
 */
export function hasDashboardTabIntent(search: string): boolean {
  const raw = search.startsWith('?') ? search.slice(1) : search;
  const tab = new URLSearchParams(raw).get('tab');
  return Boolean(tab && tab.trim());
}

/**
 * Explicit neuro/UI deep links. Do not include calm_focus — App injects that
 * default onto every URL, which would trap everyone on the neuro desk.
 */
const NEURO_HOME_DEEP_LINK_PROFILES = new Set([
  'low_stim_emergency',
  'dyslexia_readable',
  'dyscalculia_numeric_relief',
  'visual_processing_safe',
  'apd_assist',
  'executive_function_support',
  'motor_friendly',
  'adhd_dopamine_balanced',
  'adhd_hyperfocus',
  'autism_predictable',
  'tourette_tic_friendly',
  'standard_red_green',
  'focus_mode',
  'lava_hot',
]);

export function deskIdFromHomeProfile(profile: string | null | undefined): TraderDeskId | null {
  if (!profile) return null;
  return NEURO_HOME_DEEP_LINK_PROFILES.has(profile) ? 'neurodivergent' : null;
}

/** Founder ops screen. Reached from the desk chrome CEO pill and as the founder's landing. */
export const CEO_DASHBOARD_HREF = '/ceo';

/**
 * Where a logged-in member on `/` should land instead of the old Dashboard.
 * The founder lands on the CEO Dashboard, which is what the pre-desk `/` did
 * (Dashboard opened the CEO tab for the founder account).
 */
export function memberHomeDeskHref(args: {
  search?: string;
  remembered?: TraderDeskId | null;
  founder?: boolean;
}): string {
  if (args.founder) return CEO_DASHBOARD_HREF;
  const raw = (args.search || '').replace(/^\?/, '');
  const params = new URLSearchParams(raw);
  const profile = params.get('profile');
  const desk = deskIdFromHomeProfile(profile) ?? args.remembered ?? 'institutional';
  const next = new URLSearchParams();
  if (profile) next.set('profile', profile);
  const qs = next.toString();
  return qs ? `${TRADER_DESKS[desk].href}?${qs}` : TRADER_DESKS[desk].href;
}

/** Full navigation after login/register so the next document is a desk, not `/`. */
export function openMemberDesk(search?: string): void {
  if (typeof window === 'undefined') return;
  const href = memberHomeDeskHref({
    search: search ?? window.location.search,
    remembered: readRememberedTraderDesk(),
  });
  window.location.assign(href);
}

/** After Private Login, open a desk — never `/`, which still mounts the old Dashboard. */
export function continueToRememberedDesk(options?: { founder?: boolean }): void {
  if (typeof window === 'undefined') return;
  if (options?.founder) {
    window.location.assign(CEO_DASHBOARD_HREF);
    return;
  }
  openMemberDesk();
}

/**
 * Desk chrome Home. In-app navigation to the institutional desk — never `/`,
 * which for a signed-in member either bounces back to a desk or (with
 * `?choose=1`) shows the public landing page and reads as a logout.
 */
export function goHomeFromDesk(): void {
  navigateToDesk('institutional');
}

/** FX session windows in UTC hours (inclusive start, exclusive end, wrapping midnight). */
export const FX_SESSIONS: { id: string; label: string; utcStart: number; utcEnd: number }[] = [
  { id: 'sydney', label: 'Sydney', utcStart: 21, utcEnd: 6 },
  { id: 'tokyo', label: 'Tokyo', utcStart: 0, utcEnd: 9 },
  { id: 'london', label: 'London', utcStart: 7, utcEnd: 16 },
  { id: 'newyork', label: 'New York', utcStart: 12, utcEnd: 21 },
];

export function isSessionOpen(utcHour: number, utcStart: number, utcEnd: number): boolean {
  if (utcStart === utcEnd) return true;
  if (utcStart < utcEnd) return utcHour >= utcStart && utcHour < utcEnd;
  return utcHour >= utcStart || utcHour < utcEnd;
}

export const DESK_PAPER_STORAGE_KEY = 'clearpath_desk_paper';
export type DeskPaper = 'black' | 'white';

export function isDeskPaper(value: string | null | undefined): value is DeskPaper {
  return value === 'black' || value === 'white';
}

export function readDeskPaper(): DeskPaper {
  try {
    const saved = localStorage.getItem(DESK_PAPER_STORAGE_KEY);
    return isDeskPaper(saved) ? saved : 'black';
  } catch {
    return 'black';
  }
}

export function rememberDeskPaper(paper: DeskPaper): void {
  try {
    localStorage.setItem(DESK_PAPER_STORAGE_KEY, paper);
  } catch {
    /* quota / private mode */
  }
}
