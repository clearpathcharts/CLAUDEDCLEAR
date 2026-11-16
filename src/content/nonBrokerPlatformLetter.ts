/**
 * Founder policy letter for seed data room + public diligence mirror.
 * Source of truth for the permanent non-broker / no-IB posture.
 * Markdown twin: docs/data-room/NON_BROKER_PLATFORM_LETTER.md
 */

export const NON_BROKER_LETTER = {
  id: 'non-broker-policy',
  anchor: 'non-broker-policy',
  title: 'Permanent non-broker platform letter',
  eyebrow: 'Regulatory posture',
  dataRoomFolder: 'Legal (also Product)',
  dateLabel: 'November 15, 2026',
  from: 'Richard Floyd, Founder and Chief Executive Officer',
  company: 'Clear Path Markets Science Corp.',
  product: 'ClearPath Trader',
  subject: 'Permanent non-broker, non–introducing-broker platform posture',
  purpose:
    'This letter states, for investor diligence and for the company’s data room, the permanent regulatory and commercial identity of Clear Path Markets Science Corp. and ClearPath Trader. We are a data, analytics, education, and API-key platform. We are not a brokerage, and we will not become one.',
  whatWeAre: [
    'Displays market data and charts sourced through vendor APIs and keys held server-side',
    'Provides analytical tools, education, encyclopedias, and research desks',
    'Charges for software memberships (for example via Stripe), not for custody, execution, or investment advice',
  ],
  whatWeAreNot: [
    'A broker-dealer (including under FINRA / SEC broker-dealer registration)',
    'A futures commission merchant',
    'A registered investment adviser',
    'A securities exchange or ATS operated by ClearPath',
    'A bank, money services business, or custodian of customer funds or securities',
    'A signal service whose product identity is buy / sell / hold directives',
    'An introducing broker (IB), finder for brokerages, or recipient of broker referral / IB kickbacks',
  ],
  finraNote:
    'Because ClearPath is not a broker-dealer and does not hold customer securities accounts, ClearPath is not a FINRA member firm and does not maintain a FINRA broker-dealer compliance pack. Optional pass-through connectivity does not change that identity.',
  passThrough: {
    title: 'Optional pass-through broker connect',
    body: 'Users may optionally OAuth-link an account they already hold at a licensed third-party broker (for example Alpaca). The licensed broker performs KYC/AML, holds funds, and executes orders. ClearPath may transmit instructions the user explicitly submits. Without a connected broker, ClearPath remains analytics and education only.',
    notList: [
      'ClearPath acting as the broker',
      'ClearPath introducing the user to a broker for compensation',
      'ClearPath operating IB links, affiliate broker signup funnels, or residual payouts for opening brokerage accounts',
      'ClearPath custodying money or guaranteeing fills',
    ],
  },
  permanence: [
    'We sell and operate a platform of data, analytics, education, and API integrations',
    'We do not sell brokerage, custody, or personalized investment advice',
    'We do not seek FINRA broker-dealer membership as a product roadmap item',
    'We do not plan IB, introducing-broker, or broker-kickback revenue',
  ],
  closing:
    'I am stating this policy as Founder and CEO of Clear Path Markets Science Corp. for use in our seed-stage data room and ongoing investor diligence.',
  signatory: 'Richard Floyd',
  signatoryTitle: 'Founder and Chief Executive Officer',
  contact: 'forexanarchy@gmail.com',
  disclaimer:
    'This letter is a company policy statement for diligence. It is not legal advice to investors, not a securities offering, and not a regulatory filing.',
  markdownPath: 'docs/data-room/NON_BROKER_PLATFORM_LETTER.md',
} as const;
