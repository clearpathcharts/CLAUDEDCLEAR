/**
 * ClearPath Trader — Content Moderation Blocklist (Backend)
 * ----------------------------------------------------------------------------
 * Layered moderation for user-generated text and outbound marketing safety.
 *
 * Level 1 — HARD BLOCK: marketing claim phrases + explicit sexual/spam terms
 * Level 2 — SPAM SIGNALS: repeated phrases, excessive links, advertising spam
 * Level 3 — CONTEXT FLAG: ambiguous words (breast, adult, virgin, market
 *           penetration, etc.) — do NOT hard-block alone; flag for review
 * Level 4 — RATE LIMIT: track violators by key (uid / IP) in-memory
 * Level 5 — ESCALATION: mute / suspend after configurable violation count
 *
 * IMPORTANT:
 * - Legal/educational text that *discusses* prohibited claims (e.g. "we do not
 *   guarantee profits") is allowed when it appears in a clear negation context.
 * - Ambiguous finance terms (penetration, oral, adult membership) are flagged,
 *   not auto-blocked, unless paired with sexual spam signals.
 *
 * Review this list periodically — language evolves.
 */

export type ModerationCategory =
  | 'marketing_claim'
  | 'sexual_explicit'
  | 'sexual_slang'
  | 'sexual_act'
  | 'adult_industry'
  | 'hookup_spam'
  | 'spam_phrase'
  | 'context_flag'
  | 'spam_signal';

export type ModerationAction = 'allow' | 'block' | 'flag' | 'mute' | 'suspend';

export interface ModerationHit {
  term: string;
  category: ModerationCategory;
  severity: 'block' | 'flag';
}

export interface ModerationResult {
  clean: boolean;
  action: ModerationAction;
  hits: ModerationHit[];
  normalized: string;
  reasons: string[];
  violationCount?: number;
}

export interface ScanOptions {
  /** Actor key for rate-limit / escalation (uid, IP, session). */
  actorKey?: string;
  /** Also scan for marketing claims (default true). */
  checkMarketing?: boolean;
  /** Also scan for sexual / hookup spam (default true). */
  checkSexual?: boolean;
  /** Apply Level 2 spam heuristics (default true). */
  checkSpamSignals?: boolean;
  /** Record a Level 4 violation when blocked (default true). */
  recordViolation?: boolean;
}

// ---------------------------------------------------------------------------
// Level 1 — Marketing / performance claims (NEVER in marketing, bios, UGC)
// ---------------------------------------------------------------------------
export const MARKETING_CLAIM_PHRASES: string[] = [
  // User-supplied
  'promise',
  'guarantee',
  'guaranteed',
  'assured',
  'risk-free',
  'risk free',
  'foolproof',
  "can't lose",
  'cant lose',
  'cannot lose',
  'win every time',
  'always profitable',
  'never lose',
  'certain returns',
  'predict the market',
  'beat the market',
  'get rich',
  'easy money',
  'sure thing',
  'guaranteed income',
  'guaranteed profits',
  'guaranteed success',
  'no risk',
  'financial freedom',
  'we know where the market is going',
  'we always know',
  'we never miss',
  'zero risk',
  'safe investment',
  // Additional common FTC / trading-hype phrases
  'riskless',
  'no downside',
  'unlimited profits',
  'unlimited returns',
  'double your money',
  'triple your money',
  '100% win rate',
  '100 percent win rate',
  'never fail',
  'never fails',
  'always wins',
  'always win',
  'surefire',
  'sure-fire',
  "can't miss",
  'cant miss',
  'cannot miss',
  "can't go wrong",
  'cant go wrong',
  'millionaire overnight',
  'get rich quick',
  'get rich fast',
  'instant wealth',
  'passive income guaranteed',
  'no loss',
  'no losses',
  'never lose money',
  'lock in guaranteed',
  'guaranteed win',
  'guaranteed winner',
  'guaranteed signal',
  'signals that never lose',
  'strategy that never loses',
  'proven never to lose',
  'print money',
  'free money',
  'easy riches',
  'financial independence overnight',
  'guaranteed roi',
  'guaranteed return',
  'returns are guaranteed',
  'profits are guaranteed',
  'income is guaranteed',
  'cannot lose money',
  'will make you rich',
  'make you a millionaire',
  'hot tip guaranteed',
  'insider guaranteed',
  'no risk of loss',
  'zero chance of loss',
  'always in profit',
  'never in the red',
  'set and forget wealth',
  'wealth without risk',
  'profit without risk',
  'trade without risk',
];

// ---------------------------------------------------------------------------
// Level 1 — Sexual / explicit / industry / hookup (HARD BLOCK)
// ---------------------------------------------------------------------------
export const SEXUAL_EXPLICIT_TERMS: string[] = [
  // Standalone "sex" is Level-3 soft-flag (gender / demographics). Compounds
  // like "sex chat", "webcam sex", "looking for sex" remain hard-blocked below.
  'sexual',
  'sexy',
  'erotic',
  'erotica',
  'porn',
  'porno',
  'pornography',
  'xxx',
  'nsfw',
  'fetish',
  'kink',
  'bdsm',
  'hentai',
  'rule34',
  'rule 34',
];

export const SEXUAL_BODY_TERMS: string[] = [
  'penis',
  'vagina',
  'vulva',
  'clitoris',
  'boob',
  'boobs',
  'tit',
  'tits',
  'nipple',
  'nipples',
  'testicle',
  'testicles',
  'scrotum',
  'genitals',
  'genital',
  'pubic',
];

export const SEXUAL_SLANG_TERMS: string[] = [
  'dick',
  'cock',
  'pussy',
  'cunt',
  'asshole',
  'slut',
  'whore',
  'hoe',
  'cum',
  'cumming',
  'jizz',
  'semen',
  'ejaculate',
  'orgasm',
  'masturbate',
  'masturbation',
  'blowjob',
  'handjob',
  'rimjob',
  'deepthroat',
  'deep throat',
  'dildo',
  'vibrator',
  'fleshlight',
  'milf',
  'dilf',
  'nudes',
  'nude pic',
  'nude pics',
  'send nudes',
  'dick pic',
  'dickpic',
  'gooning',
  'pegging',
  'creampie',
  'squirt',
  'sexting',
  'sext',
];

export const SEXUAL_ACT_TERMS: string[] = [
  'anal',
  'intercourse',
  'fingering',
  'foreplay',
  'threesome',
  'gangbang',
  'incest',
  'bestiality',
  'webcam sex',
  'live sex',
  'free sex',
  'sex video',
  'sexvideo',
  'sex chat',
  'nude chat',
  'adult chat',
];

export const ADULT_INDUSTRY_TERMS: string[] = [
  'escort',
  'escorts',
  'stripper',
  'camgirl',
  'camboy',
  'camshow',
  'onlyfans',
  'only fans',
  'pornhub',
  'redtube',
  'xvideos',
  'xhamster',
  'brazzers',
  'chaturbate',
  'fansly',
];

export const HOOKUP_SPAM_PHRASES: string[] = [
  'hookup',
  'hookups',
  'hook up',
  'one night stand',
  'booty call',
  'friends with benefits',
  'fwb',
  'sugar daddy',
  'sugar baby',
  'horny',
  'hot singles',
  'local singles',
  'meet girls',
  'meet women',
  'lonely tonight',
  'looking for sex',
  'want sex',
  'need sex',
];

// ---------------------------------------------------------------------------
// Level 3 — Context-sensitive (FLAG only — do not hard-block alone)
// ---------------------------------------------------------------------------
export const CONTEXT_FLAG_TERMS: string[] = [
  'breast', // medical / recipes
  'breasts',
  'virgin', // olive oil, islands
  'ass', // donkey / slang — flag only
  'adult', // age / membership
  'oral', // legal oral argument
  'penetration', // market penetration
  'facial', // medical / spa
  'sex', // gender discussions — flagged here for layered review when soft mode
  'bitch', // insult / animal — flag (harder insults already blocked above as cunt etc.)
];

// Negation windows that allow discussing banned marketing claims safely
const MARKETING_NEGATION_PATTERNS: RegExp[] = [
  /\b(do\s+not|don't|dont|never|no|not|without|cannot|can't|cant)\b[\s\w]{0,40}\b(guarantee|guaranteed|promise|promises|risk[-\s]?free|assured)\b/i,
  /\b(guarantee|guaranteed|promise|promises)\b[\s\w]{0,40}\b(not|never|no)\b/i,
  /\bwe\s+do\s+not\s+(issue\s+)?guarantees?\b/i,
  /\bno\s+guarantee(s)?\b/i,
  /\bnot\s+a\s+guarantee\b/i,
  /\bwithout\s+guarantees?\b/i,
];

// ---------------------------------------------------------------------------
// Normalization — defeat spacing / leetspeak evasion
// ---------------------------------------------------------------------------
const LEET_MAP: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  '$': 's',
  '!': 'i',
};

export function normalizeForModeration(input: string): string {
  let s = (input || '').toLowerCase().normalize('NFKC');
  // strip zero-width / combining marks often used to evade filters
  s = s.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '');
  s = s.replace(/[0-9@$!]/g, (ch) => LEET_MAP[ch] ?? ch);
  // Collapse spaced/punctuated single-letter evasion only: "p o r n", "p.o.r.n", "s-e-x"
  // Do NOT remove normal spaces between whole words (that would break phrase matching).
  s = s.replace(
    /(?:^|[^a-z0-9])([a-z](?:[\s._*\-|'"`]+[a-z]){2,})(?=[^a-z0-9]|$)/g,
    (full, spaced: string) => {
      const prefix = full.slice(0, full.length - spaced.length);
      return prefix + spaced.replace(/[\s._*\-|'"`]+/g, '');
    }
  );
  // Also collapse letter+separator+letter when the whole token is short evasion (e.g. "p*rn")
  s = s.replace(/([a-z])[._*\-|'"`]+(?=[a-z])/g, '$1');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function phraseToPattern(phrase: string): RegExp {
  const parts = phrase.toLowerCase().trim().split(/\s+/).map(escapeRegex);
  // allow optional separators between words for multi-word phrases
  const body = parts.join('[\\s._\\-*]*');
  return new RegExp(`(?:^|[^a-z0-9])${body}(?:[^a-z0-9]|$)`, 'i');
}

function findPhraseHits(
  normalized: string,
  phrases: string[],
  category: ModerationCategory,
  severity: 'block' | 'flag'
): ModerationHit[] {
  const hits: ModerationHit[] = [];
  for (const phrase of phrases) {
    if (!phrase.trim()) continue;
    if (phraseToPattern(phrase).test(normalized)) {
      hits.push({ term: phrase, category, severity });
    }
  }
  return hits;
}

function hasMarketingNegation(original: string): boolean {
  return MARKETING_NEGATION_PATTERNS.some((re) => re.test(original));
}

function detectSpamSignals(original: string, normalized: string): ModerationHit[] {
  const hits: ModerationHit[] = [];
  const urlCount = (original.match(/https?:\/\/|www\./gi) || []).length;
  if (urlCount >= 3) {
    hits.push({
      term: `${urlCount} links`,
      category: 'spam_signal',
      severity: 'block',
    });
  }
  // repeated character spam / shouty hooks
  if (/(.)\1{7,}/.test(normalized)) {
    hits.push({ term: 'repeated characters', category: 'spam_signal', severity: 'flag' });
  }
  // same token repeated heavily
  const tokens = normalized.split(/\s+/).filter((t) => t.length > 3);
  if (tokens.length >= 8) {
    const freq = new Map<string, number>();
    for (const t of tokens) freq.set(t, (freq.get(t) || 0) + 1);
    for (const [t, n] of freq) {
      if (n >= 5) {
        hits.push({ term: `repeated:${t}`, category: 'spam_signal', severity: 'flag' });
        break;
      }
    }
  }
  return hits;
}

// ---------------------------------------------------------------------------
// Level 4 / 5 — in-memory violation tracking
// ---------------------------------------------------------------------------
const VIOLATION_WINDOW_MS = 24 * 60 * 60 * 1000;
const MUTE_AFTER = 3;
const SUSPEND_AFTER = 6;

interface ActorRecord {
  count: number;
  firstAt: number;
  lastAt: number;
  mutedUntil?: number;
  suspended?: boolean;
}

const actorRecords = new Map<string, ActorRecord>();

function getActor(actorKey: string): ActorRecord {
  const now = Date.now();
  let rec = actorRecords.get(actorKey);
  if (!rec || now - rec.firstAt > VIOLATION_WINDOW_MS) {
    rec = { count: 0, firstAt: now, lastAt: now };
    actorRecords.set(actorKey, rec);
  }
  return rec;
}

export function recordModerationViolation(actorKey: string): ActorRecord {
  const rec = getActor(actorKey);
  rec.count += 1;
  rec.lastAt = Date.now();
  if (rec.count >= SUSPEND_AFTER) {
    rec.suspended = true;
  } else if (rec.count >= MUTE_AFTER) {
    rec.mutedUntil = Date.now() + 60 * 60 * 1000; // 1 hour mute
  }
  actorRecords.set(actorKey, rec);
  return rec;
}

export function getActorModerationState(actorKey: string): {
  muted: boolean;
  suspended: boolean;
  count: number;
} {
  const rec = actorRecords.get(actorKey);
  if (!rec) return { muted: false, suspended: false, count: 0 };
  if (Date.now() - rec.firstAt > VIOLATION_WINDOW_MS) {
    actorRecords.delete(actorKey);
    return { muted: false, suspended: false, count: 0 };
  }
  const muted = !!(rec.mutedUntil && rec.mutedUntil > Date.now());
  return { muted, suspended: !!rec.suspended, count: rec.count };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export function scanText(input: string, options: ScanOptions = {}): ModerationResult {
  const {
    actorKey,
    checkMarketing = true,
    checkSexual = true,
    checkSpamSignals = true,
    recordViolation = true,
  } = options;

  const original = input ?? '';
  const normalized = normalizeForModeration(original);
  const hits: ModerationHit[] = [];
  const reasons: string[] = [];

  if (actorKey) {
    const state = getActorModerationState(actorKey);
    if (state.suspended) {
      return {
        clean: false,
        action: 'suspend',
        hits: [],
        normalized,
        reasons: ['Account suspended for repeated moderation violations.'],
        violationCount: state.count,
      };
    }
    if (state.muted) {
      return {
        clean: false,
        action: 'mute',
        hits: [],
        normalized,
        reasons: ['Account temporarily muted after repeated moderation violations.'],
        violationCount: state.count,
      };
    }
  }

  if (checkMarketing) {
    const marketingHits = findPhraseHits(
      normalized,
      MARKETING_CLAIM_PHRASES,
      'marketing_claim',
      'block'
    );
    // Allow clear educational negations ("we do not guarantee profits")
    if (marketingHits.length && hasMarketingNegation(original)) {
      // keep as soft flags only when negation present
      for (const h of marketingHits) {
        hits.push({ ...h, severity: 'flag', category: 'context_flag' });
      }
    } else {
      hits.push(...marketingHits);
    }
  }

  if (checkSexual) {
    hits.push(
      ...findPhraseHits(normalized, SEXUAL_EXPLICIT_TERMS, 'sexual_explicit', 'block'),
      ...findPhraseHits(normalized, SEXUAL_BODY_TERMS, 'sexual_explicit', 'block'),
      ...findPhraseHits(normalized, SEXUAL_SLANG_TERMS, 'sexual_slang', 'block'),
      ...findPhraseHits(normalized, SEXUAL_ACT_TERMS, 'sexual_act', 'block'),
      ...findPhraseHits(normalized, ADULT_INDUSTRY_TERMS, 'adult_industry', 'block'),
      ...findPhraseHits(normalized, HOOKUP_SPAM_PHRASES, 'hookup_spam', 'block')
    );
    // Level 3 flags (never sole reason to block unless paired with block hits)
    hits.push(
      ...findPhraseHits(normalized, CONTEXT_FLAG_TERMS, 'context_flag', 'flag')
    );
  }

  if (checkSpamSignals) {
    hits.push(...detectSpamSignals(original, normalized));
  }

  const blockHits = hits.filter((h) => h.severity === 'block');
  const flagHits = hits.filter((h) => h.severity === 'flag');

  if (blockHits.length) {
    for (const h of blockHits) {
      reasons.push(`Blocked ${h.category}: "${h.term}"`);
    }
    let violationCount: number | undefined;
    let action: ModerationAction = 'block';
    if (actorKey && recordViolation) {
      const rec = recordModerationViolation(actorKey);
      violationCount = rec.count;
      if (rec.suspended) action = 'suspend';
      else if (rec.mutedUntil && rec.mutedUntil > Date.now()) action = 'mute';
    }
    return { clean: false, action, hits, normalized, reasons, violationCount };
  }

  if (flagHits.length) {
    for (const h of flagHits) {
      reasons.push(`Flagged for review (${h.category}): "${h.term}"`);
    }
    return { clean: true, action: 'flag', hits, normalized, reasons };
  }

  return { clean: true, action: 'allow', hits: [], normalized, reasons: [] };
}

/**
 * Express-friendly helper: returns HTTP-ready error payload when blocked.
 */
export function assertCleanText(
  text: string,
  options?: ScanOptions
): { ok: true; result: ModerationResult } | { ok: false; status: number; body: Record<string, unknown> } {
  const result = scanText(text, options);
  if (result.action === 'suspend') {
    return {
      ok: false,
      status: 403,
      body: {
        error: 'content_suspended',
        message: 'Your account is suspended from posting due to repeated policy violations.',
        reasons: result.reasons,
      },
    };
  }
  if (result.action === 'mute') {
    return {
      ok: false,
      status: 429,
      body: {
        error: 'content_muted',
        message: 'You are temporarily muted from posting due to repeated policy violations.',
        reasons: result.reasons,
      },
    };
  }
  if (!result.clean || result.action === 'block') {
    return {
      ok: false,
      status: 422,
      body: {
        error: 'content_blocked',
        message:
          'This text contains prohibited marketing claims or explicit/spam content and cannot be submitted on ClearPath Trader.',
        reasons: result.reasons,
        hits: result.hits.filter((h) => h.severity === 'block').map((h) => ({
          term: h.term,
          category: h.category,
        })),
      },
    };
  }
  return { ok: true, result };
}

/**
 * Middleware factory: scan listed string fields on req.body.
 * Usage: app.post('/path', moderateBodyFields('content', 'question'), handler)
 */
export function moderateBodyFields(...fields: string[]) {
  return (req: any, res: any, next: any) => {
    const actorKey =
      req.body?.uid ||
      req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      req.ip ||
      'anonymous';

    for (const field of fields) {
      const value = req.body?.[field];
      if (typeof value !== 'string' || !value.trim()) continue;
      const check = assertCleanText(value, { actorKey });
      if (check.ok === false) {
        return res.status(check.status).json(check.body);
      }
      // Attach flags for downstream logging without blocking
      if (check.result.action === 'flag') {
        req.contentModerationFlags = check.result;
      }
    }
    return next();
  };
}

/** Quick self-test for startup / unit smoke */
export function runContentModerationSelfTest(): { passed: number; failed: string[] } {
  const failed: string[] = [];
  let passed = 0;

  const expectBlock = (text: string, label: string) => {
    const r = scanText(text, { recordViolation: false });
    if (r.clean) failed.push(`expected block: ${label}`);
    else passed += 1;
  };
  const expectAllow = (text: string, label: string) => {
    const r = scanText(text, { recordViolation: false });
    if (!r.clean) failed.push(`expected allow: ${label} → ${r.reasons.join('; ')}`);
    else passed += 1;
  };

  expectBlock('Guaranteed profits every week', 'marketing guarantee');
  expectBlock('This is risk-free trading', 'risk-free');
  expectBlock('Join my OnlyFans', 'onlyfans');
  expectBlock('hot singles in your area', 'hookup spam');
  expectBlock('p.o.r.n video free', 'evasion porn');
  expectBlock('sex chat tonight', 'sex chat phrase');
  expectBlock('Beat the market with zero risk', 'beat + zero risk');
  expectAllow('We do not guarantee profits. Trading involves risk.', 'negated guarantee');
  expectAllow('Market penetration improved for the product line.', 'market penetration');
  expectAllow('Adult membership is for users 18+.', 'adult membership');
  expectAllow('Biological sex is a demographic factor in some studies.', 'gender sex');
  expectAllow('Studying support and resistance on the chart.', 'normal trading text');

  return { passed, failed };
}
