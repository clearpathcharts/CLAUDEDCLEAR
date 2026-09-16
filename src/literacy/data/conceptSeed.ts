import type { WikiNode } from "../types";

const now = Date.now();

export const SEED_WIKI: WikiNode[] = [
  {
    id: "wiki_candles",
    title: "Candlesticks",
    summary: "OHLC picture language for price over a fixed time window.",
    body: "Each candle encodes open, high, low, and close. Bodies and wicks are a visual grammar for studying structure — not a signal to act.",
    links: ["wiki_structure", "wiki_timeframes", "wiki_psychology"],
    tags: ["charts", "basics"],
    updatedAt: now,
  },
  {
    id: "wiki_structure",
    title: "Market Structure",
    summary: "How swings, ranges, and trends organize a chart story.",
    body: "Structure literacy means naming what you see: higher highs, ranges, breaks, and continuations. Study the story before any conclusion.",
    links: ["wiki_candles", "wiki_patterns", "wiki_risk_language"],
    tags: ["charts", "patterns"],
    updatedAt: now,
  },
  {
    id: "wiki_patterns",
    title: "Chart Patterns as Teaching Moments",
    summary: "Recognizable shapes used for education and vocabulary.",
    body: "Patterns are labels for recurring geometry. ClearPath surfaces them so you can learn the language of charts with plain-English explainers.",
    links: ["wiki_structure", "wiki_indicators"],
    tags: ["patterns", "literacy"],
    updatedAt: now,
  },
  {
    id: "wiki_indicators",
    title: "Indicators",
    summary: "Math overlays that restate price/volume in another dialect.",
    body: "Indicators compress history into lines and oscillators. Treat them as study tools that must be understood — never as authority by themselves.",
    links: ["wiki_candles", "wiki_timeframes"],
    tags: ["indicators"],
    updatedAt: now,
  },
  {
    id: "wiki_timeframes",
    title: "Timeframes",
    summary: "The same market told at different narrative speeds.",
    body: "A daily candle and a five-minute candle answer different study questions. Literacy means matching the question to the timeframe.",
    links: ["wiki_candles", "wiki_structure"],
    tags: ["basics"],
    updatedAt: now,
  },
  {
    id: "wiki_psychology",
    title: "Learning Psychology",
    summary: "Attention, stim load, and emotional state while studying markets.",
    body: "Neuro-adaptive layouts exist so the terminal can lower noise when focus falters. Knowledge sticks better when the interface respects your nervous system.",
    links: ["wiki_risk_language", "wiki_structure"],
    tags: ["neuro", "learning"],
    updatedAt: now,
  },
  {
    id: "wiki_risk_language",
    title: "Uncertainty Language",
    summary: "How to talk about markets without pretending certainty.",
    body: "Good literacy prefers ranges, conditions, and unknowns over confident predictions. Mentor Trust Score rewards answers that admit uncertainty when evidence is thin.",
    links: ["wiki_psychology", "wiki_structure"],
    tags: ["truth", "learning"],
    updatedAt: now,
  },
];
