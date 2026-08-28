export function asFinite(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function formatCompactUsd(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return 'DATA UNAVAILABLE';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(digits)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(digits)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(digits)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(digits)}K`;
  return `${sign}$${abs.toLocaleString('en-US', { maximumFractionDigits: digits })}`;
}

export function formatNumber(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return 'DATA UNAVAILABLE';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatShares(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return 'DATA UNAVAILABLE';
  return formatCompactUsd(value, 2).replace('$', '');
}

export function formatPercent(value: number | null | undefined, alreadyRatio = false): string {
  if (value == null || !Number.isFinite(value)) return 'DATA UNAVAILABLE';
  const pct = alreadyRatio && Math.abs(value) <= 5 ? value * 100 : value;
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

export function formatMultiple(value: number | null | undefined, suffix = 'x'): string {
  if (value == null || !Number.isFinite(value)) return 'DATA UNAVAILABLE';
  return `${value.toFixed(2)}${suffix}`;
}

export function formatUsdPerShare(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return 'DATA UNAVAILABLE';
  return `$${value.toFixed(2)}`;
}

export function yoyGrowth(current: number | null, prior: number | null): number | null {
  if (current == null || prior == null || prior === 0) return null;
  return ((current - prior) / Math.abs(prior)) * 100;
}

export function cagr(first: number | null, last: number | null, years: number): number | null {
  if (first == null || last == null || first <= 0 || last <= 0 || years <= 0) return null;
  return (Math.pow(last / first, 1 / years) - 1) * 100;
}

export function median(values: Array<number | null>): number | null {
  const nums = values.filter((v): v is number => v != null && Number.isFinite(v)).sort((a, b) => a - b);
  if (!nums.length) return null;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}

export function extrema(values: Array<number | null>): { high: number | null; low: number | null } {
  const nums = values.filter((v): v is number => v != null && Number.isFinite(v));
  if (!nums.length) return { high: null, low: null };
  return { high: Math.max(...nums), low: Math.min(...nums) };
}

export function calendarYear(dateLike: unknown): string {
  const s = String(dateLike || '');
  const m = s.match(/^(\d{4})/);
  return m ? m[1] : s || '—';
}

export function statementLabel(row: Record<string, unknown>, period: 'annual' | 'quarter'): string {
  const date = String(row.date || row.calendarYear || '');
  if (period === 'quarter') {
    const q = row.period ? String(row.period) : '';
    return q && date ? `${q} ${calendarYear(date)}` : date || '—';
  }
  const fy = row.calendarYear ? `FY${row.calendarYear}` : calendarYear(date);
  return fy || '—';
}

export function surpriseVsConsensus(actual: number | null, estimate: number | null): {
  delta: number | null;
  pct: number | null;
  label: string;
} {
  if (actual == null || estimate == null) {
    return { delta: null, pct: null, label: 'DATA UNAVAILABLE' };
  }
  const delta = actual - estimate;
  const pct = estimate === 0 ? null : (delta / Math.abs(estimate)) * 100;
  if (delta > 0) return { delta, pct, label: 'EPS ACTUAL: ABOVE CONSENSUS' };
  if (delta < 0) return { delta, pct, label: 'EPS ACTUAL: BELOW CONSENSUS' };
  return { delta, pct, label: 'EPS ACTUAL: IN LINE WITH CONSENSUS' };
}

export function marketSessionUtc(now = new Date()): string {
  const h = now.getUTCHours();
  const dow = now.getUTCDay();
  if (dow === 0 || dow === 6) return 'WEEKEND — CASH SESSION CLOSED';
  if (h >= 13 && h < 20) return 'US CASH SESSION OPEN (UTC)';
  if (h >= 8 && h < 13) return 'EUROPE / PRE-US SESSION';
  if (h >= 0 && h < 8) return 'ASIA SESSION';
  return 'US SESSION CLOSED';
}

export function classifyNewsCategory(headline: string): string {
  const h = headline.toLowerCase();
  if (/\bearnings\b|\beps\b|\brevenue\b/.test(h)) return 'Earnings';
  if (/\bmerger\b|\bacqui\b|\bdeal\b/.test(h)) return 'M&A';
  if (/\blawsuit\b|\blitigat\b|\bsettlement\b/.test(h)) return 'Litigation';
  if (/\bsec\b|\bregulat\b|\bantitrust\b/.test(h)) return 'Regulation';
  if (/\bceo\b|\bcfo\b|\bappoint\b|\bresign\b/.test(h)) return 'Management';
  if (/\bproduct\b|\blaunch\b|\bchip\b/.test(h)) return 'Product';
  if (/\bfed\b|\binflation\b|\bgdp\b|\brate\b/.test(h)) return 'Macro';
  if (/\bwar\b|\bsanction\b|\bgeopolit/.test(h)) return 'Geopolitical';
  if (/\bindustry\b|\bsector\b/.test(h)) return 'Industry';
  return 'Corporate';
}
