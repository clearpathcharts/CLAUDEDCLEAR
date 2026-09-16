import fs from 'fs';
import path from 'path';
import { ALL_PLATFORMS, isSocialPlatform } from './platforms';
import type { SocialPlatform } from './types';

const DATA_DIR = path.join(process.cwd(), 'data', 'social-os');
const CADENCE_FILE = path.join(DATA_DIR, 'cadence.json');

/** Default ClearPath posting times (local timezone). */
export const DEFAULT_POST_SLOTS = ['05:00', '09:00', '15:00', '18:00'] as const;

export type CadenceState = {
  version: 1;
  /** timezone used when last slot fired */
  timezone: string;
  /** keys like "2026-07-27T05:00" that already ran */
  firedSlots: string[];
  lastTickAt?: string;
  lastSlotKey?: string;
  lastResult?: string;
};

function ensureDir(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function getSocialTimezone(): string {
  return (process.env.SOCIAL_OS_TIMEZONE || 'America/New_York').trim() || 'America/New_York';
}

export function getPostSlots(): string[] {
  const raw = (process.env.SOCIAL_OS_POST_SLOTS || '').trim();
  if (!raw) return [...DEFAULT_POST_SLOTS];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /^\d{1,2}:\d{2}$/.test(s))
    .map((s) => {
      const [h, m] = s.split(':');
      return `${h.padStart(2, '0')}:${m}`;
    });
}

/**
 * Platforms to hit each slot (comma-separated).
 * Default: top social set. Use SOCIAL_OS_PLATFORMS=all for the full ClearPath catalog.
 */
export function getCadencePlatforms(): SocialPlatform[] {
  const raw = (process.env.SOCIAL_OS_PLATFORMS || 'facebook,instagram,x,linkedin,youtube,tiktok,reddit,discord,telegram,bluesky,threads').trim();
  if (raw.toLowerCase() === 'all') return [...ALL_PLATFORMS];
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(isSocialPlatform);
}

export function readCadenceState(): CadenceState {
  ensureDir();
  try {
    if (!fs.existsSync(CADENCE_FILE)) {
      return { version: 1, timezone: getSocialTimezone(), firedSlots: [] };
    }
    const parsed = JSON.parse(fs.readFileSync(CADENCE_FILE, 'utf8')) as CadenceState;
    return {
      version: 1,
      timezone: parsed.timezone || getSocialTimezone(),
      firedSlots: Array.isArray(parsed.firedSlots) ? parsed.firedSlots : [],
      lastTickAt: parsed.lastTickAt,
      lastSlotKey: parsed.lastSlotKey,
      lastResult: parsed.lastResult,
    };
  } catch {
    return { version: 1, timezone: getSocialTimezone(), firedSlots: [] };
  }
}

export function writeCadenceState(state: CadenceState): void {
  ensureDir();
  const tmp = `${CADENCE_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf8');
  fs.renameSync(tmp, CADENCE_FILE);
}

/** Parts of "now" in the configured timezone. */
export function zonedParts(
  date: Date,
  timeZone = getSocialTimezone()
): { year: number; month: number; day: number; hour: number; minute: number; dateKey: string; timeKey: string } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(date).filter((p) => p.type !== 'literal').map((p) => [p.type, p.value])
  ) as Record<string, string>;

  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  const hour = Number(parts.hour);
  const minute = Number(parts.minute);
  const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const timeKey = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  return { year, month, day, hour, minute, dateKey, timeKey };
}

export function slotKey(dateKey: string, slot: string): string {
  return `${dateKey}T${slot}`;
}

/**
 * If current local time is within `windowMinutes` after a configured slot,
 * and that slot hasn't fired yet today, return the slot HH:MM.
 */
export function detectDueSlot(
  now = new Date(),
  windowMinutes = Number(process.env.SOCIAL_OS_SLOT_WINDOW_MINUTES) || 10
): { slot: string; key: string; dateKey: string; timeZone: string } | null {
  const timeZone = getSocialTimezone();
  const { dateKey, hour, minute } = zonedParts(now, timeZone);
  const nowMinutes = hour * 60 + minute;
  const state = readCadenceState();
  // prune fired slots older than yesterday
  const pruned = state.firedSlots.filter((k) => k.startsWith(dateKey) || k.startsWith(prevDateKey(dateKey)));

  for (const slot of getPostSlots()) {
    const [sh, sm] = slot.split(':').map(Number);
    const slotMinutes = sh * 60 + sm;
    const delta = nowMinutes - slotMinutes;
    if (delta < 0 || delta > windowMinutes) continue;
    const key = slotKey(dateKey, slot);
    if (pruned.includes(key) || state.firedSlots.includes(key)) continue;
    return { slot, key, dateKey, timeZone };
  }
  return null;
}

function prevDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

export function markSlotFired(key: string, result: string): CadenceState {
  const state = readCadenceState();
  const timeZone = getSocialTimezone();
  const { dateKey } = zonedParts(new Date(), timeZone);
  const firedSlots = [...new Set([...state.firedSlots.filter((k) => k.startsWith(dateKey) || k.startsWith(prevDateKey(dateKey))), key])];
  const next: CadenceState = {
    version: 1,
    timezone: timeZone,
    firedSlots,
    lastTickAt: new Date().toISOString(),
    lastSlotKey: key,
    lastResult: result,
  };
  writeCadenceState(next);
  return next;
}

export function cadenceStatus(): {
  timezone: string;
  slots: string[];
  platforms: SocialPlatform[];
  state: CadenceState;
  nextSlotsToday: string[];
} {
  const timezone = getSocialTimezone();
  const slots = getPostSlots();
  const { dateKey, timeKey } = zonedParts(new Date(), timezone);
  const state = readCadenceState();
  const nextSlotsToday = slots.filter((slot) => {
    const key = slotKey(dateKey, slot);
    if (state.firedSlots.includes(key)) return false;
    return slot >= timeKey;
  });
  return {
    timezone,
    slots,
    platforms: getCadencePlatforms(),
    state,
    nextSlotsToday,
  };
}
