/**
 * MQL4 → Pine Script v5 bridge (v1).
 * Converts common indicator patterns so traders can run MT4 logic on ClearPath charts today.
 * Full RIR lowering follows in a later card per RIVER_CONSTITUTION_V1.
 */
import type { ImportTranslationResult } from "../types";

const MQL4_BUILTINS: Array<{ re: RegExp; pine: string; note?: string }> = [
  { re: /\biRSI\s*\(\s*[^,]+,\s*[^,]+,\s*([^,)]+)\s*,[^)]+\)/gi, pine: "ta.rsi(close, $1)" },
  { re: /\biMA\s*\(\s*[^,]+,\s*[^,]+,\s*([^,)]+)\s*,[^,]+,\s*MODE_SMA\s*,[^)]+\)/gi, pine: "ta.sma(close, $1)" },
  { re: /\biMA\s*\(\s*[^,]+,\s*[^,]+,\s*([^,)]+)\s*,[^,]+,\s*MODE_EMA\s*,[^)]+\)/gi, pine: "ta.ema(close, $1)" },
  { re: /\biATR\s*\(\s*[^,]+,\s*[^,]+,\s*([^,)]+)\s*,[^)]+\)/gi, pine: "ta.atr($1)" },
  { re: /\biMACD\s*\([^)]+\)/gi, pine: "ta.macd(close, 12, 26, 9)", note: "MACD params defaulted — review inputs." },
  { re: /\bClose\[(\d+)\]/gi, pine: "close[$1]" },
  { re: /\bOpen\[(\d+)\]/gi, pine: "open[$1]" },
  { re: /\bHigh\[(\d+)\]/gi, pine: "high[$1]" },
  { re: /\bLow\[(\d+)\]/gi, pine: "low[$1]" },
  { re: /\bClose\b/g, pine: "close" },
  { re: /\bOpen\b/g, pine: "open" },
  { re: /\bHigh\b/g, pine: "high" },
  { re: /\bLow\b/g, pine: "low" },
];

function stripMql4Boilerplate(source: string): string {
  return source
    .replace(/\/\/[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^#property[^\n]*\n/gm, "")
    .replace(/^#include[^\n]*\n/gm, "");
}

function extractExternInputs(source: string): string[] {
  const lines: string[] = [];
  const re = /extern\s+\w+\s+(\w+)\s*=\s*([^;]+);/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    const name = m[1];
    const val = m[2].trim();
    if (/true|false/i.test(val)) {
      lines.push(`${name} = input.bool(${val.toLowerCase()}, title="${name}")`);
    } else if (/^\d+$/.test(val)) {
      lines.push(`${name} = input.int(${val}, title="${name}")`);
    } else {
      lines.push(`${name} = input.float(${val}, title="${name}")`);
    }
  }
  return lines;
}

function extractIndicatorName(source: string): string {
  const m = source.match(/#property\s+indicator_\w+\s+"([^"]+)"/i) || source.match(/#property\s+copyright\s+"([^"]+)"/i);
  return m?.[1]?.slice(0, 60) || "MQL4 Import";
}

/** Translate MQL4 indicator source into Pine Script v5 (best-effort). */
export function translateMql4ToPine(source: string): ImportTranslationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const manualReview: string[] = [];

  if (!/\b(iRSI|iMA|iATR|iMACD|OnInit|start\s*\()\b/i.test(source)) {
    return {
      ok: false,
      sourceLanguage: "mql4",
      warnings,
      errors: ["Could not recognize MQL4 indicator patterns in this file."],
      manualReview: ["Paste a simpler MQL4 indicator or ask River Genie to rewrite it."],
    };
  }

  if (/\bOrderSend\b|\bOrderClose\b|\bPositionSelect\b/i.test(source)) {
    warnings.push("Expert Advisor order functions detected — only indicator math will be converted (no live trades).");
    manualReview.push("Remove or rewrite OrderSend / position management blocks.");
  }

  const title = extractIndicatorName(source);
  const inputs = extractExternInputs(source);
  let body = stripMql4Boilerplate(source);

  for (const rule of MQL4_BUILTINS) {
    body = body.replace(rule.re, rule.pine);
  }

  // Pull simple double assignments as Pine series (after builtin rewrite)
  const assignments: string[] = [];
  const assignRe = /(?:double|int)\s+(\w+)\s*=\s*([^;]+);/gi;
  let am: RegExpExecArray | null;
  while ((am = assignRe.exec(body)) !== null) {
    const rhs = am[2].trim();
    if (/ta\.|close|open|high|low|math\./i.test(rhs)) {
      assignments.push(`${am[1]} = ${rhs}`);
    }
  }

  if (assignments.length === 0) {
    manualReview.push("No convertible assignments found — script may use loops or buffers.");
  }

  const pineSource = `//@version=5
indicator("${title.replace(/"/g, "'")} (from MQL4)", overlay=true)
// Auto-converted by The River — review before trading.
${inputs.join("\n")}
${assignments.join("\n")}
${assignments[0] ? `plot(${assignments[0].split("=")[0].trim()}, title="Converted", color=color.orange)` : "// Add plot() for your main series"}
`;

  if (/\bArrayResize\b|\bCopyBuffer\b/i.test(source)) {
    warnings.push("Array/buffer logic was not converted — simplify or ask River Genie.");
  }

  return {
    ok: assignments.length > 0 || inputs.length > 0,
    sourceLanguage: "mql4",
    pineSource,
    warnings,
    errors: assignments.length === 0 && inputs.length === 0 ? ["Conversion produced no Pine statements."] : [],
    manualReview,
  };
}
