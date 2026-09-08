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
