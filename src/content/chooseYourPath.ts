import type { AdvancedProfileId } from '../lib/advanced/profiles';

export type PathCard = {
  id: 'institutional' | 'fundamental' | 'retail';
  title: string;
  tagline: string;
  cta: string;
  profileId: AdvancedProfileId;
  png: string;
  webp: string;
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
    width: 481,
    height: 735,
    accent: '#00FFFF',
  },
];

export const NEURODIVERGENT_BANNER = {
  png: '/paths/neurodivergent-traders.png',
  webp: '/paths/neurodivergent-traders.webp',
  width: 1536,
  height: 1024,
  href: '/ui',
  profileId: 'autism_predictable' as AdvancedProfileId,
  alt: 'Built for different minds. Made for real traders. Neurodivergent, focused, empowered.',
};
