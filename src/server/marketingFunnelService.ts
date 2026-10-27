import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore } from './firebaseAdmin';
import { canonicalizePlanId, type CanonicalPlanId } from '../lib/planCatalog';

export const MARKETING_ATTRIBUTION_COOKIE = 'cp_marketing_attribution';
export const MEMBERS_PER_TIER_GOAL = 25_000;
export const MEMBERS_PER_CYCLE_GOAL = 100_000;

export type MarketingEventName = 'visit' | 'cta' | 'signup' | 'trial_start' | 'conversion';

export type MarketingAttribution = {
  source: string;
  medium: string;
  campaign: string;
  content: string;
  targetTier: CanonicalPlanId;
  landingPath: string;
};

export type MarketingFunnelRollup = MarketingAttribution & {
  id: string;
  date: string;
  visits: number;
  ctas: number;
  signups: number;
  trials: number;
  conversions: number;
  updatedAt: string;
};

type MemberAttribution = MarketingAttribution & {
  uid: string;
  signupRecordedAt?: string;
  trialStartedAt?: string;
  convertedAt?: string;
  convertedTier?: CanonicalPlanId;
};

type LocalMarketingState = {
  rollups: Record<string, MarketingFunnelRollup>;
  members: Record<string, MemberAttribution>;
  updatedAt: string;
};

export type MarketingTierSummary = {
  tier: CanonicalPlanId;
  visits: number;
  ctas: number;
  signups: number;
  trials: number;
  conversions: number;
  signupRate: number | null;
  conversionRate: number | null;
  lifetimeMembers: number;
  goal: number;
  goalProgress: number;
  completedGoals: number;
};

export type MarketingAnalytics = {
  ok: true;
  from: string;
  to: string;
  storage: 'firestore' | 'local' | 'unavailable';
  externalMetrics: {
    status: 'DATA UNAVAILABLE';
    detail: string;
  };
  totals: Omit<MarketingTierSummary, 'tier' | 'goal' | 'goalProgress' | 'completedGoals' | 'lifetimeMembers'>;
  tiers: MarketingTierSummary[];
  campaignCycle: {
    goal: number;
    lifetimeMembers: number;
    currentCycle: number;
    completedCycles: number;
    progress: number;
  };
  rows: MarketingFunnelRollup[];
};

const DATA_DIR = path.join(process.cwd(), 'data', 'marketing');
const LOCAL_FILE = path.join(DATA_DIR, 'funnel-local.json');
const ROLLUP_COLLECTION = 'marketing_funnel_daily';
const ATTRIBUTION_COLLECTION = 'marketing_attribution';
const SUMMARY_REF = ['site_settings', 'marketing_funnel_summary'] as const;
const EVENT_FIELD: Record<MarketingEventName, keyof Pick<MarketingFunnelRollup, 'visits' | 'ctas' | 'signups' | 'trials' | 'conversions'>> = {
  visit: 'visits',
  cta: 'ctas',
  signup: 'signups',
  trial_start: 'trials',
  conversion: 'conversions',
};

function emptyLocalState(): LocalMarketingState {
  return { rollups: {}, members: {}, updatedAt: new Date(0).toISOString() };
}

function readLocalState(): LocalMarketingState {
  try {
    if (!fs.existsSync(LOCAL_FILE)) return emptyLocalState();
    const parsed = JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8')) as Partial<LocalMarketingState>;
    return {
      rollups: parsed.rollups && typeof parsed.rollups === 'object' ? parsed.rollups : {},
      members: parsed.members && typeof parsed.members === 'object' ? parsed.members : {},
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date(0).toISOString(),
    };
  } catch {
    return emptyLocalState();
  }
}

function writeLocalState(state: LocalMarketingState) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  state.updatedAt = new Date().toISOString();
  fs.writeFileSync(LOCAL_FILE, `${JSON.stringify(state, null, 2)}\n`);
}

function cleanDimension(value: unknown, fallback: string, max = 80): string {
  const text = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._:/-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, max);
  return text || fallback;
}

export function sanitizeMarketingAttribution(input: Partial<MarketingAttribution>): MarketingAttribution {
  const tier = canonicalizePlanId(cleanDimension(input.targetTier, 'basic', 20));
  let landingPath = String(input.landingPath || '/').trim().slice(0, 200);
  if (!landingPath.startsWith('/') || landingPath.startsWith('//')) landingPath = '/';
  return {
    source: cleanDimension(input.source, 'direct'),
    medium: cleanDimension(input.medium, 'none'),
    campaign: cleanDimension(input.campaign, 'unattributed'),
    content: cleanDimension(input.content, 'unspecified'),
    targetTier: tier,
    landingPath,
  };
}

function cookieSecret(): string {
  return (process.env.SESSION_SECRET || process.env.CATALOG_ADMIN_SECRET || 'clearpath-local-marketing-cookie').trim();
}

export function encodeMarketingAttributionCookie(input: Partial<MarketingAttribution>): string {
  const payload = Buffer.from(JSON.stringify(sanitizeMarketingAttribution(input))).toString('base64url');
  const signature = crypto.createHmac('sha256', cookieSecret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function decodeMarketingAttributionCookie(raw: unknown): MarketingAttribution | null {
  const value = typeof raw === 'string' ? raw.trim() : '';
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return null;
  const expected = crypto.createHmac('sha256', cookieSecret()).update(payload).digest();
  let supplied: Buffer;
  try {
    supplied = Buffer.from(signature, 'base64url');
  } catch {
    return null;
  }
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) return null;
  try {
    return sanitizeMarketingAttribution(JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')));
  } catch {
    return null;
  }
}

function rollupId(date: string, attribution: MarketingAttribution): string {
  const raw = [
    date,
    attribution.targetTier,
    attribution.source,
    attribution.medium,
    attribution.campaign,
    attribution.content,
  ].join('|');
  return `${date}_${crypto.createHash('sha256').update(raw).digest('hex').slice(0, 20)}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function blankRollup(id: string, date: string, attribution: MarketingAttribution): MarketingFunnelRollup {
  return {
    id,
    date,
    ...attribution,
    visits: 0,
    ctas: 0,
    signups: 0,
    trials: 0,
    conversions: 0,
    updatedAt: new Date().toISOString(),
  };
}

async function incrementRollup(event: MarketingEventName, attribution: MarketingAttribution): Promise<'firestore' | 'local' | 'unavailable'> {
  const date = today();
  const id = rollupId(date, attribution);
  const field = EVENT_FIELD[event];
  const db = getAdminFirestore();
  if (db) {
    await db.collection(ROLLUP_COLLECTION).doc(id).set(
      {
        id,
        date,
        ...attribution,
        [field]: FieldValue.increment(1),
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    return 'firestore';
  }
  if (process.env.NODE_ENV === 'production') return 'unavailable';
  const state = readLocalState();
  const row = state.rollups[id] || blankRollup(id, date, attribution);
  row[field] += 1;
  row.updatedAt = new Date().toISOString();
  state.rollups[id] = row;
  writeLocalState(state);
  return 'local';
}

export async function recordPublicMarketingEvent(
  event: Extract<MarketingEventName, 'visit' | 'cta'>,
  input: Partial<MarketingAttribution>,
): Promise<{ recorded: boolean; storage: 'firestore' | 'local' | 'unavailable'; attribution: MarketingAttribution }> {
  const attribution = sanitizeMarketingAttribution(input);
  const storage = await incrementRollup(event, attribution);
  return { recorded: storage !== 'unavailable', storage, attribution };
}

async function claimMemberMilestone(
  uid: string,
  field: 'signupRecordedAt' | 'trialStartedAt' | 'convertedAt',
  attribution: MarketingAttribution,
  convertedTier?: CanonicalPlanId,
): Promise<boolean> {
  const safeUid = String(uid || '').trim().slice(0, 160);
  if (!safeUid) return false;
  const now = new Date().toISOString();
  const db = getAdminFirestore();
  if (db) {
    const ref = db.collection(ATTRIBUTION_COLLECTION).doc(safeUid);
    return db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const existing = snap.exists ? (snap.data() as Partial<MemberAttribution>) : {};
      if (existing[field]) return false;
      tx.set(
        ref,
        {
          uid: safeUid,
          ...attribution,
          [field]: now,
          ...(convertedTier ? { convertedTier } : {}),
        },
        { merge: true },
      );
      return true;
    });
  }
  if (process.env.NODE_ENV === 'production') return false;
  const state = readLocalState();
  const member = state.members[safeUid] || { uid: safeUid, ...attribution };
  if (member[field]) return false;
  member[field] = now;
  if (convertedTier) member.convertedTier = convertedTier;
  state.members[safeUid] = member;
  writeLocalState(state);
  return true;
}

async function incrementLifetimeSignup(tier: CanonicalPlanId) {
  const db = getAdminFirestore();
  if (!db) return;
  await db.doc(SUMMARY_REF.join('/')).set(
    {
      lifetimeMembers: FieldValue.increment(1),
      [`members_${tier}`]: FieldValue.increment(1),
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

export async function recordMarketingSignup(uid: string, cookieValue: unknown): Promise<boolean> {
  const attribution =
    decodeMarketingAttributionCookie(cookieValue) ||
    sanitizeMarketingAttribution({ source: 'direct', campaign: 'unattributed', targetTier: 'basic' });
  const claimed = await claimMemberMilestone(uid, 'signupRecordedAt', attribution);
  if (!claimed) return false;
  await incrementRollup('signup', attribution);
  await incrementLifetimeSignup(attribution.targetTier);
  return true;
}

async function readMemberAttribution(uid: string): Promise<MarketingAttribution | null> {
  const safeUid = String(uid || '').trim().slice(0, 160);
  if (!safeUid) return null;
  const db = getAdminFirestore();
  if (db) {
    const snap = await db.collection(ATTRIBUTION_COLLECTION).doc(safeUid).get();
    return snap.exists ? sanitizeMarketingAttribution(snap.data() as Partial<MemberAttribution>) : null;
  }
  if (process.env.NODE_ENV === 'production') return null;
  const member = readLocalState().members[safeUid];
  return member ? sanitizeMarketingAttribution(member) : null;
}

export async function recordMarketingTrial(uid: string, tierInput: string): Promise<boolean> {
  const tier = canonicalizePlanId(tierInput);
  const stored = await readMemberAttribution(uid);
  const attribution = sanitizeMarketingAttribution({ ...(stored || {}), targetTier: tier });
  const claimed = await claimMemberMilestone(uid, 'trialStartedAt', attribution);
  if (claimed) await incrementRollup('trial_start', attribution);
  return claimed;
}

export async function recordMarketingConversion(uid: string, tierInput: string): Promise<boolean> {
  const tier = canonicalizePlanId(tierInput);
  const stored = await readMemberAttribution(uid);
  const attribution = sanitizeMarketingAttribution({ ...(stored || {}), targetTier: tier });
  const claimed = await claimMemberMilestone(uid, 'convertedAt', attribution, tier);
  if (claimed) await incrementRollup('conversion', attribution);
  return claimed;
}

function safeDate(value: unknown, fallback: string): string {
  const text = String(value || '');
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : fallback;
}

function sumRows(rows: MarketingFunnelRollup[]) {
  return rows.reduce(
    (sum, row) => ({
      visits: sum.visits + Number(row.visits || 0),
      ctas: sum.ctas + Number(row.ctas || 0),
      signups: sum.signups + Number(row.signups || 0),
      trials: sum.trials + Number(row.trials || 0),
      conversions: sum.conversions + Number(row.conversions || 0),
    }),
    { visits: 0, ctas: 0, signups: 0, trials: 0, conversions: 0 },
  );
}

function rate(numerator: number, denominator: number): number | null {
  return denominator > 0 ? Number(((numerator / denominator) * 100).toFixed(2)) : null;
}

async function readLifetimeCounts(): Promise<{ lifetimeMembers: number; byTier: Record<CanonicalPlanId, number> }> {
  const db = getAdminFirestore();
  if (db) {
    const snap = await db.doc(SUMMARY_REF.join('/')).get();
    const data = snap.exists ? snap.data() || {} : {};
    return {
      lifetimeMembers: Number(data.lifetimeMembers || 0),
      byTier: {
        basic: Number(data.members_basic || 0),
        silver: Number(data.members_silver || 0),
        gold: Number(data.members_gold || 0),
        platinum: Number(data.members_platinum || 0),
      },
    };
  }
  if (process.env.NODE_ENV === 'production') {
    return { lifetimeMembers: 0, byTier: { basic: 0, silver: 0, gold: 0, platinum: 0 } };
  }
  const state = readLocalState();
  const byTier = { basic: 0, silver: 0, gold: 0, platinum: 0 };
  for (const member of Object.values(state.members)) {
    if (member.signupRecordedAt) byTier[member.targetTier] += 1;
  }
  return {
    lifetimeMembers: Object.values(byTier).reduce((sum, value) => sum + value, 0),
    byTier,
  };
}

export async function getMarketingAnalytics(fromInput?: unknown, toInput?: unknown): Promise<MarketingAnalytics> {
  const now = new Date();
  const defaultTo = now.toISOString().slice(0, 10);
  const fromDate = new Date(now);
  fromDate.setUTCDate(fromDate.getUTCDate() - 29);
  const from = safeDate(fromInput, fromDate.toISOString().slice(0, 10));
  const to = safeDate(toInput, defaultTo);
  const db = getAdminFirestore();
  let rows: MarketingFunnelRollup[] = [];
  let storage: MarketingAnalytics['storage'] = 'unavailable';

  if (db) {
    const snapshot = await db
      .collection(ROLLUP_COLLECTION)
      .where('date', '>=', from)
      .where('date', '<=', to)
      .orderBy('date', 'desc')
      .limit(2000)
      .get();
    rows = snapshot.docs.map((doc) => ({ ...blankRollup(doc.id, String(doc.data().date || ''), sanitizeMarketingAttribution(doc.data())), ...doc.data(), id: doc.id } as MarketingFunnelRollup));
    storage = 'firestore';
  } else if (process.env.NODE_ENV !== 'production') {
    rows = Object.values(readLocalState().rollups)
      .filter((row) => row.date >= from && row.date <= to)
      .sort((a, b) => b.date.localeCompare(a.date));
    storage = 'local';
  }

  const lifetime = await readLifetimeCounts();
  const tierIds: CanonicalPlanId[] = ['basic', 'silver', 'gold', 'platinum'];
  const tiers = tierIds.map((tier) => {
    const sums = sumRows(rows.filter((row) => row.targetTier === tier));
    const lifetimeMembers = lifetime.byTier[tier];
    return {
      tier,
      ...sums,
      signupRate: rate(sums.signups, sums.visits),
      conversionRate: rate(sums.conversions, sums.signups),
      lifetimeMembers,
      goal: MEMBERS_PER_TIER_GOAL,
      goalProgress: lifetimeMembers % MEMBERS_PER_TIER_GOAL,
      completedGoals: Math.floor(lifetimeMembers / MEMBERS_PER_TIER_GOAL),
    };
  });
  const sums = sumRows(rows);
  const currentCycle = lifetime.lifetimeMembers % MEMBERS_PER_CYCLE_GOAL;

  return {
    ok: true,
    from,
    to,
    storage,
    externalMetrics: {
      status: 'DATA UNAVAILABLE',
      detail: 'Connect an approved Metricool API/export before showing impressions, reach, watch time, saves, or platform engagement.',
    },
    totals: {
      ...sums,
      signupRate: rate(sums.signups, sums.visits),
      conversionRate: rate(sums.conversions, sums.signups),
    },
    tiers,
    campaignCycle: {
      goal: MEMBERS_PER_CYCLE_GOAL,
      lifetimeMembers: lifetime.lifetimeMembers,
      currentCycle,
      completedCycles: Math.floor(lifetime.lifetimeMembers / MEMBERS_PER_CYCLE_GOAL),
      progress: Number(((currentCycle / MEMBERS_PER_CYCLE_GOAL) * 100).toFixed(2)),
    },
    rows,
  };
}
