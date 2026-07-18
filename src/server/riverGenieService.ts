/**
 * River Genie — AI co-pilot for building Pine indicators in ClearPath.
 * Uses Groq (same stack as C.P.T. mentor) with offline rules-first fallback.
 */
import { getLocalHints } from "../river/assist/localHints";
import { suggestPineMigration } from "../river/assist/pineMigrator";
import { extractPineCode, suggestIndicatorFileName } from "../river/assist/extractPineCode";

export type GenieMessage = { role: "user" | "assistant"; content: string };

export type RiverGenieRequest = {
  question: string;
  userName?: string;
  conversationHistory?: GenieMessage[];
  pineSource?: string;
  compileError?: string;
  errorLine?: number | null;
  activeIndicatorName?: string;
  compatSummary?: string;
  compatIssues?: Array<{ severity: string; message: string; hint?: string; line?: number | null }>;
  localHints?: string[];
  chartContext?: string;
  catalogSnippet?: string;
};

export type RiverGenieResponse = {
  answer: string;
  pineCode: string | null;
  suggestedFileName: string | null;
  suggestedFixes: string[];
};

export const RIVER_GENIE_GUIDE = `
=== RIVER GENIE — PINE INDICATOR BUILDER ===

You are River Genie, ClearPath Trader's friendly Pine Script co-pilot inside **The River** workstation.
Your job is conversational: help traders describe the indicator they want, ask if they already have code,
recommend starter ideas, read pasted Pine, fix compile errors, and **write complete Pine Script** that
The River compiler can run on ClearPath charts.

PERSONALITY:
- Warm, patient, plain English. No hype, no guaranteed profits.
- Ask one clear question at a time when requirements are vague.
- When someone wants a custom indicator, clarify: overlay on price or separate pane? signals or lines only?
- Always offer: "Do you have existing Pine code to paste?" and "Want me to draft code for you?"

WORKFLOW YOU TEACH:
1. Describe the indicator (or paste code).
2. Genie drafts or fixes Pine → user loads it in the workstation.
3. The River compiles honestly (errors show exact line).
4. User applies to all charts → open CHARTS to see plots/shapes.

WHEN YOU WRITE CODE:
- Output a **complete** Pine Script in a single \`\`\`pine fenced block.
- Start with //@version=5 unless user needs v4.
- Use indicator("Title", overlay=true/false) — not strategy() unless they explicitly want backtest plumbing.
- Prefer input.int / input.float / input.bool for tunable params.
- Use ta.* functions (ta.sma, ta.ema, ta.rsi, ta.atr, ta.crossover, ta.crossunder, ta.linreg, ta.cci, ta.mfi).
- Use plot(), plotshape(), barcolor() for visible output on ClearPath charts.
- Keep scripts focused — under ~60 lines when possible.

HARD LIMITS (The River compiler — be honest):
- NO request.security(), request.financial(), security() — multi-symbol feeds fail.
- NO Heikin-Ashi ticker transforms as external feeds.
- Drawing objects (label.new, line.new, table.new) compile but do not render yet — prefer plot/plotshape.
- Strategy order functions are no-ops (no live trades).
- If user asks for unsupported features, explain and offer a chart-native alternative.

WHEN FIXING ERRORS:
- Read compileError and line number if provided.
- Suggest minimal edits; output full corrected script in \`\`\`pine block.

WHEN USER HAS NO CODE:
- Propose 2–3 simple indicator archetypes (ATR trail, RSI panel, EMA cross, Bollinger squeeze).
- After they pick, generate code immediately.

CATALOG / SHARING:
- Mention they can Save Local, Publish Public, or Save to Vault after a successful compile.

Never invent fake APIs. Never claim you applied code to charts — tell them to click "Use in Workstation" or "Compile & Apply".
=== END RIVER GENIE GUIDE ===
`.trim();

function offlineRiverGenieAnswer(req: RiverGenieRequest): RiverGenieResponse {
  const q = req.question.toLowerCase();
  const hints = req.localHints?.length
    ? req.localHints
    : getLocalHints(req.pineSource || "", req.compileError || "", []);

  if (/build|create|make|custom|indicator|rsi|ema|atr|macd|bollinger/i.test(q)) {
    const { migrated } = suggestPineMigration(`//@version=5
indicator("Genie Starter RSI", overlay=false)
len = input.int(14, title="Length")
plot(ta.rsi(close, len), color=color.purple)
hline(70, color=color.red)
hline(30, color=color.green)
`);
    return {
      answer:
        "Live River Genie AI needs GROQ_API_KEY in Secrets. Meanwhile, here's a starter RSI panel you can load. Tell me overlay vs pane, and what signals you want (crosses, colors, shapes).",
      pineCode: migrated,
      suggestedFileName: "genie-starter-rsi.pine",
      suggestedFixes: hints,
    };
  }

  if (req.compileError) {
    const { migrated, changes } = suggestPineMigration(req.pineSource || "");
    return {
      answer: `Compile error${req.errorLine ? ` on line ${req.errorLine}` : ""}: ${req.compileError}\n\nOffline fixes tried: ${changes.join("; ") || "none"}. Set GROQ_API_KEY for full AI repair.`,
      pineCode: changes.length > 0 ? migrated : null,
      suggestedFileName: req.pineSource ? suggestIndicatorFileName(migrated) : null,
      suggestedFixes: hints,
    };
  }

  return {
    answer:
      "I'm River Genie (offline mode). Set GROQ_API_KEY for full AI chat. You can still: paste Pine code, ask me to build an RSI/EMA/ATR indicator, or share a compile error and I'll suggest rule-based fixes.",
    pineCode: null,
    suggestedFileName: null,
    suggestedFixes: hints,
  };
}

function buildContextBlock(req: RiverGenieRequest): string {
  const parts: string[] = [];
  if (req.activeIndicatorName) parts.push(`Active on charts: ${req.activeIndicatorName}`);
  if (req.pineSource?.trim()) {
    parts.push(`CURRENT PINE SOURCE (${req.pineSource.length} chars):\n\`\`\`pine\n${req.pineSource.slice(0, 12000)}\n\`\`\``);
  }
  if (req.compileError) {
    parts.push(`COMPILE ERROR${req.errorLine ? ` line ${req.errorLine}` : ""}: ${req.compileError}`);
  }
  if (req.compatSummary) parts.push(`COMPATIBILITY: ${req.compatSummary}`);
  if (req.compatIssues?.length) {
    parts.push(
      "COMPAT ISSUES:\n" +
        req.compatIssues
          .slice(0, 12)
          .map((i) => `- [${i.severity}] ${i.line ? `L${i.line}: ` : ""}${i.message}`)
          .join("\n"),
    );
  }
  if (req.localHints?.length) parts.push(`LOCAL HINTS: ${req.localHints.join(" | ")}`);
  if (req.catalogSnippet) parts.push(`CATALOG CONTEXT:\n${req.catalogSnippet}`);
  if (req.chartContext?.trim()) {
    parts.push(
      `${req.chartContext.trim()}\nUse chart structure only when user asks how an indicator might fit current price action. Say "possible/forming" — never confirmed.`,
    );
  }
  return parts.length ? `\n\n=== WORKSTATION CONTEXT ===\n${parts.join("\n\n")}\n=== END CONTEXT ===` : "";
}

export async function chatRiverGenie(req: RiverGenieRequest): Promise<RiverGenieResponse> {
  const question = (req.question || "").trim();
  if (!question) {
    return { answer: "Ask me what indicator you want to build, or paste Pine code to fix.", pineCode: null, suggestedFileName: null, suggestedFixes: [] };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return offlineRiverGenieAnswer(req);
  }

  const displayName = req.userName?.trim() || "trader";
  const systemPrompt = `${RIVER_GENIE_GUIDE}${buildContextBlock(req)}`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...(Array.isArray(req.conversationHistory) ? req.conversationHistory.slice(-12) : []),
    { role: "user", content: question },
  ];

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.35,
      max_tokens: 2200,
    }),
  });

  if (!groqRes.ok) {
    const errText = await groqRes.text();
    throw new Error(`Groq API returned ${groqRes.status}: ${errText}`);
  }

  const data = await groqRes.json();
  const answer: string =
    data?.choices?.[0]?.message?.content ||
    "I couldn't draft that yet — try describing overlay vs pane and one signal you want.";

  const pineCode = extractPineCode(answer);
  const suggestedFixes = getLocalHints(req.pineSource || "", req.compileError || "", []);

  return {
    answer,
    pineCode,
    suggestedFileName: pineCode ? suggestIndicatorFileName(pineCode) : null,
    suggestedFixes,
  };
}
