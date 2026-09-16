/** Extract Pine Script from LLM markdown fences or raw indicator blocks. */

const FENCE_RE = /```(?:pine|pinescript|txt)?\s*\n([\s\S]*?)```/gi;

export function extractPineCode(text: string): string | null {
  if (!text?.trim()) return null;

  const fences: string[] = [];
  let m: RegExpExecArray | null;
  FENCE_RE.lastIndex = 0;
  while ((m = FENCE_RE.exec(text)) !== null) {
    const block = m[1]?.trim();
    if (block && looksLikePine(block)) fences.push(block);
  }
  if (fences.length > 0) return fences[fences.length - 1];

  // Fallback: raw script starting with //@version or indicator(
  const raw = text.trim();
  if (looksLikePine(raw)) return raw;

  const versionIdx = text.indexOf("//@version");
  if (versionIdx >= 0) {
    const slice = text.slice(versionIdx).trim();
    if (looksLikePine(slice)) return slice.split(/\n```/)[0].trim();
  }

  return null;
}

function looksLikePine(source: string): boolean {
  return (
    /\/\/@version\s*=\s*\d+/i.test(source) ||
    /\bindicator\s*\(/i.test(source) ||
    /\bstudy\s*\(/i.test(source) ||
    /\bstrategy\s*\(/i.test(source)
  );
}

export function suggestIndicatorFileName(pineCode: string, fallback = "river-genie.pine"): string {
  const titleMatch = pineCode.match(/(?:indicator|study|strategy)\s*\(\s*["']([^"']+)["']/i);
  if (titleMatch?.[1]) {
    return `${titleMatch[1].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "indicator"}.pine`;
  }
  return fallback;
}
