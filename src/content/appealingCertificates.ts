/**
 * Curated free certificate courses for Appealing Additions.
 * Sourced from the community list:
 * https://github.com/PanXProject/awesome-certificates
 * ClearPath links out for discovery — we do not issue these credentials
 * and this is educational literacy only (not financial advice).
 */

export type AppealingCertificate = {
  title: string;
  provider: string;
  level: 'Beginner' | 'Intermediate' | 'Professional';
  hours: string;
  reward: 'badge' | 'certificate';
  href: string;
  category: string;
};

export const AWESOME_CERTIFICATES_REPO =
  'https://github.com/PanXProject/awesome-certificates';

export const APPEALING_CERTIFICATES: AppealingCertificate[] = [
  {
    title: 'Basics of Finance',
    provider: 'HP LIFE',
    level: 'Beginner',
    hours: '0.5',
    reward: 'certificate',
    href: 'https://www.life-global.org/categorylist/3-finance',
    category: 'Finance',
  },
  {
    title: 'Cash Flow',
    provider: 'HP LIFE',
    level: 'Beginner',
    hours: '0.5',
    reward: 'certificate',
    href: 'https://www.life-global.org/categorylist/3-finance',
    category: 'Finance',
  },
  {
    title: 'Profit and Loss',
    provider: 'HP LIFE',
    level: 'Beginner',
    hours: '0.5',
    reward: 'certificate',
    href: 'https://www.life-global.org/categorylist/3-finance',
    category: 'Finance',
  },
  {
    title: 'Circular Economy',
    provider: 'HP LIFE',
    level: 'Beginner',
    hours: '0.5',
    reward: 'certificate',
    href: 'https://www.life-global.org/categorylist/3-finance',
    category: 'Finance',
  },
  {
    title: 'Business Analysis Basics',
    provider: 'Simplilearn',
    level: 'Beginner',
    hours: '2',
    reward: 'certificate',
    href: 'https://www.simplilearn.com/business-analysis-basics-free-course-skillup',
    category: 'Business Analytics',
  },
  {
    title: 'Power BI for Beginners',
    provider: 'Simplilearn',
    level: 'Beginner',
    hours: '6',
    reward: 'certificate',
    href: 'https://www.simplilearn.com/learn-power-bi-basics-free-course-skillup',
    category: 'Business Analytics',
  },
  {
    title: 'Digital Marketing',
    provider: 'Google',
    level: 'Beginner',
    hours: '40',
    reward: 'badge',
    href: 'https://grow.google/certificates/digital-marketing-ecommerce/',
    category: 'Marketing',
  },
  {
    title: 'Blockchain Masterclass',
    provider: 'CFTE',
    level: 'Beginner',
    hours: '—',
    reward: 'badge',
    href: 'https://courses.cfte.education/',
    category: 'Blockchain',
  },
];
