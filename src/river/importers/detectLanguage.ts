import type { LanguageDetection, RiverSourceLanguage } from "./types";

type Rule = {
  language: RiverSourceLanguage;
  platform: string;
  label: string;
  weight: number;
  test: (src: string) => boolean;
  hint?: string;
};

const RULES: Rule[] = [
  { language: "pine", platform: "TradingView", label: "Pine Script", weight: 10, test: (s) => /\/\/@version\s*=\s*\d/i.test(s) || /\b(indicator|strategy|study)\s*\(/i.test(s) && /\b(ta\.|plot\(|barcolor)/i.test(s) },
  { language: "mql4", platform: "MetaTrader 4", label: "MQL4", weight: 9, test: (s) => /\b#property\b/i.test(s) || (/\b(int|double)\s+\w+\s*=\s*i[A-Z]/i.test(s) && /\bOrderSend\b/i.test(s) === false && /\bstart\s*\(\s*\)/i.test(s)) },
  { language: "mql4", platform: "MetaTrader 4", label: "MQL4", weight: 8, test: (s) => /\biMA\s*\(|\biRSI\s*\(|\biATR\s*\(|\bOnInit\s*\(/i.test(s) && !/\bOnCalculate\s*\(/i.test(s) },
  { language: "mql5", platform: "MetaTrader 5", label: "MQL5", weight: 9, test: (s) => /\bOnCalculate\s*\(/i.test(s) || /\bCopyBuffer\s*\(/i.test(s) || /\bMqlRates\b/i.test(s) },
  { language: "ninjatrader", platform: "NinjaTrader", label: "NinjaScript", weight: 9, test: (s) => /\bnamespace\s+NinjaTrader/i.test(s) || /\bOnBarUpdate\s*\(\s*\)/i.test(s) && /\bprotected\s+override/i.test(s) },
  { language: "thinkscript", platform: "Thinkorswim", label: "thinkScript", weight: 9, test: (s) => /\bdef\s+\w+\s*=/i.test(s) && /\bplot\s+\w+/i.test(s) && /\bAddLabel\b/i.test(s) },
  { language: "thinkscript", platform: "Thinkorswim", label: "thinkScript", weight: 7, test: (s) => /\bdeclare\s+(upper|lower|hide)\s*;/i.test(s) },
  { language: "easylanguage", platform: "TradeStation", label: "EasyLanguage", weight: 8, test: (s) => /\binputs?\s*:/i.test(s) && /\bvariables?\s*:/i.test(s) && /\bif\s+\w+\s+then\b/i.test(s) },
  { language: "powerlanguage", platform: "MultiCharts", label: "PowerLanguage", weight: 7, test: (s) => /\bPowerLanguage\b/i.test(s) || (/\binputs?\s*:/i.test(s) && /\bValue1\b/i.test(s)) },
  { language: "afl", platform: "AmiBroker", label: "AFL", weight: 8, test: (s) => /\b_SECTION_BEGIN\s*\(/i.test(s) || /\bPlot\s*\(\s*MA\s*\(/i.test(s) && /\bEndValue\b/i.test(s) },
  { language: "python_lean", platform: "QuantConnect", label: "Python LEAN", weight: 8, test: (s) => /\bfrom\s+AlgorithmImports\b/i.test(s) || /\bQCAlgorithm\b/i.test(s) },
  { language: "indie", platform: "TakeProfit", label: "Indie Script", weight: 6, test: (s) => /\bindie\b/i.test(s) && /\b@indicator\b/i.test(s) },
  { language: "gocharting", platform: "GoCharting", label: "GoCharting Script", weight: 5, test: (s) => /\/\/@version/i.test(s) && /\bgc\./i.test(s) },
  { language: "probuilder", platform: "ProRealTime", label: "ProBuilder", weight: 7, test: (s) => /\bDEFPARAM\b/i.test(s) || /\bRETURN\b/i.test(s) && /\bDRAWTEXT\b/i.test(s) },
  { language: "efs", platform: "eSignal", label: "EFS", weight: 7, test: (s) => /\bPreMain\s*\(/i.test(s) || /\brawdata\./i.test(s) },
  { language: "csharp_algo", platform: "cTrader / Quantower", label: "C# Algo", weight: 7, test: (s) => /\busing\s+cAlgo/i.test(s) || /\bRobot\s*:\s*Robot\b/i.test(s) },
  { language: "acsil", platform: "Sierra Chart", label: "ACSIL", weight: 8, test: (s) => /\bsc\.Subgraph/i.test(s) || /\bACSIL\b/i.test(s) },
];

export function detectSourceLanguage(source: string): LanguageDetection {
  const trimmed = source.trim();
  if (!trimmed) {
    return { language: "unknown", label: "Unknown", platform: "Unknown", confidence: "low", hints: ["Paste or upload indicator source code."] };
  }

  const scores = new Map<RiverSourceLanguage, { score: number; platform: string; label: string; hints: string[] }>();

  for (const rule of RULES) {
    if (!rule.test(trimmed)) continue;
    const prev = scores.get(rule.language) ?? { score: 0, platform: rule.platform, label: rule.label, hints: [] as string[] };
    prev.score += rule.weight;
    if (rule.hint && !prev.hints.includes(rule.hint)) prev.hints.push(rule.hint);
    scores.set(rule.language, prev);
  }

  if (scores.size === 0) {
    return {
      language: "unknown",
      label: "Unknown",
      platform: "Unrecognized",
      confidence: "low",
      hints: ["River Genie can help identify and rewrite this script — describe what platform it came from."],
    };
  }

  let best: RiverSourceLanguage = "unknown";
  let bestScore = 0;
  let meta = { platform: "", label: "", hints: [] as string[] };
  for (const [lang, data] of scores) {
    if (data.score > bestScore) {
      bestScore = data.score;
      best = lang;
      meta = data;
    }
  }

  return {
    language: best,
    label: meta.label,
    platform: meta.platform,
    confidence: bestScore >= 9 ? "high" : bestScore >= 7 ? "medium" : "low",
    hints: meta.hints,
  };
}

export function isPineSource(source: string): boolean {
  return detectSourceLanguage(source).language === "pine";
}

export function languageFileExtension(lang: RiverSourceLanguage): string {
  const map: Partial<Record<RiverSourceLanguage, string>> = {
    pine: ".pine",
    mql4: ".mq4",
    mql5: ".mq5",
    thinkscript: ".ts",
    easylanguage: ".eld",
    afl: ".afl",
  };
  return map[lang] ?? ".txt";
}
