/**
 * Curated self-hosted tools for Appealing Additions.
 * Sourced from:
 * https://github.com/awesome-selfhosted/awesome-selfhosted
 *
 * ClearPath links out for discovery — we do not host, endorse, or operate these
 * services. Educational / personal tooling only (not financial advice).
 */

export type AppealingSelfhostedTool = {
  title: string;
  blurb: string;
  category: string;
  href: string;
  sourceHref: string;
};

export const AWESOME_SELFHOSTED_REPO =
  'https://github.com/awesome-selfhosted/awesome-selfhosted';

export const AWESOME_SELFHOSTED_MONEY_SECTION =
  'https://github.com/awesome-selfhosted/awesome-selfhosted#money-budgeting--management';

export const APPEALING_SELFHOSTED: AppealingSelfhostedTool[] = [
  {
    title: 'FreshRSS',
    blurb: 'Self-hostable RSS aggregator for your study / news diet (pairs with ClearPath native feeds).',
    category: 'Feed readers',
    href: 'https://freshrss.org/',
    sourceHref: 'https://github.com/FreshRSS/FreshRSS',
  },
  {
    title: 'Miniflux',
    blurb: 'Minimalist news reader — clean reading queue for literacy articles and podcasts.',
    category: 'Feed readers',
    href: 'https://miniflux.app/',
    sourceHref: 'https://github.com/miniflux/v2',
  },
  {
    title: 'Wallabag',
    blurb: 'Save articles to read later with a readable view — build a private research shelf.',
    category: 'Read later',
    href: 'https://www.wallabag.org',
    sourceHref: 'https://github.com/wallabag/wallabag',
  },
  {
    title: 'Readeck',
    blurb: 'Bookmark + keep forever the readable content of pages you study.',
    category: 'Bookmarks',
    href: 'https://readeck.org/en/',
    sourceHref: 'https://codeberg.org/readeck/readeck',
  },
  {
    title: 'Actual',
    blurb: 'Local-first envelope budgeting you run yourself — your numbers, your categories.',
    category: 'Budgeting',
    href: 'https://actualbudget.org',
    sourceHref: 'https://github.com/actualbudget/actual',
  },
  {
    title: 'Firefly III',
    blurb: 'Personal finance manager for expense tracking, budgets, and imports you control.',
    category: 'Budgeting',
    href: 'https://firefly-iii.org/',
    sourceHref: 'https://github.com/firefly-iii/firefly-iii',
  },
  {
    title: 'ExpenseOwl',
    blurb: 'Extremely simple expense tracker with a clean UI — log spending you already know.',
    category: 'Expenses',
    href: 'https://github.com/tanq16/expenseowl',
    sourceHref: 'https://github.com/tanq16/expenseowl',
  },
  {
    title: 'OpenBudgeteer',
    blurb: 'Bucket / envelope budgeting principle in a self-hosted app.',
    category: 'Budgeting',
    href: 'https://github.com/TheAxelander/OpenBudgeteer',
    sourceHref: 'https://github.com/TheAxelander/OpenBudgeteer',
  },
  {
    title: 'Wallos',
    blurb: 'Personal subscription tracker — see recurring costs without “buy this” tips.',
    category: 'Subscriptions',
    href: 'https://wallosapp.com',
    sourceHref: 'https://github.com/ellite/wallos',
  },
  {
    title: 'Ghostfolio',
    blurb: 'Self-hosted portfolio journal for assets you enter — tracking only, not recommendations.',
    category: 'Portfolio journal',
    href: 'https://ghostfol.io/',
    sourceHref: 'https://github.com/ghostfolio/ghostfolio',
  },
  {
    title: 'ArchiveBox',
    blurb: 'Archive pages, feeds, and bookmarks into a private research archive.',
    category: 'Archiving',
    href: 'https://archivebox.io/',
    sourceHref: 'https://github.com/ArchiveBox/ArchiveBox',
  },
  {
    title: 'Moodle',
    blurb: 'Full learning platform if you want to host your own course campus.',
    category: 'Learning',
    href: 'https://moodle.org/',
    sourceHref: 'https://git.moodle.org/gw',
  },
];
