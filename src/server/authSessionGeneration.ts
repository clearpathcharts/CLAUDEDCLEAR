/**
 * Global Private Login / board cookie generation.
 * Bump the durable counter (CEO Dashboard button, AUTH_SESSION_GENERATION env,
 * or DEFAULT) to drop every existing Express session on the next request.
 * Never deletes private_accounts / waitlist / profiles — only login cookies.
 * Browsers that never hit the origin cannot be logged out from here.
 */

import fs from 'node:fs';
import path from 'node:path';
import { getAdminFirestore } from './firebaseAdmin';
import { purgeExpressSessionCookiesOnly } from './firestoreSessionStore';

export const DEFAULT_AUTH_SESSION_GENERATION = 2;
export const AUTH_GENERATION_COLLECTION = 'founder_ops';
export const AUTH_GENERATION_DOC = 'auth_session_generation';

const FILE = path.join(process.cwd(), 'data', 'auth-session-generation.json');

type DurableKickState = {
  generation: number;
  kickedAt?: string;
  kickedBy?: string;
};

let cachedGeneration = DEFAULT_AUTH_SESSION_GENERATION;
let lastKick: DurableKickState = { generation: DEFAULT_AUTH_SESSION_GENERATION };

function envFloor(): number {
  const raw = Number.parseInt(String(process.env.AUTH_SESSION_GENERATION || '').trim(), 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 0;
}

export function getAuthSessionGeneration(): number {
  return Math.max(DEFAULT_AUTH_SESSION_GENERATION, envFloor(), cachedGeneration);
}

export function getAuthKickStatus(): DurableKickState {
  return { ...lastKick, generation: getAuthSessionGeneration() };
}

export function resetAuthSessionGenerationForTests(): void {
  cachedGeneration = DEFAULT_AUTH_SESSION_GENERATION;
  lastKick = { generation: DEFAULT_AUTH_SESSION_GENERATION };
}

function rememberState(state: DurableKickState): void {
  cachedGeneration = Math.max(getAuthSessionGeneration(), state.generation);
  lastKick = { ...state, generation: cachedGeneration };
}

function readFileState(): DurableKickState | null {
  try {
    if (!fs.existsSync(FILE)) return null;
    const parsed = JSON.parse(fs.readFileSync(FILE, 'utf8')) as DurableKickState;
    const generation = Number(parsed?.generation);
    if (!Number.isFinite(generation) || generation <= 0) return null;
    return {
      generation,
      kickedAt: typeof parsed.kickedAt === 'string' ? parsed.kickedAt : undefined,
      kickedBy: typeof parsed.kickedBy === 'string' ? parsed.kickedBy : undefined,
    };
  } catch {
    return null;
  }
}

function writeFileState(state: DurableKickState): void {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(state, null, 2), 'utf8');
}

export async function loadDurableAuthGeneration(): Promise<number> {
  const db = getAdminFirestore();
  if (db) {
    try {
      const snap = await db.collection(AUTH_GENERATION_COLLECTION).doc(AUTH_GENERATION_DOC).get();
      const generation = Number(snap.data()?.generation);
      if (Number.isFinite(generation) && generation > 0) {
        rememberState({
          generation,
          kickedAt: typeof snap.data()?.kickedAt === 'string' ? snap.data()?.kickedAt : undefined,
          kickedBy: typeof snap.data()?.kickedBy === 'string' ? snap.data()?.kickedBy : undefined,
        });
        return getAuthSessionGeneration();
      }
    } catch {
      /* fall through to file */
    }
  }
  const fromFile = readFileState();
  if (fromFile) rememberState(fromFile);
  return getAuthSessionGeneration();
}

async function persistKickState(state: DurableKickState): Promise<void> {
  rememberState(state);
  writeFileState(state);
  const db = getAdminFirestore();
  if (!db) return;
  await db.collection(AUTH_GENERATION_COLLECTION).doc(AUTH_GENERATION_DOC).set(
    {
      generation: state.generation,
      kickedAt: state.kickedAt || null,
      kickedBy: state.kickedBy || null,
    },
    { merge: true },
  );
}

export function sessionMatchesGeneration(session: { authGeneration?: unknown } | null | undefined): boolean {
  const got = Number(session?.authGeneration);
  return Number.isFinite(got) && got === getAuthSessionGeneration();
}

export function applyGrantedSession(
  session: Record<string, unknown> | undefined,
  user: unknown,
): void {
  if (!session) return;
  session.privateUser = user;
  session.authGeneration = getAuthSessionGeneration();
}

export function dropStaleAuthSession(session: {
  privateUser?: unknown;
  boardAccess?: unknown;
  authGeneration?: unknown;
} | null | undefined): 'ok' | 'dropped' {
  if (!session) return 'ok';
  if (!session.privateUser && !session.boardAccess) return 'ok';
  if (sessionMatchesGeneration(session)) return 'ok';
  delete session.privateUser;
  delete session.boardAccess;
  delete session.authGeneration;
  return 'dropped';
}

/** Sign everyone out. Does not delete private_accounts, waitlist, or profiles. */
export async function kickAllMemberSessions(opts?: { kickedBy?: string }): Promise<{
  generation: number;
  sessionsDeleted: number;
  sessionStore: 'firestore' | 'memory' | 'none';
  accountsDeleted: 0;
  kickedAt: string;
  kickedBy: string;
}> {
  const next: DurableKickState = {
    generation: getAuthSessionGeneration() + 1,
    kickedAt: new Date().toISOString(),
    kickedBy: String(opts?.kickedBy || 'ceo-dashboard').trim() || 'ceo-dashboard',
  };
  await persistKickState(next);
  const purged = await purgeExpressSessionCookiesOnly();
  return {
    generation: getAuthSessionGeneration(),
    sessionsDeleted: purged.deleted,
    sessionStore: purged.source,
    accountsDeleted: 0,
    kickedAt: next.kickedAt!,
    kickedBy: next.kickedBy!,
  };
}
