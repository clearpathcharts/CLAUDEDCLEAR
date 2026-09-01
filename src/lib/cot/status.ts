/** Positioning feed labels. CFTC.gov remains the only authoritative COT source. */

export const NOT_CONFIGURED = 'NOT CONFIGURED';

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const MS_DAY = 86_400_000;

export function cotAgeDays(reportDate: string | null | undefined, now = new Date()): number | null {
  if (!reportDate || !ISO_DAY.test(reportDate)) return null;
  const [y, m, d] = reportDate.split('-').map(Number);
  const start = Date.UTC(y, m - 1, d);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(0, Math.floor((today - start) / MS_DAY));
}

export function formatCotReportLabel(reportDate: string | null | undefined): string | null {
  if (!reportDate || !ISO_DAY.test(reportDate)) return null;
  const [y, m, d] = reportDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatCotAgeLabel(reportDate: string | null | undefined, now = new Date()): string | null {
  const days = cotAgeDays(reportDate, now);
  if (days == null) return null;
  if (days === 0) return '0 DAYS';
  if (days === 1) return '1 DAY';
  return `${days} DAYS`;
}

export function cotFeedChip(opts: {
  status: 'ok' | 'unmapped' | 'unavailable';
  cached: boolean;
  note: string;
}): string {
  if (opts.note === 'loading') return 'LOADING';
  if (opts.status === 'unmapped') return 'NO CFTC MAP';
  if (opts.status === 'unavailable') return 'PROVIDER ERROR';
  return opts.cached ? 'CACHED' : 'CFTC FETCH';
}

export function newsFeedChip(newsError: string | null): string {
  if (!newsError) return 'wire';
  if (/\b429\b/.test(newsError)) return 'rate limited';
  return 'provider error';
}
