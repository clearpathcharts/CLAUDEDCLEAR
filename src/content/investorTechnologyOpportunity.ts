/**
 * External investor / technology due-diligence page copy.
 * Grounded in repository systems + SEC-consultant evaluation framing.
 * Claims stay measurable; unverified commercial metrics stay blank.
 */

import { PRODUCT_LEGAL_NAME, PRODUCT_NAME, PRODUCT_URL } from './productIdentity';
import { TECHNOLOGY_OPPORTUNITY_PATH } from './brentOutreach';

export const TECH_OPP_META = {
  path: TECHNOLOGY_OPPORTUNITY_PATH,
  title: `${PRODUCT_NAME} — Technology, Innovation & Investment Opportunity`,
  description:
    'Investor and technology overview: proprietary market-analysis methodology, geometric pattern measurement, ClearPath River, neuro-adaptive interfaces, and free financial education — delivered as analytical software, not signals or brokerage.',
  canonical: `${PRODUCT_URL}${TECHNOLOGY_OPPORTUNITY_PATH}`,
};

export type TechOppNavItem = { id: string; label: string };

export const TECH_OPP_NAV: TechOppNavItem[] = [
  { id: 'opening', label: 'The Technology Behind ClearPath' },
  { id: 'philosophy', label: 'Built to Challenge Conventional Thinking' },
  { id: 'pillars', label: 'What You Are Actually Getting' },
  { id: 'engines', label: 'The Analytical Engines' },
  { id: 'patterns', label: 'Measuring Market Structure' },
  { id: 'river', label: 'An Extensible Analytical Runtime' },
  { id: 'buddy', label: 'Intelligence That Explains' },
  { id: 'neuro', label: 'Financial Technology for Different Minds' },
  { id: 'education', label: 'Knowledge Without a Paywall' },
  { id: 'platform', label: 'The Technology Platform' },
  { id: 'business', label: 'An Independent Software Business' },
  { id: 'opportunity', label: 'The Opportunity' },
  { id: 'valuation', label: 'Preliminary Valuation & SWOT' },
  { id: 'capital', label: 'Capital Strategy' },
  { id: 'verification', label: 'Verified vs Still Verifying' },
  { id: 'close', label: 'Built Differently' },
];

export const TECH_OPP_POSITIONING = {
  eyebrow: 'Investor & Technology Overview',
  brand: PRODUCT_NAME,
  headline: 'A Different Architecture for Understanding Financial Markets',
  principle: 'Help people understand the market. Don’t tell them what to do.',
  lead: `${PRODUCT_NAME} is a founder-developed financial market-analysis and education platform. Combining proprietary analytical technology, geometric pattern recognition, native chart-integrated indicators, an extensible scripting architecture, neuro-adaptive interface development, and freely accessible financial education, ClearPath is developing a different approach to financial technology.`,
  foundation:
    'At its foundation is a commitment to measurable market structure, transparent analytical processes, and independent thinking.',
  systems: [
    'Proprietary Gold Bar analytical technology',
    'A dedicated geometric pattern-recognition and measurement engine',
    'Live pattern scanning with visible detection counts',
    'ClearPath River — an extensible scripting and runtime architecture',
    'CPT Buddy — financial education and analytical explanation',
    'Neuro-adaptive interface development',
    'A free Financial Education Center',
    'An integrated Encyclopedia of Finance',
    'Optional third-party broker connectivity',
  ],
  notAbout: [
    'Trading signals as a product identity',
    'Automated predictions of profitability',
    'Broker referral commissions or introducing-broker kickbacks',
    'Membership affiliate / residual payout programs',
  ],
  focus:
    'Its focus is analytical software, financial understanding, and tools that help individuals examine markets independently.',
  philosophy: [
    { label: 'Analysis', vs: 'signals' },
    { label: 'Education', vs: 'dependency' },
    { label: 'Transparency', vs: 'assumptions' },
    { label: 'Independent thinking', vs: 'following' },
  ],
};

/** Hierarchy the consultant recommended — methodology over “another chart site”. */
export const TECH_OPP_VALUE_LAYERS = [
  {
    id: 'trading-anarchy',
    title: 'Trading Anarchy',
    role: 'Foundational analytical philosophy',
    body: 'Approximately two decades of founder research emphasizing measurable price behavior, repeatable geometric structure, multi-timeframe examination, and separation of observable structure from assumptions about future movement — encouraging independent analytical thinking. We do not claim Elliott Wave theory has been scientifically disproven; we challenge relying on conventional wave-counting as the only lens.',
  },
  {
    id: 'four-up-three-down',
    title: 'Four Up, Three Down',
    role: 'Proprietary structural methodology',
    body: 'A defined framework for examining pattern-and-breakout relationships: during a trend, four patterns and four breakouts; during a retracement, three patterns and three breakouts. This is a structural measurement framework — not a promise the market will produce a particular outcome.',
  },
  {
    id: 'live-pattern-scanner',
    title: 'Live Pattern Scanner',
    role: 'Measurement technology',
    body: 'Examines actual OHLC candle data, identifies swing highs and lows, measures geometric structures, distinguishes developing vs completed formations, counts detected structures, and displays geometric-fit confidence that updates as chart data changes. Confidence is a fit measurement — not a probability of profitability.',
  },
  {
    id: 'supporting-ecosystem',
    title: 'The Analytical Environment',
    role: 'Delivery + supporting systems',
    body: 'Charting infrastructure, Gold Bar, CPT Buddy, education, encyclopedia, and optional broker connectivity support the experience. They matter — but the central intellectual proposition is the methodology made measurable inside the environment.',
  },
];

export const TECH_OPP_PILLARS = [
  {
    id: 'gold-bar',
    title: 'Proprietary Gold Bar Technology',
    evidence: ['src/river/goldBarIndicator.ts', 'src/lib/charts/goldBarOverlay.ts', 'src/components/charts/LightweightCandles.tsx'],
    points: [
      'ATR-based trailing-stop calculation with chart-rendering integration',
      'Native integration into the charting environment',
      'One-click activation / deactivation and candle highlighting',
      'Intended for use across instruments and chart timeframes',
    ],
    investment:
      'Proprietary analytical functionality integrated into the charting experience — not a pile of external chart plugins.',
  },
  {
    id: 'pattern-engine',
    title: 'Live Geometric Pattern Recognition Engine',
    evidence: [
      'src/patterns/engine.ts',
      'src/patterns/geometry.ts',
      'src/patterns/lineFit.ts',
      'src/patterns/swings.ts',
      'src/patterns/activeScan.ts',
      'src/patterns/forming.ts',
      'src/patterns/overlay.ts',
    ],
    points: [
      'Dedicated analytical subsystem — not merely a library of pre-drawn shapes',
      'Swing identification, line/trendline fitting, forming vs completed structures',
      'Conflict handling, live-edge processing, and scan scheduling',
      'Visible detection counts and geometric-fit confidence on the chart',
    ],
    investment:
      'Transparent analytical measurements are easier to evaluate and audit than opaque recommendation engines.',
  },
  {
    id: 'river',
    title: 'ClearPath River — Compiler & Runtime',
    evidence: ['src/river/compiler/', 'src/river/rir/', 'src/river/runtime/', 'src/river/pine/', 'src/river/importers/'],
    points: [
      'Language detection and importers',
      'Parsing, AST, River Intermediate Representation (RIR), lowering',
      'Runtime execution, builtins, series storage, active runtime management',
      'Script catalog infrastructure for an extensible analytical environment',
    ],
    investment:
      'A scripting and runtime ecosystem can extend the platform beyond built-in indicators — subject to language coverage and production-readiness diligence.',
  },
  {
    id: 'neuro',
    title: 'Neuro-Adaptive Trading Environment',
    evidence: ['Neurodivergent desk components', 'Neuro-profile selection', 'Accessibility preferences', 'Neuro render-loop tests'],
    points: [
      'First-class Neurodivergent desk — not a marketing skin',
      'Multiple sensory / cognitive display profiles',
      'Chart display controls designed for different information-processing styles',
    ],
    investment:
      'Differentiation is how people interact with market information — not another dark/light theme toggle.',
  },
];

export const TECH_OPP_ECOSYSTEM = [
  {
    id: 'buddy',
    title: 'CPT Buddy',
    body: 'Dedicated mentoring, live tools, affect, and companion-guide services. Product boundaries: pattern identification and counting, financial education, explanation of chart structures — not trading instructions and not market predictions. Hard-coded prohibition of prohibited trading-action language should be independently tested across every user-visible pathway before advertising it as an enforceable technical guarantee.',
  },
  {
    id: 'education',
    title: 'Financial Education Center',
    body: 'Lessons, quizzes, curriculum, and progress infrastructure. Free by design — help users build financial knowledge rather than depend on automated trading recommendations.',
  },
  {
    id: 'encyclopedia',
    title: 'Encyclopedia of Finance',
    body: 'Searchable reference infrastructure plus a substantial indicator-illustration collection. Users can study concepts in the same ecosystem where they examine charts.',
  },
];

export const TECH_OPP_PLATFORM = [
  {
    title: 'Multi-source market data',
    body: 'Centralized market-data gateway with Twelve Data integration, Financial Modeling Prep fallback paths, quotes, news, economic data, and Commitment of Traders (official CFTC) where mapped. Public technology principles: never invent unavailable prices; mark unavailable data clearly; do not silently substitute instruments; preserve instrument identity; distinguish spot from futures.',
  },
  {
    title: 'Charting & analytical infrastructure',
    body: 'Interactive charts, lightweight candle rendering, pattern scanner panels, forming-pattern watch, HUD, drawings, Fibonacci, timeframe and zoom controls, preferences, dismissal controls, and replay/timeframe tests. The chart is where analytical systems interact — not only a display surface.',
  },
  {
    title: 'Broker connectivity',
    body: 'Optional Alpaca OAuth modules exist. Business model: ClearPath does not custody customer funds, does not operate as a brokerage, users connect a chosen licensed broker, and broker referral / introducing-broker kickbacks are not part of the model. Exact order-transmission permissions should be documented carefully before absolute public claims.',
  },
];

export const TECH_OPP_DIFFERENTIATORS: Array<{ area: string; approach: string }> = [
  { area: 'Market analysis', approach: 'Proprietary geometric pattern measurement' },
  { area: 'Chart intelligence', approach: 'Native chart-integrated analytical technology' },
  { area: 'Transparency', approach: 'Visible pattern counts and geometric-fit measurements' },
  { area: 'Education', approach: 'Free Financial Education Center and Encyclopedia' },
  { area: 'Accessibility', approach: 'Neuro-adaptive interface development' },
  { area: 'Extensibility', approach: 'Dedicated River compiler and runtime architecture' },
];

export const TECH_OPP_IP_ASSETS = [
  'Trading Anarchy methodology',
  'Four Up, Three Down structural rules and definitions',
  'Gold Bar calculation and visualization implementation',
  'Geometric pattern-recognition engine',
  'Pattern-scanning and forming-pattern infrastructure',
  'ClearPath River compiler and runtime',
  'CPT Buddy mentoring and analytical architecture',
  'Neuro-adaptive interface systems',
  'Integrated educational and financial-reference infrastructure',
];

export const TECH_OPP_MARKETS = [
  'Financial charting and analytics',
  'Technical analysis software',
  'Financial education',
  'AI-assisted financial learning',
  'Accessibility-oriented financial technology',
  'Extensible analytical scripting environments',
];

export const TECH_OPP_WHY_INVEST = [
  {
    title: 'Founder-developed intellectual property',
    body: `A substantial software platform built through ${PRODUCT_LEGAL_NAME} founder research, experimentation, programming, and market experience.`,
  },
  {
    title: 'Multiple integrated technology systems',
    body: 'Pattern recognition, chart analysis, scripting infrastructure, educational systems, and adaptive interfaces under one product philosophy.',
  },
  {
    title: 'A differentiated philosophy',
    body: 'Analysis over signals. Education over dependency. Independent thinking over following.',
  },
  {
    title: 'Expansion potential',
    body: 'An extensible platform with room for additional analytical capabilities, educational products, and technology integrations — without changing the non-broker identity.',
  },
  {
    title: 'A defined product identity',
    body: 'ClearPath is not trying to become another brokerage or signal-selling operation. Stated focus: analytical software and financial understanding.',
  },
];

/**
 * Preliminary valuation & SWOT — consultant framing, founder-stated commercial facts.
 * Assessment date: 2026-11-04. Illustrative only — not an appraisal or offer.
 */
export const TECH_OPP_VALUATION = {
  assessmentDate: 'November 4, 2026',
  honestyLead:
    'The value of the technology ClearPath has built is not necessarily the same as the current market value of the company. An investor pays for a combination of intellectual property, functioning software, commercial traction, recurring revenue, defensibility, and growth potential.',
  pitchLead:
    'ClearPath Trader has developed its own analytical methodology, its own geometric pattern-measurement technology, its own native chart-analysis tools, and an extensible software architecture designed to bring those capabilities together. The investment opportunity is to validate, commercialize, distribute, and scale technology that already exists — not to finance an undeveloped idea.',
  financialPosition: {
    title: 'Current commercial position (founder-stated)',
    rows: [
      { label: 'Paying subscribers', value: 'Currently zero paying subscribers' },
      { label: 'Monthly recurring revenue', value: '$0 MRR' },
      {
        label: 'Customer accommodation',
        value:
          'Existing subscribers were upgraded to complimentary Gold membership after a security incident remediation decision',
      },
      {
        label: 'Revenue impact of accommodation',
        value: 'Approximately $8,500 (founder estimate)',
      },
      {
        label: 'Membership tiers (live catalog)',
        value: 'Basic (free), Silver, Gold, Platinum — paid Silver–Platinum roughly $5.98–$14.99 / month',
      },
      {
        label: 'Capital sought',
        value: '$250,000 / $500,000 / $1,000,000+ conversations with VCs and investment bankers',
      },
      { label: 'Business stage', value: 'Early-stage technology company' },
    ],
    note:
      'Former subscribers may still be active under complimentary Gold. They are not necessarily lost users. Zero MRR today does not mean zero technology value — but it does mean a conventional SaaS revenue multiple is not currently available.',
  },
  principalAssets: [
    { asset: 'Trading Anarchy', value: 'Founder-developed analytical methodology' },
    { asset: 'Four Up, Three Down', value: 'Proprietary market-structure methodology' },
    { asset: 'Live Pattern Scanner', value: 'Geometric pattern-recognition technology' },
    { asset: 'Gold Bar', value: 'Native ATR-based analytical technology' },
    { asset: 'ClearPath River', value: 'Compiler, scripting, and runtime architecture' },
    { asset: 'Neuro-adaptive technology', value: 'Differentiated interface and accessibility infrastructure' },
  ],
  supportingAssets: [
    'CPT Buddy',
    'Financial Education Center',
    'Encyclopedia of Finance',
    'Market-data integration architecture',
    'Charting infrastructure',
    'Optional broker connectivity',
    'Membership / subscription infrastructure',
    'Application and backend architecture',
  ],
  commercialInterest: [
    {
      title: 'Proprietary analytical technology',
      body: 'Trading Anarchy, Four Up, Three Down, and the pattern scanner form a combined analytical proposition — more interesting than selling a single indicator.',
    },
    {
      title: 'Technology ownership and control',
      body: 'Dedicated implementations in-repo rather than exclusive dependence on third-party chart plugins — ClearPath can keep developing its own analytical capabilities.',
    },
    {
      title: 'Multiple potential audiences',
      body: 'Independent traders, technical analysts, educators, experienced market participants, neurodivergent users, fintech companies, and potential institutional technology partners — potential markets, not yet proven segments.',
    },
    {
      title: 'Expansion potential',
      body: 'If ClearPath River matures, a scripting/runtime ecosystem could extend analytical tools beyond the original built-ins.',
    },
  ],
  stageScenarios: [
    {
      stage: 'Technology / IP development, no meaningful revenue',
      range: '$250,000–$750,000',
    },
    {
      stage: 'Functional commercial product with early paying customers',
      range: '$750,000–$2 million',
    },
    {
      stage: 'Established subscription business with measurable traction',
      range: '$2–$5 million',
    },
    {
      stage: 'Growing software company with strong recurring revenue',
      range: '$5–$10 million+',
    },
  ],
  stageDisclaimer:
    'Illustrative enterprise-value scenarios only — not appraisals, not observed comparable transactions, and not an offer. Lower stages lean on technology, replacement-cost, and execution-risk considerations. Upper stages require commercial evidence. ClearPath should not presently present the $5–$10M range as established value.',
  revenueModelNote:
    'A 4× ARR illustrative model is a teaching tool only. With $0 MRR it does not produce a revenue-based enterprise value. Published fintech revenue multiples for established B2B finance software must not be applied directly to an early-stage company.',
  negotiationScenarios: [
    { label: 'Conservative', value: '$500,000 pre-money (illustrative)' },
    { label: 'Development-stage working target', value: '$1 million pre-money (illustrative)' },
    { label: 'Strong technical validation', value: '$1.5–$2 million pre-money (illustrative)' },
    { label: 'Validated product + commercial traction', value: '$3 million+ pre-money (illustrative)' },
  ],
  dilutionAt1mPre: [
    { raise: '$250,000', post: '$1.25M', ownership: '20%' },
    { raise: '$500,000', post: '$1.5M', ownership: '33.3%' },
    { raise: '$1,000,000', post: '$2M', ownership: '50%' },
  ],
  dilutionNote:
    'Simple equity examples before options, convertibles, fees, or other dilution. Giving away ~50% at this stage warrants caution — founder-built technology and control matter.',
  scores: [
    { category: 'Product differentiation', assessment: 'Strong potential' },
    { category: 'Proprietary technology', assessment: 'Strong potential' },
    { category: 'Technical breadth', assessment: 'Strong' },
    { category: 'Founder vision', assessment: 'Strong' },
    { category: 'Market opportunity', assessment: 'Significant' },
    { category: 'Intellectual-property documentation', assessment: 'Needs strengthening' },
    { category: 'Independent validation', assessment: 'Needs strengthening' },
    { category: 'Commercial traction', assessment: 'Not yet established (MRR currently $0)' },
    { category: 'Revenue scalability', assessment: 'Not yet established' },
    { category: 'Operational resilience', assessment: 'Founder concentration risk' },
  ],
  overallOpinion:
    'Early-stage proprietary financial technology company with a potentially differentiated analytical software ecosystem. Not yet valued like an established SaaS company — and not merely an unfinished trading website.',
};

export const TECH_OPP_SWOT = {
  strengths: [
    'Founder-developed technology and product connection',
    'Proprietary analytical methodology (Trading Anarchy; Four Up, Three Down)',
    'Native Gold Bar implementation integrated into charting',
    'Dedicated geometric pattern-recognition architecture',
    'Pattern transparency (counts, scanned window, geometric-fit confidence)',
    'Neuro-adaptive design philosophy',
    'Free Financial Education Center and Encyclopedia of Finance',
    'Multi-provider market-data architecture',
    'No broker-referral / introducing-broker kickback business model; membership affiliate residuals removed',
  ],
  weaknesses: [
    'Founder concentration risk (sole primary coder)',
    'Limited independent validation of pattern-recognition accuracy',
    'Intellectual-property documentation needs formalization',
    'Platform complexity across many subsystems',
    'Commercial traction must be re-established after complimentary Gold accommodations',
    'Third-party dependencies (data, cloud, AI, payments)',
    'Regulatory complexity around education, commentary, and optional broker connectivity',
  ],
  opportunities: [
    'Recognize pattern scanner and Gold Bar as named analytical products',
    'Educational / fintech / distribution partnerships',
    'Stronger market position in accessible / neuro-adaptive financial technology',
    'ClearPath River as a scripting and analytical development ecosystem',
    'Grow an educational audience through freely accessible resources',
    'International expansion subject to licensing',
    'Licensing or partnerships around the analytical technology itself',
  ],
  threats: [
    'Established competitors (TradingView, TrendSpider, TC2000, MetaTrader, and others)',
    'Market-data licensing costs as distribution grows',
    'Regulatory interpretation of product behavior and marketing',
    'AI commoditization of shallow chart explanations — defensibility must rest on measurement technology',
    'Copycat methodologies and features',
    'Customer acquisition costs exceeding lifetime value',
  ],
};

export const TECH_OPP_CAPITAL = {
  title: 'Recommended capital strategy (proposed uses — not an approved budget)',
  stages: [
    {
      round: 'Initial',
      capital: '$250,000',
      objective: 'Security validation, product stabilization, IP documentation',
    },
    {
      round: 'Growth',
      capital: '$500,000',
      objective: 'Commercial launch, marketing, customer acquisition',
    },
    {
      round: 'Expansion',
      capital: '$1,000,000+',
      objective: 'Product development, distribution, strategic partnerships',
    },
  ],
  valueIncreasePriorities: [
    { priority: 1, action: 'Document Trading Anarchy', why: 'Establish underlying intellectual property' },
    { priority: 2, action: 'Formalize Four Up, Three Down', why: 'Make the methodology independently understandable' },
    { priority: 3, action: 'Validate pattern-scanner accuracy', why: 'Demonstrate technical credibility' },
    { priority: 4, action: 'Document Gold Bar calculations', why: 'Establish reproducibility' },
    { priority: 5, action: 'Complete ClearPath River documentation', why: 'Demonstrate extensibility' },
    { priority: 6, action: 'Establish IP ownership records', why: 'Reduce investor diligence risk' },
    { priority: 7, action: 'Rebuild recurring-revenue metrics', why: 'Establish commercial value after accommodations' },
    { priority: 8, action: 'Document security and compliance', why: 'Reduce operational and regulatory uncertainty' },
    { priority: 9, action: 'Reduce founder concentration risk', why: 'Improve operational resilience' },
    { priority: 10, action: 'Establish customer retention', why: 'Demonstrate sustainable demand' },
  ],
  openDiligence: [
    'Approximate number of subscribers who received complimentary Gold memberships',
    'Years / hours of founder development investment in ClearPath (beyond ~20 years of Trading Anarchy research)',
    'Confirmation that Clear Path Markets Science Corp. owns all ClearPath Trader software and IP',
    'Whether security-incident remediation has been independently reviewed',
    'Whether the founder seeks capital-only investors or strategic partners with distribution / institutional relationships',
  ],
  securityIncidentNote: {
    title: 'Security incident & customer accommodation',
    body:
      'ClearPath made a business decision to absorb an approximately $8,500 revenue impact by placing affected paying members on complimentary Gold while addressing a serious security concern — rather than continue charging through remediation. That decision is relevant to customer trust and risk management. Serious investors may need a confidential incident record covering discovery timing, systems and information affected, whether customer information was accessed, remediation steps, independent testing status, why memberships were accommodated, and controls introduced afterward. Public materials on this page do not speculate about attack method or claim the incident was fully closed without independent security validation.',
  },
};

export const TECH_OPP_VERIFICATION: Array<{ area: string; needed: string }> = [
  { area: 'Gold Bar', needed: 'Calculation accuracy and all-timeframe behavior' },
  { area: 'Pattern engine', needed: 'Geometric calculations and completion rules' },
  { area: 'Confidence', needed: 'Exact formula and interpretation (fit ≠ profitability)' },
  { area: 'Pattern count', needed: 'Exact meaning of each counted hit on the chart window' },
  { area: 'River', needed: 'Supported languages and runtime completeness' },
  { area: 'CPT Buddy', needed: 'Actual output restrictions across every visible pathway' },
  { area: 'Neuro-adaptive system', needed: 'Implemented modes and behavioral differences' },
  { area: 'Market data', needed: 'Provider mappings and instrument integrity' },
  { area: 'Broker', needed: 'Exact permissions and order-transmission behavior' },
  { area: 'Security', needed: 'Authentication, authorization, encryption, and deployment' },
  { area: 'Tests', needed: 'Which tests pass in the current clean environment' },
];

export const TECH_OPP_SEC_NOTE = {
  title: 'Independent technology review (SEC-experienced financial consultant)',
  body: `A financial consultant with SEC experience examined a fresh repository archive and recommended this dedicated external page so investors can diligence technology — not merely a marketing site description. That review identified the source modules cited on this page and established that these systems are represented in the codebase. It does not, by itself, establish that every component is complete, production-ready, independently validated, or commercially successful. Revenue, AUM, and performance claims are omitted unless independently verified.`,
};

export const TECH_OPP_CLOSING = {
  title: 'Built Differently. Designed for Independent Thinking.',
  body: `We believe the future of financial technology should offer more than another charting interface or recommendation engine. It should help people understand what they are looking at, how analytical conclusions are formed, and where the limitations of those conclusions exist. ${PRODUCT_NAME} is being developed around that vision.`,
  investmentClose:
    'You have already built the technology. The investment opportunity is to validate, commercialize, distribute, and scale it — a more credible story than asking someone to finance an idea.',
  legal: `${PRODUCT_NAME} provides analytical software and educational tools. It does not promise investment results or tell users what financial decisions to make. Not a brokerage. Not investment advice. Illustrative valuations on this page are not appraisals or offers.`,
};
