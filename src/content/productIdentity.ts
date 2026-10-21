/**
 * Canonical product identity for crawlers, FAQ schema, About, and press.
 * Google AI Overviews have mixed ClearPath Trader with unrelated "ClearPath"
 * website chatbots (greet visitors / capture leads / book appointments).
 * Keep this copy specific so the terminal cannot be summarized as a widget.
 */

export const PRODUCT_NAME = "ClearPath Trader";
export const PRODUCT_LEGAL_NAME = "Clear Path Markets Science Corp.";
export const PRODUCT_URL = "https://clearpathtrader.com";

/** Homepage <title> — keep under ~60 chars for SERP. */
export const PRODUCT_HOME_TITLE = "ClearPath Trader | One Chart Site, Four Desks";

/** Visible / crawlable H1 (em dash, not pipe). */
export const PRODUCT_HOME_H1 = "ClearPath Trader — One chart site with four desks";

/** Named desks in founder/display order. */
export const PRODUCT_FOUR_DESKS = [
  "Institutional",
  "Fundamental",
  "Retail",
  "Neurodivergent",
] as const;

export const PRODUCT_FOUR_DESKS_PHRASE = `${PRODUCT_FOUR_DESKS[0]}, ${PRODUCT_FOUR_DESKS[1]}, ${PRODUCT_FOUR_DESKS[2]}, and ${PRODUCT_FOUR_DESKS[3]}`;

/** 140–160 chars — SERP snippet. One site, four desks, free encyclopedia. */
export const PRODUCT_META_DESCRIPTION =
  "One chart site with four desks: Institutional, Fundamental, Retail, and Neurodivergent. Free student encyclopedia, no ads or sales pitches. Not a brokerage.";

export const PRODUCT_DISAMBIGUATION =
  "ClearPath Trader (clearpathtrader.com) is not the same product as unrelated businesses that also use the name ClearPath. It is not a website chatbot, not a 24/7 receptionist, and it does not greet visitors, capture phone leads, or book appointments for small businesses.";

export const PRODUCT_KIND = "educational financial markets site";

export const PRODUCT_WHAT_IT_IS = `${PRODUCT_NAME} is one chart website with four desks: ${PRODUCT_FOUR_DESKS_PHRASE}. They are four workspaces on the same site, not four companies and not four brokers. Charts cover stocks, forex, crypto, and commodities. The encyclopedia is a free student reference with no ads and no sales pitches. It is one study library, not a claim that no other finance site exists. The Neurodivergent desk uses the same market data with sensory display settings. C.P.T. Buddy explains the site. It is not a lead-capture widget. If you connect a licensed broker, that broker holds the money and sends orders you approve. ClearPath is the screen, not the broker. Not investment advice.`;

export const PRODUCT_FEATURE_LIST = [
  `One chart site with four desks: ${PRODUCT_FOUR_DESKS_PHRASE}`,
  "Institutional desk — flow, liquidity, options, macro, and news around a multi-chart workspace",
  "Fundamental desk — statements, earnings, valuation, peers, filings, and FRED macro",
  "Retail desk — large chart, watchlist, news, economic wire, and plain-English education",
  "Neurodivergent desk — same market data with calm-focus, ADHD, autism-predictable, and low-stim profiles",
  "Live multi-asset charts (stocks, forex, crypto, commodities)",
  "Unlimited technical indicators with an indicator encyclopedia",
  "Automatic chart-pattern detection on the chart you are reading",
  "Financial encyclopedia — a free student reference with no ads and no sales pitches",
  "Literacy OS — financial vocabulary and study system",
  "Macro desk (yields, central banks, sovereign context)",
  "13 accessibility / neurodivergent UI profiles (ADHD, autism, dyslexia, low-stim, and more)",
  "INDACREATOR — ClearPath's own indicator tool. You paste indicator code, it compiles here, and it draws on our charts. It is not another company's platform and does not promise the same results.",
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
  "one chart site with four desks",
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
    answer: `Yes. It is one chart website. You choose one desk: ${PRODUCT_FOUR_DESKS_PHRASE}. Institutional is the detailed workstation. Fundamental is company research. Retail is the everyday chart. Neurodivergent is the same data with calmer display settings. These are four workspaces, not four companies and not four brokers.`,
  },
  {
    question: "Will ClearPath ever become a broker-dealer?",
    answer:
      "No. ClearPath Trader is a chart and education screen. If you connect a licensed broker, that broker holds the money and sends the orders you approve. ClearPath does not hold your money and is not a broker.",
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
      `The four desks are four ways to use the same chart site. You also get a free student encyclopedia with no ads or sales pitches, an indicator encyclopedia, lessons, and INDACREATOR, which is our own indicator tool.`,
  },
];
