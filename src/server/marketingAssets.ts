/**
 * Marketing Department asset library — posters, artwork, Flow clips, MP4s.
 *
 * Same durable bucket and resumable-upload pattern as the CEO video library,
 * under its own `marketing-assets/` prefix. The bucket listing is the catalog,
 * so nothing here depends on Cloud Run's ephemeral disk.
 */
import crypto from 'node:crypto';
import { getStorage } from 'firebase-admin/storage';
import type { Bucket } from '@google-cloud/storage';
import {
  CEO_VIDEO_CONTENT_TYPES,
  CeoVideoStorageError,
  ceoVideoMaxBytes,
  getCeoVideoStorageStatus,
  sanitizeVideoFilename,
} from './ceoVideoStorage';

export const MARKETING_ASSET_PREFIX = 'marketing-assets/';
export const MARKETING_ASSET_ID_PATTERN = /^[a-f0-9]{16}$/;

export const MARKETING_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
export const MARKETING_ASSET_TYPES = [...MARKETING_IMAGE_TYPES, ...CEO_VIDEO_CONTENT_TYPES] as const;

const IMAGE_MAX_BYTES = 50 * 1024 * 1024;

export type MarketingAssetKind = 'image' | 'video';

function normalizeType(value: unknown): string {
  return String(value || '').split(';')[0]!.trim().toLowerCase();
}

export function marketingAssetKind(contentType: unknown): MarketingAssetKind | null {
  const type = normalizeType(contentType);
  if ((MARKETING_IMAGE_TYPES as readonly string[]).includes(type)) return 'image';
  if ((CEO_VIDEO_CONTENT_TYPES as readonly string[]).includes(type)) return 'video';
  return null;
}

export function marketingAssetMaxBytes(kind: MarketingAssetKind): number {
  return kind === 'image' ? IMAGE_MAX_BYTES : ceoVideoMaxBytes();
}

export type MarketingAsset = {
  id: string;
  objectPath: string;
  filename: string;
  originalName: string;
  title: string;
  kind: MarketingAssetKind;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
  url: string;
  publicRead: boolean | null;
};

function requireBucket(): Bucket {
  const status = getCeoVideoStorageStatus();
  if (!status.configured || !status.bucket) {
    throw new CeoVideoStorageError(
      status.reason || 'Asset storage is not configured.',
      503,
      'storage_not_configured'
    );
  }
  return getStorage().bucket(status.bucket);
}

function publicUrlFor(bucket: string, objectPath: string): string {
  return `https://storage.googleapis.com/${bucket}/${objectPath.split('/').map(encodeURIComponent).join('/')}`;
}

function cleanTitle(value: unknown, fallback: string): string {
  // eslint-disable-next-line no-control-regex
  const text = String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 120);
  return text || fallback;
}

function toAsset(bucketName: string, objectPath: string, meta: Record<string, any>): MarketingAsset {
  const id = objectPath.slice(MARKETING_ASSET_PREFIX.length).split('/')[0] || '';
  const filename = objectPath.split('/').pop() || 'asset';
  const custom = (meta?.metadata || {}) as Record<string, string>;
  const contentType = normalizeType(meta?.contentType);
  const publicRead = custom.publicRead === 'yes' ? true : custom.publicRead === 'no' ? false : null;
  return {
    id,
    objectPath,
    filename,
    originalName: custom.originalName || filename,
    title: custom.title || custom.originalName || filename,
    kind: marketingAssetKind(contentType) || 'image',
    contentType,
    sizeBytes: Number(meta?.size || 0),
    uploadedAt: String(meta?.timeCreated || ''),
    url: publicUrlFor(bucketName, objectPath),
    publicRead,
  };
}

export type MarketingAssetUploadSession = {
  id: string;
  kind: MarketingAssetKind;
  uploadUrl: string;
  url: string;
  maxBytes: number;
};

export async function createMarketingAssetUploadSession(input: {
  filename: unknown;
  contentType: unknown;
  sizeBytes: unknown;
  title?: unknown;
  origin?: string;
}): Promise<MarketingAssetUploadSession> {
  const contentType = normalizeType(input.contentType);
  const kind = marketingAssetKind(contentType);
  if (!kind) {
    throw new CeoVideoStorageError(
      'Only images (JPG, PNG, WebP, GIF) and videos (MP4, WebM, MOV, M4V, MKV) can be uploaded.',
      415,
      'unsupported_type'
    );
  }
  const maxBytes = marketingAssetMaxBytes(kind);
  const sizeBytes = Number(input.sizeBytes);
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    throw new CeoVideoStorageError('The file size was missing or unreadable.', 400, 'bad_size');
  }
  if (sizeBytes > maxBytes) {
    throw new CeoVideoStorageError(
      `That file is ${(sizeBytes / 1024 / 1024).toFixed(0)} MB. The ${kind} limit is ${(maxBytes / 1024 / 1024).toFixed(0)} MB.`,
      413,
      'too_large'
    );
  }

  const bucket = requireBucket();
  const id = crypto.randomBytes(8).toString('hex');
  const filename = sanitizeVideoFilename(input.filename);
  const objectPath = `${MARKETING_ASSET_PREFIX}${id}/${filename}`;
  const originalName = String(input.filename || filename).slice(0, 200);

  const [uploadUrl] = await bucket.file(objectPath).createResumableUpload({
    origin: input.origin,
    metadata: {
      contentType,
      cacheControl: 'public, max-age=31536000, immutable',
      metadata: {
        originalName,
        title: cleanTitle(input.title, originalName),
        uploadedBy: 'ceo-marketing-department',
      },
    },
  });

  return { id, kind, uploadUrl, url: publicUrlFor(bucket.name, objectPath), maxBytes };
}

async function findObject(bucket: Bucket, id: string) {
  if (!MARKETING_ASSET_ID_PATTERN.test(id)) {
    throw new CeoVideoStorageError('That asset id is not valid.', 400, 'bad_id');
  }
  const [files] = await bucket.getFiles({ prefix: `${MARKETING_ASSET_PREFIX}${id}/`, maxResults: 2 });
  const file = files[0];
  if (!file) throw new CeoVideoStorageError('That asset is not in the bucket.', 404, 'not_found');
  return file;
}

/** The pre-flight size and type are only claims; re-check what actually landed. */
export async function finalizeMarketingAsset(id: string): Promise<MarketingAsset> {
  const bucket = requireBucket();
  const file = await findObject(bucket, id);
  const [meta] = await file.getMetadata();
  const kind = marketingAssetKind(meta.contentType);
  if (!kind) {
    await file.delete({ ignoreNotFound: true });
    throw new CeoVideoStorageError('That upload was not an image or video, so it was removed.', 415, 'unsupported_type');
  }
  const maxBytes = marketingAssetMaxBytes(kind);
  if (Number(meta.size || 0) > maxBytes) {
    await file.delete({ ignoreNotFound: true });
    throw new CeoVideoStorageError(
      `That upload was bigger than the ${(maxBytes / 1024 / 1024).toFixed(0)} MB limit, so it was removed.`,
      413,
      'too_large'
    );
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
  return toAsset(bucket.name, file.name, fresh as Record<string, any>);
}

export async function listMarketingAssets(): Promise<MarketingAsset[]> {
  const bucket = requireBucket();
  const [files] = await bucket.getFiles({ prefix: MARKETING_ASSET_PREFIX });
  return files
    .filter((f) => !f.name.endsWith('/'))
    .map((f) => toAsset(bucket.name, f.name, f.metadata as Record<string, any>))
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export async function deleteMarketingAsset(id: string): Promise<{ deleted: string }> {
  const bucket = requireBucket();
  const file = await findObject(bucket, id);
  await file.delete({ ignoreNotFound: true });
  return { deleted: file.name };
}
