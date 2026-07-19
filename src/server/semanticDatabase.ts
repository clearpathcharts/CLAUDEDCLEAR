import fs from 'fs';
import path from 'path';
import {
  TRADING_REIMAGINED_FAQS,
  TRADING_REIMAGINED_PATH,
  TRADING_REIMAGINED_SHORT_PATH,
  TRADING_REIMAGINED_SEO,
  SPEED_COPY,
} from '../content/tradingReimaginedLanding';
import { GUIDE_RECORDS, GLOSSARY_TERMS } from './contentData';
import {
  lookupStock,
  lookupCrypto,
  lookupForex,
  lookupCommodity,
  lookupIndicator,
  lookupProfile,
  lookupEconomy,
  getLessonSeo,
  PROFILE_SEO,
} from './crawlCatalog';
import { getSchool, getUnit } from '../education/curriculumData';

// ==========================================
// 5. AI-READABLE CONTENT DATABASE (EEAT COMPLIANT)
// ==========================================
export interface SemanticEntity {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: 'macroeconomics' | 'valuation' | 'flows' | 'microstructure' | 'correlations';
  entityType: 'educational' | 'technical_definition' | 'macro_framework';
  keywords: string[];
  relatedPages: string[];
  author: string;
  publishDate: string;
  updatedDate: string;
  reviewedBy: string;
  faqs: { question: string; answer: string }[];
}

export const SEMANTIC_RECORDS: Record<string, SemanticEntity> = {
  'inflation': {
    id: 'inflation',
    title: 'What Is Inflation? Monetary Expansion & purchasing power',
    summary: 'Macroeconomic inflation measures the systematic expansion of aggregate money supply and credit relative to physical outputs, diminishing currency purchasing power and altering bilateral forex parity coordinates.',
    content: `### Inflationary Regimes & Capital Degradation
    
Inflation is fundamentally a monetary phenomenon (V = PY/M) characterized by a sustained rise in the general price level of goods and services in an economy. Under the ClearPath academic framework, inflation represents the expansion of liquid credit and central bank monetizations surpassing production capacities.

#### 1. Demand-Pull vs Cost-Push Dynamics
*   **Demand-Pull:** Triggered when aggregate monetary demand outpaces aggregate physical output. Usually accompanied by central bank sovereign debt monetization or interest rate subsidies.
*   **Cost-Push:** Occurs when resource supply lines suffer bottlenecks, scaling raw material and commodity input costs.

#### 2. The Transmission Phase
When the Federal Reserve or other central banks inflate balance sheets, excess liquidity circulates into retail channels and commercial portfolios. This increases the nominal volume of bids chasing inelastic assets, driving capital depreciation of denominating fiat cash reserves. To protect treasury risk bands, institutions monitor the CPI, PCE, and Treasury Yield Spreads carefully.`,
    category: 'macroeconomics',
    entityType: 'educational',
    keywords: ['CPI', 'inflation', 'Fed', 'interest rates', 'fiat money', 'carry trade'],
    relatedPages: ['/macro', '/learn/liquidity'],
    author: 'ClearPathTrader Research Team',
    publishDate: '2026-03-01',
    updatedDate: '2026-06-07',
    reviewedBy: 'ClearPathTrader Audit Panel',
    faqs: [
      {
        question: 'What is the primary cause of secular inflation?',
        answer: 'Secular long-term inflation is driven by continuous expansion of the monetary base and systemic credit multipliers, which dilutes the purchasing power index of fiat reserve units.'
      },
      {
        question: 'How do central banks attempt to combat high inflation?',
        answer: 'Central banks lift benchmark interest rates (such as the Federal Funds Rate), execute quantitative tightening (QT), and scale back sovereign asset purchases to restrict credit creation volume.'
      }
    ]
  },
  'liquidity': {
    id: 'liquidity',
    title: 'Macro Liquidity Dynamics & Sovereign flows',
    summary: 'Macro liquidity dictates the ease, velocity, and aggregate volume of capital clearings across global interbank channels, driving risk-asset premiums and corporate debt roll-over spreads.',
    content: `### Systemic Flow & Liquidity Matrices

Macro liquidity represents the baseload energy flowing through the veins of modern financial systems. It encompasses central bank reserves, commercial deposit velocity, and shadow banking leverage multipliers.

#### 1. Core Levels of Liquidity
*   **Monetary Base (M0):** Absolute central bank liabilities (currency in circulation + commercial bank bank reserves).
*   **Systemic Credit Multiplier (M2):** Standard money supply enclosing retail deposit networks and short-term debt wrappers.
*   **Shadow Liquidity:** Bilateral repurchase agreements (Repo) and global credit lines used to clear OTC derivative trades.

#### 2. Asset Valuation Impact
When central bank reserves expand, investment banks and market makers see low funding rates, compressed yield spreads, and expanded borrowing capacities. This forces capital out of low-yield sovereign instruments into risk-assets like equities, gold, and crypto consensus networks. Conversely, liquidity drains act as systemic contraction events, forcing valuation adjustments.`,
    category: 'flows',
    entityType: 'educational',
    keywords: ['M2', 'liquidity', 'Fed reserves', 'Repo rate', 'shadow banking', 'capital flows'],
    relatedPages: ['/macro', '/learn/inflation'],
    author: 'ClearPathTrader Research Team',
    publishDate: '2026-03-01',
    updatedDate: '2026-06-07',
    reviewedBy: 'ClearPathTrader Audit Panel',
    faqs: [
      {
        question: 'What is monetary reserve draining?',
        answer: 'Reserves drift represents the systematic shrinkage of central bank deposit reserves, forcing regional banking desks to tighten lending brackets and scale back leverage.'
      },
      {
        question: 'How does macro liquidity impact stock valuations?',
        answer: 'High macro liquidity decreases corporate equity risk premiums and overnight financing costs, boosting the discounted present value of far-duration tech and growth shares.'
      }
    ]
  },
  'valuation': {
    id: 'valuation',
    title: 'Discounted Cash Flow (DCF), CAPM & Enterprise Valuation',
    summary: 'Valuation analytics translate future corporate dividend streams, capital assets, and growth trajectories into a modern discounted present value under WACC and CAPM models.',
    content: `### Enterprise Valuation & Discounted Cash Flows

Financial evaluation represents the core mathematical discipline of valuing a public stock, private startup, or property asset class. Historically, clear valuations avoid emotional retail hyperbole.

#### 1. Discounted Cash Flow (DCF) Formula
The fundamental value of any perpetual asset class represents the sum of all projected future free cash flows discounted to the present epoch:
$$PV = \\sum \\frac{CF_t}{(1 + WACC)^t} + \\frac{Terminal\\_Value}{(1 + WACC)^n}$$

#### 2. Weighted Average Cost of Capital (WACC) & CAPM
*   **Cost of Debt:** Net of tax interest rate on company bonds.
*   **Cost of Equity:** Derived from the Capital Asset Pricing Model (CAPM): Rate = RiskFree + Beta * (MarketPremium).
*   **WACC:** The weighted sum of these cost parameters based on corporate balance-sheet structuring.`,
    category: 'valuation',
    entityType: 'educational',
    keywords: ['DCF', 'valuation', 'CAPM', 'WACC', 'enterprise value', 'P/E ratio', 'discount rate'],
    relatedPages: ['/companies', '/learn/correlations'],
    author: 'ClearPathTrader Research Team',
    publishDate: '2026-03-01',
    updatedDate: '2026-06-07',
    reviewedBy: 'ClearPathTrader Audit Panel',
    faqs: [
      {
        question: 'Why does a interest rate hike compress growth stock valuations?',
        answer: 'Rising interest rates elevate the WACC and discount rates. Because growth stocks generate the majority of cash flows far in the future, these future cash flows are hit harder when discounted back to the present day.'
      },
      {
        question: 'What does Enterprise Value (EV) measure?',
        answer: 'Enterprise Value measures the total cost of acquiring an entire business, computed as: Market Capitalization + Total Debt - Cash & Cash Equivalents.'
      }
    ]
  },
  'microstructure': {
    id: 'microstructure',
    title: 'Market Microstructure, Order Books & HFT queues',
    summary: 'Market Microstructure investigates the granular mechanics of transaction clearance, bidding flows, order book depth, HFT queue alignments, and liquidity spreads.',
    content: `### Microscopic Trade Execution & Order Physics

Market Microstructure is the science examining how latent bids and immediate transactions translate into dynamic ticks. It replaces standard curves with discrete microsecond exchange order books.

#### 1. Limit Order Book (LOB) Architecture
*   **The Bid/Ask Spread:** The structural separation between the highest buying bid and the lowest selling ask.
*   **Market Orders:** Trade requests executed immediately against existing book liquidity, consuming queue depth.
*   **Limit Orders:** Passive quotes parked in the book queue waiting for counterparties, supplying market depth.

#### 2. High Frequency Trading (HFT) and Latency
Institutional market makers deploy co-located servers inside exchange routers to manage risk and collect the spread. Using specialized tickers and algorithmic arbitrage formulas, these systems complete transactions in single-digit microseconds, eliminating risk and processing immense institutional portfolios.`,
    category: 'microstructure',
    entityType: 'educational',
    keywords: ['order book', 'microstructure', 'bid-ask spread', 'HFT', 'latency', 'liquidity', 'limit order'],
    relatedPages: ['/learn/liquidity'],
    author: 'ClearPathTrader Research Team',
    publishDate: '2026-03-05',
    updatedDate: '2026-06-07',
    reviewedBy: 'ClearPathTrader Audit Panel',
    faqs: [
      {
        question: 'What causes dynamic spread expansion during panic?',
        answer: 'During high volatility panic, market maker algorithms immediately cancel passive limit orders to avoid adverse selection (toxic flow), causing order book depth to evaporate and spreads to widen.'
      },
      {
        question: 'What is co-location?',
        answer: 'Co-location is positioning trading servers in the physical data center of an asset exchange to reduce connection latency to sub-microsecond levels.'
      }
    ]
  },
  'correlations': {
    id: 'correlations',
    title: 'Intermarket Asset Correlations & Beta offsets',
    summary: 'Intermarket correlations decode the systemic mathematical connections between bond yields, forex exchange rates, commodity inputs, and equity index parameters.',
    content: `### Intermarket Dynamics & Correlation Nodes

Modern asset portfolios do not trade in isolated vacuums; they trade as highly correlated nodes inside a global financial grid. Understanding inter-asset relationships is necessary to hedging risk.

#### 1. Sovereign Bond Yields vs Currency Strengths
When a country’s sovereign bond yields rise relative to other countries, international macro funds purchase local currency paper to capture the yield. This drives the exchange parity of the denominating currency higher on bilateral desks.

#### 2. Gold vs Real Interest Rates
Gold operates as the primary sovereign risk backstop. Since gold pays no physical coupon, its opportunity cost climbs when sovereign real yields (inflation-adjusted bond rates) are elevated. When real yields flip negative, gold experiences substantial upward bids.`,
    category: 'correlations',
    entityType: 'educational',
    keywords: ['correlations', 'bond physics', 'intermarket', 'real yields', 'gold', 'beta', 'hedging'],
    relatedPages: ['/macro', '/learn/valuation'],
    author: 'ClearPathTrader Research Team',
    publishDate: '2026-03-01',
    updatedDate: '2026-06-07',
    reviewedBy: 'ClearPathTrader Audit Panel',
    faqs: [
      {
        question: 'What is the standard correlation between the USD and Commodities?',
        answer: 'Generally negative. Commodities are priced worldwide in US Dollars; hence, a weakening USD makes commodities cheaper for international clients, driving prices higher.'
      },
      {
        question: 'What does a high Beta coefficient signify?',
        answer: 'An asset beta greater than 1.0 indicates that the security moves with higher systemic volatility than the aggregate market index, multiplying directional sweeps.'
      }
    ]
  }
};

// ==========================================
// 6. INTERNAL SEMANTIC LINKING ENGINE
// ==========================================
export function semanticLinkContent(text: string): string {
  if (!text) return '';
  let linked = text;
  
  // Clean, precise regexes mapping vocabulary to Dynamic /learn Links
  const vocabMappings = [
    { word: 'inflation', link: '/learn/inflation' },
    { word: 'liquidity', link: '/learn/liquidity' },
    { word: 'valuation', link: '/learn/valuation' },
    { word: 'market microstructure', link: '/learn/microstructure' },
    { word: 'microstructure', link: '/learn/microstructure' },
    { word: 'intermarket correlations', link: '/learn/correlations' },
    { word: 'correlations', link: '/learn/correlations' }
  ];

  // To prevent double-wrapping, replace matching terms outside HTML tags
  for (const mapping of vocabMappings) {
    // Regex matches the word strictly (word boundaries), ignoring case, as long as it is not already inside an anchor tag
    // This is a robust but lightweight semantic internal linker
    const pattern = new RegExp(`\\b(${mapping.word})\\b(?![^<]*>|[^<>]*<\\/a>)`, 'gi');
    linked = linked.replace(pattern, `<a href="${mapping.link}" class="text-[#00D9FF] hover:underline font-bold font-mono">$1</a>`);
  }

  return linked;
}

// ==========================================
// 12. GENERAL FINANCIAL SYSTEM SITE FAQS (EEAT COMPACT)
// ==========================================
export const GENERAL_FAQS = [
  {
    question: "What is macroeconomic analysis?",
    answer: "Macroeconomic analysis studies the big forces that move markets: inflation, interest rates, credit growth, central bank balance sheets, and currency differentials. ClearPathTrader teaches these concepts in plain language with charts and structured lessons."
  },
  {
    question: "What does ClearPathTrader do?",
    answer: "ClearPathTrader is a free market intelligence terminal and education platform. You get live charts, unlimited indicators, automatic pattern context, a financial encyclopedia, and a beginner-to-advanced learning path — without depositing trading capital."
  },
  {
    question: "Is ClearPathTrader a brokerage?",
    answer: "No. ClearPathTrader is analytics and education only. It does not accept client deposits, execute exchange orders, open brokerage accounts, or manage retail assets."
  },
  {
    question: "How does valuation analysis work?",
    answer: "Valuation analysis estimates what a company is worth using models such as discounted cash flow (DCF), CAPM, and WACC — projecting free cash flows and discounting them to today instead of chasing short-term price hype."
  },
  {
    question: "Is ClearPathTrader accessible for people with disabilities?",
    answer: "Yes. The public site uses semantic HTML, skip links, keyboard-focusable controls, labeled forms, and reduced-motion support. The terminal also offers neurodivergent UI modes (calm focus, reading support, ADHD, autism-predictable, and more) at /ui. See our accessibility statement at /accessibility."
  }
];

/** Keep titles under ~60 chars and descriptions in the 140–160 sweet spot when possible. */
function clampTitle(raw: string, max = 60): string {
  const t = raw.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const sp = cut.lastIndexOf(' ');
  return `${(sp > 40 ? cut.slice(0, sp) : cut).trimEnd()}…`;
}

function clampDescription(raw: string, max = 160): string {
  const t = raw.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const sp = cut.lastIndexOf(' ');
  return `${(sp > 100 ? cut.slice(0, sp) : cut).trimEnd()}…`;
}

// ==========================================
// 1. DYNAMIC JSON-LD SCHEMA INJECTION & SSR METADATA
// ==========================================
function stripConflictingHeadTags(html: string): string {
  return html
    .replace(/<meta\s+property="og:[^"]+"[^>]*>/gi, '')
    .replace(/<meta\s+name="twitter:[^"]+"[^>]*>/gi, '')
    .replace(/<meta\s+name="robots"[^>]*>/gi, '')
    .replace(/<meta\s+name="theme-color"[^>]*>/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>/gi, '');
}

// Alias routes whose canonical must point at the primary URL to avoid
// duplicate-content signals (each alias serves identical page content).
const CANONICAL_ALIASES: Record<string, string> = {
  [TRADING_REIMAGINED_SHORT_PATH]: TRADING_REIMAGINED_PATH,
  '/financial-encyclopedia': '/encyclopedia',
  '/encyclopedia-of-indicators': '/indicators',
  '/clearpath-education': '/education',
  '/literacy-os': '/literacy',
};

export function enrichHtmlWithMetadata(originalHtml: string, reqPath: string): string {
  const pathClean = reqPath.toLowerCase().split('?')[0].replace(/\/$/, '') || '/';
  
  let title = "ClearPath Trader | Market Intelligence & Education Terminal";
  let description = "Free market intelligence terminal with live charts, unlimited indicators, pattern context, and plain-language trading education. Analytics only — not a brokerage.";
  let keywords = "ClearPath Trader, market intelligence, trading charts, financial education, technical indicators, forex, crypto, stocks";
  const baseUrl = "https://clearpathtrader.com";
  const canonicalPath = CANONICAL_ALIASES[pathClean] ?? pathClean;
  const canonicalUrl = `${baseUrl}${canonicalPath === '/' ? '' : canonicalPath}`;

  // Organization + WebSite schema (brand trust — no personal founder attribution)
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    "name": "ClearPathTrader",
    "alternateName": ["Clear Path Markets Science", "ClearPath Trader"],
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "description": "Market intelligence, charting, and financial education platform. Analytics and learning — not a brokerage.",
    "sameAs": [] as string[],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "ClearPathTrader",
    "alternateName": "Clear Path Markets Science",
    "url": baseUrl,
    "inLanguage": "en-US",
    "publisher": { "@id": `${baseUrl}/#organization` },
  };

  // Breadcrumb Schema
  const makeBreadcrumb = (items: { name: string; url: string }[]) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": item.name,
      "item": `${baseUrl}${item.url}`
    }))
  });

  const schemas: any[] = [orgSchema, websiteSchema];

  // Map route paths to titles, descriptions, and custom JSON-LD schemas
  if (pathClean === '/') {
    title = "ClearPath Trader | Market Intelligence & Education Terminal";
    description = "Free market intelligence terminal: live charts, unlimited indicators, automatic pattern context, and plain-language trading education. Not a brokerage.";
    keywords = "ClearPath Trader, trading terminal, market charts, financial education, technical indicators, Clear Path Markets Science";
    
    // Homepage structured FAQ
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": GENERAL_FAQS.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    });
  } else if (pathClean === '/about') {
    title = "About ClearPath Trader | Market Intelligence Platform";
    description = "Learn what ClearPath Trader is: live charts, pattern context, macro education, and clarity-first design. Analytics and education — not a brokerage.";
    keywords = "about ClearPath Trader, market intelligence platform, trading education, financial analytics";
    schemas.push(makeBreadcrumb([
      { name: "Home", url: "" },
      { name: "About", url: "/about" }
    ]));
    schemas.push({
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "@id": `${canonicalUrl}#webpage`,
      "url": canonicalUrl,
      "name": "About ClearPath Trader",
      "description": description,
      "isPartOf": { "@type": "WebSite", "url": baseUrl, "name": "ClearPathTrader" }
    });
  } else if (pathClean === '/accessibility') {
    title = "Accessibility Statement | ClearPath Trader";
    description = "How ClearPath Trader supports keyboard navigation, screen readers, contrast, reduced motion, and neurodivergent trading UI modes (WCAG-oriented).";
    keywords = "accessibility, WCAG, screen reader, keyboard navigation, neurodivergent trading UI, ClearPath Trader";
    schemas.push(makeBreadcrumb([
      { name: "Home", url: "" },
      { name: "Accessibility", url: "/accessibility" }
    ]));
    schemas.push({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${canonicalUrl}#webpage`,
      "url": canonicalUrl,
      "name": title,
      "description": description,
      "inLanguage": "en-US",
      "isPartOf": { "@type": "WebSite", "url": baseUrl, "name": "ClearPathTrader" }
    });
  } else if (pathClean === TRADING_REIMAGINED_PATH || pathClean === TRADING_REIMAGINED_SHORT_PATH) {
    title = TRADING_REIMAGINED_SEO.title;
    description = TRADING_REIMAGINED_SEO.description;
    keywords = TRADING_REIMAGINED_SEO.keywords;

    schemas.push(makeBreadcrumb([
      { name: "Home", url: "" },
      { name: "If Trading and ChatGPT Had a Baby", url: TRADING_REIMAGINED_PATH }
    ]));

    schemas.push({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${canonicalUrl}#webpage`,
      "url": canonicalUrl,
      "name": title,
      "description": description,
      "inLanguage": "en-US",
      "isPartOf": { "@type": "WebSite", "name": "ClearPathTrader", "url": baseUrl }
    });

    schemas.push({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "ClearPath Trader",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Web",
      "url": baseUrl,
      "description": description,
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "featureList": [
        "Unlimited trading indicators",
        "Automatic chart pattern detection",
        "Customizable layouts and color profiles",
        "Indicator encyclopedia",
        "Beginner to advanced education path",
        "Integrated news and social feeds"
      ]
    });

    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": TRADING_REIMAGINED_FAQS.map((faq) => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": { "@type": "Answer", "text": faq.answer }
      }))
    });
  } else if (pathClean === '/macro') {
    title = "Macro Desk: Yield Spreads & Central Bank Data | ClearPathTrader";
    description = "Track macro diagnostics — central bank balance sheets, yield spreads, and sovereign debt context — inside ClearPath Trader.";
    keywords = "macro desk, yield spreads, central bank, inflation, interest rates, ClearPath Trader";
    schemas.push(makeBreadcrumb([
      { name: "Home", url: "" },
      { name: "Macro Desk", url: "/macro" }
    ]));
    schemas.push({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${canonicalUrl}#webpage`,
      "url": canonicalUrl,
      "name": "Macroeconomic Intelligence Desk",
      "description": description
    });
  } else if (pathClean === '/learn') {
    title = "Learn Markets: Inflation, Liquidity & Valuation | ClearPathTrader";
    description = "Plain-language lessons on inflation, liquidity, valuation, market microstructure, and intermarket correlations — free financial education.";
    keywords = "financial education, learn trading, inflation, liquidity, valuation, market microstructure";
    schemas.push(makeBreadcrumb([
      { name: "Home", url: "" },
      { name: "Education", url: "/learn" }
    ]));
  } else if (pathClean === '/guides') {
    title = "Trading Guides: Macro Spreads, Arbitrage & Risk | ClearPathTrader";
    description = "Practical trading guides on macro spreads, arbitrage mechanics, and leverage risk — written for practitioners, not hype.";
    keywords = "trading guides, macro spreads, arbitrage, leverage risk, position sizing";
    schemas.push(makeBreadcrumb([
      { name: "Home", url: "" },
      { name: "Guides", url: "/guides" }
    ]));
  } else if (pathClean === '/glossary') {
    title = "Financial Glossary: Trading Terms Defined | ClearPathTrader";
    description = `Plain-language definitions of ${GLOSSARY_TERMS.length}+ trading terms: leverage, liquidity, margin, order books, spreads, volatility, and more.`;
    keywords = "financial glossary, trading terms, leverage, liquidity, margin, volatility, order book";
    schemas.push(makeBreadcrumb([
      { name: "Home", url: "" },
      { name: "Glossary", url: "/glossary" }
    ]));
    schemas.push({
      "@context": "https://schema.org",
      "@type": "DefinedTermSet",
      "@id": `${canonicalUrl}#glossary`,
      "name": "ClearPathTrader Financial Glossary",
      "url": canonicalUrl,
      "hasDefinedTerm": GLOSSARY_TERMS.map(t => ({
        "@type": "DefinedTerm",
        "name": t.term,
        "description": t.definition,
        "inDefinedTermSet": `${canonicalUrl}#glossary`
      }))
    });
  } else if (pathClean === '/faq') {
    title = "FAQ: What ClearPath Trader Is (and Isn't) | ClearPathTrader";
    description = "Answers on what ClearPathTrader does, whether it is a brokerage, valuation basics, and accessibility support for disabled users.";
    keywords = "ClearPath Trader FAQ, is ClearPath a broker, trading education FAQ, accessibility";
    schemas.push(makeBreadcrumb([
      { name: "Home", url: "" },
      { name: "FAQ", url: "/faq" }
    ]));
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": GENERAL_FAQS.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    });
  } else if (pathClean === '/research') {
    title = "Market Research & Intermarket Analytics | ClearPathTrader";
    description = "Explore quantitative research themes: balance-sheet models, intermarket correlations, and multi-asset structure — education-first analytics.";
    keywords = "market research, intermarket correlations, quantitative analytics, ClearPath Trader";
    schemas.push(makeBreadcrumb([
      { name: "Home", url: "" },
      { name: "Research Analytics", url: "/research" }
    ]));
  } else if (pathClean.startsWith('/learn/')) {
    const topicId = pathClean.replace('/learn/', '');
    const record = SEMANTIC_RECORDS[topicId];
    if (record) {
      title = `${record.title} | ClearPathTrader`;
      description = record.summary;
      keywords = record.keywords.join(', ');
      
      schemas.push(makeBreadcrumb([
        { name: "Home", url: "" },
        { name: "Education", url: "/learn" },
        { name: record.title.split('?')[0], url: `/learn/${topicId}` }
      ]));

      // 12. AUTHOR SYSTEM with precise EEAT metrics
      schemas.push({
        "@context": "https://schema.org",
        "@type": "Article",
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": canonicalUrl
        },
        "headline": record.title,
        "description": record.summary,
        "image": `${baseUrl}/og-image.png`,
        "datePublished": `${record.publishDate}T08:00:00Z`,
        "dateModified": `${record.updatedDate}T15:00:00Z`,
        "author": {
          "@type": "Organization",
          "name": "ClearPathTrader Editorial",
          "url": baseUrl
        },
        "publisher": {
          "@type": "Organization",
          "name": "ClearPathTrader",
          "logo": {
            "@type": "ImageObject",
            "url": `${baseUrl}/logo.png`
          }
        }
      });

      if (record.faqs.length > 0) {
        schemas.push({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": record.faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.answer
            }
          }))
        });
      }
    }
  } else if (pathClean.startsWith('/guides/')) {
    const slug = pathClean.replace('/guides/', '');
    const guide = GUIDE_RECORDS[slug];
    if (guide) {
      title = `${guide.title} | ClearPathTrader`;
      description = guide.summary;
      keywords = guide.keywords.join(', ');

      schemas.push(makeBreadcrumb([
        { name: "Home", url: "" },
        { name: "Guides", url: "/guides" },
        { name: guide.title.split(':')[0], url: `/guides/${slug}` }
      ]));

      schemas.push({
        "@context": "https://schema.org",
        "@type": "Article",
        "mainEntityOfPage": { "@type": "WebPage", "@id": canonicalUrl },
        "headline": guide.title,
        "description": guide.summary,
        "image": `${baseUrl}/og-image.png`,
        "datePublished": `${guide.publishDate}T08:00:00Z`,
        "dateModified": `${guide.updatedDate}T15:00:00Z`,
        "author": { "@type": "Organization", "name": "ClearPathTrader Editorial", "url": baseUrl },
        "publisher": {
          "@type": "Organization",
          "name": "ClearPathTrader",
          "logo": { "@type": "ImageObject", "url": `${baseUrl}/logo.png` }
        }
      });

      if (guide.faqs.length > 0) {
        schemas.push({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": guide.faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": { "@type": "Answer", "text": faq.answer }
          }))
        });
      }
    }
  } else if (canonicalPath === '/encyclopedia') {
    title = "Financial Encyclopedia: Stocks, Crypto, Forex & Commodities | ClearPathTrader";
    description = "Explore the ClearPath financial encyclopedia — company profiles, crypto assets, forex pairs, commodities, and economic concepts in one knowledge base.";
    schemas.push(makeBreadcrumb([
      { name: "Home", url: "" },
      { name: "Encyclopedia", url: "/encyclopedia" }
    ]));
  } else if (canonicalPath === '/indicators') {
    title = "Encyclopedia of 185+ Trading Indicators, Explained Visually | ClearPathTrader";
    description = "Browse 185+ technical and fundamental indicators — RSI, MACD, Bollinger Bands, Ichimoku, order flow, and more — each with a visual explainer.";
    schemas.push(makeBreadcrumb([
      { name: "Home", url: "" },
      { name: "Indicator Encyclopedia", url: "/indicators" }
    ]));
  } else if (canonicalPath === '/education') {
    title = "ClearPath Education: Beginner to Advanced Trading Curriculum | ClearPathTrader";
    description = "A structured, plain-language trading curriculum with lessons, quizzes, and progress tracking — from candlesticks to advanced market structure.";
    schemas.push(makeBreadcrumb([
      { name: "Home", url: "" },
      { name: "Education", url: "/education" }
    ]));
  } else if (canonicalPath === '/literacy') {
    title = "Literacy OS: Financial Literacy Study System | ClearPathTrader";
    description = "A self-paced financial literacy operating system: concept wiki, study feeds, and vocabulary building for reading markets with confidence.";
    schemas.push(makeBreadcrumb([
      { name: "Home", url: "" },
      { name: "Literacy OS", url: "/literacy" }
    ]));
  } else if (pathClean === '/market-universe') {
    title = "Market Universe: Global Asset Catalog | ClearPathTrader";
    description = "Navigate the full ClearPath market universe — equities, crypto, forex, commodities, and indices — in a single explorable catalog.";
    schemas.push(makeBreadcrumb([
      { name: "Home", url: "" },
      { name: "Market Universe", url: "/market-universe" }
    ]));
  } else if (pathClean === '/stocks' || pathClean === '/crypto' || pathClean === '/forex' || pathClean === '/commodities' || pathClean === '/companies') {
    const hubMeta: Record<string, { title: string; description: string; crumb: string }> = {
      '/stocks': {
        title: 'Stock Encyclopedia: Equity Profiles & Market Data | ClearPathTrader',
        description: 'Browse the ClearPath stock encyclopedia — equity profiles, sectors, and educational context across the market universe.',
        crumb: 'Stocks',
      },
      '/crypto': {
        title: 'Crypto Encyclopedia: Coins, Tokens & Protocols | ClearPathTrader',
        description: 'Explore cryptocurrency profiles — Layer 1s, DeFi, and digital assets — inside the ClearPath financial encyclopedia.',
        crumb: 'Crypto',
      },
      '/forex': {
        title: 'Forex Encyclopedia: Currency Pairs & Macro Drivers | ClearPathTrader',
        description: 'Study major, cross, and exotic FX pairs with the macro drivers that move exchange rates.',
        crumb: 'Forex',
      },
      '/commodities': {
        title: 'Commodities Encyclopedia: Metals, Energy & Agriculture | ClearPathTrader',
        description: 'Gold, oil, grains, and more — commodity profiles with the supply and demand forces behind them.',
        crumb: 'Commodities',
      },
      '/companies': {
        title: 'Company Directory | ClearPathTrader Encyclopedia',
        description: 'Company directory for the ClearPath financial encyclopedia — explore issuers behind listed equities.',
        crumb: 'Companies',
      },
    };
    const hub = hubMeta[pathClean];
    title = hub.title;
    description = hub.description;
    schemas.push(makeBreadcrumb([
      { name: 'Home', url: '' },
      { name: 'Encyclopedia', url: '/encyclopedia' },
      { name: hub.crumb, url: pathClean },
    ]));
  } else if (pathClean.startsWith('/stocks/')) {
    const symbol = pathClean.slice('/stocks/'.length);
    const stock = lookupStock(symbol);
    const ticker = (stock?.ticker || symbol).toUpperCase();
    const company = stock?.company || ticker;
    title = `${ticker} Stock Profile — ${company} | ClearPathTrader`;
    description = stock?.description
      || `${company} (${ticker}) equity profile in the ClearPath financial encyclopedia — sector context, educational overview, and market structure.`;
    keywords = [ticker, company, stock?.sector, 'stock profile', 'equity encyclopedia'].filter(Boolean).join(', ');
    schemas.push(makeBreadcrumb([
      { name: 'Home', url: '' },
      { name: 'Stocks', url: '/stocks' },
      { name: ticker, url: pathClean },
    ]));
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Corporation',
      name: company,
      tickerSymbol: ticker,
      description,
      url: canonicalUrl,
    });
  } else if (pathClean.startsWith('/crypto/')) {
    const symbol = pathClean.slice('/crypto/'.length);
    const coin = lookupCrypto(symbol);
    const sym = (coin?.symbol || symbol).toUpperCase();
    const name = coin?.name || sym;
    title = `${name} (${sym}) Crypto Profile | ClearPathTrader`;
    description = coin?.description
      || `${name} (${sym}) cryptocurrency profile — category, market context, and educational overview in ClearPath.`;
    keywords = [sym, name, coin?.category, 'crypto', 'digital asset'].filter(Boolean).join(', ');
    schemas.push(makeBreadcrumb([
      { name: 'Home', url: '' },
      { name: 'Crypto', url: '/crypto' },
      { name: name, url: pathClean },
    ]));
  } else if (pathClean.startsWith('/forex/')) {
    const pairKey = pathClean.slice('/forex/'.length);
    const fx = lookupForex(pairKey);
    const pair = fx?.pair || pairKey.toUpperCase();
    title = `${pair} Forex Pair — Drivers & Education | ClearPathTrader`;
    description = fx?.description
      || `${pair} currency pair profile — type, macro drivers, and educational context in the ClearPath forex encyclopedia.`;
    keywords = [pair, 'forex', 'currency pair', ...(fx?.affectedBy || [])].join(', ');
    schemas.push(makeBreadcrumb([
      { name: 'Home', url: '' },
      { name: 'Forex', url: '/forex' },
      { name: pair, url: pathClean },
    ]));
  } else if (pathClean.startsWith('/commodities/')) {
    const symbol = pathClean.slice('/commodities/'.length);
    const c = lookupCommodity(symbol);
    const name = c?.name || symbol.toUpperCase();
    const sym = (c?.symbol || symbol).toUpperCase();
    title = `${name} (${sym}) Commodity Profile | ClearPathTrader`;
    description = c?.description
      || `${name} commodity profile — category, drivers, and educational context in ClearPath.`;
    keywords = [name, sym, c?.category, 'commodity'].filter(Boolean).join(', ');
    schemas.push(makeBreadcrumb([
      { name: 'Home', url: '' },
      { name: 'Commodities', url: '/commodities' },
      { name: name, url: pathClean },
    ]));
  } else if (pathClean.startsWith('/economy/')) {
    const slug = pathClean.slice('/economy/'.length);
    const topic = lookupEconomy(slug);
    title = topic
      ? `${topic.title} — Economy Encyclopedia | ClearPathTrader`
      : `${slug.replace(/-/g, ' ')} — Economy Encyclopedia | ClearPathTrader`;
    description = topic?.summary
      || `Economic concept explainer in the ClearPath financial encyclopedia.`;
    schemas.push(makeBreadcrumb([
      { name: 'Home', url: '' },
      { name: 'Encyclopedia', url: '/encyclopedia' },
      { name: topic?.title || slug, url: pathClean },
    ]));
    if (topic) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: topic.title,
        description: topic.summary,
        url: canonicalUrl,
        publisher: { '@type': 'Organization', name: 'ClearPathTrader', url: baseUrl },
      });
    }
  } else if (pathClean.startsWith('/indicators/')) {
    const slug = pathClean.slice('/indicators/'.length);
    const ind = lookupIndicator(slug);
    if (ind) {
      title = `${ind.name} Indicator Explained | ClearPathTrader`;
      description = `${ind.description} Category: ${ind.category}. Complexity ${ind.complexity}/5. Part of the ClearPath Encyclopedia of Indicators.`;
      keywords = [ind.name, ind.category, ...ind.tags, 'trading indicator'].join(', ');
      schemas.push(makeBreadcrumb([
        { name: 'Home', url: '' },
        { name: 'Indicators', url: '/indicators' },
        { name: ind.name, url: pathClean },
      ]));
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `${ind.name} Indicator`,
        description,
        url: canonicalUrl,
        image: `${baseUrl}${ind.img}`,
        publisher: { '@type': 'Organization', name: 'ClearPathTrader', url: baseUrl },
      });
    }
  } else if (pathClean.startsWith('/education/')) {
    const parts = pathClean.split('/').filter(Boolean); // education, school, unit?, lesson?
    if (parts.length === 2) {
      const school = getSchool(parts[1]);
      if (school) {
        title = `${school.name} Trading School — ClearPath Education`;
        description = school.tagline;
        schemas.push(makeBreadcrumb([
          { name: 'Home', url: '' },
          { name: 'Education', url: '/education' },
          { name: school.name, url: pathClean },
        ]));
      }
    } else if (parts.length === 3) {
      const school = getSchool(parts[1]);
      const unit = getUnit(parts[1], parts[2]);
      if (school && unit) {
        title = `${unit.title} | ${school.name} — ClearPath Education`;
        description = `${unit.lessons.length} lessons in ${school.name}: ${unit.title}. Plain-language trading curriculum on ClearPath.`;
        schemas.push(makeBreadcrumb([
          { name: 'Home', url: '' },
          { name: 'Education', url: '/education' },
          { name: school.name, url: `/education/${school.id}` },
          { name: unit.title, url: pathClean },
        ]));
      }
    } else if (parts.length === 4) {
      const seo = getLessonSeo(parts[1], parts[2], parts[3]);
      if (seo) {
        title = `${seo.lesson.title} | ${seo.school.name} — ClearPath Education`;
        description = seo.summary;
        schemas.push(makeBreadcrumb([
          { name: 'Home', url: '' },
          { name: 'Education', url: '/education' },
          { name: seo.school.name, url: `/education/${seo.school.id}` },
          { name: seo.unit.title.split('—')[0].trim(), url: `/education/${seo.school.id}/${seo.unit.id}` },
          { name: seo.lesson.title, url: pathClean },
        ]));
        schemas.push({
          '@context': 'https://schema.org',
          '@type': 'LearningResource',
          name: seo.lesson.title,
          description: seo.summary,
          url: canonicalUrl,
          learningResourceType: 'Lesson',
          isPartOf: {
            '@type': 'Course',
            name: `${seo.school.name} School`,
            url: `${baseUrl}/education/${seo.school.id}`,
          },
          provider: { '@type': 'Organization', name: 'ClearPathTrader', url: baseUrl },
        });
      }
    }
  } else if (pathClean === '/ui') {
    title = 'Neurodivergent Trading UI Modes | ClearPathTrader';
    description = `${PROFILE_SEO.length} accessible trading interfaces — calm focus, reading support, ADHD modes, autism-predictable layouts, minimal motion, and more.`;
    schemas.push(makeBreadcrumb([
      { name: 'Home', url: '' },
      { name: 'UI Modes', url: '/ui' },
    ]));
  } else if (pathClean.startsWith('/ui/')) {
    const slug = pathClean.slice('/ui/'.length);
    const profile = lookupProfile(slug);
    if (profile) {
      title = `${profile.name} Trading Interface | ClearPathTrader`;
      description = `${profile.headline}. ${profile.summary}`;
      keywords = [profile.name, 'neurodivergent trading UI', 'accessible trading interface', 'ClearPath Trader'].join(', ');
      schemas.push(makeBreadcrumb([
        { name: 'Home', url: '' },
        { name: 'UI Modes', url: '/ui' },
        { name: profile.name, url: pathClean },
      ]));
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: `ClearPath Trader — ${profile.name}`,
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        description,
        url: canonicalUrl,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      });
    }
  }

  // Normalize length for SERP/social previews (entity pages may still be long; clamp soft)
  title = clampTitle(title, 70);
  description = clampDescription(description, 160);
  // Keywords meta is low-weight for Google; keep a short phrase list (not hashtags — those belong on social posts)
  keywords = keywords
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
    .slice(0, 12)
    .join(', ');

  // Construct final Schema script blocks to inject
  const schemaScripts = schemas.map(schema => {
    return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
  }).join('\n');

  // Perform surgical replacements of metadata placeholders in standard index.html template
  let html = stripConflictingHeadTags(originalHtml);

  const escAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

  // Replace default Title
  const titleRegex = /<title>[^]*?<\/title>/gi;
  if (titleRegex.test(html)) {
    html = html.replace(titleRegex, `<title>${escAttr(title)}</title>`);
  } else {
    html = html.replace('</head>', `<title>${escAttr(title)}</title>\n</head>`);
  }

  // Inject or Replace Meta Description
  const descRegex = /<meta\s+name="description"\s+content="[^]*?"\s*\/?>/gi;
  if (descRegex.test(html)) {
    html = html.replace(descRegex, `<meta name="description" content="${escAttr(description)}" />`);
  } else {
    html = html.replace('</head>', `<meta name="description" content="${escAttr(description)}" />\n</head>`);
  }

  const keywordsRegex = /<meta\s+name="keywords"\s+content="[^]*?"\s*\/?>/gi;
  if (keywordsRegex.test(html)) {
    html = html.replace(keywordsRegex, `<meta name="keywords" content="${escAttr(keywords)}" />`);
  } else {
    html = html.replace('</head>', `<meta name="keywords" content="${escAttr(keywords)}" />\n</head>`);
  }

  // Open Graph + Twitter + discoverability tags
  const ogTags = `
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:title" content="${escAttr(title)}" />
    <meta property="og:description" content="${escAttr(description)}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${baseUrl}/og-image.png" />
    <meta property="og:image:alt" content="ClearPath Trader — market intelligence terminal" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="ClearPathTrader" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escAttr(title)}" />
    <meta name="twitter:description" content="${escAttr(description)}" />
    <meta name="twitter:image" content="${baseUrl}/og-image.png" />
    <meta name="twitter:image:alt" content="ClearPath Trader — market intelligence terminal" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <meta name="theme-color" content="#0b0e11" />
    <link rel="canonical" href="${canonicalUrl}" />
  `;

  // Inject OG Tags & Schema Script blocks right before closing head
  html = html.replace('</head>', `${ogTags}\n${schemaScripts}\n</head>`);

  if (pathClean === TRADING_REIMAGINED_PATH) {
    const noscriptArticle = `
    <noscript>
      <article style="max-width:48rem;margin:2rem auto;padding:1rem;font-family:system-ui,sans-serif;color:#e5e5e5;background:#0a0a0a">
        <h1>If Trading and ChatGPT Had a Baby — ClearPath Trader</h1>
        <p>${description}</p>
        <h2>${SPEED_COPY.headline}</h2>
        <p>${SPEED_COPY.body}</p>
        <h2>Neurodivergence</h2>
        <p>Custom colors and layouts from traditional trading desks to autism-friendly designs — you choose what works for you. Browse all modes at <a href="/ui">/ui</a>.</p>
        <h2>Customization</h2>
        <p>Your platform: colors, layouts, windows, social links, and news without leaving your charts.</p>
        <h2>Indicators</h2>
        <p>Unlimited indicators, automatic chart pattern marking, and an indicator encyclopedia.</p>
        <h2>Education</h2>
        <p>Beginner to advanced path in plain language.</p>
      </article>
    </noscript>`;
    html = html.replace('<div id="root">', `${noscriptArticle}\n    <div id="root">`);
  } else if (
    pathClean.startsWith('/stocks/') ||
    pathClean.startsWith('/crypto/') ||
    pathClean.startsWith('/forex/') ||
    pathClean.startsWith('/commodities/') ||
    pathClean.startsWith('/economy/')
  ) {
    // Encyclopedia entity pages are SPA-rendered; give non-JS crawlers the unique title/description.
    const safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeDesc = description.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const noscriptEntity = `
    <noscript>
      <article style="max-width:48rem;margin:2rem auto;padding:1rem;font-family:system-ui,sans-serif;color:#e5e5e5;background:#0a0a0a">
        <h1>${safeTitle}</h1>
        <p>${safeDesc}</p>
        <p><a href="/encyclopedia">Browse the Financial Encyclopedia</a> · <a href="/education">ClearPath Education</a> · <a href="/indicators">Indicator Encyclopedia</a></p>
      </article>
    </noscript>`;
    html = html.replace('<div id="root">', `${noscriptEntity}\n    <div id="root">`);
  }

  return html;
}

// ==========================================
// 8. BRONZE-PLATE SE0 PNG IMAGES GENERATION DUMMY WRITER (Avoids 404s completely!)
// ==========================================
export function ensureSeoAssetsExist() {
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const logoPath = path.join(publicDir, 'logo.png');
  const ogImgPath = path.join(publicDir, 'og-image.png');

  // Minimal valid 1x1 black pixel PNG for ultra fast loading and perfect SEO reference compatibility
  const pixelPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  const imageBuffer = Buffer.from(pixelPngBase64, 'base64');

  if (!fs.existsSync(logoPath)) {
    try {
      fs.writeFileSync(logoPath, imageBuffer);
      console.log('[SEO Asset Node] /public/logo.png successfully initialized.');
    } catch (e) {
      console.error('[SEO Asset Node] logo.png write failure:', e);
    }
  }

  if (!fs.existsSync(ogImgPath)) {
    try {
      fs.writeFileSync(ogImgPath, imageBuffer);
      console.log('[SEO Asset Node] /public/og-image.png successfully initialized.');
    } catch (e) {
      console.error('[SEO Asset Node] og-image.png write failure:', e);
    }
  }
}
