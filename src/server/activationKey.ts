import crypto from 'node:crypto';

export function generateActivationKey(): string {
  const bytes = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `CPMS-${bytes.slice(0, 4)}-${bytes.slice(4, 8)}-${bytes.slice(8, 12)}`;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
