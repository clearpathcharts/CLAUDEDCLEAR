import { auth } from '../firebase';

export type InboxSeverity = 'security' | 'update' | 'info';

export type MemberInboxMessage = {
  id: string;
  subject: string;
  body: string;
  severity: InboxSeverity;
  createdAt: string;
  read: boolean;
};

async function memberHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  try {
    const current = auth.currentUser as { getIdToken?: () => Promise<string> } | null;
    if (current?.getIdToken) headers.Authorization = `Bearer ${await current.getIdToken()}`;
  } catch {
    /* private-session members authenticate by cookie */
  }
  return headers;
}

export async function fetchMemberInbox(): Promise<{ messages: MemberInboxMessage[]; unread: number } | null> {
  const res = await fetch('/api/member/inbox', { credentials: 'include', headers: await memberHeaders() });
  if (!res.ok) return null;
  return res.json();
}

export async function markInboxRead(ids: string[] | 'all'): Promise<void> {
  await fetch('/api/member/inbox/read', {
    method: 'POST',
    credentials: 'include',
    headers: await memberHeaders(),
    body: JSON.stringify(ids === 'all' ? { all: true } : { ids }),
  });
}
