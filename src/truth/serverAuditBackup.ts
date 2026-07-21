import fs from 'node:fs';
import path from 'node:path';

/** Server-only filesystem backup for truth audit recovery (never imported by the client bundle). */
export async function writeTruthAuditRecoveryFile(
  payload: string,
  originId: string,
): Promise<string | null> {
  const dir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const safeId = String(originId || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'unknown';
  const filePath = path.resolve(dir, `truth_audit_recovery_${safeId}.json`);
  const realDir = fs.realpathSync(dir);
  if (!filePath.startsWith(realDir + path.sep)) {
    throw new Error('Blocked audit backup path outside logs/');
  }
  fs.writeFileSync(filePath, payload, 'utf8');
  return filePath;
}
