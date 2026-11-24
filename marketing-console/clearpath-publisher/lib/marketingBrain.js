/**
 * Marketing Brain — one asset → search + organic social packs.
 * Does not buy ads. Does not auto-publish. Does not invent rankings or volume.
 * ClearPath Trader is market education / analysis — not a brokerage.
 */
import { matchDraft, scanClaims } from "./marketingIntelligence.js";

const SITE = "https://clearpathtrader.com";
const TRUTH =
  "ClearPath Trader is market education and analysis for calm learning. It is not a brokerage.";

const INTENTS = {
  "market-analysis": {
    label: "People looking for a better way to analyze markets",
    phrase: "how to analyze markets without the noise",
    capabilityBias: ["SEO", "VSO", "AEO", "SXO", "AAO"],
  },
  "accessible-education": {
    label: "Veterans and neurodivergent learners looking for calm charts",
    phrase: "accessible market education without flashing tickers",
    capabilityBias: ["AAO", "VSO", "SEO", "SMO", "EEAT"],
  },
  "chart-reading": {
    label: "Beginners looking for chart / indicator education",
    phrase: "how to read a market chart in plain language",
    capabilityBias: ["AEO", "VSO", "SEO", "GEO", "HSO"],
  },
  "not-a-broker": {
    label: "People comparing noisy trading apps to calm education",
    phrase: "market education terminal not a brokerage",
    capabilityBias: ["ENTITY", "EEAT", "SEO", "AEO", "CRO"],
  },
};

const IN_APP_TAGS = {
  youtube: [
    "market analysis",
    "trading education",
    "technical analysis",
    "financial literacy",
    "calm charts",
    "accessible learning",
    "ClearPath Trader",
  ],
  tiktok: ["#MarketAnalysis", "#TradingEducation", "#TechnicalAnalysis", "#CalmCharts", "#FinancialLiteracy", "#ClearPathTrader"],
  instagram: ["#MarketAnalysis", "#TradingEducation", "#CalmCharts", "#AccessibleLearning", "#ClearPathTrader", "#NotABrokerage"],
  facebook: ["#MarketEducation", "#FinancialLiteracy", "#ClearPathTrader"],
  linkedin: ["#MarketAnalysis", "#FinancialLiteracy", "#AccessibleDesign", "#VeteranEducation", "#ClearPathTrader"],
  pinterest: ["Market analysis education", "Calm trading charts", "Financial literacy"],
};

function clean(s) {
  return String(s || "").trim();
}

function titleCaseTopic(topic) {
  const t = clean(topic) || "Calm market analysis";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function youtubeTitle(topic, intent) {
  const core = titleCaseTopic(topic);
  const extra = intent === "accessible-education" ? " — calm charts, no ticker flash" : " — a calmer way to analyze markets";
  const raw = `${core}${extra}`;
  return raw.length <= 70 ? raw : `${core} — calm market education`;
}

function buildFaq(topic, intentMeta) {
  const t = titleCaseTopic(topic);
  return [
    {
      q: `What is ${t}?`,
      a: `${t} is explained in ClearPath Trader as market education, not a trade signal and not a brokerage. ${TRUTH}`,
    },
    {
      q: `How do I analyze markets without a noisy trading platform?`,
      a: `Use a calm chart, one idea at a time, and a written takeaway. ClearPath Trader is built for that kind of ${intentMeta.phrase}. Learn at ${SITE}`,
    },
    {
      q: `Is ClearPath Trader a trading platform I can buy and sell on?`,
      a: `No. ${TRUTH} If you need a broker, that is a separate decision. This product teaches analysis.`,
    },
  ];
}

function faqJsonLd(faq) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function listIntents() {
  return Object.entries(INTENTS).map(([id, row]) => ({ id, label: row.label, phrase: row.phrase }));
}

export function buildBrainPack({ topic, lesson, intent, mediaKind }) {
  const intentId = INTENTS[intent] ? intent : "market-analysis";
  const intentMeta = INTENTS[intentId];
  const t = titleCaseTopic(topic);
  const body = clean(lesson) || `${t}: a calm, education-only walkthrough.`;
  const claims = scanClaims(`${t}\n${body}`);
  if (claims.length) {
    return { ok: false, claims, pack: null };
  }

  const faq = buildFaq(t, intentMeta);
  const ytTitle = youtubeTitle(t, intentId);
  const kind = mediaKind === "image" ? "poster" : "video";

  const search = {
    engineNote:
      "Google, Bing, and AI answers index pages and YouTube — not Instagram hashtags. Put this copy on clearpathtrader.com and on the YouTube listing.",
    googleTitle: `${t} | ClearPath Trader market education`,
    metaDescription: `${body} ${TRUTH} ${SITE}`.slice(0, 155),
    h1: t,
    speakable: `${t}. ${TRUTH} One idea, calm charts, no flashing tickers. ${SITE}`,
    faq,
    jsonLd: faqJsonLd(faq),
    indexTargets: ["Google Search", "Bing / IndexNow", "YouTube Search", "Google AI Overviews", "Perplexity / ChatGPT citations"],
  };

  const youtube = {
    channel: "youtube",
    title: ytTitle,
    caption: [
      body,
      "",
      TRUTH,
      `Learn: ${SITE}`,
      "",
      "Chapters",
      "0:00 Why calm analysis",
      `0:20 ${t}`,
      "1:30 How to read this without overload",
      "2:30 Takeaway",
      "",
      `YouTube search phrases: ${IN_APP_TAGS.youtube.join(", ")}`,
    ].join("\n"),
    tags: IN_APP_TAGS.youtube,
    capabilities: ["VSO", "SEO", "AEO", "AAO"],
  };

  const social = [
    {
      channel: "facebook",
      title: t,
      caption: `${body}\n\n${TRUTH}\n${SITE}\n\n${IN_APP_TAGS.facebook.join(" ")}`,
      tags: IN_APP_TAGS.facebook,
      capabilities: ["SMO", "SXO"],
    },
    {
      channel: "reddit",
      title: `${t} — education, not a broker pitch`,
      caption: `${body}\n\nCalm market analysis education (not a brokerage). Lesson: ${SITE}\n\nNot a signal service.`,
      tags: [],
      capabilities: ["AEO", "EEAT", "SMO"],
    },
  ];

  const uniqueSocial = [];
  const seen = new Set();
  for (const p of [youtube, ...social]) {
    if (seen.has(p.channel)) continue;
    seen.add(p.channel);
    uniqueSocial.push(p);
  }

  const matched = matchDraft(t, body);

  return {
    ok: true,
    claims: [],
    pack: {
      topic: t,
      intent: intentId,
      intentLabel: intentMeta.label,
      mediaKind: kind,
      truth: TRUTH,
      site: SITE,
      capabilities: [...new Set([...(matched.matched || []).map((c) => c.ID), ...intentMeta.capabilityBias])],
      search,
      posts: uniqueSocial,
      reminder:
        "Dispatch always publishes a public /watch page and pings Bing/IndexNow. YouTube is the other search engine. Reddit and the Facebook Page are the only social launches. Nothing buys ads.",
    },
  };
}
