/**
 * Buffer API client (v1).
 * Docs: https://buffer.com/developers/api
 *
 * When BUFFER_ACCESS_TOKEN is missing, callers should use dry_run.
 */

export type BufferProfile = {
  id: string;
  service: string;
  formatted_username?: string;
  timezone?: string;
};

export type BufferCreateResult = {
  success: boolean;
  updateIds: string[];
  raw: unknown;
};

function clean(raw: string | undefined): string {
  return (raw || '').trim();
}

export function getBufferAccessToken(): string {
  return clean(process.env.BUFFER_ACCESS_TOKEN);
}

export function isBufferConfigured(): boolean {
  return Boolean(getBufferAccessToken());
}

/** Map ClearPath platforms → Buffer "service" names */
export function bufferServiceForPlatform(platform: string): string | null {
  const map: Record<string, string> = {
    x: 'twitter',
    twitter: 'twitter',
    linkedin: 'linkedin',
    facebook: 'facebook',
    instagram: 'instagram',
    tiktok: 'tiktok',
    youtube: 'youtube',
  };
  return map[platform] || null;
}

export async function listBufferProfiles(): Promise<BufferProfile[]> {
  const token = getBufferAccessToken();
  if (!token) throw new Error('BUFFER_ACCESS_TOKEN is not configured.');

  const url = `https://api.bufferapp.com/1/profiles.json?access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Buffer profiles failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as BufferProfile[];
  return Array.isArray(data) ? data : [];
}

export async function resolveBufferProfileId(
  platform: string,
  overrideId?: string
): Promise<string> {
  if (overrideId?.trim()) return overrideId.trim();

  const envKey = `BUFFER_PROFILE_${platform.toUpperCase()}`;
  const fromEnv = clean(process.env[envKey]);
  if (fromEnv) return fromEnv;

  const service = bufferServiceForPlatform(platform);
  if (!service) throw new Error(`No Buffer service mapping for platform: ${platform}`);

  const profiles = await listBufferProfiles();
  const match = profiles.find((p) => (p.service || '').toLowerCase() === service);
  if (!match?.id) {
    throw new Error(
      `No Buffer profile found for service "${service}". Connect it in Buffer or set ${envKey}.`
    );
  }
  return match.id;
}

export async function createBufferUpdate(opts: {
  profileId: string;
  text: string;
  scheduledAt?: string;
  mediaUrls?: string[];
  linkUrl?: string;
}): Promise<BufferCreateResult> {
  const token = getBufferAccessToken();
  if (!token) throw new Error('BUFFER_ACCESS_TOKEN is not configured.');

  const params = new URLSearchParams();
  params.set('access_token', token);
  params.set('profile_ids[]', opts.profileId);
  params.set('text', opts.text);
  params.set('shorten', 'false');

  if (opts.scheduledAt) {
    const ms = Date.parse(opts.scheduledAt);
    if (Number.isFinite(ms)) {
      params.set('scheduled_at', String(Math.floor(ms / 1000)));
    }
  } else {
    // Now / next slot — Buffer treats now=true as share ASAP
    params.set('now', 'true');
  }

  if (opts.mediaUrls?.[0]) {
    params.set('media[photo]', opts.mediaUrls[0]);
  }
  if (opts.linkUrl) {
    params.set('media[link]', opts.linkUrl);
  }

  const res = await fetch('https://api.bufferapp.com/1/updates/create.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const raw = await res.json().catch(async () => ({ text: await res.text() }));
  if (!res.ok) {
    throw new Error(
      `Buffer create failed (${res.status}): ${JSON.stringify(raw).slice(0, 300)}`
    );
  }

  const success = Boolean((raw as { success?: boolean }).success);
  const updates = (raw as { updates?: Array<{ id?: string }> }).updates || [];
  const updateIds = updates.map((u) => u.id).filter(Boolean) as string[];

  return { success, updateIds, raw };
}
