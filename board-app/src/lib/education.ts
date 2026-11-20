export type Lesson = {
  id: string;
  title: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  minutes: number;
  summary: string;
  body: string[];
};

export type GlossaryEntry = {
  term: string;
  definition: string;
};

export const LESSONS: Lesson[] = [
  {
    id: "candles-101",
    title: "How to read a candlestick",
    level: "Beginner",
    minutes: 6,
    summary: "Open, high, low, close — and why the wick matters more than the color alone.",
    body: [
      "Each candle summarizes a time window: the body spans open to close; wicks mark the extremes.",
      "A green (or teal) body usually means close above open; red means close below open — conventions vary by desk theme.",
      "Long wicks with small bodies often signal rejection: buyers or sellers pushed hard, then gave ground back.",
      "ClearPath treats candles as learning objects first — not trade signals. Context (desk, timeframe, instrument) comes before any decision.",
    ],
  },
  {
    id: "risk-before-execution",
    title: "Knowledge before execution",
    level: "Beginner",
    minutes: 5,
    summary: "Why ClearPath separates analysis from brokerage — and what that means for learners.",
    body: [
      "ClearPath Trader is an educational analysis platform. It does not hold customer funds and is not a broker-dealer.",
      "Optional broker connect is a future product path; this board demo does not execute orders or move money.",
      "The safer habit: understand the instrument, the desk framing, and the risk framing before any live venue.",
      "Use paper market data here to practice navigation. Production clearpathtrader.com wires live vendor feeds when keys are present.",
    ],
  },
  {
    id: "four-desks",
    title: "One chart site, four desks",
    level: "Intermediate",
    minutes: 8,
    summary: "Institutional, Fundamental, Retail, and Neurodivergent — same market, different cognitive layouts.",
    body: [
      "Institutional: denser intel tone — positioning and levels first.",
      "Fundamental: business and macro context beside price.",
      "Retail: clearer labels and guided tools for everyday learners.",
      "Neurodivergent: calmer contrast, wider spacing, less sensory noise — same instruments, different presentation.",
    ],
  },
  {
    id: "cot-primer",
    title: "Commitment of Traders (primer)",
    level: "Advanced",
    minutes: 10,
    summary: "Official CFTC positioning reports — not a substitute for price, but a framing layer on Gold+ desks.",
    body: [
      "COT is published by the CFTC. ClearPath maps common FX/metal symbols to futures codes (example: XAUUSD → GC).",
      "In production, Positioning reads CFTC via server routes — never invent timed COT cells when data is unavailable.",
      "This board demo shows the concept in Education only; live COT tables stay on the production Cloud Run stack.",
    ],
  },
];

export const GLOSSARY: GlossaryEntry[] = [
  {
    term: "Spread",
    definition:
      "The gap between bid and ask. Educational platforms show spreads as market structure context — they are not order tickets here.",
  },
  {
    term: "Desk",
    definition:
      "A ClearPath workspace layout and tone for a learner type (Institutional, Fundamental, Retail, Neurodivergent).",
  },
  {
    term: "Paper / demo data",
    definition:
      "Deterministic mock candles used when vendor API keys are absent. Labeled in the UI so boards never confuse demo with live quotes.",
  },
  {
    term: "Not a brokerage",
    definition:
      "Clear Path Markets Science Corp. operates ClearPath Trader as analysis and education. It does not custody funds or execute customer trades in this product.",
  },
];
