/**
 * Brent (CCO) investor outreach — draft + optional SMTP send.
 * Separate from CEO Marketing Department. From-address uses BRENT_OUTREACH_EMAIL.
 */
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
import { esc, isSmtpConfigured, sendTransactionalEmail } from './registrationEmail';

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
    'For a technology and investment due-diligence overview — methodology, pattern measurement, River, neuro-adaptive design, and verification caveats — please read:',
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
    fromPreview: fromConfigured ? brentFromHeader() : 'BRENT_OUTREACH_EMAIL not set yet',
    smtpConfigured: isSmtpConfigured(),
  };
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

  const sent = await sendTransactionalEmail({
    to,
    subject: draft.subject,
    text: draft.text,
    html: draft.html,
    from: brentFromHeader(),
  });

  return {
    ok: sent,
    sent,
    reason: sent ? undefined : 'smtp_send_failed',
    draft: { ...draft, to },
  };
}

export function brentOutreachStatus() {
  return {
    brentEmailConfigured: brentOutreachConfigured(),
    brentEmailPreview: brentOutreachConfigured() ? brentOutreachEmail().replace(/(.{2}).+(@.+)/, '$1***$2') : null,
    fromPreview: brentOutreachConfigured() ? brentFromHeader() : null,
    smtpConfigured: isSmtpConfigured(),
    opportunityUrl: TECHNOLOGY_OPPORTUNITY_URL,
    siteUrl: PRODUCT_URL,
    screenshotCount: BRENT_OUTREACH_SCREENSHOTS.length,
    investorCount: getInvestorCatalog().length,
  };
}
