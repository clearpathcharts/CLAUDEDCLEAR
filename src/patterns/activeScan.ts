import { formingChartKey } from './activeForming';
import { PatternScanResult } from './types';

export interface ChartPatternScan {
  symbol: string;
  timeframe: string;
  scan: PatternScanResult;
  updatedAt: number;
}

const scans = new Map<string, ChartPatternScan>();
let latestKey: string | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((fn) => fn());
}

export function subscribePatternScan(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setActivePatternScan(
  scan: PatternScanResult | null,
  symbol?: string,
  timeframe?: string,
): void {
  if (!scan || !symbol || !timeframe) return;

  const key = formingChartKey(symbol, timeframe);
  scans.set(key, {
    symbol: symbol.toUpperCase(),
    timeframe,
    scan,
    updatedAt: Date.now(),
  });
  latestKey = key;
  notify();
}

export function clearPatternScan(symbol: string, timeframe: string): void {
  const key = formingChartKey(symbol, timeframe);
  if (!scans.delete(key)) return;
  if (latestKey === key) {
    const keys = [...scans.keys()];
    latestKey = keys.length > 0 ? keys[keys.length - 1] : null;
  }
  notify();
}

export function getAllPatternScans(): ChartPatternScan[] {
  return [...scans.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getPatternScan(symbol: string, timeframe: string): ChartPatternScan | null {
  return scans.get(formingChartKey(symbol, timeframe)) ?? null;
}

/** Most recently updated chart scan — backward compatible fallback. */
export function getActivePatternScan(): PatternScanResult | null {
  if (latestKey && scans.has(latestKey)) return scans.get(latestKey)!.scan;
  const all = getAllPatternScans();
  return all[0]?.scan ?? null;
}

export function getRecentPatterns(limit = 8): PatternScanResult['patterns'] {
  const scan = getActivePatternScan();
  if (!scan) return [];
  return scan.patterns.slice(0, limit);
}
