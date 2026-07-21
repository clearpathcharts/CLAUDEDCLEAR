// Access code for the Board / Founders portal client-side gate.
//
// SECURITY NOTE: any value shipped to the browser is visible in the compiled
// bundle, so this gate is only obscurity, not real protection. Sensitive access
// must ultimately be verified server-side. Setting VITE_BOARD_ACCESS_CODE lets
// the code be rotated/strengthened without a code change and keeps the literal
// out of source control.
export const BOARD_ACCESS_CODE: string =
  (import.meta.env.VITE_BOARD_ACCESS_CODE as string | undefined)?.trim() || '142879';
