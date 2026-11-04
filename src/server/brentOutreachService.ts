/**
 * Brent (CCO) investor outreach — draft + optional SMTP send.
 * Separate from CEO Marketing Department. From-address uses BRENT_OUTREACH_EMAIL.
 * Successful sends are logged for the CEO daily bento (who / what / when).
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  BRENT_OUTREACH_SCREENSHOTS,
  TECHNOLOGY_OPPORTUNITY_URL,
  brentFromHeader,
  brentOutreachConfigured,
  brentOutreachEmail,
} from '../content/brentOutreach';
import { PRODUCT_LEGAL_NAME, PRODUCT_NAME, PRODUCT_URL } from '../content/productIdentity';
import {
  getInvestorCatalog,
  findInvestorSeed,
  buildInvestorDraftLetter,
  type InvestorSeed,
} from './investorDesk';
import { pacificDateKey } from './dailyOpsCatalog';
import { getAdminFirestore } from './firebaseAdmin';
import { esc, isSmtpConfigured, sendTransactionalEmail } from './registrationEmail';

const SEND_LOG_DIR = path.join(process.cwd(), 'data', 'communications');
const SEND_LOG_FILE = 'brent_outreach_sends.json';
const SEND_LOG_COLLECTION = 'brent_outreach_sends';
const MAX_LOG_ENTRIES = 2000;

export type BrentOutreachSendRecord = {
  id: string;
  sentAt: string;
  /** Pacific calendar day YYYY-MM-DD */
  dayKey: string;
  from: string;
  to: string;
  investorId: string;
  investorName: string;
  subject: string;
  /** Plain-text body (what was said) */
  bodyText: string;
};

export type BrentOutreachDraft = {
  investorId: string;
  investorName: string;
  to: string | null;
  subject: string;
  text: string;
  html: string;
  opportunityUrl: string;
  siteUrl: string;
  screenshots: typeof BRENT_OUTREACH_SCREENSHOTS;
  fromConfigured: boolean;
  fromPreview: string;
  smtpConfigured: boolean;
};

function subjectFor(inv: InvestorSeed): string {
  return `${PRODUCT_NAME} — technology & investment opportunity (live product)`;
}

function letterBodyForBrent(inv: InvestorSeed): string {
  // Reuse the founder letter’s factual middle, then wrap with Brent CCO voice.
  const base = buildInvestorDraftLetter(inv);
  const lines = base.split('\n');
  const sincereIdx = lines.findIndex((l) => /^Sincerely,?$/i.test(l.trim()));
  const subjectIdx = lines.findIndex((l) => /^Subject:/i.test(l));
  const core = lines
    .slice(subjectIdx >= 0 ? subjectIdx + 1 : 0, sincereIdx >= 0 ? sincereIdx : undefined)
    .join('\n')
    .replace(/^I am Richard A\. Floyd[\s\S]*?shipped at \S+\.\s*/m, '')
    .trim();

  return [
    `I am Brent, Chief Communications Officer for ${PRODUCT_LEGAL_NAME}. I am writing on behalf of our founder, Richard A. Floyd, to introduce ${PRODUCT_NAME} — a founder-developed market-analysis and education platform already live at ${PRODUCT_URL}.`,
    '',
    core,
    '',
    'We are speaking with venture capitalists and investment bankers about capital to validate, commercialize, distribute, and scale technology that already exists — proprietary methodology, geometric pattern measurement, native chart tools, and an extensible software architecture — not to finance an undeveloped idea.',
    '',
    'For a technology and investment due-diligence overview — including an honest preliminary valuation framework, SWOT, current commercial position, and verification caveats — please read:',
    TECHNOLOGY_OPPORTUNITY_URL,
    '',
    `Live product: ${PRODUCT_URL}`,
    '',
    'Screenshots of the live desks are included in the HTML version of this note.',
    '',
    'Sincerely,',
    '',
    'Brent',
    `Chief Communications Officer, ${PRODUCT_LEGAL_NAME}`,
    PRODUCT_URL,
  ].join('\n');
}

function buildHtml(inv: InvestorSeed, textBody: string): string {
  const paras = textBody
    .split(/\n\n+/)
    .map((p) => `<p style="margin:0 0 14px;line-height:1.55;color:#1a1a1a;font-size:15px;">${esc(p).replace(/\n/g, '<br/>')}</p>`)
    .join('');

  const shots = BRENT_OUTREACH_SCREENSHOTS.map(
    (s) => `
      <figure style="margin:0 0 18px;padding:0;">
        <img src="${esc(s.src)}" alt="${esc(s.alt)}" width="560" style="display:block;width:100%;max-width:560px;height:auto;border:1px solid #ddd;" />
        <figcaption style="margin-top:6px;font-size:12px;color:#555;">${esc(s.caption)}</figcaption>
      </figure>`
  ).join('');

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <div style="background:#0a0a0a;color:#fff;padding:18px 20px;">
      <div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#00E5FF;">ClearPath Trader</div>
      <div style="font-size:18px;font-weight:800;margin-top:6px;">Technology &amp; Investment Opportunity</div>
    </div>
    <div style="background:#ffffff;padding:22px 20px;">
      ${paras}
      <hr style="border:none;border-top:1px solid #e5e5e5;margin:22px 0;" />
      <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#666;">Website screenshots</p>
      ${shots}
      <p style="margin:18px 0 0;font-size:13px;">
        <a href="${esc(TECHNOLOGY_OPPORTUNITY_URL)}" style="color:#0066aa;">Technology, Innovation &amp; Investment Opportunity</a>
        &nbsp;·&nbsp;
        <a href="${esc(PRODUCT_URL)}" style="color:#0066aa;">${esc(PRODUCT_URL)}</a>
      </p>
    </div>
    <p style="margin:14px 8px 0;font-size:11px;color:#888;line-height:1.4;">
      Analytical software and education. Not a brokerage. Not investment advice. Not a trading-signal service.
    </p>
  </div>
</body></html>`;
}

export function listBrentInvestorTargets(limit = 200): Array<{
  id: string;
  name: string;
  kind: string;
  website: string;
  outreachEmail: string | null;
  stage: string;
}> {
  return getInvestorCatalog()
    .slice(0, Math.max(1, Math.min(limit, 1000)))
    .map((inv) => ({
      id: inv.id,
      name: inv.name,
      kind: inv.kind,
      website: inv.website,
      outreachEmail: inv.outreachEmail || null,
      stage: inv.stage,
    }));
}

export function buildBrentOutreachDraft(investorId: string): BrentOutreachDraft {
  const inv = findInvestorSeed(investorId);
  if (!inv) {
    throw Object.assign(new Error('Unknown investor id'), { status: 404 });
  }
  const text = letterBodyForBrent(inv);
  const subject = subjectFor(inv);
  const html = buildHtml(inv, text);
  const fromConfigured = brentOutreachConfigured();
  return {
    investorId: inv.id,
    investorName: inv.name,
    to: inv.outreachEmail || null,
    subject,
    text: `Subject: ${subject}\n\n${text}`,
    html,
    opportunityUrl: TECHNOLOGY_OPPORTUNITY_URL,
    siteUrl: PRODUCT_URL,
    screenshots: BRENT_OUTREACH_SCREENSHOTS,
    fromConfigured,
    fromPreview: fromConfigured ? brentFromHeader() : 'Brent From unavailable',
    smtpConfigured: isSmtpConfigured(),
  };
}

function ensureSendLogDir() {
  if (!fs.existsSync(SEND_LOG_DIR)) fs.mkdirSync(SEND_LOG_DIR, { recursive: true });
}

function readLocalSendLog(): BrentOutreachSendRecord[] {
  ensureSendLogDir();
  const fp = path.join(SEND_LOG_DIR, SEND_LOG_FILE);
  if (!fs.existsSync(fp)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(fp, 'utf8'));
    return Array.isArray(parsed) ? (parsed as BrentOutreachSendRecord[]) : [];
  } catch {
    return [];
  }
}

function writeLocalSendLog(rows: BrentOutreachSendRecord[]) {
  ensureSendLogDir();
  const trimmed = rows
    .slice()
    .sort((a, b) => String(b.sentAt).localeCompare(String(a.sentAt)))
    .slice(0, MAX_LOG_ENTRIES);
  fs.writeFileSync(path.join(SEND_LOG_DIR, SEND_LOG_FILE), JSON.stringify(trimmed, null, 2), 'utf8');
}

async function persistSendRecord(entry: BrentOutreachSendRecord): Promise<void> {
  const rows = readLocalSendLog().filter((r) => r.id !== entry.id);
  rows.unshift(entry);
  writeLocalSendLog(rows);
  const db = getAdminFirestore();
  if (!db) return;
  try {
    await db.collection(SEND_LOG_COLLECTION).doc(entry.id).set(entry, { merge: true });
  } catch (err) {
    console.warn('[brentOutreach] Firestore send-log write failed:', err);
  }
}

async function loadSendLogMerged(): Promise<BrentOutreachSendRecord[]> {
  const byId = new Map<string, BrentOutreachSendRecord>();
  for (const row of readLocalSendLog()) {
    if (row?.id) byId.set(row.id, row);
  }
  const db = getAdminFirestore();
  if (db) {
    try {
      // No composite index required — sort in process after merge with local.
      const snap = await db.collection(SEND_LOG_COLLECTION).limit(MAX_LOG_ENTRIES).get();
      for (const doc of snap.docs) {
        const d = doc.data() as Partial<BrentOutreachSendRecord>;
        const id = String(d.id || doc.id);
        byId.set(id, {
          id,
          sentAt: String(d.sentAt || ''),
          dayKey: String(d.dayKey || ''),
          from: String(d.from || ''),
          to: String(d.to || ''),
          investorId: String(d.investorId || ''),
          investorName: String(d.investorName || ''),
          subject: String(d.subject || ''),
          bodyText: String(d.bodyText || ''),
        });
      }
    } catch (err) {
      // Missing index / ADC — keep local copy.
      console.warn('[brentOutreach] Firestore send-log read failed:', err);
    }
  }
  return [...byId.values()].sort((a, b) => String(b.sentAt).localeCompare(String(a.sentAt)));
}

/** CEO / founder view: sends grouped by Pacific day. */
export async function listBrentOutreachSendLog(input?: {
  dayKey?: string;
  limitDays?: number;
}): Promise<{
  ok: true;
  todayKey: string;
  days: Array<{
    dayKey: string;
    count: number;
    sends: BrentOutreachSendRecord[];
  }>;
  totalSends: number;
}> {
  const todayKey = pacificDateKey();
  const all = await loadSendLogMerged();
  const filterDay = input?.dayKey ? String(input.dayKey) : '';
  const filtered = filterDay ? all.filter((r) => r.dayKey === filterDay) : all;
  const byDay = new Map<string, BrentOutreachSendRecord[]>();
  for (const row of filtered) {
    const key = row.dayKey || row.sentAt.slice(0, 10) || 'unknown';
    const list = byDay.get(key) || [];
    list.push(row);
    byDay.set(key, list);
  }
  const limitDays = Math.max(1, Math.min(Number(input?.limitDays) || 30, 90));
  const dayKeys = [...byDay.keys()].sort((a, b) => b.localeCompare(a)).slice(0, limitDays);
  const days = dayKeys.map((dayKey) => {
    const sends = (byDay.get(dayKey) || []).sort((a, b) => String(b.sentAt).localeCompare(String(a.sentAt)));
    return { dayKey, count: sends.length, sends };
  });
  return { ok: true, todayKey, days, totalSends: filtered.length };
}

export async function sendBrentOutreachEmail(input: {
  investorId: string;
  toOverride?: string;
  confirmSend: boolean;
}): Promise<{
  ok: boolean;
  sent: boolean;
  reason?: string;
  draft: BrentOutreachDraft;
  sendRecord?: BrentOutreachSendRecord;
}> {
  const draft = buildBrentOutreachDraft(input.investorId);
  const to = String(input.toOverride || draft.to || '').trim().toLowerCase();
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { ok: false, sent: false, reason: 'recipient_email_required', draft: { ...draft, to: to || null } };
  }
  if (!input.confirmSend) {
    return { ok: true, sent: false, reason: 'preview_only', draft: { ...draft, to } };
  }
  if (!draft.fromConfigured) {
    return { ok: false, sent: false, reason: 'brent_email_not_configured', draft: { ...draft, to } };
  }
  if (!draft.smtpConfigured) {
    return { ok: false, sent: false, reason: 'smtp_not_configured', draft: { ...draft, to } };
  }

  const from = brentFromHeader();
  const sent = await sendTransactionalEmail({
    to,
    subject: draft.subject,
    text: draft.text,
    html: draft.html,
    from,
  });

  if (!sent) {
    return { ok: false, sent: false, reason: 'smtp_send_failed', draft: { ...draft, to } };
  }

  const now = new Date();
  const sendRecord: BrentOutreachSendRecord = {
    id: `bos_${now.getTime()}_${crypto.randomBytes(4).toString('hex')}`,
    sentAt: now.toISOString(),
    dayKey: pacificDateKey(now),
    from,
    to,
    investorId: draft.investorId,
    investorName: draft.investorName,
    subject: draft.subject,
    bodyText: draft.text,
  };
  try {
    await persistSendRecord(sendRecord);
  } catch (err) {
    console.warn('[brentOutreach] send logged to SMTP but durable log failed:', err);
  }

  return {
    ok: true,
    sent: true,
    draft: { ...draft, to },
    sendRecord,
  };
}

export function brentOutreachStatus() {
  const localCount = readLocalSendLog().length;
  return {
    brentEmailConfigured: brentOutreachConfigured(),
    brentEmailPreview: brentOutreachConfigured() ? brentOutreachEmail().replace(/(.{2}).+(@.+)/, '$1***$2') : null,
    fromPreview: brentOutreachConfigured() ? brentFromHeader() : null,
    smtpConfigured: isSmtpConfigured(),
    opportunityUrl: TECHNOLOGY_OPPORTUNITY_URL,
    siteUrl: PRODUCT_URL,
    screenshotCount: BRENT_OUTREACH_SCREENSHOTS.length,
    investorCount: getInvestorCatalog().length,
    recordedSendsLocal: localCount,
  };
}
