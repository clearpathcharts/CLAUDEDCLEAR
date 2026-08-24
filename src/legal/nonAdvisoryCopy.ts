/**
 * Canonical non-advisory / educational-only legal phrasing.
 * Used by LegalFooter UI and Daily Ops auto-checks so production
 * (Docker image without /src) can still verify the sentence is shipped.
 */

/** Exact clause required by Daily Ops `auto_legal` (case-insensitive match). */
export const LEGAL_NON_ADVISORY_CLAUSE =
  "does not evaluate, alter, or advise on financial decisions";

/** Full Legal Positioning blurb shown in the footer. */
export const LEGAL_POSITIONING_BLURB =
  `Provides financial data visualization with optional user-controlled presentation adjustments for accessibility and visual clarity. The system ${LEGAL_NON_ADVISORY_CLAUSE}.`;

export function legalNonAdvisoryClausePresent(text: string): boolean {
  return new RegExp(LEGAL_NON_ADVISORY_CLAUSE, "i").test(text);
}
