// Rules-first Pine Script hints — no network, no LLM.

import type { CompatIssue } from "../compat/report";

const ERROR_HINTS: Array<{ match: RegExp; hint: string }> = [
  {
    match: /doesn't support the function '([^']+)'/,
    hint: "Check INDACREATOR docs for supported ta.* and math.* functions. Popular gaps: ta.vwap, ta.alma, ta.hma.",
  },
  {
    match: /request\.|security/,
    hint: "Multi-symbol feeds are the #1 blocker. Swap to close/open/high/low from the active chart.",
  },
  {
    match: /Unexpected token|Expected/,
    hint: "Syntax may be v6-only (switch types, UDTs). Try simplifying blocks or add //@version=5.",
  },
  {
    match: /history reference|\[\d+\]/,
    hint: "Series history needs enough warmup bars. Reduce lookback or ensure ta.* length inputs are reasonable.",
  },
];

const QUICK_FIXES: Array<{ match: RegExp; fix: string }> = [
  { match: /\bstudy\s*\(/, fix: "Rename study() → indicator() for Pine v5 clarity." },
  { match: /\bsecurity\s*\(/, fix: "Remove security() and use close (or open/high/low) from the chart." },
  { match: /(?<![\w.])tr(?![\w.])/, fix: "Bare tr works in INDACREATOR, but ta.tr() is clearer on v5+." },
  { match: /\/\/@version\s*=\s*4/, fix: "Consider migrating to //@version=5 — see Auto-migrate below." },
];

/** Actionable hints from a compile error string and optional compat issues. */
export function getLocalHints(source: string, errorMessage = "", issues: CompatIssue[] = []): string[] {
  const hints = new Set<string>();

  for (const rule of ERROR_HINTS) {
    if (rule.match.test(errorMessage)) hints.add(rule.hint);
  }

  for (const issue of issues) {
    if (issue.hint) hints.add(issue.hint);
  }

  for (const rule of QUICK_FIXES) {
    if (rule.match.test(source)) hints.add(rule.fix);
  }

  if (!source.includes("//@version")) {
    hints.add("Add //@version=5 at the top so INDACREATOR picks the right parser mode.");
  }

  if (source.includes("overlay=true") === false && source.includes("indicator(")) {
    hints.add("If plots should sit on price, pass overlay=true to indicator().");
  }

  return [...hints].slice(0, 8);
}
