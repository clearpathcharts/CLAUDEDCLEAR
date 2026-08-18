import nodemailer from 'nodemailer';

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

let transporter: nodemailer.Transporter | null = null;

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  });

  return transporter;
}

/**
 * Providers that authenticate a mailbox (Gmail, Workspace, most SMTP relays)
 * reject a From address that is not the authenticated user or a verified alias.
 * Defaulting to an unverified noreply@ domain made every send fail with
 * "Invalid sender", so fall back to the authenticated account instead.
 */
function resolveFromAddress(): string {
  const explicit = (process.env.SMTP_FROM || '').trim();
  if (explicit) return explicit;
  const user = (process.env.SMTP_USER || '').trim();
  if (user) return `ClearPath Trader <${user}>`;
  return 'ClearPath Trader <noreply@clearpathtrader.com>';
}

async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const mailer = getTransporter();
  const from = resolveFromAddress();

  if (!mailer) {
    // Never log activation keys / PII when SMTP is unset
    console.error(
      '[Registration Email] BLOCKED: no mail transport configured (SMTP_HOST/SMTP_USER/SMTP_PASS). ' +
        `Email to ${payload.to} was NOT sent: "${payload.subject}"`
    );
    return false;
  }

  try {
    await mailer.sendMail({ from, ...payload });
    console.info(`[Registration Email] Sent "${payload.subject}" to ${payload.to}`);
    return true;
  } catch (error) {
    console.error(`[Registration Email] Send FAILED to ${payload.to} from ${from}:`, error);
    return false;
  }
}

/**
 * Founder diagnostic: prove the mail path end to end instead of assuming it works.
 * `verify()` opens a real authenticated SMTP handshake, so a bad app password or
 * blocked port fails here rather than silently swallowing member emails.
 */
export async function verifySmtpTransport(): Promise<{
  ok: boolean;
  configured: boolean;
  host?: string;
  port?: number;
  user?: string;
  from: string;
  error?: string;
}> {
  const from = resolveFromAddress();
  if (!isSmtpConfigured()) {
    return {
      ok: false,
      configured: false,
      from,
      error: 'SMTP_HOST, SMTP_USER and SMTP_PASS are not all set on this server.',
    };
  }

  const mailer = getTransporter();
  const base = {
    configured: true,
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER,
    from,
  };
  if (!mailer) return { ok: false, ...base, error: 'Transport could not be created.' };

  try {
    await mailer.verify();
    return { ok: true, ...base };
  } catch (error) {
    return { ok: false, ...base, error: (error as Error)?.message || 'SMTP verify failed.' };
  }
}

/** Founder diagnostic: send a real test message to a chosen inbox. */
export async function sendMailSelfTest(to: string): Promise<boolean> {
  const stamp = new Date().toISOString();
  return sendEmail({
    to,
    subject: 'ClearPath mail self-test',
    text: `Mail transport is working. Sent ${stamp}.`,
    html: `<p>Mail transport is working.</p><p style="color:#666;">Sent ${stamp}.</p>`,
  });
}

export async function sendWaitlistConfirmationEmail(params: {
  to: string;
  firstName: string;
  activationKey: string;
  country: string;
}): Promise<boolean> {
  const subject = 'Your ClearPath Soft Launch Access Key';
  const text = [
    `Hi ${params.firstName},`,
    '',
    'Your soft launch waitlist registration is confirmed.',
    '',
    `Private activation key: ${params.activationKey}`,
    `Country: ${params.country}`,
    '',
    'Keep this key safe. You will use it to activate your trading education desk when the portal opens.',
    '',
    '— ClearPath Trader',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; background:#050505; color:#fff; padding:32px;">
      <h1 style="color:#00FFFF; text-transform:uppercase; letter-spacing:2px;">Access Key Secured</h1>
      <p>Hi ${params.firstName},</p>
      <p>Your soft launch waitlist registration is confirmed for <strong>${params.country}</strong>.</p>
      <div style="margin:24px 0; padding:20px; border:1px solid #00FFFF; border-radius:12px; background:#0a0a0a;">
        <div style="font-size:11px; color:#888; text-transform:uppercase; letter-spacing:2px;">Private Activation Key</div>
        <div style="font-size:24px; font-weight:bold; color:#FF1493; margin-top:8px; font-family:monospace;">${params.activationKey}</div>
      </div>
      <p style="color:#aaa;">Keep this key safe. You will use it to activate your account when the portal opens.</p>
      <p style="color:#666; font-size:12px;">— ClearPath Trader</p>
    </div>
  `;

  return sendEmail({ to: params.to, subject, text, html });
}

export async function sendIdentityPreregistrationEmail(params: {
  to: string;
  displayName?: string;
  tierName: string;
  activationKey: string;
}): Promise<boolean> {
  const greeting = params.displayName ? `Hi ${params.displayName}` : 'Hello';
  const subject = `Identity Pre-Registration Confirmed — ${params.tierName}`;
  const text = [
    greeting + ',',
    '',
    `Your ${params.tierName} identity verification pre-registration is saved.`,
    '',
    `Pre-registration reference: ${params.activationKey}`,
    '',
    'Payment gateway integration will be fully active within 90 days. We will notify you when billing is live.',
    '',
    '— ClearPath Trader',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; background:#050505; color:#fff; padding:32px;">
      <h1 style="color:#6366f1; text-transform:uppercase; letter-spacing:2px;">Identity Pre-Registered</h1>
      <p>${greeting},</p>
      <p>Your <strong>${params.tierName}</strong> verification tier has been reserved.</p>
      <div style="margin:24px 0; padding:20px; border:1px solid #6366f1; border-radius:12px; background:#0a0a0a;">
        <div style="font-size:11px; color:#888; text-transform:uppercase; letter-spacing:2px;">Pre-Registration Reference</div>
        <div style="font-size:22px; font-weight:bold; color:#00FFFF; margin-top:8px; font-family:monospace;">${params.activationKey}</div>
      </div>
      <p style="color:#aaa;">Payment gateway integration will be fully active within 90 days. We will email you when billing goes live.</p>
      <p style="color:#666; font-size:12px;">— ClearPath Trader</p>
    </div>
  `;

  return sendEmail({ to: params.to, subject, text, html });
}

export async function notifyAdminNewRegistration(params: {
  type: 'waitlist' | 'identity';
  email: string;
  details: string;
}): Promise<void> {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
  if (!adminEmail) return;

  await sendEmail({
    to: adminEmail,
    subject: `[ClearPath] New ${params.type} pre-registration`,
    text: `New ${params.type} registration\nEmail: ${params.email}\n${params.details}`,
    html: `<p>New <strong>${params.type}</strong> registration</p><p>Email: ${params.email}</p><pre>${params.details}</pre>`,
  });
}

/** CEO one-click Private Login invite — plain text + simple HTML. */
export async function sendPrivateLoginInviteEmail(params: {
  to: string;
  firstName: string;
  activateUrl: string;
  tempPassword: string;
  affiliateTermsUrl: string;
}): Promise<boolean> {
  const subject = 'Your ClearPath Private Login is ready';
  const text = [
    `Hi ${params.firstName},`,
    '',
    'Your ClearPath Private Login is ready.',
    '',
    `Login: ${params.activateUrl}`,
    `Email: ${params.to}`,
    `Temporary password: ${params.tempPassword}`,
    '',
    'Please sign in, update your password in your profile, and keep this email private.',
    '',
    `Affiliate program (optional): ${params.affiliateTermsUrl}`,
    '',
    '— Rick Floyd',
    'ClearPath Trader',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; background:#050505; color:#fff; padding:32px;">
      <h1 style="color:#00FFFF; text-transform:uppercase; letter-spacing:2px;">Private Login Ready</h1>
      <p>Hi ${params.firstName},</p>
      <p>Your ClearPath Private Login is ready.</p>
      <div style="margin:24px 0; padding:20px; border:1px solid #00FFFF; border-radius:12px; background:#0a0a0a;">
        <p style="margin:0 0 8px;"><a href="${params.activateUrl}" style="color:#00FFFF;">Open login desk</a></p>
        <p style="margin:0; font-family:monospace; color:#FF1493;">Email: ${params.to}</p>
        <p style="margin:8px 0 0; font-family:monospace; color:#FFD700;">Temp password: ${params.tempPassword}</p>
      </div>
      <p style="color:#aaa;">Please sign in, update your password in your profile, and keep this email private.</p>
      <p style="color:#666; font-size:12px;">— Rick Floyd · ClearPath Trader</p>
    </div>
  `;

  return sendEmail({ to: params.to, subject, text, html });
}

/** Member (or founder) asked to reset a forgotten / misplaced Private Login password. */
export async function sendPasswordResetEmail(params: {
  to: string;
  firstName: string;
  activateUrl: string;
  tempPassword: string;
}): Promise<boolean> {
  const subject = 'Your ClearPath password reset';
  const text = [
    `Hi ${params.firstName},`,
    '',
    'You asked to reset a forgotten or misplaced ClearPath Private Login password.',
    '',
    `Login: ${params.activateUrl}`,
    `Email: ${params.to}`,
    `New temporary password: ${params.tempPassword}`,
    '',
    'Sign in with this password, then change it after you get in. If you did not ask for this, reply to this email.',
    '',
    '— Rick Floyd',
    'ClearPath Trader',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; background:#050505; color:#fff; padding:32px;">
      <h1 style="color:#FFD700; text-transform:uppercase; letter-spacing:2px;">Password Reset</h1>
      <p>Hi ${params.firstName},</p>
      <p>You asked to reset a forgotten or misplaced ClearPath Private Login password.</p>
      <div style="margin:24px 0; padding:20px; border:1px solid #FFD700; border-radius:12px; background:#0a0a0a;">
        <p style="margin:0 0 8px;"><a href="${params.activateUrl}" style="color:#00FFFF;">Open login desk</a></p>
        <p style="margin:0; font-family:monospace; color:#FF1493;">Email: ${params.to}</p>
        <p style="margin:8px 0 0; font-family:monospace; color:#FFD700;">New temporary password: ${params.tempPassword}</p>
      </div>
      <p style="color:#aaa;">Sign in with this password, then change it after you get in.</p>
      <p style="color:#666; font-size:12px;">— Rick Floyd · ClearPath Trader</p>
    </div>
  `;

  return sendEmail({ to: params.to, subject, text, html });
}

/** Ask a quarantined registrant to confirm a real email / identity. */
export async function sendIdentityConfirmEmail(params: {
  to: string;
  displayName?: string;
  confirmUrl: string;
}): Promise<boolean> {
  const greeting = params.displayName ? `Hi ${params.displayName}` : 'Hello';
  const subject = 'Confirm your ClearPath identity';
  const text = [
    greeting + ',',
    '',
    'We need you to confirm a real email and name before your private desk unlocks.',
    '',
    `Confirm here (link expires in 48 hours): ${params.confirmUrl}`,
    '',
    'If this was not you, ignore this message.',
    '',
    '— ClearPath Trader',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; background:#050505; color:#fff; padding:32px;">
      <h1 style="color:#00FFFF; text-transform:uppercase; letter-spacing:2px;">Confirm Your Identity</h1>
      <p>${greeting},</p>
      <p>We need a real email and name before your private ClearPath desk unlocks.</p>
      <p style="margin:28px 0;">
        <a href="${params.confirmUrl}" style="display:inline-block;padding:14px 22px;background:#00E5FF;color:#000;font-weight:bold;text-decoration:none;border-radius:10px;">
          Confirm my identity
        </a>
      </p>
      <p style="color:#aaa;font-size:13px;">This link expires in 48 hours. If you did not sign up, ignore this email.</p>
      <p style="color:#666; font-size:12px;">— ClearPath Trader</p>
    </div>
  `;

  return sendEmail({ to: params.to, subject, text, html });
}
