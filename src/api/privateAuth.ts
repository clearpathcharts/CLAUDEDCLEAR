/** Client API for ClearPath private account login / registration.
 * Auth state lives in the httpOnly `cpt.sid` cookie — never localStorage.
 */

export type PrivateSessionUser = {
  uid: string;
  email: string;
  displayName: string;
  isAnonymous: boolean;
  emailVerified: boolean;
  privateAccount: boolean;
  boardAccess?: boolean;
};

const LEGACY_SESSION_KEY = 'cp_private_session';
const LEGACY_BYPASS_KEY = 'cp_local_bypass_user';

/** Wipe legacy client-side auth mirrors (pre-hardening). Does not touch server cookies. */
export function clearPrivateSession() {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(LEGACY_SESSION_KEY);
      localStorage.removeItem(LEGACY_BYPASS_KEY);
      localStorage.removeItem('MASTER_BYPASS');
      localStorage.removeItem('founders_unlocked');
    } catch {
      /* ignore */
    }
  }
}

/** Full client cleanup on logout (legacy + tab-scoped board UI flags). */
export function clearClientAuthArtifacts() {
  clearPrivateSession();
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.removeItem('founders_unlocked');
      sessionStorage.removeItem('cp_board_unlocked');
    } catch {
      /* ignore */
    }
  }
}

/** @deprecated Prefer fetchPrivateSession() — localStorage is no longer authoritative. */
export function getStoredPrivateSession(): PrivateSessionUser | null {
  return null;
}

/** @deprecated Sessions are cookie-backed; this is a no-op kept for call-site compatibility. */
export function storePrivateSession(_user: PrivateSessionUser) {
  clearPrivateSession();
}

async function parseJson(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed (${res.status})`);
  }
  return data;
}

/** Resolve the current private/board session from the httpOnly cookie. */
export async function fetchPrivateSession(): Promise<PrivateSessionUser | null> {
  try {
    const res = await fetch('/api/auth/private/me', {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (res.status === 401) {
      clearPrivateSession();
      return null;
    }
    const data = await parseJson(res);
    return (data.user as PrivateSessionUser) || null;
  } catch {
    return null;
  }
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
  clearPrivateSession();
  const res = await fetch('/api/auth/private/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });
  const data = await parseJson(res);
  return data.user as PrivateSessionUser;
}

export async function loginPrivateAccount(input: {
  email: string;
  password: string;
}): Promise<PrivateSessionUser> {
  clearPrivateSession();
  const res = await fetch('/api/auth/private/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });
  const data = await parseJson(res);
  return data.user as PrivateSessionUser;
}

export async function verifyBoardAccess(code: string): Promise<PrivateSessionUser> {
  clearPrivateSession();
  const res = await fetch('/api/auth/board/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ code }),
  });
  const data = await parseJson(res);
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('cp_board_unlocked', 'true');
    sessionStorage.setItem('founders_unlocked', 'true');
  }
  return data.user as PrivateSessionUser;
}

export async function logoutPrivateAccount(): Promise<void> {
  try {
    await fetch('/api/auth/private/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } finally {
    clearClientAuthArtifacts();
  }
}
