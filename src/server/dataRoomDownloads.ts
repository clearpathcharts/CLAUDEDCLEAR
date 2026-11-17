/**
 * Public allowlisted downloads for seed data-room markdown packs.
 * Files live under docs/data-room/ (copied into the Cloud Run image).
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Express, Request, Response } from 'express';

const ALLOWED = new Set([
  'SEED_DILIGENCE_ANSWERS.md',
  'NON_BROKER_PLATFORM_LETTER.md',
  'README.md',
]);

const DOWNLOAD_NAMES: Record<string, string> = {
  'SEED_DILIGENCE_ANSWERS.md': 'ClearPath_Seed_Diligence_Answers.md',
  'NON_BROKER_PLATFORM_LETTER.md': 'ClearPath_Non_Broker_Platform_Letter.md',
  'README.md': 'ClearPath_Data_Room_README.md',
};

export function dataRoomDir(): string {
  return path.join(process.cwd(), 'docs', 'data-room');
}

export function resolveDataRoomFile(rawName: string): { ok: true; abs: string; downloadName: string } | { ok: false; status: number; message: string } {
  const name = String(rawName || '').trim();
  if (!name || name.includes('/') || name.includes('\\') || name.includes('..')) {
    return { ok: false, status: 400, message: 'Invalid file name.' };
  }
  if (!ALLOWED.has(name)) {
    return { ok: false, status: 404, message: 'Unknown data-room document.' };
  }
  const abs = path.join(dataRoomDir(), name);
  const root = dataRoomDir();
  if (!abs.startsWith(root + path.sep) && abs !== root) {
    return { ok: false, status: 400, message: 'Invalid file path.' };
  }
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
    return { ok: false, status: 404, message: 'Document not found on this revision.' };
  }
  return { ok: true, abs, downloadName: DOWNLOAD_NAMES[name] || name };
}

export function listDataRoomDownloads(): Array<{ file: string; downloadName: string; href: string }> {
  return [...ALLOWED]
    .filter((file) => file !== 'README.md')
    .map((file) => ({
      file,
      downloadName: DOWNLOAD_NAMES[file] || file,
      href: `/api/data-room/${file}`,
    }));
}

export function mountDataRoomDownloadRoutes(app: Express): void {
  app.get('/api/data-room', (_req, res) => {
    res.json({
      ok: true,
      documents: listDataRoomDownloads(),
      folder: 'docs/data-room',
    });
  });

  app.get('/api/data-room/:file', (req: Request, res: Response) => {
    const resolved = resolveDataRoomFile(String(req.params.file || ''));
    if (resolved.ok === false) {
      return res.status(resolved.status).json({ error: 'DATA_ROOM_FILE', message: resolved.message });
    }
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${resolved.downloadName}"`
    );
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.sendFile(resolved.abs);
  });
}
