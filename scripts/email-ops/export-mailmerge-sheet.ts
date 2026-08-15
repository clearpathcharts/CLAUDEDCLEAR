/**
 * Export ClearPath members + founder invites into a Google Sheets mail-merge CSV.
 *
 * Usage:
 *   npx tsx scripts/email-ops/export-mailmerge-sheet.ts
 *
 * Output (gitignored):
 *   data/email-ops/clearpath-mailmerge-YYYY-MM-DD.csv
 *
 * Columns match scripts/email-ops/MailMerge.gs placeholders.
 */
import fs from 'node:fs';
import path from 'node:path';
import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

type Row = {
  email: string;
  firstName: string;
  displayName: string;
  uid: string;
  tempPassword: string;
  activationKey: string;
  hasPrivateAccount: string;
  inviteCreatedAt: string;
  activateUrl: string;
  affiliateTermsUrl: string;
  subject: string;
  body: string;
  sendStatus: string;
};

function csvEscape(value: string): string {
  const v = value ?? '';
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function firstNameFrom(displayName: string, email: string): string {
  const fromName = (displayName || '').trim().split(/\s+/)[0] || '';
  if (fromName && !fromName.includes('@')) return fromName;
  return (email.split('@')[0] || 'Member').replace(/[._+]/g, ' ');
}

async function main() {
  if (!getApps().length) {
    initializeApp({
      credential: applicationDefault(),
      projectId: process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0282858983',
    });
  }
  const db = getFirestore();

  const [accountsSnap, invitesSnap] = await Promise.all([
    db.collection('private_accounts').limit(2000).get(),
    db.collection('private_account_invites').limit(2000).get(),
  ]);

  const accounts = new Map<string, { uid: string; displayName: string }>();
  for (const doc of accountsSnap.docs) {
    const d = doc.data() as Record<string, unknown>;
    const email = String(d.email || doc.id || '')
      .trim()
      .toLowerCase();
    if (!email.includes('@')) continue;
    accounts.set(email, {
      uid: String(d.uid || ''),
      displayName: String(d.displayName || email.split('@')[0] || 'Member'),
    });
  }

  const invites = new Map<
    string,
    { displayName: string; uid: string; tempPassword: string; activationKey: string; createdAt: string }
  >();
  for (const doc of invitesSnap.docs) {
    const d = doc.data() as Record<string, unknown>;
    const email = String(d.email || doc.id || '')
      .trim()
      .toLowerCase();
    if (!email.includes('@')) continue;
    invites.set(email, {
      displayName: String(d.displayName || ''),
      uid: String(d.uid || ''),
      tempPassword: String(d.tempPassword || ''),
      activationKey: String(d.activationKey || ''),
      createdAt: String(d.createdAt || ''),
    });
  }

  const emails = new Set([...accounts.keys(), ...invites.keys()]);
  // Skip obvious test / typo self-dupes from merge sheet unless founder wants them.
  const skip = new Set([
    'stripe-smoke-test@example.com',
    'member@example.com',
    'test@example.com',
    'user@example.com',
    'forexanarchy@gmaill.com',
  ]);

  const rows: Row[] = [];
  for (const email of [...emails].sort()) {
    if (skip.has(email)) continue;
    const acct = accounts.get(email);
    const inv = invites.get(email);
    const displayName = (inv?.displayName || acct?.displayName || email.split('@')[0] || 'Member').trim();
    const firstName = firstNameFrom(displayName, email);
    const tempPassword = inv?.tempPassword || '';
    const activateUrl = `https://clearpathtrader.com/activate?email=${encodeURIComponent(email)}`;

    const defaultSubject = tempPassword
      ? 'Your ClearPath Private Login is ready'
      : 'ClearPath Trader — account check-in';

    const defaultBody = tempPassword
      ? [
          `Hi ${firstName},`,
          '',
          'Your ClearPath Private Login is ready.',
          '',
          `Login: ${activateUrl}`,
          `Email: ${email}`,
          `Temporary password: ${tempPassword}`,
          '',
          'Please sign in, update your password in your profile, and keep this email private.',
          '',
          'Affiliate program (optional): https://clearpathtrader.com/affiliate-terms',
          '',
          '— Rick Floyd',
          'ClearPath Trader',
        ].join('\n')
      : [
          `Hi ${firstName},`,
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

    rows.push({
      email,
      firstName,
      displayName,
      uid: inv?.uid || acct?.uid || '',
      tempPassword,
      activationKey: inv?.activationKey || '',
      hasPrivateAccount: acct ? 'yes' : 'no',
      inviteCreatedAt: inv?.createdAt || '',
      activateUrl,
      affiliateTermsUrl: 'https://clearpathtrader.com/affiliate-terms',
      subject: defaultSubject,
      body: defaultBody,
      sendStatus: '',
    });
  }

  const header = [
    'email',
    'firstName',
    'displayName',
    'uid',
    'tempPassword',
    'activationKey',
    'hasPrivateAccount',
    'inviteCreatedAt',
    'activateUrl',
    'affiliateTermsUrl',
    'subject',
    'body',
    'sendStatus',
  ] as const;

  const lines = [
    header.join(','),
    ...rows.map((r) => header.map((h) => csvEscape(String(r[h] ?? ''))).join(',')),
  ];

  const outDir = path.join(process.cwd(), 'data', 'email-ops');
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const outPath = path.join(outDir, `clearpath-mailmerge-${stamp}.csv`);
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');

  const withPasswords = rows.filter((r) => r.tempPassword).length;
  console.log(
    JSON.stringify(
      {
        ok: true,
        path: outPath,
        rows: rows.length,
        withTempPasswords: withPasswords,
        note: 'CSV is gitignored. Import into Google Sheets, then run MailMerge.gs. Do not commit or paste passwords into chat.',
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
