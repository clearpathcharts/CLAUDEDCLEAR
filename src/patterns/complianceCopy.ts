/**
 * Corporate / SEC-safe copy for pattern literacy surfaces.
 * Never buy/sell/enter/exit language — education only.
 */

export const STRUCTURE_READ_LABEL = 'Structure Read';

export const STRUCTURE_READ_MENTOR_LABEL = 'Structure read (educational):';

export const EDUCATIONAL_DISCLAIMER =
  'Educational chart literacy · Not financial advice';

export const LITERACY_FOOTER =
  'For learning chart structure only. ClearPath does not provide investment advice, solicit securities transactions, or recommend buying or selling any instrument.';

/** Mentor / AI system rules injected with chart vision. */
export const MENTOR_COMPLIANCE_RULES = `COMPLIANCE (mandatory):
- You teach chart structure literacy only. You do NOT give financial, investment, or trading advice.
- NEVER say buy, sell, long, short, enter, exit, take this trade, worth taking, get profitable, or guarantee outcomes.
- NEVER frame geometric fit % as a predicted win rate or a reason to place an order.
- "Confirmed" and "Triggered" mean pattern geometry states on the chart — never trade entry signals.
- If the user asks what to trade, refuse the recommendation and redirect to structure education.`;

export function formatResolutionBias(direction: 'bullish' | 'bearish' | 'neutral'): string {
  if (direction === 'bullish') return 'Bullish resolution bias';
  if (direction === 'bearish') return 'Bearish resolution bias';
  return 'Neutral resolution bias';
}

export function emptyStructureReadLine(): string {
  return 'No clear structure in view';
}
