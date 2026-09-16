/**
 * Split a daily-bar scan into:
 *   daily   — outer (major) structure on the completed session history
 *   nested  — same geometry inside that parent
 *   independent — prints / structures in the gaps (not nested, not the outer)
 */

import type { DetectedPattern } from "../patterns/types";

export type ClassifiedDailyPatterns = {
  dailyPattern: DetectedPattern | null;
  subPatterns: DetectedPattern[];
  independentPatterns: DetectedPattern[];
};

function span(p: DetectedPattern): number {
  return Math.max(0, p.endIndex - p.startIndex);
}

function overlapRatio(a: DetectedPattern, b: DetectedPattern): number {
  const start = Math.max(a.startIndex, b.startIndex);
  const end = Math.min(a.endIndex, b.endIndex);
  if (end < start) return 0;
  const overlap = end - start + 1;
  const denom = Math.min(span(a) + 1, span(b) + 1);
  return denom > 0 ? overlap / denom : 0;
}

function inside(child: DetectedPattern, parent: DetectedPattern): boolean {
  return child.startIndex >= parent.startIndex && child.endIndex <= parent.endIndex;
}

/** Pure classifier — no network, no invented hits. */
export function classifyDailyPatterns(patterns: DetectedPattern[]): ClassifiedDailyPatterns {
  const list = Array.isArray(patterns) ? patterns : [];
  const chart = list.filter((p) => p.category === "chart");
  const candles = list.filter((p) => p.category === "candlestick");

  const majors = chart
    .filter((p) => (p.scale ?? "major") === "major")
    .sort((a, b) => span(b) - span(a) || b.confidence - a.confidence);

  const dailyPattern = majors[0] ?? null;
  const nested = chart.filter((p) => p.scale === "nested");

  const independent: DetectedPattern[] = [];

  for (const p of majors.slice(1)) {
    if (!dailyPattern || overlapRatio(p, dailyPattern) < 0.35) {
      independent.push(p);
    }
  }

  for (const c of candles) {
    if (nested.some((n) => inside(c, n))) continue;
    independent.push(c);
  }

  return {
    dailyPattern,
    subPatterns: nested,
    independentPatterns: independent,
  };
}

export function summarizeClassification(classified: ClassifiedDailyPatterns): string {
  const daily = classified.dailyPattern
    ? `${classified.dailyPattern.label} (${classified.dailyPattern.direction})`
    : "none labeled";
  const nested = classified.subPatterns.length;
  const independent = classified.independentPatterns.length;
  return `daily ${daily} · nested ${nested} · independent ${independent}`;
}

export function summarizeMultiTimeframe(
  weekly: ClassifiedDailyPatterns,
  daily: ClassifiedDailyPatterns,
): string {
  const w = weekly.dailyPattern
    ? `${weekly.dailyPattern.label} (${weekly.dailyPattern.direction})`
    : "none";
  const d = daily.dailyPattern
    ? `${daily.dailyPattern.label} (${daily.dailyPattern.direction})`
    : "none";
  const between = daily.independentPatterns.length;
  return `weekly ${w} · daily ${d} · in-between ${between} · nested ${daily.subPatterns.length}`;
}

/** Alias — same classifier for weekly or daily bars. */
export const classifyTimeframePatterns = classifyDailyPatterns;
