/** Rick Floyd — ClearPath founder inboxes. CEO Dashboard is locked to these accounts only. */
export const FOUNDER_EMAIL = 'forexanarchy@gmail.com';

/** Both Google accounts that may open the CEO pill, Private Login founder session, and founder APIs. */
export const FOUNDER_EMAILS = ['forexanarchy@gmail.com', 'clearpathcharts@gmail.com'] as const;

export function isFounderEmail(email: string | null | undefined): boolean {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized) return false;
  return (FOUNDER_EMAILS as readonly string[]).includes(normalized);
}

type EmailCarrier = {
  email?: string | null;
  providerData?: Array<{ email?: string | null } | null> | null;
} | null | undefined;

/** Firebase sometimes leaves `email` empty and puts the Gmail address on providerData. */
export function collectAuthEmails(...carriers: EmailCarrier[]): string[] {
  const out: string[] = [];
  for (const carrier of carriers) {
    if (!carrier) continue;
    if (carrier.email) out.push(carrier.email);
    for (const provider of carrier.providerData || []) {
      if (provider?.email) out.push(provider.email);
    }
  }
  return out;
}

/** True if any session/profile/Google email is a founder inbox. */
export function isFounderSession(...emails: Array<string | null | undefined>): boolean {
  return emails.some((email) => isFounderEmail(email));
}

/** True if a Firebase/user object (including providerData) is a founder account. */
export function isFounderAuthUser(...carriers: EmailCarrier[]): boolean {
  return isFounderSession(...collectAuthEmails(...carriers));
}

/** First founder email on the account, if any. */
export function founderEmailOf(...carriers: EmailCarrier[]): string | null {
  return collectAuthEmails(...carriers).find((email) => isFounderEmail(email)) || null;
}

/**
 * Optional Firebase Auth uids for the founder Google accounts.
 * Set FOUNDER_FIREBASE_UID on Cloud Run. Comma-separated when both inboxes are pinned.
 */
export function getFounderFirebaseUids(): string[] {
  return (process.env.FOUNDER_FIREBASE_UID || '')
    .split(/[,\s]+/)
    .map((uid) => uid.trim())
    .filter(Boolean);
}

/** @deprecated Prefer getFounderFirebaseUids — first configured uid, or empty. */
export function getFounderFirebaseUid(): string {
  return getFounderFirebaseUids()[0] || '';
}

/**
 * When FOUNDER_FIREBASE_UID is configured, Bearer founder auth must match one of
 * those uids (not only the email string). Unset = email-only gate (legacy).
 * Session email checks remain for Private Login founder.
 */
export function isFounderFirebaseUid(uid: string | null | undefined): boolean {
  const expected = getFounderFirebaseUids();
  if (expected.length === 0) return true;
  return Boolean(uid && expected.includes(uid));
}
