// Static + compile-time compatibility report for Pine scripts.
// Surfaces ALL known issues, not just the first compile error.

import { compilePine, RiverCompileResult } from "../riverEngine";

export type CompatSeverity = "error" | "warning" | "info";

export interface CompatIssue {
  severity: CompatSeverity;
  code: string;
  message: string;
  line: number | null;
  hint?: string;
}

export interface CompatibilityReport {
  issues: CompatIssue[];
  /** 0–100 compatibility score */
  score: number;
  compileOk: boolean;
  version: number | null;
  title: string | null;
}

const STATIC_PATTERNS: Array<{
  code: string;
  severity: CompatSeverity;
  regex: RegExp;
  message: string;
  hint: string;
}> = [
  {
    code: "request.security",
    severity: "error",
    regex: /\brequest\.security\s*\(/,
    message: "request.security() pulls data from another symbol/timeframe.",
    hint: "Replace with the chart's own close/open/high/low series, or remove the alternate feed.",
  },
  {
    code: "request.financial",
    severity: "error",
    regex: /\brequest\.financial\s*\(/,
    message: "request.financial() is not supported in The River.",
    hint: "Remove fundamental data calls or replace with static inputs.",
  },
  {
    code: "request.seed",
    severity: "error",
    regex: /\brequest\.seed\s*\(/,
    message: "request.seed() is not supported in The River.",
    hint: "Remove seeded randomness helpers.",
  },
  {
    code: "security",
    severity: "error",
    regex: /\bsecurity\s*\(/,
    message: "security() (v4 multi-symbol fetch) is not supported.",
    hint: "Use the chart's native series instead of security().",
  },
  {
    code: "strategy.entry",
    severity: "warning",
    regex: /\bstrategy\.(entry|order|close|close_all|cancel)\s*\(/,
    message: "Strategy order functions are accepted but do not place live trades here.",
    hint: "Safe for indicator overlays; order plumbing is a no-op in The River.",
  },
  {
    code: "label.new",
    severity: "info",
    regex: /\blabel\.new\s*\(/,
    message: "label.new() is tolerated but labels are not rendered on charts yet.",
    hint: "Use plotshape() or plot() for visible signals.",
  },
  {
    code: "line.new",
    severity: "info",
    regex: /\bline\.new\s*\(/,
    message: "line.new() is tolerated but drawing objects are not rendered yet.",
    hint: "Prefer plot() for lines you need to see on ClearPath charts.",
  },
  {
    code: "table.new",
    severity: "info",
    regex: /\btable\.new\s*\(/,
    message: "table.new() is tolerated but tables are not rendered yet.",
    hint: "Table output is ignored visually in The River.",
  },
  {
    code: "v4-study",
    severity: "warning",
    regex: /\bstudy\s*\(/,
    message: "v4 study() detected — The River maps this to indicator().",
    hint: "Consider //@version=5 with indicator() for clearer intent.",
  },
  {
    code: "v4-tr",
    severity: "info",
    regex: /(?<![\w.])tr(?![\w.])/,
    message: "Bare v4 tr may need ta.tr in strict Pine v5+ scripts.",
    hint: "The River accepts bare tr as ta.tr, but TradingView v5 prefers ta.tr().",
  },
  {
    code: "input-v4",
    severity: "info",
    regex: /\binput\s*\(\s*(?:title\s*=\s*)?["']/,
    message: "Legacy input() style detected.",
    hint: "v5+ prefers input.int(), input.float(), input.bool(), etc.",
  },
  {
    code: "heikinashi",
    severity: "warning",
    regex: /heikinashi|ticker\.heikinashi/,
    message: "Heikin-Ashi ticker transforms are not available.",
    hint: "Use regular OHLC from the chart instead of Heikin-Ashi feeds.",
  },
];

function lineOf(source: string, index: number): number {
  return source.slice(0, index).split("\n").length;
}

function detectVersion(source: string): number | null {
  const m = source.match(/\/\/@version\s*=\s*(\d+)/);
  return m ? Number(m[1]) : null;
}

function staticScan(source: string): CompatIssue[] {
  const issues: CompatIssue[] = [];
  for (const rule of STATIC_PATTERNS) {
    const m = rule.regex.exec(source);
    if (m) {
      issues.push({
        severity: rule.severity,
        code: rule.code,
        message: rule.message,
        line: lineOf(source, m.index),
        hint: rule.hint,
      });
    }
  }
  return issues;
}

function compileIssues(result: RiverCompileResult): CompatIssue[] {
  if (result.status === "error") {
    return [{
      severity: "error",
      code: "compile",
      message: result.error,
      line: result.line,
    }];
  }
  return result.warnings.map((w, i) => ({
    severity: "warning" as CompatSeverity,
    code: `runtime-${i}`,
    message: w,
    line: null,
  }));
}

function scoreFromIssues(issues: CompatIssue[], compileOk: boolean): number {
  let score = compileOk ? 92 : 40;
  for (const issue of issues) {
    if (issue.severity === "error") score -= 18;
    else if (issue.severity === "warning") score -= 6;
    else score -= 2;
  }
  return Math.max(0, Math.min(100, score));
}

/** Build a full compatibility report (static scan + compile + runtime warnings). */
export function buildCompatibilityReport(source: string): CompatibilityReport {
  const trimmed = source.trim();
  if (!trimmed) {
    return {
      issues: [{ severity: "error", code: "empty", message: "Script is empty.", line: null }],
      score: 0,
      compileOk: false,
      version: null,
      title: null,
    };
  }

  const version = detectVersion(trimmed);
  const staticIssues = staticScan(trimmed);
  const compileResult = compilePine(trimmed);
  const compileOk = compileResult.status === "ok";
  const merged = dedupeIssues([...staticIssues, ...compileIssues(compileResult)]);

  return {
    issues: merged,
    score: scoreFromIssues(merged, compileOk),
    compileOk,
    version,
    title: compileOk ? compileResult.title : null,
  };
}

function dedupeIssues(issues: CompatIssue[]): CompatIssue[] {
  const seen = new Set<string>();
  const out: CompatIssue[] = [];
  for (const issue of issues) {
    const key = `${issue.code}:${issue.line}:${issue.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(issue);
  }
  const rank = { error: 0, warning: 1, info: 2 };
  return out.sort((a, b) => {
    const sr = rank[a.severity] - rank[b.severity];
    if (sr !== 0) return sr;
    return (a.line ?? 9999) - (b.line ?? 9999);
  });
}

export function formatCompatSummary(report: CompatibilityReport): string {
  const errors = report.issues.filter((i) => i.severity === "error").length;
  const warnings = report.issues.filter((i) => i.severity === "warning").length;
  const infos = report.issues.filter((i) => i.severity === "info").length;
  return `${report.score}% compatible · ${errors} error(s) · ${warnings} warning(s) · ${infos} note(s)`;
}
