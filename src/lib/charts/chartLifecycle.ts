/** Chart instance lifecycle helpers — not overlay geometry. */

export function isChartDisposedError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /disposed|invalid object/i.test(msg);
}

export function isEmptyVisibleRange(
  range: { from: number; to: number } | null | undefined,
): boolean {
  if (!range) return true;
  if (!Number.isFinite(range.from) || !Number.isFinite(range.to)) return true;
  return range.to - range.from < 1e-6;
}
