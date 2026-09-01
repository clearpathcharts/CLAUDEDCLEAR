/**
 * Layer 1 — untouched official CFTC payloads on disk.
 * Cloud Run disk is ephemeral; this still avoids repeat CFTC hits within a revision
 * and works as a durable archive on a VM / local volume.
 */
import fs from 'node:fs';
import path from 'node:path';

export type CftcDatasetId = 'legacy_combined' | 'disaggregated_combined' | 'annual_zip';

export function cotDataRoot(): string {
  return process.env.COT_DATA_DIR || path.join(process.cwd(), 'data', 'cot');
}

export function rawArchivePath(year: string | number, dataset: CftcDatasetId, name: string): string {
  return path.join(cotDataRoot(), 'raw', String(year), dataset, name);
}

export function writeRawArchive(
  year: string | number,
  dataset: CftcDatasetId,
  name: string,
  body: string | Buffer,
): string | null {
  try {
    const file = rawArchivePath(year, dataset, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, body);
    return file;
  } catch {
    return null;
  }
}

export function readRawArchive(year: string | number, dataset: CftcDatasetId, name: string): string | null {
  try {
    const file = rawArchivePath(year, dataset, name);
    if (!fs.existsSync(file)) return null;
    return fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

export function writeNormalizedCache(cftcCode: string, json: string): string | null {
  try {
    const file = path.join(cotDataRoot(), 'normalized', `${cftcCode}.json`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, json);
    return file;
  } catch {
    return null;
  }
}

export function readNormalizedCache(cftcCode: string, maxAgeMs: number): string | null {
  try {
    const file = path.join(cotDataRoot(), 'normalized', `${cftcCode}.json`);
    if (!fs.existsSync(file)) return null;
    const age = Date.now() - fs.statSync(file).mtimeMs;
    if (age > maxAgeMs) return null;
    return fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

/** Official CFTC annual compressed history (Futures-only Legacy from 1986). */
export function cftcAnnualZipUrl(kind: 'legacy_fut' | 'disagg_fut', year: number): string {
  if (kind === 'legacy_fut') {
    return `https://www.cftc.gov/files/dea/history/deacot${year}.zip`;
  }
  return `https://www.cftc.gov/files/dea/history/fut_disagg_txt_${year}.zip`;
}

export async function ingestAnnualZip(
  kind: 'legacy_fut' | 'disagg_fut',
  year: number,
): Promise<{ file: string | null; bytes: number; url: string; error?: string }> {
  const url = cftcAnnualZipUrl(kind, year);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(60_000),
      headers: { 'User-Agent': 'ClearPathTrader/1.0 (COT archive; +https://clearpathtrader.com)' },
    });
    if (!res.ok) return { file: null, bytes: 0, url, error: `HTTP ${res.status}` };
    const buf = Buffer.from(await res.arrayBuffer());
    const name = kind === 'legacy_fut' ? `deacot${year}.zip` : `fut_disagg_txt_${year}.zip`;
    const file = writeRawArchive(year, 'annual_zip', name, buf);
    return { file, bytes: buf.length, url };
  } catch (e) {
    return { file: null, bytes: 0, url, error: e instanceof Error ? e.message : 'fetch failed' };
  }
}
