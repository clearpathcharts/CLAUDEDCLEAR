export const CEO_COMMITMENT_PATH = '/ceo-statement';

export const CEO_COMMITMENT_META = {
  title: "CEO's Certified Statement — Two-Year Voluntary Salary Waiver",
  description:
    "Richard Floyd's certified statement of a two-year voluntary CEO salary waiver and customer-first commitment at ClearPath Trader.",
  canonical: `https://clearpathtrader.com${CEO_COMMITMENT_PATH}`,
} as const;

export const CEO_COMMITMENT_DETAILS = [
  ['Founder and Chief Executive Officer', 'Richard Floyd'],
  ['Location', 'Murrieta, California'],
  ['Digital Signature Date', 'September 13, 2026'],
  ['Commitment Period', 'Two (2) Years Forward'],
] as const;

export const CEO_COMMITMENT_INTRO = [
  'I, Richard Floyd, Founder and Chief Executive Officer of Clear Path Markets Science Corp., operating as ClearPathTrader, hereby formally state my intention to forgo a salary for the next two (2) years, beginning September 13, 2026, subject to applicable corporate approvals and accounting requirements.',
  'This commitment follows four years of developing and coding the ClearPathTrader platform from scratch. The time, effort, and technical work invested in building this platform reflect my commitment to creating an accessible, educational, and technology-driven resource for people seeking to understand the financial markets.',
] as const;

export const CEO_COMMITMENT_SECTIONS = [
  {
    title: 'Voluntary Compensation Commitment',
    paragraphs: [
      "For the next two years, I intend to receive no salary for my services as CEO and founder. This is a voluntary commitment intended to prioritize the company's continued development, operational sustainability, and customer value during this period.",
    ],
  },
  {
    title: 'Passing Value on to Our Customers',
    paragraphs: [
      'My intention is to use the financial flexibility created by foregoing my salary to support the development of ClearPathTrader, improve its educational resources, and help keep our services as affordable as reasonably possible.',
      'Our customers should benefit from a platform designed around practical value rather than unnecessary overhead. Any allocation of savings toward lower prices or additional customer benefits will be determined and documented through appropriate company financial and operational records.',
    ],
  },
  {
    title: 'Our Founding Philosophy',
    paragraphs: [
      'I believe that once someone understands how to trade, access to the tools that support their continued learning should not become an unnecessary financial burden.',
      'Financial education should help people become more informed, independent, and capable of making their own decisions. ClearPathTrader was developed to help make market analysis, charting technology, and financial education more accessible to everyday traders.',
      'I believe the value of a trading platform should be demonstrated through the quality of its tools, the usefulness of its educational resources, and the value it provides to its customers.',
    ],
  },
  {
    title: 'Four Years of Development. Two Years of Customer-First Leadership.',
    paragraphs: [
      'ClearPathTrader represents four years of coding, development, and work toward building a platform from the ground up.',
      'My decision to forgo a salary for the following two years reflects my intention to continue putting the platform and its customers first as the business moves forward.',
      'This is a statement of leadership, personal commitment, and the principles I intend to uphold as founder and CEO.',
    ],
  },
  {
    title: 'Certification',
    paragraphs: [
      'I certify that this statement accurately reflects my stated intentions regarding voluntary CEO compensation and my commitment to prioritizing customer value at ClearPathTrader.',
      'This statement documents my commitment and founding philosophy. It does not, by itself, constitute a corporate resolution, an independently notarized certificate, or a guarantee of specific customer savings.',
    ],
  },
] as const;

export const CEO_COMMITMENT_SIGNATURE = {
  notation: '/s/ Richard Floyd',
  name: 'Richard Floyd',
  title: 'Founder & Chief Executive Officer',
  company: 'Clear Path Markets Science Corp.',
  product: 'ClearPathTrader',
  location: 'Murrieta, California',
  date: 'September 13, 2026',
  disclaimer:
    'Digitally signed statement. The signature notation above identifies the intended signer; it does not independently verify identity or establish a cryptographic digital signature.',
} as const;
