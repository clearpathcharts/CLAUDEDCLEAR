import fs from 'fs';
import path from 'path';
import type { SocialPlatform, SocialPost } from '../types';
import type { AdapterPublishResult } from './types';

export function env(name: string): string {
  return (process.env[name] || '').trim();
}

export function composePostText(post: SocialPost): string {
  const tags = (post.hashtags || []).map((h) => (h.startsWith('#') ? h : `#${h}`));
  const parts = [post.body];
  if (post.linkUrl && !post.body.includes(post.linkUrl)) {
    parts.push(post.linkUrl);
  }
  if (tags.length) parts.push(tags.join(' '));
  return parts.join('\n\n').trim();
}

export async function postJson(
  url: string,
  body: unknown,
  headers: Record<string, string> = {}
): Promise<{ ok: boolean; status: number; json: unknown; text: string }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { text };
  }
  return { ok: res.ok, status: res.status, json, text };
}

export async function postForm(
  url: string,
  params: Record<string, string>,
  headers: Record<string, string> = {}
): Promise<{ ok: boolean; status: number; json: unknown; text: string }> {
  const body = new URLSearchParams(params);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...headers },
    body: body.toString(),
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { text };
  }
  return { ok: res.ok, status: res.status, json, text };
}

/** ClearPath-owned package fallback — never a third-party scheduler. */
export function writePublishPackage(
  platform: SocialPlatform,
  post: SocialPost,
  text: string
): AdapterPublishResult {
  const dir = path.join(process.cwd(), 'data', 'social-os', 'packages');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${post.id}_${platform}.json`);
  const payload = {
    id: post.id,
    platform,
    title: post.title,
    body: post.body,
    text,
    linkUrl: post.linkUrl,
    mediaUrls: post.mediaUrls,
    hashtags: post.hashtags,
    createdAt: post.createdAt,
    packagedAt: new Date().toISOString(),
    note: 'ClearPath Social OS package — connect platform credentials for direct live send.',
  };
  fs.writeFileSync(file, JSON.stringify(payload, null, 2), 'utf8');
  return {
    platform,
    mode: 'package',
    delivery: 'package',
    dryRun: false,
    packagePath: file,
    message: `Packaged for ${platform} (no live credentials yet): ${file}`,
  };
}

/** Optional ClearPath-owned outbound webhook (your endpoint — not Buffer/Zapier). */
export async function tryPlatformWebhook(
  platform: SocialPlatform,
  post: SocialPost,
  text: string
): Promise<AdapterPublishResult | null> {
  const specific = env(`SOCIAL_WEBHOOK_${platform.toUpperCase()}`);
  const shared = env('SOCIAL_DIRECT_WEBHOOK_URL');
  const url = specific || shared;
  if (!url) return null;

  const payload = {
    source: 'clearpath-social-os',
    platform,
    postId: post.id,
    title: post.title,
    body: post.body,
    text,
    linkUrl: post.linkUrl,
    mediaUrls: post.mediaUrls || [],
    hashtags: post.hashtags || [],
    scheduledAt: post.scheduledAt,
    sentAt: new Date().toISOString(),
  };

  const res = await postJson(url, payload, {
    'X-ClearPath-Social-OS': '1',
    ...(env('SOCIAL_WEBHOOK_SECRET') ? { 'X-ClearPath-Webhook-Secret': env('SOCIAL_WEBHOOK_SECRET') } : {}),
  });

  if (!res.ok) {
    throw new Error(`ClearPath webhook for ${platform} failed (${res.status}): ${res.text.slice(0, 240)}`);
  }

  const id =
    typeof (res.json as { id?: string })?.id === 'string'
      ? (res.json as { id: string }).id
      : `webhook_${platform}_${Date.now()}`;

  return {
    platform,
    mode: 'direct',
    delivery: 'webhook',
    dryRun: false,
    platformPostId: id,
    message: `Delivered to ClearPath webhook for ${platform}`,
    raw: res.json,
  };
}
