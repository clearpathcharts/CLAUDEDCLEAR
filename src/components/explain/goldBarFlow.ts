/**
 * Google Flow production bible — Gold Bar (what it is, never how it works).
 *
 * EACH shot is its own Google Flow job. Hard cap: 8.00 seconds.
 * Twelve clips × 8s = 96s. Stitch to public/explain-videos/gold-bar.mp4
 *
 * Voice: calm, plain English, new-trader to veteran. Do not name math,
 * stops, crosses, periods, or formulas. The secret stays in the code.
 */

import {
  EXPLAIN_FLOW_BRAND_LOOK,
  EXPLAIN_FLOW_CLIP_SECONDS,
  EXPLAIN_FLOW_HOLD,
  EXPLAIN_FLOW_NEGATIVE,
  EXPLAIN_FLOW_SHOT_COUNT,
  type ExplainFlowScript,
  type ExplainFlowShot,
} from "./flowScripts";

const GOLD = "#FFCC00";

type Draft = {
  id: string;
  title: string;
  visual: string;
  narration: string;
  super: string;
};

function flowPrompt(index: number, draft: Draft): string {
  const n = String(index + 1).padStart(2, "0");
  return [
    "GOOGLE FLOW — ONE FLOATING EIGHT-SECOND JOB.",
    `Film: Gold Bar. Clip ${n} of 12 — “${draft.title}”.`,
    "Paste this prompt ALONE. Do not paste the other eleven clips into the same job.",
    "Aspect: 16:9 landscape. Duration slider: 8 seconds. If Flow offers 5s or 6s, pick 8 or regenerate until the clip holds to 8.00.",
    EXPLAIN_FLOW_BRAND_LOOK,
    EXPLAIN_FLOW_HOLD,
    `ACCENT LOCK: every rim light, glow, and color wash is ${GOLD}. Cyan #00FFFF and magenta #FF1493 candles stay in the background as the quiet market. Gold is the only hero.`,
    `ONE IDEA ONLY: ${draft.title}. Tell them what the Gold Bar is for a human being. Never how it is calculated. No formulas, no period numbers, no stop lines, no buy/sell arrows, no secret sauce on screen.`,
    "0.00–2.00s: Camera is already inside a dark ClearPath chart. Huge rounded kid super already on screen. No logo card. No fade-in from black.",
    "2.00–4.00s: Perform the picture notes. Move as if a child is counting one-Mississippi, two-Mississippi. If a mouse is needed, it is a GIANT cartoon white-glove cursor, bigger than the button, crawling, never teleporting.",
    "4.00–6.00s: Keep the SAME action going, twenty percent slower. Do not introduce a second lesson. Soft museum glitter only — not casino sparks.",
    "6.00–8.00s: HOLD the clearest, most readable frame until 8.00. Super still huge. Do not fade to black. Do not smash-cut. If the model wants to end at three seconds, ignore it and keep this exact picture living through eight.",
    `FULL PICTURE NOTES (use for the whole eight seconds, not a 3-second postcard): ${draft.visual}`,
    `ON-SCREEN SUPER (≤6 words, huge rounded letters, ${GOLD} fill, white outline): ${draft.super}`,
    "SOUND: silent picture. Voiceover is recorded later over the stitch. Do not burn captions into the pixels.",
    `Avoid: ${EXPLAIN_FLOW_NEGATIVE} Also avoid: equation overlays, trailing lines, arrow markers, the words ATR, trail, algorithm, secret, hack, guaranteed.`,
  ].join(" ");
}

function shotsFrom(drafts: Draft[]): ExplainFlowShot[] {
  if (drafts.length !== EXPLAIN_FLOW_SHOT_COUNT) {
    throw new Error(`Gold Bar Flow needs ${EXPLAIN_FLOW_SHOT_COUNT} eight-second clips`);
  }
  return drafts.map((draft, index) => ({
    id: draft.id,
    title: draft.title,
    startSeconds: index * EXPLAIN_FLOW_CLIP_SECONDS,
    endSeconds: (index + 1) * EXPLAIN_FLOW_CLIP_SECONDS,
    flowPrompt: flowPrompt(index, draft),
    narration: draft.narration,
    super: draft.super,
  }));
}

const CLIPS: Draft[] = [
  {
    id: "01-the-gold-candle",
    title: "The gold candle",
    super: "The Gold Bar",
    visual:
      "Close on a live ClearPath candlestick chart in the dark. Cyan and magenta candles breathe quietly. One candle in the middle slowly ignites into a luminous solid gold bar — body, wick, and outline the same bright gold. The rest of the chart stays calm. No arrows. No lines. The gold candle is the only event.",
    narration:
      "This is the Gold Bar. One bright gold candle on your chart. It is not a tip. It is a picture your eyes can trust.",
  },
  {
    id: "02-the-storm-goes-quiet",
    title: "The storm goes quiet",
    super: "One candle speaks",
    visual:
      "Wide chart full of busy cyan and magenta noise. Soft rack-focus: the storm of candles falls slightly out of focus while a single gold candle snaps into crystal sharpness, like a lighthouse in fog. The room feels quieter. No text except the super.",
    narration:
      "Most charts are a storm of pink and blue. The Gold Bar is the one candle that steps forward and says: look here.",
  },
  {
    id: "03-your-eye-lands",
    title: "Your eye lands",
    super: "You do not hunt",
    visual:
      "A human eye reflection of the chart, then a slow push into the gold candle as if the eye cannot miss it. Soft gold bloom. No targeting reticle, no HUD math. The feeling is relief — the important bar found you.",
    narration:
      "You do not hunt. Your eye lands on gold. That is the whole gift. The market becomes a picture, not a puzzle.",
  },
  {
    id: "04-new-trader",
    title: "If you are new",
    super: "New eyes, clear start",
    visual:
      "A beginner at a dark desk, shoulders dropping as a gold candle lights on XAUUSD. Their face is calm, not hyped. The chart stays educational — no P&L, no order ticket. The gold bar is a friendly lantern, not a siren.",
    narration:
      "If you are new, you do not need ten years of tape reading. The gold candle shows you the moment a new chapter starts.",
  },
  {
    id: "05-veteran",
    title: "If you have years",
    super: "Quiet for veterans",
    visual:
      "A veteran desk: too many lines, too many colors. Those extra overlays gently fade. The same market remains. Only the gold candle stays lit. The trader leans back. Clean. Professional. No celebration.",
    narration:
      "If you have traded for years, you already know the turn. Gold Bar lets you see it without a messy desk of leftover lines.",
  },
  {
    id: "06-the-first-step",
    title: "The first real step",
    super: "A chapter begins",
    visual:
      "A sideways, sleepy stretch of cyan/magenta candles. Then one gold candle stands up taller and brighter — the first real step of a new story. Price walks on after it, but the gold bar is the doorway. Do not draw a path or a stop. Just the doorway.",
    narration:
      "Every trend has a first real step. Gold Bar paints that step so the new story is visible the second it begins.",
  },
  {
    id: "07-one-language",
    title: "One language",
    super: "Every market, same gold",
    visual:
      "Four chart tiles slide past: gold, euro, bitcoin, a stock index. Different symbols, same dark ClearPath look. On each tile, the same gold candle language. The camera never pauses on a formula. One color, four worlds.",
    narration:
      "Gold, euro, bitcoin, stocks — same gold candle. One language on every chart. You stop translating. You start seeing.",
  },
  {
    id: "08-you-still-decide",
    title: "You still decide",
    super: "You choose",
    visual:
      "Giant white-glove cursor crawls to a Gold Bar on/off pill in trophy gold. It clicks once. The gold candles stay on the chart. No order ticket opens. No buy or sell. The human is still the trader.",
    narration:
      "This is not a robot. Click the Gold Bar button if you want it on. You still choose what to do with what you see.",
  },
  {
    id: "09-you-can-rest-it",
    title: "You can rest it",
    super: "Off when you need quiet",
    visual:
      "Same giant cursor clicks the Gold Bar pill again. Gold candles ease back to normal cyan and magenta. The market is still there. Only the highlight takes a rest. Soft, reversible, no punishment.",
    narration:
      "Need a quieter screen? Click the same button to hide it. The market stays. Only the gold highlight takes a rest.",
  },
  {
    id: "10-every-kind-of-brain",
    title: "Every kind of brain",
    super: "One color. One meaning.",
    visual:
      "Three silhouettes at three desks — a beginner, a focused veteran, a neurodivergent trader with a calmer layout. All three charts show the same gold candle at the same moment. Different minds. Same light. No cluttered settings menus.",
    narration:
      "One color. One meaning. Built so a tired brain, a new brain, and a veteran brain can all read the same moment.",
  },
  {
    id: "11-see-first",
    title: "See first, then think",
    super: "See first. Then think.",
    visual:
      "The gold candle holds. The camera breathes. No arrows. No voice bubbles saying buy or sell. A small pause in the film — space for a human thought. Educational, grown-up, life-changing because the picture is finally simple.",
    narration:
      "See first. Then think. The Gold Bar does not shout buy or sell. It shows you the live turn so your own mind can work.",
  },
  {
    id: "12-look-for-the-gold",
    title: "Look for the gold",
    super: "Look for the gold",
    visual:
      "Final hold: a beautiful ClearPath chart, one gold candle glowing like a living thing among quiet cyan and magenta. Soft gold dust in the air. End on the candle, not a logo. The market looks readable, almost kind.",
    narration:
      "Look for the gold. That is ClearPath’s way of making the market feel alive — and finally readable.",
  },
];

const shots = shotsFrom(CLIPS);

/** Paste this ONE paragraph into Google Flow as a single job. */
export const GOLD_BAR_GOOGLE_FLOW_PROMPT =
  "Cinematic 16:9 Google Flow film, longest duration, hold the last frame, use the attached real ClearPath XAUUSD chart as the picture of the screen, a wide trading terminal on a pure black background filled with a normal left-to-right candlestick PRICE SERIES, every candle is the same thin width sitting on the timeline like a real broker chart, most candles are cyan #00FFFF with green wicks when price rises and hot pink #FF1493 with red wicks when price falls, Gold Bar means only this: a few of those SAME candlesticks in the series are recolored solid yellow-gold #FFCC00, same width, same wick style, same body size as their neighbors, gold is a paint job on existing bars not a new object, show about three to six gold candles scattered through the history the way breakout bars actually appear, NEVER draw one giant gold candlestick floating in the middle of the frame, NEVER a 3D gold statue, NEVER a gold pillar, NEVER a trophy candle bigger than the man, the ClearPath CEO a real human man stands off to the LEFT of the monitor, he is shorter than the screen, calm open hands explaining this is the Gold Bar breakout candle chart tool he created six years ago to help neurodivergent minds understand pattern trading and it helped everyone so it is on every account, camera is a wide side shot of a man next to a computer chart, silent picture, no words written on the glass."

/** Spoken VO, also one paragraph — what Gold Bar is, never how it works. */
export const GOLD_BAR_FLOW_PARAGRAPH =
  "This is the Gold Bar: one bright gold candle on your chart, not a tip, a picture your eyes can trust, because most charts are a storm of pink and blue and the Gold Bar is the one candle that steps forward and says look here, so you do not hunt, your eye lands on gold, and the market becomes a picture instead of a puzzle; if you are new you do not need ten years of tape reading because the gold candle shows you the moment a new chapter starts, and if you have traded for years you already know the turn, Gold Bar just lets you see it without a messy desk of leftover lines, painting the first real step of every trend so the new story is visible the second it begins, the same gold language on gold, euro, bitcoin, and stocks, so you stop translating and start seeing; this is not a robot, click the Gold Bar button if you want it on, you still choose what to do with what you see, and if you need a quieter screen click the same button to hide it, the market stays, only the gold highlight takes a rest, one color, one meaning, built so a tired brain, a new brain, and a veteran brain can all read the same moment, see first then think, it does not shout buy or sell, it shows you the live turn so your own mind can work, so look for the gold, that is ClearPath’s way of making the market feel alive and finally readable.";

export const GOLD_BAR_FLOW_SCRIPT: Omit<ExplainFlowScript, "id"> & { id: "gold-bar" } = {
  id: "gold-bar",
  navLabel: "Gold Bar",
  title: "What the Gold Bar is",
  color: GOLD,
  targetSeconds: EXPLAIN_FLOW_SHOT_COUNT * EXPLAIN_FLOW_CLIP_SECONDS,
  logline:
    "What the Gold Bar is for a human being: a gold candle that makes the market readable. Never how it is built.",
  narrationScript: GOLD_BAR_FLOW_PARAGRAPH,
  masterFlowPrompt: [
    "MASTER LOOK ONLY — do not generate one film from this. Generate twelve separate 8.00s Flow jobs.",
    EXPLAIN_FLOW_BRAND_LOOK,
    "Hero color is trophy gold #FFCC00. Cyan and magenta candles are supporting extras. The Gold Bar is a living gold candlestick, never a trail, never an arrow, never a math overlay.",
    EXPLAIN_FLOW_HOLD,
    `Avoid: ${EXPLAIN_FLOW_NEGATIVE}`,
  ].join(" "),
  shots,
  music: "Low, warm, hopeful pulse. No trap drops. No ticker anxiety. Leave room for a calm spoken voice.",
  captionsNote:
    "Burn nothing into the picture. Fifth-grade-clear captions later from narration. Never caption formulas or the words buy/sell as a command.",
};

export const GOLD_BAR_FLOW_DROPS = {
  stitch: "/explain-videos/gold-bar.mp4",
  poster: "/explain-videos/gold-bar.jpg",
  captions: "/explain-videos/gold-bar.vtt",
} as const;
