import nodemailer from 'nodemailer';

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

let transporter: nodemailer.Transporter | null = null;

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

async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const mailer = getTransporter();
  const from = process.env.SMTP_FROM || 'ClearPath Trader <noreply@clearpathtrader.com>';

  if (!mailer) {
    // Never log activation keys / PII when SMTP is unset
    console.info('[Registration Email] SMTP not configured — email not sent (preview suppressed).');
    return false;
  }

  try {
    await mailer.sendMail({ from, ...payload });
    return true;
  } catch (error) {
    console.error('[Registration Email] Send failed:', error);
    return false;
  }
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
