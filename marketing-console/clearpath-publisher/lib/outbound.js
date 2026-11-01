/**
 * Outbound kill switch. Off unless ALLOW_OUTBOUND_DISPATCH is exactly "true".
 * While off, nothing loads the channel adapters and nothing leaves this server.
 */
export const OUTBOUND_DISABLED_ERROR = "Outbound dispatch disabled until founder re-enables.";

export function outboundEnabled() {
  return String(process.env.ALLOW_OUTBOUND_DISPATCH || "").trim().toLowerCase() === "true";
}

export async function loadDispatch() {
  if (!outboundEnabled()) return null;
  return import("./dispatch.js");
}

export async function loadScheduler() {
  if (!outboundEnabled()) return null;
  return import("./scheduler.js");
}
