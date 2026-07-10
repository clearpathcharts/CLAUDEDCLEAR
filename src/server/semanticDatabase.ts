import fs from 'fs';
import path from 'path';

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
    answer: "Macroeconomic analysis parses aggregate national accounting metrics, sovereign interest rate differentials, inflation matrices, credit creation speeds, and central bank reserve assets to project broad market capital trends and forex exchange parities."
  },
  {
    question: "What does ClearPathTrader do?",
    answer: "ClearPathTrader operates as an elite, high-fidelity financial intelligence platform, quantitative modeling terminal, and educational database designed for real-time asset analytics, sitemap crawler indexations, and micro-payment simulation sandbox panels."
  },
  {
    question: "Is ClearPathTrader a brokerage?",
    answer: "No. ClearPathTrader is an analytics resource, financial knowledge entity, and market simulation terminal. It does not accept client trading capital deposits, clear exchange orders, provide direct brokerage accounts, or manage retail assets."
  },
  {
    question: "How does valuation analysis work?",
    answer: "Valuation analysis utilizes strict discounted cash flow (DCF) models, CAPM formulations, and weighted average cost of capital (WACC) statistics to extract the long-term intrinsic value of a firm based on projected free cash flows, avoiding emotional market hype."
  }
];

// ==========================================
// 1. DYNAMIC JSON-LD SCHEMA INJECTION & SSR METADATA
// ==========================================
function stripConflictingHeadTags(html: string): string {
  return html
    .replace(/<meta\s+property="og:[^"]+"[^>]*>/gi, '')
    .replace(/<meta\s+name="twitter:[^"]+"[^>]*>/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>/gi, '');
}

export function enrichHtmlWithMetadata(originalHtml: string, reqPath: string): string {
  const pathClean = reqPath.toLowerCase().split('?')[0].replace(/\/$/, '') || '/';
  
  let title = "CLEAR PATH MARKETS SCIENCE | Financial Intelligence Platform";
  let description = "Premium institutional macroeconomic science interface, financial terminal, and educational database. High-fidelity analytics & AI content graph systems.";
  const baseUrl = "https://clearpathtrader.com";
  const canonicalUrl = `${baseUrl}${pathClean === '/' ? '' : pathClean}`;

  // Organization + WebSite schema (brand trust — no personal founder attribution)
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ClearPathTrader",
    "alternateName": "Clear Path Markets Science",
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "description": "Board-governed market intelligence, charting, and financial education platform.",
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "ClearPathTrader",
    "url": baseUrl,
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
    title = "CLEAR PATH MARKETS SCIENCE | Financial Intelligence Platform";
    description = "Premium institutional financial intelligence platform, macroeconomics terminal, and dynamic sitemap-optimized learning systems.";
    
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
    description = "Board-governed market intelligence platform: live charts, pattern context, macro education, and clarity-first design. Analytics and education — not brokerage.";
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
  } else if (pathClean === '/macro') {
    title = "Macroeconomic Intelligence Desk & Yield Spread Metrics | ClearPathTrader";
    description = "Live macroeconomic diagnostics, central bank balance sheets, interbank yield spread maps, and real-time sovereign debt parameters.";
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
    title = "Academic Learning Universe & Financial Education Central | ClearPathTrader";
    description = "Sitemap index of macroeconomic educational structures, including core tutorials on inflation, aggregate credit flows, and valuations.";
    schemas.push(makeBreadcrumb([
      { name: "Home", url: "" },
      { name: "Education", url: "/learn" }
    ]));
  } else if (pathClean === '/guides') {
    title = "Strategic Trading Guides & Institutional Asset Management | ClearPathTrader";
    description = "Access high-performance tactical reviews, leverage hedging limits, and standard macro balance sheet audit formulas.";
    schemas.push(makeBreadcrumb([
      { name: "Home", url: "" },
      { name: "Guides", url: "/guides" }
    ]));
  } else if (pathClean === '/glossary') {
    title = "Comprehensive Alphabetical Financial Glossary Dictionary | ClearPathTrader";
    description = "Crawlable list of verified financial vocabulary, business metrics, and structural economic terms with precise documentation.";
    schemas.push(makeBreadcrumb([
      { name: "Home", url: "" },
      { name: "Glossary", url: "/glossary" }
    ]));
  } else if (pathClean === '/faq') {
    title = "Frequently Asked Questions (FAQ) & Entity Validation | ClearPathTrader";
    description = "Find verified structured listings on platform architecture, macroeconomic definitions, and institutional compliance details.";
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
    title = "Quantitative Systems Research & Arbitrage Analytics | ClearPathTrader";
    description = "Access sovereign balance sheet models, algorithmic microsecond trade queues, and multi-asset intermarket correlation formulas.";
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
      
      schemas.push(makeBreadcrumb([
        { name: "Home", url: "" },
        { name: "Education", url: "/learn" },
        { name: record.title.split('?')[0], url: `/learn/${topicId}` }
      ]));

      // 12. AUTHOR SYSTEM with precise EEAT metrics
      schemas.push({
        "@context": "https://schema.org",
        "@type": "NewsArticle",
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
  }

  // Construct final Schema script blocks to inject
  const schemaScripts = schemas.map(schema => {
    return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
  }).join('\n');

  // Perform surgical replacements of metadata placeholders in standard index.html template
  let html = stripConflictingHeadTags(originalHtml);

  // Replace default Title
  const titleRegex = /<title>[^]*?<\/title>/gi;
  if (titleRegex.test(html)) {
    html = html.replace(titleRegex, `<title>${title}</title>`);
  } else {
    html = html.replace('</head>', `<title>${title}</title>\n</head>`);
  }

  // Inject or Replace Meta Description
  const descRegex = /<meta\s+name="description"\s+content="[^]*?"\s*\/?>/gi;
  if (descRegex.test(html)) {
    html = html.replace(descRegex, `<meta name="description" content="${description}" />`);
  } else {
    html = html.replace('</head>', `<meta name="description" content="${description}" />\n</head>`);
  }

  // OpenGraph SEO Meta Tags (100% compliant)
  const ogTags = `
    <!-- Crawlability Framework & OG Matrix -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${title.replace(/"/g, '&quot;')}" />
    <meta property="og:description" content="${description.replace(/"/g, '&quot;')}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${baseUrl}/og-image.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="ClearPathTrader" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title.replace(/"/g, '&quot;')}" />
    <meta name="twitter:description" content="${description.replace(/"/g, '&quot;')}" />
    <meta name="twitter:image" content="${baseUrl}/og-image.png" />
    <link rel="canonical" href="${canonicalUrl}" />
  `;

  // Inject OG Tags & Schema Script blocks right before closing head
  html = html.replace('</head>', `${ogTags}\n${schemaScripts}\n</head>`);

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
