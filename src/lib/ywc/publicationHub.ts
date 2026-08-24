import type {
  AudienceAge,
  MagazinePublicationCard,
  OrientationDesk,
  PoliticsDesk,
} from './magazineTypes';

export const HUB_TRANSLATE_LANGS = [
  { id: 'en', label: 'English' },
  { id: 'es', label: 'Español' },
  { id: 'zh', label: '中文' },
  { id: 'ko', label: '한국어' },
  { id: 'pt', label: 'Português' },
  { id: 'fr', label: 'Français' },
  { id: 'de', label: 'Deutsch' },
  { id: 'ar', label: 'العربية' },
  { id: 'ja', label: '日本語' },
] as const;

export type HubTranslateLang = (typeof HUB_TRANSLATE_LANGS)[number]['id'];

export const AUDIENCE_AGE_OPTIONS: Array<{ id: AudienceAge; label: string }> = [
  { id: 'all-ages', label: 'All ages' },
  { id: 'young-adult', label: 'Young adult' },
  { id: 'adult', label: 'Adult' },
  { id: 'fifty-plus', label: '50+' },
];

export const ORIENTATION_OPTIONS: Array<{ id: OrientationDesk; label: string }> = [
  { id: 'general', label: 'General audience' },
  { id: 'lgbtq', label: 'LGBTQ+ press' },
];

export const POLITICS_OPTIONS: Array<{ id: PoliticsDesk; label: string }> = [
  { id: 'nonpartisan', label: 'Nonpartisan' },
  { id: 'left', label: 'Left / progressive' },
  { id: 'center', label: 'Center' },
  { id: 'right', label: 'Right / conservative' },
];

export const FAVORITES_STORAGE_KEY = 'clearpath.ywc.publicationFavs.v1';
export const MAX_PUBLICATION_FAVORITES = 40;

export type PublicationFavorite = {
  id: string;
  title: string;
  homepage: string;
  audienceAge: AudienceAge;
  orientation: OrientationDesk;
  politics: PoliticsDesk;
  sourceId: string | null;
  addedAt: string;
};

export function isHubTranslateLang(raw: string): raw is HubTranslateLang {
  return HUB_TRANSLATE_LANGS.some((l) => l.id === raw);
}

/** Opens the publisher page through Google Translate. Does not scrape or proxy the article. */
export function googleTranslatePageUrl(pageUrl: string, lang: string): string {
  const target = isHubTranslateLang(lang) ? lang : 'en';
  try {
    const parsed = new URL(pageUrl);
    if (parsed.protocol !== 'https:') return pageUrl;
  } catch {
    return pageUrl;
  }
  if (target === 'en') return pageUrl;
  return `https://translate.google.com/translate?sl=auto&tl=${encodeURIComponent(target)}&u=${encodeURIComponent(pageUrl)}`;
}

/** Favorites are bookmarks to the publisher — https homepages only, no RSS fetch. */
export function parseFavoriteHomepage(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== 'https:') return null;
    if (url.username || url.password) return null;
    const host = url.hostname.replace(/\.$/, '').toLowerCase();
    if (!host || host === 'localhost' || host.endsWith('.localhost')) return null;
    if (netLikeIp(host)) return null;
    return `${url.protocol}//${url.host}${url.pathname === '/' ? '/' : url.pathname}`;
  } catch {
    return null;
  }
}

function netLikeIp(host: string): boolean {
  if (host.startsWith('[') && host.endsWith(']')) return true;
  const v4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  return v4.test(host);
}

export function isAudienceAge(raw: string): raw is AudienceAge {
  return AUDIENCE_AGE_OPTIONS.some((o) => o.id === raw);
}

export function isOrientationDesk(raw: string): raw is OrientationDesk {
  return ORIENTATION_OPTIONS.some((o) => o.id === raw);
}

export function isPoliticsDesk(raw: string): raw is PoliticsDesk {
  return POLITICS_OPTIONS.some((o) => o.id === raw);
}

export function favoriteFromPublication(pub: MagazinePublicationCard): PublicationFavorite {
  return {
    id: `rack:${pub.id}`,
    title: pub.name,
    homepage: pub.homepage,
    audienceAge: pub.audienceAge,
    orientation: pub.orientation,
    politics: pub.politics,
    sourceId: pub.id,
    addedAt: new Date().toISOString(),
  };
}

export function favoriteFromForm(input: {
  title: string;
  homepage: string;
  audienceAge: string;
  orientation: string;
  politics: string;
}): PublicationFavorite | null {
  const title = input.title.replace(/\s+/g, ' ').trim().slice(0, 80);
  const homepage = parseFavoriteHomepage(input.homepage);
  if (!title || !homepage) return null;
  if (!isAudienceAge(input.audienceAge)) return null;
  if (!isOrientationDesk(input.orientation)) return null;
  if (!isPoliticsDesk(input.politics)) return null;
  const host = new URL(homepage).hostname.replace(/^www\./, '');
  return {
    id: `fav:${host}:${title.toLowerCase()}`,
    title,
    homepage,
    audienceAge: input.audienceAge,
    orientation: input.orientation,
    politics: input.politics,
    sourceId: null,
    addedAt: new Date().toISOString(),
  };
}

export function upsertFavorite(
  list: PublicationFavorite[],
  next: PublicationFavorite,
): PublicationFavorite[] {
  const without = list.filter((f) => f.id !== next.id && f.homepage !== next.homepage);
  return [next, ...without].slice(0, MAX_PUBLICATION_FAVORITES);
}

export function removeFavorite(list: PublicationFavorite[], id: string): PublicationFavorite[] {
  return list.filter((f) => f.id !== id);
}

export function parseStoredFavorites(raw: unknown): PublicationFavorite[] {
  if (!Array.isArray(raw)) return [];
  const out: PublicationFavorite[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const rec = row as Record<string, unknown>;
    const homepage = typeof rec.homepage === 'string' ? parseFavoriteHomepage(rec.homepage) : null;
    const title = typeof rec.title === 'string' ? rec.title.replace(/\s+/g, ' ').trim().slice(0, 80) : '';
    const audienceAge = typeof rec.audienceAge === 'string' ? rec.audienceAge : '';
    const orientation = typeof rec.orientation === 'string' ? rec.orientation : '';
    const politics = typeof rec.politics === 'string' ? rec.politics : '';
    if (!homepage || !title) continue;
    if (!isAudienceAge(audienceAge) || !isOrientationDesk(orientation) || !isPoliticsDesk(politics)) {
      continue;
    }
    const id = typeof rec.id === 'string' && rec.id.trim() ? rec.id.trim().slice(0, 120) : `fav:${homepage}`;
    if (seen.has(id) || seen.has(homepage)) continue;
    seen.add(id);
    seen.add(homepage);
    out.push({
      id,
      title,
      homepage,
      audienceAge,
      orientation,
      politics,
      sourceId: typeof rec.sourceId === 'string' ? rec.sourceId : null,
      addedAt: typeof rec.addedAt === 'string' ? rec.addedAt : new Date().toISOString(),
    });
    if (out.length >= MAX_PUBLICATION_FAVORITES) break;
  }
  return out;
}

export function matchesHubFilters(
  item: {
    title: string;
    homepage: string;
    audienceAge: AudienceAge;
    orientation: OrientationDesk;
    politics: PoliticsDesk;
  },
  filters: {
    title: string;
    audienceAge: 'any' | AudienceAge;
    orientation: 'any' | OrientationDesk;
    politics: 'any' | PoliticsDesk;
  },
): boolean {
  const q = filters.title.trim().toLowerCase();
  if (q) {
    const hay = `${item.title} ${item.homepage}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (filters.audienceAge !== 'any' && item.audienceAge !== filters.audienceAge) return false;
  if (filters.orientation !== 'any' && item.orientation !== filters.orientation) return false;
  if (filters.politics !== 'any' && item.politics !== filters.politics) return false;
  return true;
}
