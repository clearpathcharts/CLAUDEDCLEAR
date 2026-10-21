/**
 * Join three Google Flow clips (~10s each) into one tab explainer (~30s).
 * Flow will not export a longer take, so the founder uploads the three pieces
 * and this route concatenates them in the order chosen on the CEO page.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  CeoVideoStorageError,
  CEO_VIDEO_PREFIX,
  finalizeCeoVideo,
  getCeoVideoStorageStatus,
  listCeoVideos,
  sanitizeVideoFilename,
  type CeoVideo,
} from './ceoVideoStorage';
import { getStorage } from 'firebase-admin/storage';

export const TAB_EXPLAINER_CLIP_COUNT = 3;
const ID_PATTERN = /^[a-f0-9]{16}$/;

export function normalizeMergeVideoIds(value: unknown): string[] {
  if (!Array.isArray(value) || value.length !== TAB_EXPLAINER_CLIP_COUNT) {
    throw new CeoVideoStorageError(
      'Pick exactly three clips, in the order they should play.',
      400,
      'need_three_clips'
    );
  }
  const ids = value.map((item) => String(item || '').trim());
  if (ids.some((id) => !ID_PATTERN.test(id))) {
    throw new CeoVideoStorageError('One of those clips is not a library video.', 400, 'bad_id');
  }
  if (new Set(ids).size !== TAB_EXPLAINER_CLIP_COUNT) {
    throw new CeoVideoStorageError('Pick three different clips.', 400, 'duplicate_clip');
  }
  return ids;
}

/** Video-only concat so a silent Flow export still joins with the others. */
export function ffmpegConcatArgs(inputs: string[], output: string): string[] {
  const filter =
    inputs.map((_, index) => `[${index}:v:0]`).join('') +
    `concat=n=${inputs.length}:v=1:a=0[v]`;
  return [
    '-y',
    ...inputs.flatMap((file) => ['-i', file]),
    '-filter_complex',
    filter,
    '-map',
    '[v]',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    output,
  ];
}

function ffmpegBin(): string {
  const fromEnv = (process.env.FFMPEG_PATH || '').trim();
  return fromEnv || 'ffmpeg';
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegBin(), args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr?.on('data', (chunk) => {
      stderr = (stderr + String(chunk)).slice(-2000);
    });
    const timer = setTimeout(() => {
      child.kill();
      reject(
        new CeoVideoStorageError(
          'Joining the three clips took too long and was stopped.',
          504,
          'merge_timeout'
        )
      );
    }, 120_000);
    child.on('error', (error: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      if (error.code === 'ENOENT') {
        reject(
          new CeoVideoStorageError(
            'ffmpeg is not installed on this server, so the three clips cannot be joined yet.',
            503,
            'ffmpeg_missing'
          )
        );
        return;
      }
      reject(new CeoVideoStorageError(error.message || 'ffmpeg failed to start.', 502, 'merge_failed'));
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new CeoVideoStorageError(
          stderr.trim() || `ffmpeg stopped with code ${code}.`,
          502,
          'merge_failed'
        )
      );
    });
  });
}

export async function mergeCeoVideos(videoIds: unknown): Promise<CeoVideo> {
  const ids = normalizeMergeVideoIds(videoIds);
  const status = getCeoVideoStorageStatus();
  if (!status.configured || !status.bucket) {
    throw new CeoVideoStorageError(
      status.reason || 'Video storage is not configured.',
      503,
      'storage_not_configured'
    );
  }
  const library = await listCeoVideos();
  const ordered = ids.map((id) => library.find((video) => video.id === id));
  if (ordered.some((video) => !video)) {
    throw new CeoVideoStorageError('One of those clips is no longer in the library.', 404, 'not_found');
  }
  const clips = ordered as CeoVideo[];

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'cp-merge-'));
  try {
    const bucket = getStorage().bucket(status.bucket);
    const locals: string[] = [];
    for (const clip of clips) {
      const dest = path.join(dir, `${clip.id}.mp4`);
      await bucket.file(clip.objectPath).download({ destination: dest });
      locals.push(dest);
    }
    const output = path.join(dir, 'merged.mp4');
    await runFfmpeg(ffmpegConcatArgs(locals, output));
    const stat = await fs.stat(output);
    if (!stat.size) {
      throw new CeoVideoStorageError('The joined video came out empty.', 502, 'merge_failed');
    }

    const id = crypto.randomBytes(8).toString('hex');
    const filename = sanitizeVideoFilename('tab-explainer-30s.mp4');
    const objectPath = `${CEO_VIDEO_PREFIX}${id}/${filename}`;
    const names = clips.map((clip) => clip.originalName || clip.filename).join(' + ');
    await bucket.upload(output, {
      destination: objectPath,
      metadata: {
        contentType: 'video/mp4',
        cacheControl: 'public, max-age=31536000, immutable',
        metadata: {
          originalName: `30s tab explainer (${names})`.slice(0, 200),
          uploadedBy: 'ceo-video-merge',
        },
      },
    });
    return await finalizeCeoVideo(id);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}
