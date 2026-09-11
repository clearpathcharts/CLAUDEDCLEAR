import type { ThemeProfileId } from '../../../lib/theme/profiles';
import { themeProfiles } from '../../../lib/theme/profiles';
import type { AdvancedProfileId } from '../../../lib/advanced/profiles';

/** Map path / advanced profile ids onto chart theme profiles (what LightweightCandles reads). */
export function resolveNeuroChartProfile(id: string | null | undefined): ThemeProfileId {
  const raw = (id || '').trim();
  if (raw === 'focus_mode') return 'calm_focus';
  if (raw === 'lava_hot') return 'adhd_dopamine_balanced';
  if (raw && raw in themeProfiles) return raw as ThemeProfileId;
  return 'calm_focus';
}

export function readStoredNeuroProfile(): ThemeProfileId {
  try {
    return resolveNeuroChartProfile(localStorage.getItem('clearpath_current_profile_id'));
  } catch {
    return 'calm_focus';
  }
}

/** Honor ?profile= on direct desk links (Choose Your Path writes storage; URL-only visits did not). */
export function readNeuroProfileFromUrl(): ThemeProfileId | null {
  if (typeof window === 'undefined') return null;
  try {
    const urlProfile = new URLSearchParams(window.location.search).get('profile');
    if (!urlProfile) return null;
    const chartId = resolveNeuroChartProfile(urlProfile);
    return chartId in themeProfiles ? chartId : null;
  } catch {
    return null;
  }
}

export function readInitialNeuroProfile(): ThemeProfileId {
  const fromUrl = readNeuroProfileFromUrl();
  if (fromUrl) {
    applyNeuroProfile(fromUrl);
    return fromUrl;
  }
  return readStoredNeuroProfile();
}

export function applyNeuroProfile(profileId: AdvancedProfileId | ThemeProfileId) {
  const chartId = resolveNeuroChartProfile(profileId);
  try {
    localStorage.setItem('clearpath_current_profile_id', chartId);
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('clearpath-set-profile', { detail: chartId }));
  }
  return chartId;
}

/** Profiles shown on the Neuro desk picker — theme profiles only (chart-backed). */
export const NEURO_DESK_PROFILES: ThemeProfileId[] = [
  'calm_focus',
  'low_stim_emergency',
  'dyslexia_readable',
  'dyscalculia_numeric_relief',
  'visual_processing_safe',
  'apd_assist',
  'executive_function_support',
  'motor_friendly',
  'adhd_dopamine_balanced',
  'adhd_hyperfocus',
  'autism_predictable',
  'tourette_tic_friendly',
  'standard_red_green',
];

export const NEURO_PROFILE_BLURBS: Record<ThemeProfileId, string> = {
  calm_focus: 'Softer contrast, slower chrome, room to think.',
  low_stim_emergency: 'Lowest visual load when the screen is too much.',
  dyslexia_readable: 'Reading support for long labels and news.',
  dyscalculia_numeric_relief: 'Numbers spaced for easier scanning.',
  visual_processing_safe: 'Lower visual noise for pattern reading.',
  apd_assist: 'Fewer competing signals on screen.',
  executive_function_support: 'Clear structure, one job at a time.',
  motor_friendly: 'Larger tap targets and spacing.',
  adhd_dopamine_balanced: 'Clear targets without casino motion.',
  adhd_hyperfocus: 'One primary chart. Minimal chrome.',
  autism_predictable: 'Stable layout. Same places. No surprise animation.',
  tourette_tic_friendly: 'Motion off. Predictable controls.',
  standard_red_green: 'Classic red/green candles retail traders already know.',
};

export const NEURO_RIBBON: { symbol: string; label: string }[] = [
  { symbol: 'BTCUSD', label: 'BTC' },
  { symbol: 'ETHUSD', label: 'ETH' },
  { symbol: 'SOLUSD', label: 'SOL' },
  { symbol: 'SPX', label: 'S&P 500' },
  { symbol: 'NDX', label: 'NASDAQ' },
  { symbol: 'DXY', label: 'DXY' },
  { symbol: 'XAUUSD', label: 'GOLD' },
  { symbol: 'EURUSD', label: 'EUR/USD' },
];

export const NEURO_DEFAULT_SYMBOL = 'BTCUSD';

export const NEURO_DEFAULT_WATCHLISTS = [
  {
    id: 'calm-core',
    name: 'CALM CORE',
    symbols: ['BTCUSD', 'ETHUSD', 'EURUSD', 'XAUUSD', 'SPX'],
  },
  {
    id: 'crypto',
    name: 'CRYPTO',
    symbols: ['BTCUSD', 'ETHUSD', 'SOLUSD', 'ADAUSD', 'XRPUSD', 'DOGEUSD'],
  },
  {
    id: 'forex',
    name: 'FOREX',
    symbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD'],
  },
  {
    id: 'favorites',
    name: 'FAVORITES',
    symbols: ['BTCUSD', 'ETHUSD'],
  },
] as const;

export function prefersReducedChrome(profileId: ThemeProfileId): boolean {
  return (
    profileId === 'low_stim_emergency' ||
    profileId === 'adhd_hyperfocus' ||
    profileId === 'autism_predictable' ||
    profileId === 'tourette_tic_friendly' ||
    profileId === 'apd_assist'
  );
}
