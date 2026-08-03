import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

async function main() {
  if (!getApps().length) {
    initializeApp({
      credential: applicationDefault(),
      projectId: 'gen-lang-client-0282858983',
    });
  }
  const db = getFirestore();
  const regs = await db.collection('site_registrations').limit(2000).get();
  const priv = await db.collection('private_accounts').limit(2000).get();
  const invites = await db.collection('private_account_invites').limit(2000).get();
  const emails = new Set<string>();
  let converted = 0;
  let pending = 0;
  for (const d of regs.docs) {
    const x = d.data() as Record<string, unknown>;
    const e = String(x.emailAddress || x.email || '').toLowerCase();
    if (e) emails.add(e);
    if (String(x.status || '') === 'confirmed' || x.convertedUid) converted += 1;
    else pending += 1;
  }
  console.log(
    JSON.stringify(
      {
        site_registrations: regs.size,
        uniqueEmails: emails.size,
        confirmedOrConverted: converted,
        pendingish: pending,
        private_accounts: priv.size,
        private_account_invites: invites.size,
        sampleWaitlist: [...emails].slice(0, 12),
        samplePrivate: priv.docs.slice(0, 12).map((d) => d.id),
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
