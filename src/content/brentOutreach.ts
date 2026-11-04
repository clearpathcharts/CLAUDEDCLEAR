/**
 * Brent (CCO) investor outreach identity.
 * Founder will supply the live mailbox last — keep the env name stable.
 */

import { PRODUCT_NAME, PRODUCT_URL } from './productIdentity';

/** Cloud Run / .env: BRENT_OUTREACH_EMAIL. Empty until founder provides it. */
export function brentOutreachEmail(): string {
  return String(process.env.BRENT_OUTREACH_EMAIL || '').trim().toLowerCase();
}

export function brentOutreachConfigured(): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(brentOutreachEmail());
}

export function brentFromHeader(): string {
  const email = brentOutreachEmail();
  if (!email) return '';
  return `Brent · ${PRODUCT_NAME} <${email}>`;
}

/** Absolute image URLs embedded in outreach HTML (website screenshots / product stills). */
export const BRENT_OUTREACH_SCREENSHOTS: Array<{ src: string; alt: string; caption: string }> = [
  {
    src: `${PRODUCT_URL}/og-image.png`,
    alt: 'ClearPath Trader open graph preview',
    caption: 'Live product surface — clearpathtrader.com',
  },
  {
    src: `${PRODUCT_URL}/paths/institutional-trader.webp`,
    alt: 'Institutional trader desk',
    caption: 'Institutional desk — chart-first command center',
  },
  {
    src: `${PRODUCT_URL}/paths/fundamental-trader.webp`,
    alt: 'Fundamental trader desk',
    caption: 'Fundamental desk — research and filings context',
  },
  {
    src: `${PRODUCT_URL}/paths/retail-trader.webp`,
    alt: 'Retail trader desk',
    caption: 'Retail desk — educational chart workstation',
  },
  {
    src: `${PRODUCT_URL}/paths/neurodivergent-traders.webp`,
    alt: 'Neurodivergent trader desk',
    caption: 'Neurodivergent desk — sensory profiles, same market data',
  },
  {
    src: `${PRODUCT_URL}/marketing/posters/gold-see-the-pattern.jpg`,
    alt: 'Pattern-focused product poster',
    caption: 'Pattern measurement messaging (Gold tier poster)',
  },
];

export const TECHNOLOGY_OPPORTUNITY_PATH = '/technology-opportunity';
export const TECHNOLOGY_OPPORTUNITY_URL = `${PRODUCT_URL}${TECHNOLOGY_OPPORTUNITY_PATH}`;
export const COMMUNICATIONS_PATH = '/communications';
