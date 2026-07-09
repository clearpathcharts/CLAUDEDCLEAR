import { PatternScanResult } from './types';
import { formingChartKey } from './activeForming';
import { normalizeTimeframe } from './forming';

export interface ChartPatternScanBrief extends PatternScanResult {
  symbol: string;
  timeframe: string;
  updatedAt: number;
}

const scans = new Map<string, ChartPatternScanBrief>();
let latestKey: string | null = null;
let activeScan: PatternScanResult | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((fn) => fn());
}

export function subscribePatternScan(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function patternScanKey(symbol: string, timeframe: string): string {
  return formingChartKey(symbol, timeframe);
}

/** Store measured pattern scan for a specific chart (Buddy eyes per symbol/timeframe). */
export function setChartPatternScan(
  symbol: string,
  timeframe: string,
  scan: PatternScanResult,
): void {
  const key = patternScanKey(symbol, timeframe);
  const brief: ChartPatternScanBrief = {
    ...scan,
    symbol: symbol.toUpperCase(),
    timeframe: normalizeTimeframe(timeframe),
    updatedAt: Date.now(),
  };
  scans.set(key, brief);
  latestKey = key;
  activeScan = scan;
  notify();
}

export function clearChartPatternScan(symbol: string, timeframe: string): void {
  const key = patternScanKey(symbol, timeframe);
  if (!scans.delete(key)) return;
  if (latestKey === key) {
    const keys = [...scans.keys()];
    latestKey = keys.length > 0 ? keys[keys.length - 1]! : null;
    activeScan = latestKey ? scans.get(latestKey)! : null;
  }
  notify();
}

export function getChartPatternScan(symbol: string, timeframe: string): ChartPatternScanBrief | null {
  return scans.get(patternScanKey(symbol, timeframe)) ?? null;
}

export function getAllChartPatternScans(): ChartPatternScanBrief[] {
  return [...scans.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}

/** @deprecated Use setChartPatternScan — kept for backward compatibility */
export function setActivePatternScan(scan: PatternScanResult | null): void {
  activeScan = scan;
  notify();
}

export function getActivePatternScan(): PatternScanResult | null {
  if (latestKey && scans.has(latestKey)) return scans.get(latestKey)!;
  return activeScan;
}

export function getRecentPatterns(limit = 8): PatternScanResult['patterns'] {
  const scan = getActivePatternScan();
  if (!scan) return [];
  return scan.patterns.slice(-limit);
}
