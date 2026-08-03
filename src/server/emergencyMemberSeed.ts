/**
 * Known private members that survived the last Cloud Run revision wipe
 * (CEO Members screenshot, Aug 2026). Used only for emergency restore —
 * does NOT invent the lost ~4000 cohort.
 *
 * Dawn Hobson (dawnhobson@aol.com) is explicitly included — login must work
 * after a founder password reset + invite export.
 */
import { generateActivationKey, normalizeEmail } from './activationKey';
import {
  assertDurablePrivateWritesAllowed,
  findPrivateUserByEmail,
  PrivateAuthError,
  provisionPrivateUser,
  resetPrivateUserPassword,
} from './privateAuthService';
import { generateTempPassword, recordFounderInvite } from './waitlistConvertService';

export type EmergencyMemberSeed = {
  email: string;
  displayName: string;
};

/** Last known private-login cohort that still appeared in CEO Members. */
export const EMERGENCY_KNOWN_MEMBERS: EmergencyMemberSeed[] = [
  { email: 'forexanarchy@gmail.com', displayName: 'Forex Anarchy' },
  { email: 'triciacard@aol.com', displayName: 'Tricia Hussar' },
  { email: 'spiritualtrader@yahoo.com', displayName: 'Louann' },
  { email: 'seanglyde9@gmail.com', displayName: 'Sean' },
  { email: 'rebelmediafx@gmail.com', displayName: 'ivana KUMalot' },
  { email: 'rdigital7777@gmail.com', displayName: 'Reggie' },
  { email: 'offthecharts0919@gmail.com', displayName: 'Jason' },
  { email: 'mnbound79@gmail.com', displayName: 'ivana humpalot' },
  { email: 'michaeljankowski1975@gmail.com', displayName: 'Michael' },
  { email: 'mayday4g@gmail.com', displayName: 'Lenard' },
  { email: 'jdervon53@gmail.com', displayName: 'Joshua' },
  { email: 'itsahmadsaad@gmail.com', displayName: 'Ahmad' },
  { email: 'hillsquentin@gmail.com', displayName: 'Quentin' },
  { email: 'dawnhobson@aol.com', displayName: 'Dawn Hobson' },
  { email: 'barry.nicholl@hotmail.com', displayName: 'Barry Nicholl' },
  { email: 'atstriano@gmail.com', displayName: 'Anthony' },
];

export const DAWN_HOBSON_EMAIL = 'dawnhobson@aol.com';

export type EmergencySeedRow = {
  email: string;
  displayName: string;
  action: 'created' | 'reset' | 'already' | 'error';
  message?: string;
};

export type EmergencySeedResult = {
  ok: true;
  dryRun: boolean;
  created: number;
  reset: number;
  already: number;
  errors: number;
  invitesCreated: number;
  members: EmergencySeedRow[];
};

/**
 * Ensure every known survivor has a private account + fresh invite password.
 * `resetExisting: true` (default) re-issues temp passwords so Dawn and others
 * can log in even if their old password hash was lost with the wipe.
 */
export async function seedEmergencyKnownMembers(opts?: {
  dryRun?: boolean;
  resetExisting?: boolean;
}): Promise<EmergencySeedResult> {
  const dryRun = Boolean(opts?.dryRun);
  const resetExisting = opts?.resetExisting !== false;

  if (!dryRun) {
    assertDurablePrivateWritesAllowed();
  }

  let created = 0;
  let reset = 0;
  let already = 0;
  let errors = 0;
  let invitesCreated = 0;
  const members: EmergencySeedRow[] = [];

  for (const row of EMERGENCY_KNOWN_MEMBERS) {
    const email = normalizeEmail(row.email);
    try {
      const existing = await findPrivateUserByEmail(email);
      const tempPassword = generateTempPassword();

      if (!existing) {
        if (dryRun) {
          created += 1;
          invitesCreated += 1;
          members.push({ email, displayName: row.displayName, action: 'created', message: 'dry-run' });
          continue;
        }
        const user = await provisionPrivateUser({
          email,
          password: tempPassword,
          displayName: row.displayName,
          tempPassword,
        });
        await recordFounderInvite({
          email: user.email,
          displayName: user.displayName,
          uid: user.uid,
          activationKey: generateActivationKey(),
          tempPassword,
          createdAt: new Date().toISOString(),
          waitlistSource: 'emergency_known_members',
        });
        created += 1;
        invitesCreated += 1;
        members.push({ email, displayName: user.displayName, action: 'created' });
        continue;
      }

      if (!resetExisting) {
        already += 1;
        members.push({
          email,
          displayName: existing.displayName || row.displayName,
          action: 'already',
        });
        continue;
      }

      if (dryRun) {
        reset += 1;
        invitesCreated += 1;
        members.push({
          email,
          displayName: existing.displayName || row.displayName,
          action: 'reset',
          message: 'dry-run',
        });
        continue;
      }

      const user = await resetPrivateUserPassword({
        email,
        password: tempPassword,
        tempPassword,
      });
      await recordFounderInvite({
        email: user.email,
        displayName: user.displayName,
        uid: user.uid,
        activationKey: generateActivationKey(),
        tempPassword,
        createdAt: new Date().toISOString(),
        waitlistSource: 'emergency_password_reset',
      });
      reset += 1;
      invitesCreated += 1;
      members.push({ email, displayName: user.displayName, action: 'reset' });
    } catch (err: any) {
      errors += 1;
      members.push({
        email,
        displayName: row.displayName,
        action: 'error',
        message: err?.message || 'failed',
      });
    }
  }

  return { ok: true, dryRun, created, reset, already, errors, invitesCreated, members };
}

/** Single-user emergency password reset (e.g. Dawn) — always creates/updates invite. */
export async function emergencyResetMemberPassword(emailRaw: string): Promise<{
  ok: true;
  email: string;
  displayName: string;
  created: boolean;
  /** Returned once to founder response only — also stored in founder invites. */
  tempPassword: string;
}> {
  assertDurablePrivateWritesAllowed();

  const email = normalizeEmail(emailRaw);
  if (!email.includes('@')) {
    throw new PrivateAuthError('Valid email required');
  }
  const known = EMERGENCY_KNOWN_MEMBERS.find((m) => normalizeEmail(m.email) === email);
  const displayName = known?.displayName || email.split('@')[0] || 'Member';
  const tempPassword = generateTempPassword();
  const existing = await findPrivateUserByEmail(email);

  if (!existing) {
    const user = await provisionPrivateUser({
      email,
      password: tempPassword,
      displayName,
      tempPassword,
    });
    await recordFounderInvite({
      email: user.email,
      displayName: user.displayName,
      uid: user.uid,
      activationKey: generateActivationKey(),
      tempPassword,
      createdAt: new Date().toISOString(),
      waitlistSource: 'emergency_single_reset',
    });
    return { ok: true, email: user.email, displayName: user.displayName, created: true, tempPassword };
  }

  const user = await resetPrivateUserPassword({
    email,
    password: tempPassword,
    tempPassword,
  });
  await recordFounderInvite({
    email: user.email,
    displayName: user.displayName,
    uid: user.uid,
    activationKey: generateActivationKey(),
    tempPassword,
    createdAt: new Date().toISOString(),
    waitlistSource: 'emergency_single_reset',
  });
  return {
    ok: true,
    email: user.email,
    displayName: user.displayName,
    created: false,
    tempPassword,
  };
}
