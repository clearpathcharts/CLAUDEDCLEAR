import { PatternScanResult } from './types';

let activeScan: PatternScanResult | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((fn) => fn());
}

export function subscribePatternScan(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setActivePatternScan(scan: PatternScanResult | null): void {
  activeScan = scan;
  notify();
}

export function getActivePatternScan(): PatternScanResult | null {
  return activeScan;
}

export function getRecentPatterns(limit = 8): PatternScanResult['patterns'] {
  if (!activeScan) return [];
  return activeScan.patterns.slice(-limit);
}
