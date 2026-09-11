/**
 * Convert real waitlist emails → durable Private Login accounts (ADC / Firebase Admin).
 * Does NOT print temp passwords. After run, founder loads invites via:
 *   GET /api/admin/members/invites?includeSecrets=1
 * or CEO → Members → “Show invite passwords”.
 *
 * Usage:
 *   npx tsx scripts/convert-waitlist-to-private.ts
 *   npx tsx scripts/convert-waitlist-to-private.ts --dry-run
 */
import { convertWaitlistToPrivateAccounts } from '../src/server/waitlistConvertService';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const result = await convertWaitlistToPrivateAccounts({ dryRun, resetExisting: false });
  const safe = {
    ok: result.ok,
    dryRun: result.dryRun,
    candidates: result.candidates,
    created: result.created,
    already: result.already,
    skippedTest: result.skippedTest,
    errors: result.errors,
    invitesCreated: result.invitesCreated,
    emails: result.results.map((r) => ({
      email: r.email,
      status: r.status,
      uid: r.uid,
      displayName: r.displayName,
      ...(r.message ? { message: r.message } : {}),
    })),
  };
  console.log(JSON.stringify(safe, null, 2));
  console.log(
    dryRun
      ? '\nDry run only. Re-run without --dry-run to create accounts.'
      : '\nDone. Temp passwords are in Firestore private_account_invites + data/private_accounts/founder_invites.json (gitignored). Use CEO Members → Show invite passwords.'
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
