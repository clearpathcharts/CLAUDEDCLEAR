/** Rick Floyd — ClearPath founder. CEO Dashboard is locked to this account only. */
export const FOUNDER_EMAIL = 'forexanarchy@gmail.com';

export function isFounderEmail(email: string | null | undefined): boolean {
  return (email || '').trim().toLowerCase() === FOUNDER_EMAIL;
}

/** Optional Firebase Auth uid for the founder Google account — set FOUNDER_FIREBASE_UID on Cloud Run. */
export function getFounderFirebaseUid(): string {
  return (process.env.FOUNDER_FIREBASE_UID || '').trim();
}

/**
 * When FOUNDER_FIREBASE_UID is configured, Bearer founder auth must match that uid
 * (not only the email string). Session email checks remain for Private Login founder.
 */
export function isFounderFirebaseUid(uid: string | null | undefined): boolean {
  const expected = getFounderFirebaseUid();
  if (!expected) return true; // unset = email-only gate (legacy)
  return Boolean(uid && uid === expected);
}
