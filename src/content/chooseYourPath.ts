import type { AdvancedProfileId } from '../lib/advanced/profiles';

export type PathCard = {
  id: 'institutional' | 'fundamental' | 'retail';
  title: string;
  tagline: string;
  cta: string;
  profileId: AdvancedProfileId;
  png: string;
  webp: string;
  /** Looping silent clip. The still image stays until this file exists. */
  mp4?: string;
  width: number;
  height: number;
  accent: string;
};

export const PATH_CARDS: PathCard[] = [
  {
    id: 'institutional',
    title: 'Institutional Trader',
    tagline: 'Give me the information',
    cta: 'Enter Institutional UI',
    profileId: 'focus_mode',
    png: '/paths/institutional-trader.png',
    webp: '/paths/institutional-trader.webp',
    mp4: '/paths/institutional-trader.mp4',
    width: 512,
    height: 735,
    accent: '#FF1493',
  },
  {
    id: 'fundamental',
    title: 'Fundamental Trader',
    tagline: 'Tell me what the asset is worth',
    cta: 'Enter Fundamental UI',
    profileId: 'calm_focus',
    png: '/paths/fundamental-trader.png',
    webp: '/paths/fundamental-trader.webp',
    mp4: '/paths/fundamental-trader.mp4',
    width: 533,
    height: 735,
    accent: '#FF7A00',
  },
  {
    id: 'retail',
    title: 'Retail Trader',
    tagline: 'Make trading understandable',
    cta: 'Enter Retail UI',
    profileId: 'standard_red_green',
    png: '/paths/retail-trader.png',
    webp: '/paths/retail-trader.webp',
    mp4: '/paths/retail-trader.mp4',
    width: 481,
    height: 735,
    accent: '#00FFFF',
  },
];

/**
 * Learning-philosophy block under the three path videos.
 * Replaces the old neurodivergent still banner. Keeps the neuro desk entry
 * profile so Auth can still open Neurodivergent Traders from the CTA.
 */
export const LEARNING_PHILOSOPHY = {
  profileId: 'autism_predictable' as AdvancedProfileId,
  photo: '/team/sarah-weber.jpg',
  photoWidth: 883,
  photoHeight: 1024,
  photoAlt: 'Sarah Weber, LSCSW — Clear Path Trader board member and behavioral therapist',
  role: 'Sarah Weber, LSCSW',
  roleLine: 'Behavioral Therapist · Board Member',
  title: 'How people learn shapes how we teach',
  paragraphs: [
    'Through ongoing research into educational psychology, cognitive development, and adult learning, Clear Path Trader recognizes that individuals absorb, process, and retain information in different ways. While scientific research distinguishes between personal learning preferences and formally proven learning styles, it consistently supports the value of incorporating diverse teaching methods, including visual instruction, auditory learning, reading and writing, and hands-on application.',
    'This philosophy is at the foundation of Clear Path Trader’s development. The goal is to provide individuals with a diverse set of educational tools, resources, and instructional approaches that accommodate their individual learning preferences, helping each person better understand, apply, and retain the knowledge necessary to succeed. By combining research-driven teaching methods with adaptable learning experiences, Clear Path Trader strives to make education more accessible, engaging, and effective for every individual.',
  ],
  /** Board endorsement — homepage pull quote under the philosophy block. */
  quote: {
    text: 'In many situations, I see people who struggle with focus and attention span, as well as cognitive retainability and execution of that information because many programs are designed to fit what they feel is the “norm”, but in all reality, there really isn’t a “norm”, because everyone learns things a little bit differently. What Clear Path Trader has designed has allowed the program to adapt to the trader instead of the trader adapting to the program.',
    attribution: 'Sarah Weber, LSCSW',
    attributionLine: 'Behavioral Therapist · Board Member',
  },
};

/** @deprecated Use LEARNING_PHILOSOPHY — kept for Auth profile fallback name stability. */
export const NEURODIVERGENT_BANNER = {
  profileId: LEARNING_PHILOSOPHY.profileId,
  href: '/ui',
  alt: LEARNING_PHILOSOPHY.title,
};
