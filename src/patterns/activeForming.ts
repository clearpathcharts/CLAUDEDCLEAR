import { FormingStructureBrief, normalizeTimeframe } from './forming';

const briefs = new Map<string, FormingStructureBrief>();
let latestKey: string | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((fn) => fn());
}

export function formingChartKey(symbol: string, timeframe: string): string {
  return `${symbol.toUpperCase()}|${normalizeTimeframe(timeframe)}`;
}

export function subscribeFormingBrief(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setActiveFormingBrief(brief: FormingStructureBrief | null): void {
  if (!brief) return;
  const key = formingChartKey(brief.symbol, brief.timeframe);
  briefs.set(key, brief);
  latestKey = key;
  notify();
}

export function clearFormingBrief(symbol: string, timeframe: string): void {
  const key = formingChartKey(symbol, timeframe);
  if (!briefs.delete(key)) return;
  if (latestKey === key) {
    const keys = [...briefs.keys()];
    latestKey = keys.length > 0 ? keys[keys.length - 1] : null;
  }
  notify();
}

export function getFormingBrief(symbol: string, timeframe: string): FormingStructureBrief | null {
  return briefs.get(formingChartKey(symbol, timeframe)) ?? null;
}

export function getAllFormingBriefs(): FormingStructureBrief[] {
  return [...briefs.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Most recently updated chart — backward compatible fallback. */
export function getActiveFormingBrief(): FormingStructureBrief | null {
  if (latestKey && briefs.has(latestKey)) return briefs.get(latestKey)!;
  const all = getAllFormingBriefs();
  return all[0] ?? null;
}
