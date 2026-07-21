/**
 * Single source of truth for River marketing copy + hero media paths.
 * Updated by: npm run page:auto-update
 */
export const RIVER_PAGE_CONTENT = {
  version: "1.2.0",
  updatedAt: "2026-07-21",

  hero: {
    eyebrow: "ClearPath AI Coding System",
    title: "The River",
    subtitle:
      "Import Pine Script from TradingView — or describe what you want. River Genie writes the code, The River compiles it honestly, and one click applies it to every chart.",
    badge: "Pine Script v4 / v5 / v6 · River Genie AI",

    videos: {
      /** Build phase: workstation + Genie co-pilot */
      genieWorkstation: "/river/hero-genie-workstation.mp4",
      /** Apply phase: one script → many charts */
      tributariesCharts: "/river/hero-tributaries-charts.mp4",
    },
  },

  pillars: [
    {
      title: "River Genie",
      body: "AI co-pilot that asks what you want to build, reads your code, fixes compile errors, and drafts complete Pine in one click.",
      accent: "#00D9FF",
    },
    {
      title: "Honest Compiler",
      body: "Tokenize, parse, and bar-by-bar test on real candles. Every error names the line — never fake success.",
      accent: "#FFD700",
    },
    {
      title: "Apply Everywhere",
      body: "One compiled indicator flows to all ClearPath charts. Local, public, and private vault catalogs included.",
      accent: "#FF007F",
    },
  ],

  platformLayers: [
    "Interpreter catalog reconnect",
    "Public community API",
    "Private per-user vault",
    "Full compatibility report",
    "Compiler manifest updates",
    "Local assist + auto-migrate",
  ],

  discovery: {
    title: "The River + River Genie",
    subtitle: "Build custom Pine indicators with AI — compile and apply to every chart.",
    cta: "Open The River",
  },

  /** Public trust warning — always visible on The River workstation. */
  honestLimits: {
    title: "Honest limits",
    tagline: "Trust is the moat",
    intro:
      "You will not get 100% auto-conversion on every script from every platform. Some code depends on feeds and APIs ClearPath does not host.",
    wontConvert: [
      "Multi-symbol security() / request.security() / iCustom() chains",
      "Broker order routing and live execution (OrderSend, strategy bots as trades)",
      "Proprietary drawing, DOM, footprint, and vendor-only data feeds",
    ],
    wePromise: [
      "These 47 lines converted.",
      "These 3 lines need a manual swap — Genie suggests the fix.",
      "This is a strategy bot — we import the signal math, not live orders.",
    ],
    closing:
      "That beats platforms that pretend full compatibility and break on bar 2. The River reports honestly — never fake success.",
  },
} as const;

export type RiverPageContent = typeof RIVER_PAGE_CONTENT;
