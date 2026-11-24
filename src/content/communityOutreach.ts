/**
 * Clear Path Community Outreach — public institutional content.
 * Honest status defaults: Proposed / In Development. No fabricated partnerships.
 */

export const COMMUNITY_OUTREACH_PATH = '/community-outreach';
export const COMMUNITY_OUTREACH_URL = `https://clearpathtrader.com${COMMUNITY_OUTREACH_PATH}`;

export const COMMUNITY_OUTREACH_META = {
  title: 'Clear Path Community Outreach',
  description:
    'Clear Path Community Outreach — a proposed community education initiative for financial literacy, digital inclusion, consumer protection, and accessible learning resources. Public verification portal for libraries, schools, and government agencies. Not a brokerage. Does not issue SNAP/CalFresh benefits.',
  keywords:
    'Clear Path Community Outreach, financial literacy, digital inclusion, public libraries, school financial education, SNAP CalFresh community service information, consumer protection education, Clear Path Markets Science',
  canonical: COMMUNITY_OUTREACH_URL,
} as const;

export const COMMUNITY_OUTREACH_INTRO = {
  heading: 'CLEAR PATH COMMUNITY OUTREACH',
  subheading: 'Education. Digital Inclusion. Financial Literacy. Community Resources.',
  lead:
    'Clear Path Community Outreach is a proposed community education initiative associated with Clear Path Markets Science Corp. Its mission is to expand access to financial literacy, digital education, technology safety, consumer protection, and accessible educational resources.',
  publicAccess:
    'This portal is publicly accessible without registration or ClearPathTrader membership. City officials, school administrators, librarians, county and state agencies, charitable organizations, and members of the public may review the initiative independently.',
  honestyBanner:
    'This initiative is proposed. Institutional listings below are potential points of contact — not confirmed partners, endorsements, or government authorizations.',
} as const;

export type InstitutionStatus =
  | 'Proposed'
  | 'Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Active'
  | 'Suspended'
  | 'Expired';

export const INSTITUTION_STATUSES: InstitutionStatus[] = [
  'Proposed',
  'Submitted',
  'Under Review',
  'Approved',
  'Active',
  'Suspended',
  'Expired',
];

export type PublicationStatus = 'In Development' | 'Draft' | 'Approved for Public Distribution' | 'Published';

export const COMMUNITY_OUTREACH_NAV = [
  { id: 'programs', label: 'Program divisions' },
  { id: 'resources', label: 'Resource library' },
  { id: 'food-shelf', label: 'Future food shelf initiative' },
  { id: 'partnerships', label: 'Institutional partnerships' },
  { id: 'directory', label: 'Local institution directory' },
  { id: 'california-counties', label: 'California by county' },
  { id: 'snap-calfresh', label: 'SNAP / CalFresh information' },
  { id: 'documents', label: 'Document center' },
  { id: 'transparency', label: 'Transparency & status' },
  { id: 'governance', label: 'Governance & safeguards' },
  { id: 'inquiry', label: 'Institutional inquiry' },
] as const;

/**
 * Labor-market context for the future food-shelf initiative.
 * Source: California EDD Quick Statistics — September 2026 (seasonally adjusted).
 * November 2026 monthly figures were not yet the published reference when this page shipped.
 */
export const CALIFORNIA_UNEMPLOYMENT_CONTEXT = {
  label: 'California civilian unemployment (seasonally adjusted)',
  period: 'September 2026',
  unemployed: '987,600',
  unemploymentRate: '5.1%',
  sourceName: 'California Employment Development Department (EDD) Quick Statistics',
  sourceUrl: 'https://edd.ca.gov/en/about_edd/quick_statistics/',
  blsCrossCheck:
    'BLS Local Area Unemployment Statistics reported approximately 987,617 unemployed Californians for September 2026.',
  blsUrl: 'https://www.bls.gov/news.release/laus.t01.htm',
  note:
    'Clear Path Community Outreach does not claim that unemployed residents automatically need food assistance, and it does not use unemployment figures to market trading products. The figure is published public context for why accessible education and community food coordination matter.',
} as const;

export const FOOD_SHELF_FUTURE_INITIATIVE = {
  statusBanner: 'FUTURE INITIATIVE — NOT YET OPERATIONAL',
  title: 'Community Food Shelf / Food Bank Coordination',
  lead:
    'Clear Path Community Outreach proposes a future community food shelf where neighbors can drop off shelf-stable food donations or pick up food when they need help — developed only with documented local partners, not as a ClearPathTrader membership benefit.',
  opportunityFraming:
    'California’s published labor-market data shows hundreds of thousands of residents out of work. Even if only a small share ever engages with Clear Path’s educational mission, every person deserves a clear path to information, dignity, and practical community resources — including food assistance referrals while a Clear Path shelf is still in planning.',
  goals: [
    'Create a supervised drop-off point for donated shelf-stable foods once a host site and permits are confirmed.',
    'Create a respectful pick-up process for households that need groceries, without collecting EBT numbers, case files, or trading-account data.',
    'Coordinate with Riverside County community leaders, libraries, faith communities, and established food banks so efforts add capacity instead of duplicating or competing with them.',
    'Publish transparent operating status on this page — Proposed until written host approvals exist.',
  ],
  proposedOperatingModel: [
    {
      title: 'Donation drop-off (proposed)',
      body: 'Community members could donate unopened, non-expired shelf-stable items at a posted host location during published hours. Perishable handling would require a licensed/partnered food-bank workflow — not informal storage.',
    },
    {
      title: 'Food pick-up (proposed)',
      body: 'Residents could receive groceries through a low-barrier pick-up window or partner pantry distribution, subject to host-site rules and food-safety requirements.',
    },
    {
      title: 'Referral desk (proposed)',
      body: 'Until a Clear Path shelf opens, this page points people to existing Riverside County food banks, 2-1-1, CalFresh, and WIC so help is available now.',
    },
    {
      title: 'Volunteer & leader coordination (proposed)',
      body: 'City staff, librarians, school liaisons, nonprofit directors, and neighborhood leaders could request informational meetings through the institutional inquiry form. No partnership is claimed until documented.',
    },
  ],
  riversideLeadershipPathways: [
    {
      title: 'County human services alignment',
      body: 'Informational coordination with Riverside County DPSS so food-shelf planning stays consistent with CalFresh and county food-assistance messaging — Clear Path would not determine benefit eligibility.',
    },
    {
      title: 'Established food-bank partnership talks',
      body: 'Proposed conversations with Feeding America Riverside | San Bernardino, FIND Food Bank (Coachella Valley), and Southern Riverside pantry networks about donation drives, volunteer standards, and non-duplication.',
    },
    {
      title: 'City and library host-site exploration',
      body: 'Proposed outreach to Murrieta, Temecula, Menifee, Lake Elsinore, Perris, and Riverside city departments / public libraries about meeting-room or lobby host rules, liability, and hours.',
    },
    {
      title: 'Faith and civic partners',
      body: 'Proposed invitations to congregations, service clubs, and neighborhood associations already feeding neighbors — Clear Path would amplify, not replace, their work.',
    },
  ],
  helpAvailableNow: [
    {
      label: 'Call 2-1-1 for local food assistance',
      href: 'https://www.cafoodbanks.org/find-food/',
      detail: 'Statewide find-food guidance including 2-1-1.',
    },
    {
      label: 'Feeding America Riverside | San Bernardino — find a pantry',
      href: 'https://www.feedingamericaie.org/find-a-pantry',
      detail: 'Western Riverside / Inland Empire pantry map.',
    },
    {
      label: 'FIND Food Bank — Coachella Valley map',
      href: 'https://findfoodbank.org/map',
      detail: 'Eastern Riverside County food distributions.',
    },
    {
      label: 'Western Eagle Foundation programs (Southern Riverside)',
      href: 'https://westerneaglefoundation.org/programs',
      detail: 'Southern Riverside County food programs.',
    },
    {
      label: 'Riverside County DPSS — CalFresh food assistance',
      href: 'https://rivcodpss.org/calfresh-food-assistance',
      detail: 'Apply via BenefitsCal or 1-877-410-8827.',
    },
    {
      label: 'BenefitsCal — apply for CalFresh online',
      href: 'https://www.benefitscal.com/',
      detail: 'Official statewide benefits application portal.',
    },
    {
      label: 'Riverside University Health System — WIC',
      href: 'https://www.ruhealth.org/wic',
      detail: 'Nutrition support for qualifying pregnant people and young children.',
    },
  ],
  disclaimers: [
    'The Clear Path food shelf is a FUTURE INITIATIVE. It is not open for drop-off or pick-up at this time.',
    'Listing Riverside County agencies or food banks does not mean they have approved, endorsed, or partnered with Clear Path.',
    'Clear Path Community Outreach does not issue EBT benefits, store food under a licensed food-bank charter yet, or guarantee pantry inventory.',
    'People who need food today should use 2-1-1, established food banks, CalFresh, and WIC — not wait for this future shelf.',
    'This initiative is separate from ClearPathTrader charts, desks, memberships, and market analysis.',
  ],
} as const;

export const PROGRAM_DIVISIONS = [
  {
    id: 'libraries',
    number: '01',
    title: 'Public Libraries & Community Learning',
    summary:
      'Library-friendly workshops and print materials that help residents build practical money and technology skills in trusted community spaces.',
    items: [
      'Financial literacy workshops',
      'Digital literacy workshops',
      'Senior technology education',
      'Public educational pamphlets',
      'Community resource guides',
    ],
  },
  {
    id: 'schools',
    number: '02',
    title: 'School-Age Financial and Digital Literacy',
    summary:
      'Age-appropriate classroom and family materials that introduce money concepts, digital safety, and consumer awareness without commercial pressure.',
    items: [
      'Elementary financial education',
      'Student workbooks',
      'Teacher curriculum guides',
      'Parent educational materials',
      'Digital safety education',
      'Age-appropriate financial concepts',
    ],
  },
  {
    id: 'adult',
    number: '03',
    title: 'Adult Financial Literacy',
    summary:
      'Practical adult education covering everyday financial decisions: budgeting, banking relationships, credit awareness, and interest.',
    items: [
      'Budgeting',
      'Banking',
      'Credit awareness',
      'Understanding interest',
      'Consumer financial education',
    ],
  },
  {
    id: 'digital-inclusion',
    number: '04',
    title: 'Digital Inclusion & Accessibility',
    summary:
      'Materials designed for diverse learning needs, including neurodivergent-friendly formats, basic computer skills, and assistive technology awareness.',
    items: [
      'Neurodivergent-friendly educational materials',
      'Accessible technology',
      'Basic computer education',
      'Internet safety',
      'Assistive technology awareness',
    ],
  },
  {
    id: 'consumer-protection',
    number: '05',
    title: 'Consumer Protection & Community Resources',
    summary:
      'Public education on common financial scams, identity theft risks, cryptocurrency fraud patterns, and how to find local assistance directories.',
    items: [
      'Financial scam awareness',
      'Identity theft prevention',
      'Cryptocurrency scam awareness',
      'Community assistance directories',
      'Employment and educational resources',
    ],
  },
] as const;

export type EducationalResource = {
  id: string;
  code: string;
  title: string;
  description: string;
  audience: string;
  objectives: string[];
  publicationStatus: PublicationStatus;
  revisionDate: string;
  /** Only set when an authorized public document exists. */
  downloadUrl: string | null;
};

export const EDUCATIONAL_RESOURCES: EducationalResource[] = [
  {
    id: 'understanding-money',
    code: '01',
    title: 'Understanding Money',
    description:
      'Foundational overview of how paychecks, prices, savings, and the U.S. dollar relate to everyday household decisions.',
    audience: 'Adults, library patrons, community learners',
    objectives: [
      'Explain what a paycheck represents after deductions',
      'Describe how prices and purchasing power change over time',
      'Identify basic roles of banks and payment systems',
    ],
    publicationStatus: 'In Development',
    revisionDate: '2026-11-16',
    downloadUrl: null,
  },
  {
    id: 'money-smart-kids',
    code: '02',
    title: 'Money-Smart Kids',
    description:
      'Age-appropriate lessons and workbook activities that introduce earning, saving, sharing, and safe spending habits.',
    audience: 'Elementary students, teachers, parents/guardians',
    objectives: [
      'Distinguish needs from wants in age-appropriate language',
      'Practice simple saving and budgeting exercises',
      'Recognize trusted adults for money questions',
    ],
    publicationStatus: 'In Development',
    revisionDate: '2026-11-16',
    downloadUrl: null,
  },
  {
    id: 'digital-safety',
    code: '03',
    title: 'Digital Safety',
    description:
      'Practical guidance for safer internet use, account hygiene, phishing recognition, and device basics.',
    audience: 'Students, seniors, general public',
    objectives: [
      'Identify common phishing and social-engineering patterns',
      'Apply password and account-protection basics',
      'Know when to stop and verify before sharing personal data',
    ],
    publicationStatus: 'In Development',
    revisionDate: '2026-11-16',
    downloadUrl: null,
  },
  {
    id: 'recognizing-financial-scams',
    code: '04',
    title: 'Recognizing Financial Scams',
    description:
      'Consumer-protection education covering romance scams, fake investment pitches, crypto fraud patterns, and government-impersonation schemes.',
    audience: 'Adults, seniors, community organizations',
    objectives: [
      'Spot high-pressure financial solicitation tactics',
      'List official channels for verifying government contact',
      'Know where to report suspected fraud',
    ],
    publicationStatus: 'In Development',
    revisionDate: '2026-11-16',
    downloadUrl: null,
  },
  {
    id: 'everyday-technology',
    code: '05',
    title: 'Everyday Technology',
    description:
      'Introductory computer and smartphone skills for people building digital confidence for school, work, and public services.',
    audience: 'Beginners, seniors, adult learners',
    objectives: [
      'Perform basic device navigation and file tasks',
      'Use email and web browsers safely for essential services',
      'Locate help resources when technology feels overwhelming',
    ],
    publicationStatus: 'In Development',
    revisionDate: '2026-11-16',
    downloadUrl: null,
  },
  {
    id: 'technology-for-every-mind',
    code: '06',
    title: 'Technology for Every Mind',
    description:
      'Neurodivergent-friendly and accessibility-focused guidance on learning technology at a sustainable pace with reduced cognitive overload.',
    audience: 'Neurodivergent learners, educators, accessibility advocates',
    objectives: [
      'Identify interface and pacing choices that reduce overwhelm',
      'Use assistive features already built into common devices',
      'Advocate for accessible learning formats',
    ],
    publicationStatus: 'In Development',
    revisionDate: '2026-11-16',
    downloadUrl: null,
  },
  {
    id: 'building-your-future',
    code: '07',
    title: 'Building Your Future',
    description:
      'Forward-looking adult education connecting education pathways, employment resources, and long-term financial habits.',
    audience: 'Adults, job seekers, community program participants',
    objectives: [
      'Map short-term skill goals to education or employment steps',
      'Understand credit and interest at a practical consumer level',
      'Locate reputable community and workforce resources',
    ],
    publicationStatus: 'In Development',
    revisionDate: '2026-11-16',
    downloadUrl: null,
  },
  {
    id: 'community-resource-guide',
    code: '08',
    title: 'Community Resource Guide',
    description:
      'Directory-style educational guide explaining how to find local libraries, schools, county services, and official assistance programs.',
    audience: 'General public, caseworkers, librarians, community partners',
    objectives: [
      'Locate official agency websites for local services',
      'Distinguish educational materials from benefit determinations',
      'Use public directories without sharing sensitive case data online',
    ],
    publicationStatus: 'In Development',
    revisionDate: '2026-11-16',
    downloadUrl: null,
  },
];

export type PartnershipAudience = {
  id: string;
  title: string;
  explanation: string;
};

export const PARTNERSHIP_AUDIENCES: PartnershipAudience[] = [
  {
    id: 'public-libraries',
    title: 'Public libraries',
    explanation:
      'Proposed workshops, pamphlet distribution, senior technology sessions, and community resource programming hosted in library meeting spaces under library policies.',
  },
  {
    id: 'elementary-secondary',
    title: 'Elementary and secondary schools',
    explanation:
      'Proposed classroom-ready financial and digital literacy materials, teacher guides, and parent packets subject to school and district curriculum review.',
  },
  {
    id: 'school-districts',
    title: 'School districts',
    explanation:
      'Proposed district-level review of curriculum packets, volunteer safeguarding alignment, and optional pilot classroom or after-school modules.',
  },
  {
    id: 'municipal',
    title: 'Municipal governments',
    explanation:
      'Proposed community education briefings, digital inclusion support, and consumer-protection awareness events coordinated with city departments.',
  },
  {
    id: 'county',
    title: 'County government',
    explanation:
      'Proposed informational coordination with county education offices and human-services departments on publicly available educational materials — not benefit administration.',
  },
  {
    id: 'california-agencies',
    title: 'California state agencies',
    explanation:
      'Proposed informational outreach so agencies can independently evaluate educational materials related to financial literacy, digital safety, and consumer protection.',
  },
  {
    id: 'kansas-agencies',
    title: 'Kansas state agencies',
    explanation:
      'Proposed informational outreach for Kansas agencies evaluating community education resources and digital inclusion materials.',
  },
];

export type DirectoryInstitution = {
  id: string;
  name: string;
  category: string;
  proposedRelationship: string;
  website: string;
  websiteLabel: string;
  /** Seed status — always Proposed until an authorized admin updates the durable store. */
  status: InstitutionStatus;
  lastVerifiedDate: string;
  note: string;
};

export const DIRECTORY_BANNER =
  'PROPOSED CONTACT — APPROVAL NOT YET CONFIRMED.' as const;

export const DIRECTORY_INSTITUTIONS: DirectoryInstitution[] = [
  {
    id: 'murrieta-public-library',
    name: 'Murrieta Public Library',
    category: 'Public library',
    proposedRelationship: 'Proposed library workshop and pamphlet partnership',
    website: 'https://www.murrietaca.gov/309/Policies',
    websiteLabel: 'Murrieta Public Library policies',
    status: 'Proposed',
    lastVerifiedDate: '2026-11-16',
    note: DIRECTORY_BANNER,
  },
  {
    id: 'murrieta-valley-usd',
    name: 'Murrieta Valley Unified School District',
    category: 'School district',
    proposedRelationship: 'Proposed school and district curriculum review pathway',
    website: 'https://www.murrieta.k12.ca.us/families/volunteers',
    websiteLabel: 'MVUSD families / volunteers',
    status: 'Proposed',
    lastVerifiedDate: '2026-11-16',
    note: DIRECTORY_BANNER,
  },
  {
    id: 'city-of-murrieta',
    name: 'City of Murrieta',
    category: 'Municipal government',
    proposedRelationship: 'Proposed municipal community-education coordination',
    website: 'https://www.murrietaca.gov/',
    websiteLabel: 'City of Murrieta',
    status: 'Proposed',
    lastVerifiedDate: '2026-11-16',
    note: DIRECTORY_BANNER,
  },
  {
    id: 'riverside-county-ode',
    name: 'Riverside County Office of Education',
    category: 'County education office',
    proposedRelationship: 'Proposed county education informational outreach',
    website: 'https://www.rcoe.us/',
    websiteLabel: 'Riverside County Office of Education',
    status: 'Proposed',
    lastVerifiedDate: '2026-11-16',
    note: DIRECTORY_BANNER,
  },
  {
    id: 'riverside-county-dpss',
    name: 'Riverside County DPSS',
    category: 'County human services',
    proposedRelationship: 'Proposed informational listing for public benefit education links',
    website: 'https://rivcodpss.org/calfresh-food-assistance',
    websiteLabel: 'Riverside County DPSS CalFresh',
    status: 'Proposed',
    lastVerifiedDate: '2026-11-16',
    note: DIRECTORY_BANNER,
  },
  {
    id: 'cdss',
    name: 'California Department of Social Services',
    category: 'California state agency',
    proposedRelationship: 'Proposed informational reference for CalFresh ABAWD guidance',
    website: 'https://www.cdss.ca.gov/inforesources/calfresh/abawd',
    websiteLabel: 'CDSS CalFresh ABAWD',
    status: 'Proposed',
    lastVerifiedDate: '2026-11-16',
    note: DIRECTORY_BANNER,
  },
  {
    id: 'kansas-dcf',
    name: 'Kansas Department for Children and Families',
    category: 'Kansas state agency',
    proposedRelationship: 'Proposed informational outreach for Kansas community education evaluation',
    website: 'https://www.dcf.ks.gov/',
    websiteLabel: 'Kansas DCF',
    status: 'Proposed',
    lastVerifiedDate: '2026-11-16',
    note: DIRECTORY_BANNER,
  },
];

export const TRANSPARENCY_STATEMENT =
  'The listing of any government agency, school district, library, or public institution does not constitute an endorsement, partnership, or approval. Institutional relationships will be identified accurately according to documented authorization.' as const;

export const SNAP_CALFRESH = {
  title: 'SNAP / CalFresh Community Service Information',
  bullets: [
    'Some SNAP/CalFresh recipients are subject to work and community-engagement requirements.',
    'Certain qualifying volunteer activities may count toward those requirements.',
    'California currently describes a 20-hour weekly or 80-hour monthly average requirement for certain affected participants.',
    'Individual exemptions and eligibility differ by person and circumstance.',
    'Government agencies determine whether particular activities and hours qualify.',
    'Clear Path does not issue EBT benefits or determine benefit eligibility.',
  ],
  disclaimer:
    'Clear Path Community Outreach does not guarantee that participation in any activity will satisfy SNAP or CalFresh work requirements. Individuals must confirm qualifying activities and documentation with their responsible government agency.',
  commercialBan:
    'Clear Path Community Outreach does not advertise unpaid commercial work for Clear Path Markets Science Corp. as a benefit-qualifying activity.',
  officialLinks: [
    {
      label: 'CDSS CalFresh ABAWD information',
      href: 'https://www.cdss.ca.gov/inforesources/calfresh/abawd',
    },
    {
      label: 'Riverside County DPSS CalFresh food assistance',
      href: 'https://rivcodpss.org/calfresh-food-assistance',
    },
    {
      label: 'USDA SNAP work requirements overview',
      href: 'https://www.fns.usda.gov/snap/work-requirements',
    },
  ],
} as const;

export type DocumentCenterItem = {
  id: string;
  category: string;
  title: string;
  version: string;
  publicationDate: string;
  approvalStatus: PublicationStatus;
  downloadUrl: string | null;
};

export const DOCUMENT_CENTER: DocumentCenterItem[] = [
  {
    id: 'corp-org-info',
    category: 'Corporate and organizational information',
    title: 'Clear Path Markets Science Corp. — Organizational Overview (Community Outreach)',
    version: '0.1-draft',
    publicationDate: '—',
    approvalStatus: 'In Development',
    downloadUrl: null,
  },
  {
    id: 'program-overview',
    category: 'Community outreach program overview',
    title: 'Clear Path Community Outreach — Program Overview',
    version: '0.1-draft',
    publicationDate: '—',
    approvalStatus: 'In Development',
    downloadUrl: null,
  },
  {
    id: 'curriculum',
    category: 'Educational curriculum',
    title: 'Community Outreach Educational Curriculum Outline',
    version: '0.1-draft',
    publicationDate: '—',
    approvalStatus: 'In Development',
    downloadUrl: null,
  },
  {
    id: 'student-parent',
    category: 'Student and parent resources',
    title: 'Student & Parent Resource Packet',
    version: '0.1-draft',
    publicationDate: '—',
    approvalStatus: 'In Development',
    downloadUrl: null,
  },
  {
    id: 'volunteer-safeguarding',
    category: 'Volunteer safeguarding policies',
    title: 'Volunteer Safeguarding Policy (Proposed)',
    version: '0.1-draft',
    publicationDate: '—',
    approvalStatus: 'In Development',
    downloadUrl: null,
  },
  {
    id: 'privacy-accessibility',
    category: 'Privacy and accessibility policies',
    title: 'Privacy & Accessibility Commitments (Proposed)',
    version: '0.1-draft',
    publicationDate: '—',
    approvalStatus: 'In Development',
    downloadUrl: null,
  },
  {
    id: 'partnership-proposals',
    category: 'Institutional partnership proposals',
    title: 'Institutional Partnership Proposal Template',
    version: '0.1-draft',
    publicationDate: '—',
    approvalStatus: 'In Development',
    downloadUrl: null,
  },
  {
    id: 'evaluation-reports',
    category: 'Program evaluation reports',
    title: 'Program Evaluation Report Template',
    version: '0.1-draft',
    publicationDate: '—',
    approvalStatus: 'In Development',
    downloadUrl: null,
  },
];

export const GOVERNANCE_SECTIONS = [
  {
    id: 'educational-purpose',
    title: 'Educational purpose',
    body: 'Clear Path Community Outreach is intended as a noncommercial educational initiative. Materials are designed to teach practical financial literacy, digital skills, consumer protection, and accessibility concepts.',
  },
  {
    id: 'noncommercial',
    title: 'Noncommercial educational activities',
    body: 'Proposed community workshops and materials are educational. They are not investment solicitations, brokerage marketing, or cryptocurrency promotions. Trading-platform membership is not required to review this portal.',
  },
  {
    id: 'conflict-of-interest',
    title: 'Conflict-of-interest safeguards',
    body: 'Proposed safeguard: outreach activities must not condition access to educational materials on purchasing ClearPathTrader memberships or related commercial products. Formal conflict policies remain under development until adopted.',
  },
  {
    id: 'child-protection',
    title: 'Child protection',
    body: 'Any school-age programming would operate only under host-institution rules, with adult supervision standards defined by the school or library. Clear Path does not claim adopted child-protection certification until policies are formally approved.',
  },
  {
    id: 'volunteer-screening',
    title: 'Volunteer screening',
    body: 'Proposed volunteer roles would follow host-organization screening requirements (for example district or library volunteer processes). Clear Path will not place unsupervised volunteers in schools without documented host approval.',
  },
  {
    id: 'school-confidentiality',
    title: 'School confidentiality',
    body: 'Clear Path Community Outreach does not collect student education records through the public inquiry form. School partnerships, if approved later, must respect FERPA and local student-privacy rules.',
  },
  {
    id: 'data-protection',
    title: 'Data protection',
    body: 'The institutional inquiry form collects only name, organization, business email, inquiry category, and message. It does not collect EBT numbers, Social Security numbers, student records, financial accounts, benefit case numbers, or medical information.',
  },
  {
    id: 'accessibility',
    title: 'Accessibility accommodations',
    body: 'Materials are intended to support accessible learning formats, including neurodivergent-friendly pacing and assistive-technology awareness. Specific accommodation procedures will be published when formally adopted.',
  },
  {
    id: 'incident-reporting',
    title: 'Incident reporting',
    body: 'Proposed process: safety or safeguarding concerns related to outreach activities should be reported to the host institution and to Clear Path Markets Science Corp. through the institutional inquiry channel. Formal incident-response procedures remain under development.',
  },
  {
    id: 'accountability',
    title: 'Program accountability',
    body: 'Institutional status changes require authorized administrator action with documented evidence. Statuses do not auto-promote to Approved. Public pages must not claim endorsements that have not been documented.',
  },
] as const;

export const GOVERNANCE_POLICY_NOTE =
  'Policy sections on this page describe proposed safeguards and educational intent. They are not represented as formally adopted corporate or government policies unless separately published with an approval status of “Approved for Public Distribution” or “Published.”' as const;

export const INQUIRY_CATEGORIES = [
  'Municipal partnership',
  'Public library partnership',
  'School district partnership',
  'Educational curriculum',
  'Community outreach',
  'Food shelf / food bank coordination',
  'Government agency inquiry',
  'General information',
] as const;

export type InquiryCategory = (typeof INQUIRY_CATEGORIES)[number];

export const INQUIRY_PRIVACY_NOTE =
  'Do not submit EBT card information, Social Security numbers, student records, financial account details, government benefit case numbers, or sensitive medical information. This form is for institutional and general program inquiries only.' as const;
