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
  identityStatus?: 'ok' | 'pending_confirm' | 'declined' | 'expired';
};

export type IdentityGateUser = {
  uid: string;
  email: string;
  displayName: string;
  identityStatus: 'pending_confirm' | 'declined' | 'expired';
};

export class PrivateAuthClientError extends Error {
  code?: string;
  identityStatus?: string;
  reasons?: string[];
  user?: IdentityGateUser;
  emailSent?: boolean;
  constructor(
    message: string,
    opts?: {
      code?: string;
      identityStatus?: string;
      reasons?: string[];
      user?: IdentityGateUser;
      emailSent?: boolean;
    }
  ) {
    super(message);
    this.code = opts?.code;
    this.identityStatus = opts?.identityStatus;
    this.reasons = opts?.reasons;
    this.user = opts?.user;
    this.emailSent = opts?.emailSent;
  }
}

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
    throw new PrivateAuthClientError(data.error || data.message || `Request failed (${res.status})`, {
      code: data.code,
      identityStatus: data.identityStatus,
      reasons: Array.isArray(data.reasons) ? data.reasons : undefined,
      user: data.user,
      emailSent: data.emailSent,
    });
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
  identityStatus?: string;
}> {
  const res = await fetch('/api/auth/private/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email }),
  });
  return parseJson(res);
}

export type RegisterPrivateResult =
  | { quarantined: false; user: PrivateSessionUser }
  | {
      quarantined: true;
      identityStatus: 'pending_confirm';
      emailSent: boolean;
      reasons: string[];
      user: IdentityGateUser;
    };

export async function registerPrivateAccount(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<RegisterPrivateResult> {
  clearPrivateSession();
  const res = await fetch('/api/auth/private/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });
  const data = await parseJson(res);
  if (data.quarantined) {
    return {
      quarantined: true,
      identityStatus: 'pending_confirm',
      emailSent: Boolean(data.emailSent),
      reasons: Array.isArray(data.reasons) ? data.reasons : [],
      user: data.user as IdentityGateUser,
    };
  }
  return { quarantined: false, user: data.user as PrivateSessionUser };
}

export type LoginPrivateResult =
  | { kind: 'ok'; user: PrivateSessionUser }
  | {
      kind: 'pending_confirm';
      user: IdentityGateUser;
      reasons: string[];
    }
  | {
      kind: 'declined';
      message: string;
    };

export async function loginPrivateAccount(input: {
  email: string;
  password: string;
}): Promise<LoginPrivateResult> {
  clearPrivateSession();
  const res = await fetch('/api/auth/private/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok) {
    return { kind: 'ok', user: data.user as PrivateSessionUser };
  }
  if (data.code === 'IDENTITY_PENDING' || data.identityStatus === 'pending_confirm') {
    return {
      kind: 'pending_confirm',
      user: data.user as IdentityGateUser,
      reasons: Array.isArray(data.reasons) ? data.reasons : [],
    };
  }
  if (data.code === 'IDENTITY_DECLINED' || data.identityStatus === 'declined' || data.identityStatus === 'expired') {
    return { kind: 'declined', message: data.error || 'Have a good one.' };
  }
  throw new PrivateAuthClientError(data.error || data.message || `Request failed (${res.status})`, {
    code: data.code,
    identityStatus: data.identityStatus,
  });
}

export async function resubmitIdentity(input: {
  currentEmail: string;
  password: string;
  newEmail: string;
  newDisplayName: string;
}): Promise<RegisterPrivateResult | { quarantined: false; user: PrivateSessionUser; unlocked: true }> {
  const res = await fetch('/api/auth/private/identity/resubmit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });
  const data = await parseJson(res);
  if (data.identityStatus === 'ok' && data.user) {
    return { quarantined: false, user: data.user as PrivateSessionUser, unlocked: true };
  }
  return {
    quarantined: true,
    identityStatus: 'pending_confirm',
    emailSent: Boolean(data.emailSent),
    reasons: Array.isArray(data.reasons) ? data.reasons : [],
    user: data.user as IdentityGateUser,
  };
}

export async function declineIdentity(input: {
  email: string;
  password?: string;
}): Promise<void> {
  const res = await fetch('/api/auth/private/identity/decline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });
  await parseJson(res);
}

export async function resendIdentityConfirm(input: {
  email: string;
  password: string;
}): Promise<{ emailSent: boolean }> {
  const res = await fetch('/api/auth/private/identity/resend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });
  const data = await parseJson(res);
  return { emailSent: Boolean(data.emailSent) };
}

export async function requestForgotPassword(email: string): Promise<{ ok: true; message: string }> {
  const res = await fetch('/api/auth/private/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email }),
  });
  const data = await parseJson(res);
  return {
    ok: true,
    message:
      String(data.message || '') ||
      'If that email has a Private Login, we emailed a new password. Check inbox and spam.',
  };
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
