/** Public member handle: stored without `/u/`, advertised as /u/{handle}. */

const RESERVED_HANDLES = new Set([
  'about',
  'activate',
  'admin',
  'administrator',
  'affiliate',
  'api',
  'auth',
  'board',
  'ceo',
  'clearpath',
  'clearpathtrader',
  'education',
  'encyclopedia',
  'favicon',
  'founder',
  'help',
  'indicators',
  'join',
  'literacy',
  'login',
  'logout',
  'me',
  'moderator',
  'null',
  'operator',
  'press',
  'profile',
  'r',
  'register',
  'reset',
  'reset-password',
  'robots',
  'root',
  'settings',
  'sitemap',
  'static',
  'support',
  'system',
  'u',
  'undefined',
  'www',
]);

export function normalizeProfileUsername(raw: string): string {
  let s = String(raw || '').trim().toLowerCase();
  s = s.replace(/^https?:\/\/[^/]+/i, '');
  s = s.replace(/^\/+/, '');
  if (s.startsWith('u/')) s = s.slice(2);
  s = s.replace(/[^a-z0-9_-]/g, '');
  return s.slice(0, 24);
}

export function isValidProfileUsername(handle: string): boolean {
  return /^[a-z0-9][a-z0-9_-]{2,23}$/.test(handle);
}

export function isReservedProfileUsername(handle: string): boolean {
  return RESERVED_HANDLES.has(normalizeProfileUsername(handle));
}

export function isPublicPublishStatus(status?: string): boolean {
  return String(status || '').trim().toLowerCase() === 'public';
}

export function profilePath(handle: string): string {
  return `/u/${normalizeProfileUsername(handle)}`;
}

export function publicProfileUrl(origin: string, handle: string): string {
  const base = String(origin || '').replace(/\/$/, '') || 'https://clearpathtrader.com';
  return `${base}${profilePath(handle)}`;
}
