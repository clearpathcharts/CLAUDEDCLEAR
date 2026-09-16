/**
 * Encrypt broker OAuth tokens at rest. Requires BROKER_TOKEN_ENCRYPTION_KEY (32+ byte secret).
 */
import crypto from 'node:crypto';
import { getBrokerTokenEncryptionKey } from '../secrets';

const ALGO = 'aes-256-gcm';

function keyBuffer(): Buffer {
  const raw = getBrokerTokenEncryptionKey();
  if (!raw) throw new Error('BROKER_TOKEN_ENCRYPTION_KEY is not configured');
  if (/^[0-9a-f]{64}$/i.test(raw)) return Buffer.from(raw, 'hex');
  const buf = Buffer.from(raw, 'base64');
  if (buf.length >= 32) return buf.subarray(0, 32);
  return crypto.createHash('sha256').update(raw).digest();
}

export function isBrokerTokenEncryptionConfigured(): boolean {
  return Boolean(getBrokerTokenEncryptionKey());
}

export function encryptBrokerSecret(plaintext: string): string {
  const key = keyBuffer();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64url');
}

export function decryptBrokerSecret(payload: string): string {
  const key = keyBuffer();
  const buf = Buffer.from(payload, 'base64url');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}
