/** Client helpers for server-backed profile save (avoids Firestore permission errors). */

export async function saveProfileToServer(payload: Record<string, unknown>): Promise<{ ok: boolean; profile?: any; error?: string }> {
  const res = await fetch('/api/profile/me', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data.error || data.message || `Save failed (${res.status})` };
  }
  return { ok: true, profile: data.profile };
}

export async function loadProfileFromServer(uid?: string): Promise<any | null> {
  const q = uid ? `?uid=${encodeURIComponent(uid)}` : '';
  const res = await fetch(`/api/profile/me${q}`, { credentials: 'include' });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data?.profile || null;
}

export type PublicMemberProfile = {
  displayName: string;
  username: string;
  bio: string;
  avatarUrl: string;
  coverUrl: string;
  instagramType?: string;
  contractorBadges: { id: string; label: string; imageUrl: string }[];
};

export async function loadPublicProfile(username: string): Promise<PublicMemberProfile | null> {
  const handle = encodeURIComponent(String(username || '').trim());
  if (!handle) return null;
  const res = await fetch(`/api/profile/public/${handle}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data?.profile || null;
}
