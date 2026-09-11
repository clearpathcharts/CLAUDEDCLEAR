/**
 * US/Eastern briefing schedule — Sun–Fri only (no Saturday).
 * 1) NYSE regular-session close bell (default 4:00 PM ET)
 * 2) Overnight refresh (default 1:00 AM ET)
 */

export type BriefingSlot = "market_close" | "overnight";

const TZ = "America/New_York";

export function easternDateKey(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

export function easternWeekday(at: Date = new Date()): number {
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" }).format(at);
  const i = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd);
  return i >= 0 ? i : at.getDay();
}

/** Sunday (0) through Friday (5). Saturday (6) is off. */
export function isBriefingDay(at: Date = new Date()): boolean {
  return easternWeekday(at) !== 6;
}

export function briefingReportId(date: string, slot: BriefingSlot): string {
  return `${date}_${slot}`;
}

export function parseBriefingReportId(id: string): { date: string; slot: BriefingSlot } | null {
  const m = /^(\d{4}-\d{2}-\d{2})_(market_close|overnight)$/.exec(id);
  if (!m) return null;
  return { date: m[1], slot: m[2] as BriefingSlot };
}

export function slotLabel(slot: BriefingSlot): string {
  return slot === "market_close" ? "NYSE close bell" : "1:00 AM ET overnight";
}

function easternHourMinute(at: Date): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(at);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return { hour, minute };
}

export function configuredCloseHourEt(): number {
  const n = Number(process.env.DAILY_PATTERN_REVIEW_CLOSE_HOUR_ET ?? 16);
  return Number.isFinite(n) ? Math.max(0, Math.min(23, n)) : 16;
}

export function configuredOvernightHourEt(): number {
  const n = Number(process.env.DAILY_PATTERN_REVIEW_OVERNIGHT_HOUR_ET ?? 1);
  return Number.isFinite(n) ? Math.max(0, Math.min(23, n)) : 1;
}

/** True when `at` is within the one-minute window for this slot on a briefing day. */
export function isSlotDue(slot: BriefingSlot, at: Date = new Date()): boolean {
  if (!isBriefingDay(at)) return false;
  const { hour, minute } = easternHourMinute(at);
  const targetHour = slot === "market_close" ? configuredCloseHourEt() : configuredOvernightHourEt();
  return hour === targetHour && minute === 0;
}

export function activeSlots(at: Date = new Date()): BriefingSlot[] {
  if (!isBriefingDay(at)) return [];
  const out: BriefingSlot[] = [];
  if (isSlotDue("market_close", at)) out.push("market_close");
  if (isSlotDue("overnight", at)) out.push("overnight");
  return out;
}

export function nextDueHintText(): string {
  return `Auto sweeps Sun–Fri at ${configuredCloseHourEt()}:00 ET (NYSE close) and ${configuredOvernightHourEt()}:00 ET overnight · CEO approves before newsletter sends`;
}
