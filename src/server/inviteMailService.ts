/**
 * CEO one-click Private Login invite emails.
 * Builds the mail-merge list from durable invites + private accounts.
 * Sends via SMTP (same transporter as registration emails).
 */
import fs from 'node:fs';
import path from 'node:path';
import { generateActivationKey, normalizeEmail } from './activationKey';
import {
  sendPasswordResetEmail,
  sendPrivateLoginInviteEmail,
  isSmtpConfigured,
  verifySmtpTransport,
} from './registrationEmail';
import {
  assertDurablePrivateWritesAllowed,
  findPrivateUserByEmail,
  listPrivateMembersSafe,
  resetPrivateUserPassword,
} from './privateAuthService';
import {
  generateTempPassword,
  listFounderInvites,
  recordFounderInvite,
} from './waitlistConvertService';
import { getAdminFirestore } from './firebaseAdmin';
import { getRegistrationEmailBlock } from './identityRisk';

const SEND_LOG_COLLECTION = 'private_account_invite_sends';
const SEND_LOG_DIR = path.join(process.cwd(), 'data', 'private_accounts');
const SEND_LOG_FILE = 'invite_send_log.json';
const SITE_ORIGIN = 'https://clearpathtrader.com';
const AFFILIATE_TERMS_URL = `${SITE_ORIGIN}/affiliate-terms`;

export type InviteMailRow = {
  email: string;
  firstName: string;
  displayName: string;
  uid: string;
  tempPassword?: string;
  activationKey?: string;
  hasPrivateAccount: boolean;
  inviteCreatedAt?: string;
  activateUrl: string;
  affiliateTermsUrl: string;
  subject: string;
  body: string;
  sendStatus: 'ready' | 'sent' | 'needs_password' | 'skipped_junk' | 'error';
  lastSentAt?: string;
  nameFlag?: string;
};

export type InviteMailSendResult = {
  ok: boolean;
  email: string;
  sendStatus: InviteMailRow['sendStatus'];
  smtpConfigured: boolean;
  message: string;
  tempPasswordIssued?: boolean;
  /** Admin-only: returned so the founder can copy it if the member misses the email. */
  tempPassword?: string;
};

export const PUBLIC_FORGOT_PASSWORD_MESSAGE =
  'If that email has a Private Login, we emailed a new password. Check inbox and spam.';

export const PUBLIC_FORGOT_PASSWORD_UNAVAILABLE =
  'Password reset by email is not available yet. Contact ClearPath and we will reset your website password.';

const FORGOT_COOLDOWN_MS = 10 * 60 * 1000;
const lastPublicForgotAt = new Map<string, number>();

type SendLogEntry = {
  email: string;
  sentAt: string;
  subject: string;
};

function isJunkEmail(email: string): boolean {
  const e = normalizeEmail(email);
  if (!e.includes('@') || e.includes('$(') || e.includes('+smoke') || e.includes('recovery-probe')) {
    return true;
  }
  return getRegistrationEmailBlock(e).blocked;
}

/** Handles / email-local-parts are not real names for "Hi X," greetings. */
export function friendlyFirstName(displayName: string, email: string): string {
  const raw = String(displayName || '').trim();
  const local = normalizeEmail(email).split('@')[0] || '';
  if (!raw) return 'there';
  const lower = raw.toLowerCase();
  const looksLikeHandle =
    !/\s/.test(raw) &&
    (raw === lower ||
      /[0-9_]/.test(raw) ||
      raw.length > 18 ||
      lower === local ||
      /^(bank|trader|spiritual|thebusiness|forex|probe|recovery)/i.test(raw));
  if (looksLikeHandle) return 'there';
  return raw.split(/\s+/)[0] || 'there';
}

function buildActivateUrl(email: string): string {
  return `${SITE_ORIGIN}/activate?email=${encodeURIComponent(normalizeEmail(email))}`;
}

function buildEmailCopy(params: {
  firstName: string;
  email: string;
  tempPassword?: string;
}): { subject: string; body: string } {
  const activateUrl = buildActivateUrl(params.email);
  if (params.tempPassword) {
    const subject = 'Your ClearPath Private Login is ready';
    const body = [
      `Hi ${params.firstName},`,
      '',
      'Your ClearPath Private Login is ready.',
      '',
      `Login: ${activateUrl}`,
      `Email: ${normalizeEmail(params.email)}`,
      `Temporary password: ${params.tempPassword}`,
      '',
      'Please sign in, update your password in your profile, and keep this email private.',
      '',
      `Affiliate program (optional): ${AFFILIATE_TERMS_URL}`,
      '',
      '— Rick Floyd',
      'ClearPath Trader',
    ].join('\n');
    return { subject, body };
  }

  const subject = 'ClearPath Trader — account check-in';
  const body = [
    `Hi ${params.firstName},`,
    '',
    'Quick check-in from ClearPath Trader.',
    '',
    `Your login desk: ${activateUrl}`,
    '',
    'If you have any trouble signing in, reply to this email and we will reset access for you.',
    '',
    '— Rick Floyd',
    'ClearPath Trader',
  ].join('\n');
  return { subject, body };
}

function ensureSendLogDir() {
  if (!fs.existsSync(SEND_LOG_DIR)) fs.mkdirSync(SEND_LOG_DIR, { recursive: true });
}

function readLocalSendLog(): SendLogEntry[] {
  ensureSendLogDir();
  const filePath = path.join(SEND_LOG_DIR, SEND_LOG_FILE);
  if (!fs.existsSync(filePath)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return Array.isArray(parsed) ? (parsed as SendLogEntry[]) : [];
  } catch {
    return [];
  }
}

function writeLocalSendLog(rows: SendLogEntry[]) {
  ensureSendLogDir();
  fs.writeFileSync(path.join(SEND_LOG_DIR, SEND_LOG_FILE), JSON.stringify(rows, null, 2), 'utf8');
}

async function loadSendLogMap(): Promise<Map<string, SendLogEntry>> {
  const map = new Map<string, SendLogEntry>();
  for (const row of readLocalSendLog()) {
    map.set(normalizeEmail(row.email), row);
  }
  const db = getAdminFirestore();
  if (db) {
    try {
      const snap = await db.collection(SEND_LOG_COLLECTION).limit(2000).get();
      for (const doc of snap.docs) {
        const d = doc.data() as Record<string, unknown>;
        const email = normalizeEmail(String(d.email || doc.id));
        map.set(email, {
          email,
          sentAt: String(d.sentAt || ''),
          subject: String(d.subject || ''),
        });
      }
    } catch (err) {
      console.warn('[inviteMail] Firestore send-log read failed:', err);
    }
  }
  return map;
}

async function recordSend(entry: SendLogEntry): Promise<void> {
  const rows = readLocalSendLog().filter((r) => normalizeEmail(r.email) !== entry.email);
  rows.push(entry);
  writeLocalSendLog(rows);
  const db = getAdminFirestore();
  if (!db) return;
  try {
    await db.collection(SEND_LOG_COLLECTION).doc(entry.email).set(entry, { merge: true });
  } catch (err) {
    console.warn('[inviteMail] Firestore send-log write failed:', err);
  }
}

export async function listInviteMailRows(): Promise<{
  ok: true;
  smtpConfigured: boolean;
  count: number;
  readyCount: number;
  rows: InviteMailRow[];
}> {
  const [invitesListed, privateListed, sendLog] = await Promise.all([
    listFounderInvites(),
    listPrivateMembersSafe(),
    loadSendLogMap(),
  ]);

  const inviteByEmail = new Map(
    invitesListed.invites.map((inv) => [normalizeEmail(inv.email), inv] as const)
  );
  const memberByEmail = new Map(
    privateListed.members.map((m) => [normalizeEmail(m.email), m] as const)
  );

  const emails = new Set<string>([...inviteByEmail.keys(), ...memberByEmail.keys()]);
  const rows: InviteMailRow[] = [];

  for (const email of [...emails].sort()) {
    if (isJunkEmail(email)) {
      rows.push({
        email,
        firstName: 'there',
        displayName: email.split('@')[0] || email,
        uid: memberByEmail.get(email)?.uid || '',
        hasPrivateAccount: memberByEmail.has(email),
        activateUrl: buildActivateUrl(email),
        affiliateTermsUrl: AFFILIATE_TERMS_URL,
        subject: '',
        body: '',
        sendStatus: 'skipped_junk',
        nameFlag: 'junk_email',
      });
      continue;
    }

    const invite = inviteByEmail.get(email);
    const member = memberByEmail.get(email);
    const displayName = String(invite?.displayName || member?.displayName || email.split('@')[0] || '');
    const firstName = friendlyFirstName(displayName, email);
    const nameFlag = firstName === 'there' ? 'handle_not_real_name' : undefined;
    const tempPassword = invite?.tempPassword;
    const copy = buildEmailCopy({ firstName, email, tempPassword });
    const sent = sendLog.get(email);

    let sendStatus: InviteMailRow['sendStatus'] = 'ready';
    if (!tempPassword) sendStatus = 'needs_password';
    if (sent?.sentAt) sendStatus = 'sent';

    rows.push({
      email,
      firstName,
      displayName,
      uid: String(invite?.uid || member?.uid || ''),
      tempPassword,
      activationKey: invite?.activationKey,
      hasPrivateAccount: Boolean(member),
      inviteCreatedAt: invite?.createdAt,
      activateUrl: buildActivateUrl(email),
      affiliateTermsUrl: AFFILIATE_TERMS_URL,
      subject: copy.subject,
      body: copy.body,
      sendStatus,
      lastSentAt: sent?.sentAt,
      nameFlag,
    });
  }

  // Prefer actionable people first: ready, needs_password, sent, junk last
  const rank: Record<InviteMailRow['sendStatus'], number> = {
    ready: 0,
    needs_password: 1,
    sent: 2,
    error: 3,
    skipped_junk: 4,
  };
  rows.sort((a, b) => rank[a.sendStatus] - rank[b.sendStatus] || a.email.localeCompare(b.email));

  return {
    ok: true,
    smtpConfigured: isSmtpConfigured(),
    count: rows.length,
    readyCount: rows.filter((r) => r.sendStatus === 'ready' || r.sendStatus === 'needs_password').length,
    rows,
  };
}

/**
 * One-click: ensure temp password exists (reset if needed), then SMTP-send the invite.
 * forceFreshPassword: always mint a new password first (use this for "they forgot").
 */
export async function sendInviteMailToEmail(
  rawEmail: string,
  opts?: { forceFreshPassword?: boolean; kind?: 'invite' | 'reset' }
): Promise<InviteMailSendResult> {
  const email = normalizeEmail(rawEmail);
  const forceFresh = Boolean(opts?.forceFreshPassword);
  const kind = opts?.kind || (forceFresh ? 'reset' : 'invite');
  if (!email.includes('@') || isJunkEmail(email)) {
    return {
      ok: false,
      email,
      sendStatus: 'skipped_junk',
      smtpConfigured: isSmtpConfigured(),
      message: 'Skipped junk / test email.',
    };
  }

  if (!isSmtpConfigured()) {
    if (!forceFresh) {
      return {
        ok: false,
        email,
        sendStatus: 'error',
        smtpConfigured: false,
        message:
          'SMTP is not configured on the server (SMTP_HOST / SMTP_USER / SMTP_PASS). Emails cannot send until those env vars are set on Cloud Run.',
      };
    }
    // Still mint a website password so the founder can copy it even when mail is down.
    try {
      assertDurablePrivateWritesAllowed();
      const existing = await findPrivateUserByEmail(email);
      if (!existing) {
        return {
          ok: false,
          email,
          sendStatus: 'error',
          smtpConfigured: false,
          message: 'No Private Login account for this email. SMTP is also not configured.',
        };
      }
      const tempPassword = generateTempPassword();
      const activationKey = generateActivationKey();
      await resetPrivateUserPassword({
        email,
        password: tempPassword,
        tempPassword,
      });
      await recordFounderInvite({
        email: existing.email,
        displayName: existing.displayName,
        uid: existing.uid,
        activationKey,
        tempPassword,
        createdAt: new Date().toISOString(),
        waitlistSource: 'ceo_email_reset_smtp_down',
      });
      return {
        ok: true,
        email,
        sendStatus: 'needs_password',
        smtpConfigured: false,
        tempPasswordIssued: true,
        tempPassword,
        message:
          `Email cannot send (SMTP is not set on Cloud Run). Website password WAS reset. Copy this and send it to them privately: ${tempPassword}`,
      };
    } catch (err: any) {
      return {
        ok: false,
        email,
        sendStatus: 'error',
        smtpConfigured: false,
        message: err?.message || 'SMTP is not configured and password reset failed.',
      };
    }
  }

  assertDurablePrivateWritesAllowed();

  const existing = await findPrivateUserByEmail(email);
  if (!existing) {
    return {
      ok: false,
      email,
      sendStatus: 'error',
      smtpConfigured: true,
      message: 'No Private Login account for this email. Release waitlist / restore members first.',
    };
  }

  const listed = await listFounderInvites();
  let invite = listed.invites.find((i) => normalizeEmail(i.email) === email);
  let tempPasswordIssued = false;

  if (forceFresh || !invite?.tempPassword) {
    const tempPassword = generateTempPassword();
    const activationKey = generateActivationKey();
    await resetPrivateUserPassword({
      email,
      password: tempPassword,
      tempPassword,
    });
    await recordFounderInvite({
      email: existing.email,
      displayName: existing.displayName,
      uid: existing.uid,
      activationKey,
      tempPassword,
      createdAt: new Date().toISOString(),
      waitlistSource: forceFresh ? 'ceo_email_reset' : 'ceo_one_click_send',
    });
    invite = {
      email: existing.email,
      displayName: existing.displayName,
      uid: existing.uid,
      activationKey,
      tempPassword,
      createdAt: new Date().toISOString(),
      waitlistSource: forceFresh ? 'ceo_email_reset' : 'ceo_one_click_send',
    };
    tempPasswordIssued = true;
  }

  const firstName = friendlyFirstName(invite.displayName || existing.displayName, email);
  const copy = buildEmailCopy({
    firstName,
    email,
    tempPassword: invite.tempPassword,
  });

  const sent =
    kind === 'reset'
      ? await sendPasswordResetEmail({
          to: email,
          firstName,
          activateUrl: buildActivateUrl(email),
          tempPassword: invite.tempPassword!,
        })
      : await sendPrivateLoginInviteEmail({
          to: email,
          firstName,
          activateUrl: buildActivateUrl(email),
          tempPassword: invite.tempPassword!,
          affiliateTermsUrl: AFFILIATE_TERMS_URL,
        });

  if (!sent) {
    return {
      ok: false,
      email,
      sendStatus: 'error',
      smtpConfigured: true,
      message: `SMTP send failed. Check Cloud Run SMTP credentials / logs.${
        invite.tempPassword ? ` Temp password (send privately): ${invite.tempPassword}` : ''
      }`,
      tempPasswordIssued,
      tempPassword: invite.tempPassword,
    };
  }

  await recordSend({
    email,
    sentAt: new Date().toISOString(),
    subject: kind === 'reset' ? 'Your ClearPath password reset' : copy.subject,
  });

  return {
    ok: true,
    email,
    sendStatus: 'sent',
    smtpConfigured: true,
    message: tempPasswordIssued
      ? `Emailed a new password to ${email}. Temp password (if they miss the mail): ${invite.tempPassword}`
      : `Sent login email to ${email}.`,
    tempPasswordIssued,
    tempPassword: invite.tempPassword,
  };
}

/**
 * Public forgot-password. Always the same message. Never leaks whether the account exists.
 * Does not reset unless we can actually email the new password.
 */
export async function requestPublicPasswordReset(rawEmail: string): Promise<{
  ok: true;
  message: string;
}> {
  const email = normalizeEmail(rawEmail);
  if (!email.includes('@')) {
    return { ok: true, message: PUBLIC_FORGOT_PASSWORD_MESSAGE };
  }

  const last = lastPublicForgotAt.get(email) || 0;
  if (Date.now() - last < FORGOT_COOLDOWN_MS) {
    return { ok: true, message: PUBLIC_FORGOT_PASSWORD_MESSAGE };
  }
  lastPublicForgotAt.set(email, Date.now());

  if (!isSmtpConfigured()) {
    console.warn('[forgot-password] SMTP not configured — no email sent.');
    return { ok: true, message: PUBLIC_FORGOT_PASSWORD_UNAVAILABLE };
  }

  // The reset mints the new password before the message goes out, so a dead relay
  // would rotate a member's password into an email that never arrives and lock
  // them out. Prove the relay authenticates before touching the account.
  const transport = await verifySmtpTransport();
  if (!transport.ok) {
    console.error(
      `[forgot-password] Mail relay unhealthy (${transport.error}) — refusing to rotate the password for ${email}.`
    );
    return { ok: true, message: PUBLIC_FORGOT_PASSWORD_UNAVAILABLE };
  }

  try {
    const existing = await findPrivateUserByEmail(email);
    if (!existing || isJunkEmail(email)) {
      return { ok: true, message: PUBLIC_FORGOT_PASSWORD_MESSAGE };
    }
    const result = await sendInviteMailToEmail(email, { forceFreshPassword: true, kind: 'reset' });
    if (!result.ok) {
      // Password already rotated. Recoverable: the temp password is on the founder
      // invite record and in Stripe metadata, so surface it loudly for support.
      console.error(
        `[forgot-password] Password for ${email} was rotated but the email FAILED to send ` +
          `(${result.message}). Recover the temp password from CEO Dashboard → invites.`
      );
    }
  } catch (err) {
    console.error('[forgot-password] Reset/send failed:', err);
  }

  return { ok: true, message: PUBLIC_FORGOT_PASSWORD_MESSAGE };
}

/** Test helper. */
export function _resetPublicForgotCooldownForTests() {
  lastPublicForgotAt.clear();
}
