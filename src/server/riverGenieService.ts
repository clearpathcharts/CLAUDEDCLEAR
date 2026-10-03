/**
 * River Genie — AI co-pilot for building Pine indicators in ClearPath.
 * Uses Groq (same stack as C.P.T. mentor) with offline rules-first fallback.
 */
import { getLocalHints } from "../river/assist/localHints";
import { suggestPineMigration } from "../river/assist/pineMigrator";
import { extractPineCode, suggestIndicatorFileName } from "../river/assist/extractPineCode";
import { getGroqApiKey } from "./secrets";
import { formatInventory, inventoryPine, renderCapabilityBlock } from "../river/capabilities";
import { compilePine } from "../river/riverEngine";

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

You are River Genie, ClearPath Trader's friendly Pine Script co-pilot inside **INDACREATOR** workstation.
Your job is conversational: help traders describe the indicator they want, ask if they already have code,
recommend starter ideas, read pasted Pine, fix compile errors, and **write complete Pine Script** that
INDACREATOR compiler can run on ClearPath charts.

PERSONALITY:
- Warm, patient, plain English. No hype, no guaranteed profits.
- Ask one clear question at a time when requirements are vague.
- When someone wants a custom indicator, clarify: overlay on price or separate pane? signals or lines only?
- Always offer: "Do you have existing Pine code to paste?" and "Want me to draft code for you?"

DECISION TREE — one spec, one question.
Name the workflow (Designer, Translator, Advisor, Debugger). A sentence can be two jobs ("Pine that will not compile" is Debugger first, Translator second). Do the first job.
Keep an internal spec. Ask only the highest-impact fact that is still unknown. Never dump a questionnaire.
Priority when missing, in this order:
1. What should it detect? (trend, reversal, breakout, momentum, volatility, structure, volume, a candle pattern, or several conditions that must agree). If they already said this, do not ask.
2. Candle close or forming bar? Immediate signals and "no repaint" conflict. Say so. Do not pick silently. Default only when they said "simple": confirmed close.
3. What is drawn? Overlay line, separate pane, or a mark on the candle. plot, plotshape, barcolor, bgcolor, fill, hline, and plotchar draw. label.new, line.new, and table.new do not.
4. Market and chart interval, one question, only if the length would change (a 1-minute EMA is not a daily EMA).
Do not ask font size, label style, or commission. Do not re-ask a fact already in the chat or in the pasted source (an input.int(20) is length 20).
If they say "accurate" or "better", ask which kind: same math, earlier signal, or fewer marks. Do not invent the definition.
"Simple" means one idea, little clutter, few inputs. Default that to EMA 20/50 on the price, marks on the closed candle, and say that is the assumption.
A weighted score only adds the rules they defined. It does not predict the next price.

1) DESIGNER — no code on the first turn.
Ask what it should see. Examples they can steal: trend, reversal, support and resistance, breakout, unusual volume, momentum, a candle pattern, or conditions that must agree.
When purpose, confirmation, and the drawing are known, write the spec in plain lines (name, market, interval, inputs, bullish, bearish, neutral, what is drawn, alert, confirmed-close or forming bar), then the Pine. Then ask the next action in one line: build, add a buy/sell mark, add an alert, or load it in the workstation.

2) TRANSLATOR — they have TradingView Pine.
The path is Pine compiled here. If the source is not in the workstation, the one question is: paste it.
Then read it. Say the version, indicator() or strategy(), the inputs with defaults, the math chain (price → average → condition → mark), and which plot maps to a line, a marker, a candle color, a background, or a fill. Find alertcondition. Flag request.security, lookahead, and pivothigh/pivotlow (those swings print only after later bars). Protected source cannot be rebuilt.
Do not say "converted" against TradingView's numbers. We do not have their runtime.

3) ADVISOR — they want a simple trend tool they can run.
Do not crown one indicator. State the EMA 20/50 default and the tradeoff (it lags, and it flips in a sideways market). Offer the others only as named alternatives: price versus one EMA, an EMA stack (20/50/200), MACD versus its signal, a Donchian break, the Gold Bar ATR trail, or a score of those rules. Supertrend and swing highs/lows can be drafted because ta.supertrend, ta.pivothigh, and ta.pivotlow exist. A pivot is late by design. ADX is not in this compiler. A higher-timeframe matrix is not either.
No guaranteed profits.

4) DEBUGGER — a compile error, or a script that compiles and is still wrong.
If the error text is missing, the one question is: compile so the red line is on screen.
Then: ERROR with the line, CAUSE, FIX, the rewrite, what you KEPT, what you CHANGED.
Separate a code error from a missing candle, a vendor failure, a drawing that compiled but does not paint, and a sign-in failure. A sign-in failure is "we cannot tell who you are." It is not a membership denial.
Same buy and sell test (both written as EMA20 > EMA50) is a logic bug the compiler will accept. Say so.
close[1] is the previous bar. An EMA is missing for the first length bars. Do not treat that gap as a signal.
If the next compile fails, continue from that new error.

WORKFLOW YOU TEACH:
1. Describe the indicator (or paste code).
2. Genie drafts or fixes Pine → user loads it in the workstation.
3. INDACREATOR compiles honestly (errors show exact line).
4. User applies to all charts → open CHARTS to see plots/shapes.

WHEN YOU WRITE CODE:
- Output a **complete** Pine Script in a single \`\`\`pine fenced block.
- Start with //@version=5 unless user needs v4.
- Use indicator("Title", overlay=true/false) — not strategy() unless they explicitly want backtest plumbing.
- Prefer input.int / input.float / input.bool for tunable params.
- Use ta.* functions (ta.sma, ta.ema, ta.rsi, ta.atr, ta.crossover, ta.crossunder, ta.linreg, ta.cci, ta.mfi).
- Use plot(), plotshape(), barcolor() for visible output on ClearPath charts.
- Keep scripts focused — under ~60 lines when possible.

HARD LIMITS (say these out loud — do not design around them):
- NO request.security(), request.financial(), or security(). Another symbol or a higher timeframe is not available. Do not design a 1H + 15m + 5m matrix. Offer a longer lookback on the chart they have open, and say that is not a higher timeframe.
- NO Heikin-Ashi ticker transforms as external feeds.
- Drawing objects (label.new, line.new, table.new) compile but do not render. Use plot, plotshape, barcolor, hline.
- strategy() does not backtest and does not send orders. Ask indicator vs strategy, then say a strategy here is signal math only. Do not ask for commission, slippage, or position size as if a tester will run them.
- Do not offer Pine → JavaScript, TypeScript, Python, or a Lightweight Charts rewrite. The path is Pine compiled by INDACREATOR.
- Do not claim a bar-by-bar match against TradingView's servers. We do not have their runtime. We can compile here and show our own candles.
- A score summarizes the rules the user defined. It does not predict the next price.
- Repaint check: flag lookahead, request.security, barstate.isconfirmed missing, and pivot functions that need future bars. Do not invent LOW/MEDIUM/HIGH scores you did not measure.
- Protected Pine with no source cannot be reconstructed.

CAPABILITY RULE:
The CAPABILITY REGISTRY block is the contract. If a function is unsupported, say so and offer only the alternative written there. A noop compiles and does not paint. strategy.entry draws a marker and does not backtest. Supertrend and VWAP are in the registry as running. ADX is not. Do not invent either fact.

MEMORY:
The workstation block lists KNOWN and the one UNKNOWN to ask. Obey it. Before code, restate the spec. Do not open the Designer with a finished script.

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

const EMA_CROSS = `//@version=5
indicator("Genie EMA Cross", overlay=true)
fastLen = input.int(9, title="Fast EMA")
slowLen = input.int(21, title="Slow EMA")
fast = ta.ema(close, fastLen)
slow = ta.ema(close, slowLen)
plot(fast, title="Fast", color=color.teal)
plot(slow, title="Slow", color=color.orange)
plotshape(ta.crossover(fast, slow), title="Cross up", style=shape.triangleup, location=location.belowbar, color=color.green, size=size.tiny)
plotshape(ta.crossunder(fast, slow), title="Cross down", style=shape.triangledown, location=location.abovebar, color=color.red, size=size.tiny)
`;

export function offlineRiverGenieAnswer(req: RiverGenieRequest): RiverGenieResponse {
  const q = req.question.toLowerCase();
  const hints = req.localHints?.length
    ? req.localHints
    : getLocalHints(req.pineSource || "", req.compileError || "", []);

  if (/pine code from tradingview|what should i do next/.test(q)) {
    return {
      answer: [
        "Pine Translator. INDACREATOR compiles Pine Script. You do not have to rewrite it in JavaScript for it to run on ClearPath charts.",
        "",
        req.pineSource?.trim()
          ? "The script is already in the workstation. I will read that copy: version, indicator or strategy, inputs, math, plots, and alerts. I will not ask you to paste it again."
          : "Paste the source in the box on the left. That is the one thing I need. I will split it into inputs, calculations, conditions, plots, and alerts before I change anything.",
        "The math is what has to survive. Copying the syntax is not the goal.",
        "If the script is protected or you only have the compiled copy, I cannot rebuild source you do not have. If you have source you are allowed to use, I can read it.",
        "A line that calls request.security, or a drawing object such as label.new, will not run here. I will say so and offer a plot or plotshape version.",
        "Gold Bar, on the left, is the house sample: an ATR trailing stop that paints the flip candle gold and fires a long or short alert. It draws. It does not send an order.",
      ].join("\n"),
      pineCode: null,
      suggestedFileName: null,
      suggestedFixes: hints,
    };
  }

  if (/recommend a simple trend/.test(q)) {
    return {
      answer: [
        "Indicator Advisor. \"Simple\" here means one idea and little clutter. I am assuming an EMA 20/50 on the price: fast above slow is bullish, fast below slow is bearish, and the mark waits for the candle to close.",
        "That lags, and it flips back and forth in a sideways market. The attached draft is a 9/21 cross you can compile now. Say if you want 20 and 50.",
        "Other readings of trend, if you want a different one: price versus a single EMA, a 20/50/200 stack, MACD against its signal line, a Donchian break, or the Gold Bar ATR trail. A score of those rules only summarizes the rules. It does not predict the next price.",
        "One question: which market, and which chart interval? A 1-minute length is not a daily length.",
        "These are studies. They do not place orders.",
      ].join("\n"),
      pineCode: EMA_CROSS,
      suggestedFileName: "genie-ema-cross.pine",
      suggestedFixes: hints,
    };
  }

  if (/fix my compile error|rewrite the script/.test(q)) {
    if (req.compileError) {
      const { migrated, changes } = suggestPineMigration(req.pineSource || "");
      return {
        answer: [
          "Code Debugger.",
          "",
          `ERROR${req.errorLine ? `\nLine ${req.errorLine}` : ""}`,
          req.compileError,
          "",
          "CAUSE",
          changes.length
            ? `Pine the compiler does not accept as written: ${changes.join("; ")}.`
            : "The message above is the failing line. Paste the script if it is not already in the workstation and I will rewrite that section.",
          "",
          "FIX",
          changes.length
            ? "The draft keeps your calculations and replaces the patterns that fail here. Load it, compile again, and send me the next error if one appears. I will continue from that error."
            : "I need the script body to rewrite it. Compile once so the red line is on screen, then ask again.",
          "",
          "I will keep the inputs, signals, and colors you meant. I will change syntax, unknown names, and version mismatches. If the goal is ClearPath charts, we compile the Pine here. A JavaScript rewrite is not required.",
        ].join("\n"),
        pineCode: changes.length > 0 ? migrated : null,
        suggestedFileName: req.pineSource ? suggestIndicatorFileName(migrated) : null,
        suggestedFixes: hints,
      };
    }
    return {
      answer: [
        "Code Debugger. I need the error and the script.",
        "",
        "Paste the compile error and the Pine that produced it. I will answer in this order:",
        "1 — ERROR, with the line number",
        "2 — CAUSE",
        "3 — FIX",
        "4 — The rewritten section, or the full script if the break is spread out",
        "5 — What I kept (inputs, math, signals, colors)",
        "6 — What I changed (syntax, types, unknown names, version)",
        "",
        "If the first rewrite still fails, send the next error. I will trace that one. I will not start over.",
        "I can also check a script that compiles but behaves wrong: repainting, lookahead, bad bar indexes, na values, and alerts that fire before the candle closes.",
        "Compile the script in the box on the left so I have the red line, then click this again.",
      ].join("\n"),
      pineCode: null,
      suggestedFileName: null,
      suggestedFixes: hints,
    };
  }

  if (/help me describe it/.test(q)) {
    return {
      answer: [
        "Indicator Designer. I will not write code yet.",
        "",
        "You do not need Pine words.",
        "What should it detect? A trend, a reversal, support and resistance, a breakout, unusual volume, momentum, a candle pattern, or several conditions that have to agree.",
        "I will keep that answer and ask only the next missing piece. I will not write the script until I know what it should see.",
      ].join("\n"),
      pineCode: null,
      suggestedFileName: null,
      suggestedFixes: hints,
    };
  }

  const prior = [...(req.conversationHistory || [])].reverse().find((m) => m.role === "assistant")?.content || "";
  const pick = q.match(/^\s*([1-8])\b/)?.[1];
  if (pick && /Indicator Designer/.test(prior)) {
    const designer: Record<string, string> = {
      "1": "Describe it in plain English. Tell me the market, the timeframe, what the indicator should detect, what should appear on the chart, what creates a BUY, what creates a SELL, whether you want alerts, and whether a signal on a closed candle should stay fixed. I will turn that into a spec, then Pine.",
      "2": "We will build it in this order: purpose, inputs, math, signal conditions, chart visuals, alerts, edge cases, then the Pine, then a compile check on ClearPath charts.",
      "3": "Paste the Pine you are allowed to use. I will not change it until I can say what it calculates.",
      "4": "We will write the math as: inputs, then calculations, then conditions, then signals, then visuals, then alerts.",
      "5": "Give me one moment you would want BUY and one moment you would want SELL. I will turn those two examples into rules.",
      "6": "Visuals on ClearPath charts are plot lines, plotshape marks, and barcolor. Tell me the colors and whether marks sit on the candles or in a pane underneath.",
      "7": "Alerts use alertcondition on a closed bar. Tell me the exact event: bullish transition, bearish transition, or a cross. An alert is a notice. It is not an order.",
      "8": "Non-repainting means the signal waits for the candle to close, then stays put. I will not use the forming bar as a confirmed signal. Say the BUY and SELL rules and I will write them that way.",
    };
    return { answer: designer[pick] || designer["1"], pineCode: null, suggestedFileName: null, suggestedFixes: hints };
  }
  if (pick && /Pine Translator/.test(prior)) {
    const pine: Record<string, string> = {
      "1": "Paste the script. I will say what it calculates, what it draws, and what would fail on ClearPath, before I edit a line.",
      "2": "Paste the script and the red compile line. I will name the cause, keep the math, and rewrite the broken part.",
      "3": "Paste it in the box on the left and press Compile Code. If it compiles, Apply to All Charts. If a line fails, send me that line.",
      "4": "Paste it. I will list inputs, variables, calculations, conditions, and plots, then write Pine that does the same math with plot and plotshape.",
      "5": "Paste it and tell me the event that should notify you. I will add alertcondition on the closed bar. That notice does not send an order.",
      "6": "Paste it and describe the BUY bar and the SELL bar. I will add plotshape marks without changing the calculation.",
    };
    return { answer: pine[pick] || pine["1"], pineCode: null, suggestedFileName: null, suggestedFixes: hints };
  }
  if (pick && /Indicator Advisor/.test(prior)) {
    const advisor: Record<string, string> = {
      "1": "EMA 20/50 is the trend filter. Fast above slow is bullish. Fast below slow is bearish. The attached draft is a 9/21 cross you can compile now. Say if you want 20/50 instead.",
      "2": "EMA 50 and EMA 200. Price above both is a bullish bias. Price below both is bearish. Price between them is transitional. Tell me the market and I will write those two lengths.",
      "3": "Price above one EMA is bullish. Price below it is bearish. Tell me the length. 20 is a common intraday start. 50 is a slower swing start.",
      "4": "MACD above its signal line is bullish momentum. MACD below it is bearish momentum. Say the timeframe and I will draft the pane.",
      "5": "A Donchian breakout: a close through the highest high of N bars is the bullish event. A close through the lowest low is the bearish event. Tell me N. 20 is the usual start.",
      "6": "Use Try the Gold Bar indicator on the left. That is the ATR trailing stop: the stop follows price, and the candle turns gold when the close crosses it.",
      "7": "ClearPath trend score. EMA direction +1 or -1, price versus that EMA +1 or -1, MACD direction +1 or -1. Add them. ADX only says whether the move is strong, not the direction. Tell me the timeframe and I will write the score.",
    };
    return {
      answer: advisor[pick] || advisor["1"],
      pineCode: pick === "1" ? EMA_CROSS : null,
      suggestedFileName: pick === "1" ? "genie-ema-cross.pine" : null,
      suggestedFixes: hints,
    };
  }

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
        "Here is a starter RSI pane you can load. Tell me overlay vs pane, and what you want on the chart (crosses, colors, or shapes), and I will write that next.",
      pineCode: migrated,
      suggestedFileName: "genie-starter-rsi.pine",
      suggestedFixes: hints,
    };
  }

  if (req.compileError) {
    const { migrated, changes } = suggestPineMigration(req.pineSource || "");
    return {
      answer: `Compile error${req.errorLine ? ` on line ${req.errorLine}` : ""}: ${req.compileError}\n\n${changes.length ? `Rewrites tried: ${changes.join("; ")}. Load the draft and compile again.` : "Paste the script and compile it so I have the failing line."}`,
      pineCode: changes.length > 0 ? migrated : null,
      suggestedFileName: req.pineSource ? suggestIndicatorFileName(migrated) : null,
      suggestedFixes: hints,
    };
  }

  return {
    answer:
      "I'm River Genie. Paste Pine on the left, or tell me the indicator you want: overlay or pane, and lines or buy/sell marks. I can draft an RSI pane, an EMA cross, or walk you through the Gold Bar trailing stop.",
    pineCode: null,
    suggestedFileName: null,
    suggestedFixes: hints,
  };
}

function inferSpecBlock(req: RiverGenieRequest): string {
  const blob = [
    req.question || "",
    ...(req.conversationHistory || []).map((m) => m.content || ""),
  ].join("\n");
  const text = blob.toLowerCase();
  const known: string[] = [];
  const market = text.match(/\b(forex|crypto|stocks?|futures?|metals?|indices|index|eur\/?usd|gbp\/?usd|xau\/?usd|btc\/?usd|gold)\b/);
  if (market) known.push(`Market: ${market[1]}`);
  const interval = text.match(/\b(1m|5m|15m|30m|1h|4h|1d|1w|daily|hourly|scalp|intraday|swing)\b/);
  if (interval) known.push(`Interval: ${interval[1]}`);
  const purpose = text.match(/\b(trend|reversal|breakout|momentum|volatility|volume|structure|support|resistance|candle pattern)\b/);
  if (purpose) known.push(`Detect: ${purpose[1]}`);
  if (/minimal|simple|one line|little clutter/.test(text)) known.push("Style: minimal");
  if (/candle close|confirmed|no repaint|non-repaint|stay fixed/.test(text)) known.push("Confirmation: closed candle");
  if (/forming bar|realtime|right away|immediately/.test(text)) known.push("Confirmation: forming bar");
  if (req.pineSource?.trim()) known.push("Source: already in the workstation");
  if (req.compileError) known.push("Compile error: already on screen");

  const unknown: string[] = [];
  if (!purpose && !req.pineSource?.trim() && !req.compileError) unknown.push("what it should detect");
  const wantsNow = /forming bar|realtime|right away|immediately/.test(text);
  const wantsClose = /candle close|confirmed|no repaint|non-repaint|stay fixed/.test(text);
  if (wantsNow && wantsClose) unknown.push("CONFLICT: immediate marks and no repaint — ask which one wins");
  else if (!wantsNow && !wantsClose && !req.compileError) unknown.push("closed candle or forming bar");
  if (unknown.length === 0 && !interval && !req.compileError) unknown.push("market and chart interval");

  const ask = unknown[0] ? `Ask only this: ${unknown[0]}.` : "Nothing required. Restate the spec, then write the Pine.";
  const knownLine = known.length ? known.join("; ") : "nothing yet";
  return `\n\n=== SPEC MEMORY ===\nKNOWN: ${knownLine}\n${ask}\n=== END SPEC MEMORY ===`;
}

function buildContextBlock(req: RiverGenieRequest): string {
  const parts: string[] = [];
  if (req.activeIndicatorName) parts.push(`Active on charts: ${req.activeIndicatorName}`);
  if (req.pineSource?.trim()) {
    parts.push(`CURRENT PINE SOURCE (${req.pineSource.length} chars):\n\`\`\`pine\n${req.pineSource.slice(0, 12000)}\n\`\`\``);
    parts.push(`PINE INVENTORY (from the capability registry):\n${formatInventory(inventoryPine(req.pineSource))}`);
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

  const apiKey = getGroqApiKey();
  if (!apiKey) {
    return offlineRiverGenieAnswer(req);
  }

  const displayName = req.userName?.trim() || "trader";
  const systemPrompt = `${RIVER_GENIE_GUIDE}\n\n${renderCapabilityBlock()}${buildContextBlock(req)}${inferSpecBlock(req)}`;

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
    console.error("[River Genie] Groq failed", groqRes.status, errText.slice(0, 300));
    const offline = offlineRiverGenieAnswer(req);
    return {
      ...offline,
      answer: `${offline.answer}\n\nThe live model did not answer this turn, so this reply is the built-in guide.`,
    };
  }

  const data = await groqRes.json();
  const answer: string =
    data?.choices?.[0]?.message?.content ||
    "I couldn't draft that yet — try describing overlay vs pane and one signal you want.";

  const pineCode = extractPineCode(answer);
  const suggestedFixes = getLocalHints(req.pineSource || "", req.compileError || "", []);
  let checked = answer;
  if (pineCode) {
    const compiled = compilePine(pineCode);
    if (compiled.status === "error") {
      checked = `${answer}\n\nINDACREATOR rejected this draft${compiled.line ? ` on line ${compiled.line}` : ""}: ${compiled.error}\nThis is not a finished indicator. The compiler stopped.`;
    } else if (compiled.warnings.length) {
      checked = `${answer}\n\nINDACREATOR compiled this draft. Warnings: ${compiled.warnings.join(" ")}`;
    } else {
      checked = `${answer}\n\nINDACREATOR compiled this draft. Load it and apply it to the chart.`;
    }
  }

  return {
    answer: checked,
    pineCode,
    suggestedFileName: pineCode ? suggestIndicatorFileName(pineCode) : null,
    suggestedFixes,
  };
}
