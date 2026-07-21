/** Rick Floyd — ClearPath founder. CEO Dashboard is locked to this account only. */
export const FOUNDER_EMAIL = 'forexanarchy@gmail.com';

export function isFounderEmail(email: string | null | undefined): boolean {
  return (email || '').trim().toLowerCase() === FOUNDER_EMAIL;
}
