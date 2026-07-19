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
  const filePath = path.join(dir, `truth_audit_recovery_${originId}.json`);
  fs.writeFileSync(filePath, payload, 'utf8');
  return filePath;
}
