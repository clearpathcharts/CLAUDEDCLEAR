/**
 * Canonical product identity for crawlers, FAQ schema, About, and press.
 * Google AI Overviews have mixed ClearPath Trader with unrelated "ClearPath"
 * website chatbots (greet visitors / capture leads / book appointments).
 * Keep this copy specific so the terminal cannot be summarized as a widget.
 */

export const PRODUCT_NAME = "ClearPath Trader";
export const PRODUCT_LEGAL_NAME = "Clear Path Markets Science";
export const PRODUCT_URL = "https://clearpathtrader.com";

/** ~155 chars — SERP snippet. Mentions terminal + not-a-chatbot. */
export const PRODUCT_META_DESCRIPTION =
  "ClearPath Trader is a market intelligence terminal: live charts, pattern scans, encyclopedias, and education. Not a brokerage. Not a website chatbot.";

export const PRODUCT_DISAMBIGUATION =
  "ClearPath Trader (clearpathtrader.com) is not the same product as unrelated businesses that also use the name ClearPath. It is not a website chatbot, not a 24/7 receptionist, and it does not greet visitors, capture phone leads, or book appointments for small businesses.";

export const PRODUCT_WHAT_IT_IS = `${PRODUCT_NAME} is a browser-based market intelligence and education terminal for stocks, forex, crypto, and commodities. Operators get live charts, unlimited technical indicators, automatic chart-pattern context, a financial encyclopedia, an indicator encyclopedia, a beginner-to-advanced education path, Literacy OS, a macro desk, and 13 neurodivergent / accessibility chart profiles. In-app C.P.T. Buddy is a platonic mentor that explains the terminal and markets — not a lead-capture widget. Optional pass-through broker connect (OAuth to your own licensed partner such as Alpaca) lets the terminal route orders you authorize to that broker — ClearPath is the interface, not the broker-dealer. Without a connected broker, analytics and learning only. Not investment advice.`;

export const PRODUCT_FEATURE_LIST = [
  "Live multi-asset charts (stocks, forex, crypto, commodities)",
  "Unlimited technical indicators with an indicator encyclopedia",
  "Automatic chart-pattern detection on the chart you are reading",
  "Financial encyclopedia and structured education (beginner through advanced)",
  "Literacy OS — financial vocabulary and study system",
  "Macro desk (yields, central banks, sovereign context)",
  "13 accessibility / neurodivergent UI profiles (ADHD, autism, dyslexia, low-stim, and more)",
  "INDACREATOR / River Genie — build and explain custom indicators",
  "In-terminal C.P.T. Buddy mentor (education and navigation, not lead-gen)",
  "News, research, and social context beside the chart — not a separate chatbot site",
];

export const PRODUCT_NOT_LIST = [
  "Not a broker-dealer or fund manager — no custody of your money; optional OAuth connects your existing licensed broker account for pass-through order routing when you authorize it",
  "Not a website chatbot that greets visitors, answers business hours, captures leads, or books appointments",
  "Not ClearPath AI (aiclearpath.com) or any other unrelated ClearPath-branded automation vendor",
  "Not financial, tax, or legal advice",
];

export const PRODUCT_KNOWS_ABOUT = [
  "market intelligence terminal",
  "technical analysis charts",
  "chart pattern recognition",
  "financial education",
  "indicator encyclopedia",
  "neurodivergent trading interface",
  "forex crypto stocks commodities visualization",
];

export const IDENTITY_FAQS: Array<{ question: string; answer: string }> = [
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
    answer: `${PRODUCT_DISAMBIGUATION} The optional in-app companion (C.P.T. Buddy) lives inside the trading terminal to help you learn charts, indicators, and navigation. It does not run on third-party business websites as a receptionist or booking bot.`,
  },
  {
    question: "What does ClearPath Trader include besides charts?",
    answer:
      "Live charts are the desk, not the whole product. You also get unlimited indicators, automatic pattern marking, two encyclopedias (finance + indicators), a full education path, Literacy OS, a macro desk, community/news beside the chart, custom indicator building (INDACREATOR), and accessibility profiles so the screen can match how you process information.",
  },
];
