/**
 * Academic research discovery links for Appealing Additions.
 * Sourced from EBSCO Academic Libraries / free databases messaging:
 * https://about.ebsco.com/academic-libraries
 * https://about.ebsco.com/products/research-databases/free-databases
 *
 * ClearPath does not subscribe to paid EBSCOhost packages (e.g. Business Source).
 * We only surface free / open-access literacy entry points. Not financial advice.
 */

export type AppealingAcademicResource = {
  title: string;
  blurb: string;
  category: string;
  href: string;
};

export const EBSCO_ACADEMIC_LIBRARIES =
  'https://about.ebsco.com/academic-libraries';

export const EBSCO_FREE_DATABASES =
  'https://about.ebsco.com/products/research-databases/free-databases';

export const EBSCO_OPEN_ACCESS =
  'https://about.ebsco.com/open-for-research/open-access';

export const APPEALING_ACADEMIC_RESEARCH: AppealingAcademicResource[] = [
  {
    title: 'EBSCO free research databases',
    blurb: 'Hub of complimentary scholarly databases for students and researchers — start here.',
    category: 'Free databases',
    href: EBSCO_FREE_DATABASES,
  },
  {
    title: 'Open Dissertations',
    blurb: 'Search millions of electronic theses and dissertations with free full-text links where available.',
    category: 'Open research',
    href: 'https://opendissertations.org/',
  },
  {
    title: 'GreenFILE',
    blurb: 'Free database on environment, climate, renewable energy, and sustainability research.',
    category: 'Environment',
    href: 'https://www.greeninfoonline.com/',
  },
  {
    title: 'EBSCO Open Access',
    blurb: 'How EBSCO indexes trustworthy OA journals, Unpaywall links, and open educational resources.',
    category: 'Open access',
    href: EBSCO_OPEN_ACCESS,
  },
  {
    title: 'Directory of Open Access Journals (DOAJ)',
    blurb: 'Peer-reviewed open journals across disciplines — literacy research without a paywall.',
    category: 'Open access',
    href: 'https://doaj.org/',
  },
  {
    title: 'Academic libraries overview',
    blurb: 'EBSCO’s academic library stack (discovery, archives, skill-building) — institutional context.',
    category: 'Overview',
    href: EBSCO_ACADEMIC_LIBRARIES,
  },
];
