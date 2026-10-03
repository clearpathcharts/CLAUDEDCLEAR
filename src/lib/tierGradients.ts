/**
 * One source of truth for the per-tier gradient pair used across the site.
 *
 * Every surface that represents Basic / Silver / Gold / Platinum reads from
 * here, so a tier's colours cannot drift between /plans, Communities, and any
 * page added later. Consumers spread `tierAccentVars(id)` onto an element and
 * the shared classes in `src/styles/tierGradient.css` pick the values up from
 * `--plan-accent` / `--plan-accent-2`.
 */
import type { CSSProperties } from 'react';

export type TierGradientId = 'basic' | 'silver' | 'gold' | 'platinum';

export const TIER_GRADIENT: Record<TierGradientId, { from: string; to: string }> = {
  basic: { from: '#00E5FF', to: '#0066FF' },
  silver: { from: '#C9D3E0', to: '#7D8DA3' },
  gold: { from: '#FF6A00', to: '#FFD700' },
  platinum: { from: '#FF007F', to: '#5B00FF' },
};

/** The page-level brand gradient (the "Pick your level" hero sweep). */
export const BRAND_GRADIENT = 'linear-gradient(110deg, #5b00ff, #ff007f 58%, #ff6a00)';

export function isTierGradientId(value: unknown): value is TierGradientId {
  return typeof value === 'string' && value in TIER_GRADIENT;
}

/** CSS custom properties a tier-aware element needs. Unknown tiers fall back to Basic. */
export function tierAccentVars(id: string | null | undefined): CSSProperties {
  const tier = isTierGradientId(id) ? id : 'basic';
  return {
    '--plan-accent': TIER_GRADIENT[tier].from,
    '--plan-accent-2': TIER_GRADIENT[tier].to,
  } as CSSProperties;
}

/**
 * Stops of the brand sweep, in order. A row of sibling cards that has no tier
 * of its own (stat counters, process steps) walks these so the group reads as
 * one gradient instead of N identical boxes.
 */
export const SEQUENCE_ACCENTS = ['#36D9F5', '#5B00FF', '#FF007F', '#FF6A00'] as const;

/** Accent vars for position `index` in a sibling row. Wraps past the last stop. */
export function sequenceAccentVars(index: number): CSSProperties {
  const accent = SEQUENCE_ACCENTS[((index % SEQUENCE_ACCENTS.length) + SEQUENCE_ACCENTS.length) % SEQUENCE_ACCENTS.length];
  return { '--plan-accent': accent } as CSSProperties;
}
