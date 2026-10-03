/**
 * Founder-only explainer-video library — durable Google Cloud Storage only.
 *
 * Cloud Run's filesystem is ephemeral, so nothing here ever touches local disk:
 * this module imports no `fs` and the browser PUTs straight to a resumable
 * upload session minted here, so multi-hundred-MB videos never pass through
 * Express (Cloud Run caps request bodies around 32 MB).
 *
 * Resumable session URIs are used instead of V4 signed URLs on purpose: they
 * work with the Cloud Run service account's ADC and do not require the extra
 * `iam.serviceAccounts.signBlob` permission that signing needs.
 */
import crypto from 'node:crypto';
import { getStorage } from 'firebase-admin/storage';
import type { Bucket } from '@google-cloud/storage';
import { ensureAdminApp, hasFirebaseAdminCredentials } from './firebaseAdmin';
import firebaseConfig from '../../firebase-applet-config.json';

/** Object key prefix inside the bucket. Everything the library owns lives here. */
export const CEO_VIDEO_PREFIX = 'ceo-videos/';

/** Upload ids are server-minted hex so no caller-supplied path ever reaches GCS. */
const ID_PATTERN = /^[a-f0-9]{16}$/;

export const CEO_VIDEO_CONTENT_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v',
  'video/x-matroska',
  'video/mpeg',
  'video/ogg',
] as const;

const DEFAULT_MAX_MB = 2048;

export function ceoVideoMaxBytes(): number {
  const raw = Number.parseInt(String(process.env.CEO_VIDEO_MAX_MB || '').trim(), 10);
  const mb = Number.isFinite(raw) && raw > 0 ? Math.min(raw, 10240) : DEFAULT_MAX_MB;
  return mb * 1024 * 1024;
}

export function isAllowedVideoContentType(value: unknown): boolean {
  const type = String(value || '').split(';')[0]!.trim().toLowerCase();
  return (CEO_VIDEO_CONTENT_TYPES as readonly string[]).includes(type);
}

/**
 * Strip directories, control characters and anything that could escape the
 * `ceo-videos/<id>/` prefix. Always returns a usable, non-empty name.
 */
export function sanitizeVideoFilename(value: unknown): string {
  const base = String(value || '')
    .replace(/\\/g, '/')
    .split('/')
    .pop()!;
  const cleaned = base
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^[.-]+/, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 120)
    .trim();
  return cleaned || 'explainer-video.mp4';
}

export type CeoVideoStorageStatus = {
  configured: boolean;
  bucket: string | null;
  credentials: boolean;
  reason?: string;
};

/** Bucket name is server-side config only — never a `VITE_` value. */
export function getCeoVideoBucketName(): string {
  const explicit = (process.env.CEO_VIDEO_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || '').trim();
  if (explicit) return explicit.replace(/^gs:\/\//, '').replace(/\/+$/, '');
  const fallback = (firebaseConfig as { storageBucket?: string }).storageBucket || '';
  return fallback.trim();
}

export function getCeoVideoStorageStatus(): CeoVideoStorageStatus {
  const bucket = getCeoVideoBucketName();
  const credentials = hasFirebaseAdminCredentials();
  if (!bucket) {
    return {
      configured: false,
      bucket: null,
      credentials,
      reason: 'CEO_VIDEO_BUCKET is not set on the Cloud Run service.',
    };
  }
  if (!credentials) {
    return {
      configured: false,
      bucket,
      credentials: false,
      reason:
        'No Google credentials. Cloud Run needs a service account with Storage Object Admin on this bucket (or FIREBASE_SERVICE_ACCOUNT locally).',
    };
  }
  if (!ensureAdminApp()) {
    return {
      configured: false,
      bucket,
      credentials: true,
      reason: 'Firebase Admin could not initialize, so the bucket client is unavailable.',
    };
  }
  return { configured: true, bucket, credentials: true };
}

/** Storage-not-configured is an honest failure, never a silent fake success. */
export class CeoVideoStorageError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string
  ) {
    super(message);
    this.name = 'CeoVideoStorageError';
  }
}

function requireBucket(): Bucket {
  const status = getCeoVideoStorageStatus();
  if (!status.configured || !status.bucket) {
    throw new CeoVideoStorageError(
      status.reason || 'Video storage is not configured.',
      503,
      'storage_not_configured'
    );
  }
  return getStorage().bucket(status.bucket);
}

export type CeoVideo = {
  id: string;
  objectPath: string;
  filename: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
  url: string;
  publicRead: boolean | null;
};

function publicUrlFor(bucket: string, objectPath: string): string {
  return `https://storage.googleapis.com/${bucket}/${objectPath.split('/').map(encodeURIComponent).join('/')}`;
}

function objectPathFor(id: string, filename: string): string {
  return `${CEO_VIDEO_PREFIX}${id}/${filename}`;
}

function parsePublicFlag(value: unknown): boolean | null {
  if (value === 'yes') return true;
  if (value === 'no') return false;
  return null;
}

function toVideo(bucketName: string, objectPath: string, meta: Record<string, any>): CeoVideo {
  const id = objectPath.slice(CEO_VIDEO_PREFIX.length).split('/')[0] || '';
  const filename = objectPath.split('/').pop() || 'video';
  const custom = (meta?.metadata || {}) as Record<string, string>;
  return {
    id,
    objectPath,
    filename,
    originalName: custom.originalName || filename,
    contentType: String(meta?.contentType || 'video/mp4'),
    sizeBytes: Number(meta?.size || 0),
    uploadedAt: String(meta?.timeCreated || new Date().toISOString()),
    url: publicUrlFor(bucketName, objectPath),
    publicRead: parsePublicFlag(custom.publicRead),
  };
}

export type CeoVideoUploadSession = {
  id: string;
  objectPath: string;
  uploadUrl: string;
  url: string;
  maxBytes: number;
};

/**
 * Mint a resumable upload session the browser PUTs the file to directly.
 * `origin` binds the session to the calling site so a leaked URI is not usable
 * from an arbitrary page.
 */
export async function createCeoVideoUploadSession(input: {
  filename: unknown;
  contentType: unknown;
  sizeBytes: unknown;
  origin?: string;
}): Promise<CeoVideoUploadSession> {
  const bucket = requireBucket();
  const contentType = String(input.contentType || '').split(';')[0]!.trim().toLowerCase();
  if (!isAllowedVideoContentType(contentType)) {
    throw new CeoVideoStorageError(
      `That file type is not a video we accept (${CEO_VIDEO_CONTENT_TYPES.join(', ')}).`,
      415,
      'unsupported_type'
    );
  }

  const maxBytes = ceoVideoMaxBytes();
  const sizeBytes = Number(input.sizeBytes);
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    throw new CeoVideoStorageError('The file size was missing or unreadable.', 400, 'bad_size');
  }
  if (sizeBytes > maxBytes) {
    throw new CeoVideoStorageError(
      `That video is ${(sizeBytes / 1024 / 1024).toFixed(0)} MB. The limit is ${(maxBytes / 1024 / 1024).toFixed(0)} MB.`,
      413,
      'too_large'
    );
  }

  const id = crypto.randomBytes(8).toString('hex');
  const filename = sanitizeVideoFilename(input.filename);
  const objectPath = objectPathFor(id, filename);

  const [uploadUrl] = await bucket.file(objectPath).createResumableUpload({
    origin: input.origin,
    metadata: {
      contentType,
      cacheControl: 'public, max-age=31536000, immutable',
      metadata: {
        originalName: String(input.filename || filename).slice(0, 200),
        uploadedBy: 'ceo-video-library',
      },
    },
  });

  return { id, objectPath, uploadUrl, url: publicUrlFor(bucket.name, objectPath), maxBytes };
}

async function findObject(bucket: Bucket, id: string) {
  if (!ID_PATTERN.test(id)) {
    throw new CeoVideoStorageError('That video id is not valid.', 400, 'bad_id');
  }
  const [files] = await bucket.getFiles({ prefix: `${CEO_VIDEO_PREFIX}${id}/`, maxResults: 2 });
  const file = files[0];
  if (!file) {
    throw new CeoVideoStorageError('That video is not in the bucket.', 404, 'not_found');
  }
  return file;
}

/**
 * Called after the browser finishes its PUT. Enforces the size cap for real
 * (the pre-flight size is only a claim), tries to make the object world
 * readable so the copied link works when pasted into the site, then reports
 * whether it actually is readable rather than assuming.
 */
export async function finalizeCeoVideo(id: string): Promise<CeoVideo> {
  const bucket = requireBucket();
  const file = await findObject(bucket, id);
  const [meta] = await file.getMetadata();

  const maxBytes = ceoVideoMaxBytes();
  if (Number(meta.size || 0) > maxBytes) {
    await file.delete({ ignoreNotFound: true });
    throw new CeoVideoStorageError(
      `That upload was bigger than the ${(maxBytes / 1024 / 1024).toFixed(0)} MB limit, so it was removed.`,
      413,
      'too_large'
    );
  }
  if (!isAllowedVideoContentType(meta.contentType)) {
    await file.delete({ ignoreNotFound: true });
    throw new CeoVideoStorageError('That upload was not a video, so it was removed.', 415, 'unsupported_type');
  }

  await file.makePublic().catch(() => undefined);
  let publicRead = false;
  try {
    const [isPublic] = await file.isPublic();
    publicRead = Boolean(isPublic);
  } catch {
    publicRead = false;
  }

  await file
    .setMetadata({ metadata: { ...(meta.metadata || {}), publicRead: publicRead ? 'yes' : 'no' } })
    .catch(() => undefined);

  const [fresh] = await file.getMetadata();
  return toVideo(bucket.name, file.name, fresh as Record<string, any>);
}

export async function listCeoVideos(): Promise<CeoVideo[]> {
  const bucket = requireBucket();
  const [files] = await bucket.getFiles({ prefix: CEO_VIDEO_PREFIX });
  return files
    .filter((f) => !f.name.endsWith('/'))
    .map((f) => toVideo(bucket.name, f.name, f.metadata as Record<string, any>))
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export async function deleteCeoVideo(id: string): Promise<{ deleted: string }> {
  const bucket = requireBucket();
  const file = await findObject(bucket, id);
  await file.delete({ ignoreNotFound: true });
  return { deleted: file.name };
}
