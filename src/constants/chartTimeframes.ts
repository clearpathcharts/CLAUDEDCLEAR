/**
 * Complete chart timeframe catalog for every ClearPath chart.
 * Month codes stay Pascal (1M, 3M) so they never collide with minutes (1m, 3m).
 */

export type ChartTimeframeOption = {
  id: string;
  label: string;
};

export type ChartTimeframeGroup = {
  id: string;
  title: string;
  options: ChartTimeframeOption[];
};

export const CHART_TIMEFRAME_GROUPS: ChartTimeframeGroup[] = [
  {
    id: "seconds",
    title: "Seconds",
    options: [
      { id: "1s", label: "1s" },
      { id: "2s", label: "2s" },
      { id: "3s", label: "3s" },
      { id: "5s", label: "5s" },
      { id: "10s", label: "10s" },
      { id: "15s", label: "15s" },
      { id: "30s", label: "30s" },
      { id: "45s", label: "45s" },
      { id: "60s", label: "60s" },
    ],
  },
  {
    id: "minutes",
    title: "Minute charts",
    options: [
      { id: "1m", label: "1 min" },
      { id: "2m", label: "2 min" },
      { id: "3m", label: "3 min" },
      { id: "5m", label: "5 min" },
      { id: "8m", label: "8 min" },
      { id: "10m", label: "10 min" },
      { id: "13m", label: "13 min" },
      { id: "15m", label: "15 min" },
      { id: "18m", label: "18 min" },
      { id: "20m", label: "20 min" },
      { id: "25m", label: "25 min" },
      { id: "30m", label: "30 min" },
      { id: "45m", label: "45 min" },
    ],
  },
  {
    id: "hours",
    title: "Hour charts",
    options: [
      { id: "1h", label: "1h" },
      { id: "2h", label: "2h" },
      { id: "3h", label: "3h" },
      { id: "4h", label: "4h" },
      { id: "5h", label: "5h" },
      { id: "6h", label: "6h" },
      { id: "7h", label: "7h" },
      { id: "8h", label: "8h" },
      { id: "9h", label: "9h" },
      { id: "10h", label: "10h" },
      { id: "12h", label: "12h" },
    ],
  },
  {
    id: "session",
    title: "Daily / weekly / monthly",
    options: [
      { id: "1d", label: "Daily" },
      { id: "1w", label: "Weekly" },
      { id: "1M", label: "Monthly" },
    ],
  },
  {
    id: "months",
    title: "Multi-month",
    options: [
      { id: "3M", label: "3 month" },
      { id: "5M", label: "5 month" },
      { id: "6M", label: "6 month" },
      { id: "7M", label: "7 month" },
      { id: "8M", label: "8 month" },
      { id: "9M", label: "9 month" },
      { id: "10M", label: "10 month" },
      { id: "11M", label: "11 month" },
      { id: "12M", label: "12 month" },
    ],
  },
  {
    id: "years",
    title: "Year charts",
    options: [
      { id: "ytd", label: "YTD" },
      { id: "3Y", label: "3 yr" },
      { id: "5Y", label: "5 yr" },
      { id: "7Y", label: "7 yr" },
      { id: "10Y", label: "10 yr" },
      { id: "11Y", label: "11 yr" },
      { id: "13Y", label: "13 yr" },
      { id: "15Y", label: "15 yr" },
    ],
  },
];

export const MONTH_TIMEFRAME_IDS = new Set([
  "1M",
  "3M",
  "5M",
  "6M",
  "7M",
  "8M",
  "9M",
  "10M",
  "11M",
  "12M",
]);

export const YEAR_TIMEFRAME_IDS = new Set([
  "3Y",
  "5Y",
  "7Y",
  "10Y",
  "11Y",
  "13Y",
  "15Y",
]);

export const ALL_CHART_TIMEFRAMES: ChartTimeframeOption[] =
  CHART_TIMEFRAME_GROUPS.flatMap((group) => group.options);

const LABEL_BY_ID = new Map(ALL_CHART_TIMEFRAMES.map((opt) => [opt.id, opt.label]));

/** True for second and minute bars (plan lock + live-tick cadence). */
export function isMinuteOrSecondTimeframe(id: string): boolean {
  const n = normalizeChartTimeframe(id);
  if (n.endsWith("s")) return true;
  return /^\d+m$/.test(n) && !MONTH_TIMEFRAME_IDS.has(n);
}

export function chartTimeframeLabel(id: string): string {
  const n = normalizeChartTimeframe(id);
  return LABEL_BY_ID.get(n) || id.toUpperCase();
}

/**
 * Canonical UI id. Months/years keep their case so `5M` (five months)
 * never becomes `5m` (five minutes).
 */
export function normalizeChartTimeframe(raw: string): string {
  const t = (raw || "").trim();
  if (!t) return "1h";
  if (t.toLowerCase() === "ytd") return "ytd";
  if (MONTH_TIMEFRAME_IDS.has(t) || YEAR_TIMEFRAME_IDS.has(t)) return t;

  const upper = t.toUpperCase();
  if (YEAR_TIMEFRAME_IDS.has(upper)) return upper;
  if (MONTH_TIMEFRAME_IDS.has(upper) && /[A-Z]$/.test(t.slice(-1))) return upper;

  if (/^\d+s$/i.test(t)) return t.toLowerCase();
  if (/^\d+h$/i.test(t)) return t.toLowerCase();
  if (/^\d+d$/i.test(t) || t.toLowerCase() === "day" || t.toLowerCase() === "1day") return t.toLowerCase() === "day" || t.toLowerCase() === "1day" ? "1d" : t.toLowerCase();
  if (/^\d+w$/i.test(t) || t.toLowerCase() === "week" || t.toLowerCase() === "1week") {
    return t.toLowerCase() === "week" || t.toLowerCase() === "1week" ? "1w" : t.toLowerCase();
  }
  if (/^\d+min$/i.test(t)) return `${t.toLowerCase().replace(/min$/, "")}m`;
  if (/^\d+m$/i.test(t)) return t.toLowerCase();
  return t;
}

export function chartTimeframeStepSeconds(id: string): number {
  const n = normalizeChartTimeframe(id);
  if (n === "1M") return 30 * 86400;
  if (MONTH_TIMEFRAME_IDS.has(n)) return 86400;
  if (n === "ytd") return 86400;
  if (YEAR_TIMEFRAME_IDS.has(n)) return n === "3Y" || n === "5Y" ? 604800 : 30 * 86400;
  const sec = /^(\d+)s$/.exec(n);
  if (sec) return Number(sec[1]);
  const min = /^(\d+)m$/.exec(n);
  if (min) return Number(min[1]) * 60;
  const hr = /^(\d+)h$/.exec(n);
  if (hr) return Number(hr[1]) * 3600;
  if (n === "1d") return 86400;
  if (n === "1w") return 604800;
  return 3600;
}
