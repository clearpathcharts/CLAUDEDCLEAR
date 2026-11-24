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
    const dir = path.dirname(LOG_PATH);
    const base = path.basename(LOG_PATH);
    for (const name of fs.readdirSync(dir)) {
      if (name.startsWith(`${base}.`) && name.endsWith('.old')) fs.rmSync(path.join(dir, name), { force: true });
    }
    fs.renameSync(LOG_PATH, `${LOG_PATH}.${Date.now()}.old`);
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
