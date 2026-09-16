/**
 * Canonical product identity for crawlers, FAQ schema, About, and press.
 * Google AI Overviews have mixed ClearPath Trader with unrelated "ClearPath"
 * website chatbots (greet visitors / capture leads / book appointments).
 * Keep this copy specific so the terminal cannot be summarized as a widget.
 */

export const PRODUCT_NAME = "ClearPath Trader";
export const PRODUCT_LEGAL_NAME = "Clear Path Markets Science";
export const PRODUCT_URL = "https://clearpathtrader.com";

/** Homepage <title> — keep under ~60 chars for SERP. */
export const PRODUCT_HOME_TITLE = "ClearPath Trader | Four Trader Desks on One Site";

/** Visible / crawlable H1 (em dash, not pipe). */
export const PRODUCT_HOME_H1 = "ClearPath Trader — Four Trader Desks on One Site";

/** Named desks in founder/display order. */
export const PRODUCT_FOUR_DESKS = [
  "Institutional",
  "Fundamental",
  "Retail",
  "Neurodivergent",
] as const;

export const PRODUCT_FOUR_DESKS_PHRASE = `${PRODUCT_FOUR_DESKS[0]}, ${PRODUCT_FOUR_DESKS[1]}, ${PRODUCT_FOUR_DESKS[2]}, and ${PRODUCT_FOUR_DESKS[3]}`;

/** 140–160 chars — SERP snippet. Four desks first, then what the site is not. */
export const PRODUCT_META_DESCRIPTION =
  "Four trader desks on one site: Institutional, Fundamental, Retail, and Neurodivergent. Analytics and education — not a brokerage or website chatbot.";

export const PRODUCT_DISAMBIGUATION =
  "ClearPath Trader (clearpathtrader.com) is not the same product as unrelated businesses that also use the name ClearPath. It is not a website chatbot, not a 24/7 receptionist, and it does not greet visitors, capture phone leads, or book appointments for small businesses.";

export const PRODUCT_KIND = "educational financial markets site";

export const PRODUCT_WHAT_IT_IS = `${PRODUCT_NAME} is one browser-based ${PRODUCT_KIND} with four trader desks: ${PRODUCT_FOUR_DESKS_PHRASE}. One website — four workstations for four kinds of traders, not four brokerages and not four ways to place trades. Live charts for stocks, forex, crypto, and commodities, unlimited technical indicators, automatic chart-pattern context, a financial encyclopedia, an indicator encyclopedia, a beginner-to-advanced education path, Literacy OS, and a macro desk. The Neurodivergent desk uses the same market data with 13 accessibility / sensory chart profiles. In-app C.P.T. Buddy is a platonic mentor that explains the site and markets — not a lead-capture widget. Optional pass-through broker connect (OAuth to your own licensed partner such as Alpaca) lets the site route orders you authorize to that broker — ClearPath is the interface, not the broker-dealer. Without a connected broker, analytics and learning only. Not investment advice.`;

export const PRODUCT_FEATURE_LIST = [
  `Four trader desks on one website: ${PRODUCT_FOUR_DESKS_PHRASE}`,
  "Institutional desk — flow, liquidity, options, macro, and news around a multi-chart workspace",
  "Fundamental desk — statements, earnings, valuation, peers, filings, and FRED macro",
  "Retail desk — large chart, watchlist, news, economic wire, and plain-English education",
  "Neurodivergent desk — same market data with calm-focus, ADHD, autism-predictable, and low-stim profiles",
  "Live multi-asset charts (stocks, forex, crypto, commodities)",
  "Unlimited technical indicators with an indicator encyclopedia",
  "Automatic chart-pattern detection on the chart you are reading",
  "Financial encyclopedia and structured education (beginner through advanced)",
  "Literacy OS — financial vocabulary and study system",
  "Macro desk (yields, central banks, sovereign context)",
  "13 accessibility / neurodivergent UI profiles (ADHD, autism, dyslexia, low-stim, and more)",
  "INDACREATOR / River Genie — build and explain custom indicators",
  "In-app C.P.T. Buddy mentor (education and navigation, not lead-gen)",
  "News, research, and social context beside the chart — not a separate chatbot site",
];

export const PRODUCT_NOT_LIST = [
  "Not a broker-dealer or fund manager — no custody of your money; optional OAuth connects your existing licensed broker account for pass-through order routing when you authorize it",
  "Not a website chatbot that greets visitors, answers business hours, captures leads, or books appointments",
  "Not ClearPath AI (aiclearpath.com) or any other unrelated ClearPath-branded automation vendor",
  "Not financial, tax, or legal advice",
];

export const PRODUCT_KNOWS_ABOUT = [
  "four trader desks on one website",
  "Institutional trader desk",
  "Fundamental trader desk",
  "Retail trader desk",
  "Neurodivergent trader desk",
  "educational financial markets site",
  "technical analysis charts",
  "chart pattern recognition",
  "financial education",
  "indicator encyclopedia",
  "neurodivergent trading interface",
  "forex crypto stocks commodities visualization",
];

export const IDENTITY_FAQS: Array<{ question: string; answer: string }> = [
  {
    question: "Does ClearPath Trader have four trader desks?",
    answer: `Yes. One website lists four educational desks: ${PRODUCT_FOUR_DESKS_PHRASE}. Institutional is a command-center workstation (flow, liquidity, macro). Fundamental is company research (statements, earnings, valuation). Retail is a chart-first everyday desk. Neurodivergent is the same market data with sensory UI profiles. Those are four workstations for four kinds of traders — not four brokerages and not four types of trade execution. Analytics and education only.`,
  },
  {
    question: "Will ClearPath ever become a broker-dealer?",
    answer:
      "No — never. ClearPath Trader is a chart and intelligence interface only. Optional pass-through OAuth (same model as TradingView + Alpaca) lets you link your own account at a licensed broker; that broker holds funds, performs KYC/AML, and executes orders you authorize. ClearPath does not custody money or hold a broker-dealer license.",
  },
  {
    question: "What is ClearPath Trader?",
    answer: PRODUCT_WHAT_IT_IS,
  },
  {
    question: "Is ClearPath Trader a website chatbot or the same as ClearPath AI?",
    answer: `${PRODUCT_DISAMBIGUATION} The optional in-app companion (C.P.T. Buddy) lives inside this educational financial markets site to help you learn charts, indicators, and navigation. It does not run on third-party business websites as a receptionist or booking bot.`,
  },
  {
    question: "What does ClearPath Trader include besides charts?",
    answer:
      `The four desks are the front door. You also get unlimited indicators, automatic pattern marking, two encyclopedias (finance + indicators), a full education path, Literacy OS, a macro desk, community/news beside the chart, custom indicator building (INDACREATOR), and accessibility profiles so the screen can match how you process information.`,
  },
];
