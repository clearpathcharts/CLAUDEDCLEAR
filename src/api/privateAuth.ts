/** Client API for ClearPath private account login / registration. */

export type PrivateSessionUser = {
  uid: string;
  email: string;
  displayName: string;
  isAnonymous: boolean;
  emailVerified: boolean;
  privateAccount: boolean;
};

const SESSION_KEY = 'cp_private_session';

export function getStoredPrivateSession(): PrivateSessionUser | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.uid && parsed?.email) return parsed as PrivateSessionUser;
  } catch {
    /* ignore */
  }
  return null;
}

export function storePrivateSession(user: PrivateSessionUser) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  // Keep legacy bypass slot in sync so existing auth gate recognizes the user
  localStorage.setItem('cp_local_bypass_user', JSON.stringify(user));
}

export function clearPrivateSession() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
  try {
    const raw = localStorage.getItem('cp_local_bypass_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.privateAccount) {
        localStorage.removeItem('cp_local_bypass_user');
      }
    }
  } catch {
    localStorage.removeItem('cp_local_bypass_user');
  }
}

async function parseJson(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed (${res.status})`);
  }
  return data;
}

export async function lookupPrivateAccount(email: string): Promise<{
  exists: boolean;
}> {
  const res = await fetch('/api/auth/private/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email }),
  });
  return parseJson(res);
}

export async function registerPrivateAccount(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<PrivateSessionUser> {
  const res = await fetch('/api/auth/private/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });
  const data = await parseJson(res);
  storePrivateSession(data.user);
  return data.user;
}

export async function loginPrivateAccount(input: {
  email: string;
  password: string;
}): Promise<PrivateSessionUser> {
  const res = await fetch('/api/auth/private/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });
  const data = await parseJson(res);
  storePrivateSession(data.user);
  return data.user;
}

export async function logoutPrivateAccount(): Promise<void> {
  try {
    await fetch('/api/auth/private/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } finally {
    clearPrivateSession();
  }
}
