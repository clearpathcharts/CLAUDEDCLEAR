/**
 * Client error log — async append with rotation (Cloud Run disk is ephemeral but still guard OOM).
 */
import fs from 'node:fs';
import path from 'node:path';

const LOG_PATH = path.join(process.cwd(), 'frontend_errors.log');
const MAX_BYTES = 5 * 1024 * 1024;

function rotateIfNeeded() {
  try {
    if (!fs.existsSync(LOG_PATH)) return;
    const stat = fs.statSync(LOG_PATH);
    if (stat.size <= MAX_BYTES) return;
    const rotated = `${LOG_PATH}.${Date.now()}.old`;
    fs.renameSync(LOG_PATH, rotated);
  } catch {
    /* ignore */
  }
}

export function appendFrontendError(sanitizedLine: string): void {
  rotateIfNeeded();
  fs.appendFile(LOG_PATH, sanitizedLine + '\n', (err) => {
    if (err) console.warn('[frontend_error] append failed', err.message);
  });
}
