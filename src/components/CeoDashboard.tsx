import React, { useState, useEffect } from 'react';
import { getDb, auth } from "../firebase";
import { collection, getDocs, query, limit, onSnapshot } from '../firebase';
import { Search, Activity, Users, ShieldAlert, Terminal, AlertCircle, Lock, UserPlus, RefreshCw, Mail, Download, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/FirebaseContext';
import { isVideoUrl, isAudioUrl } from '../lib/utils';
import { AnimatePresence } from 'framer-motion';
import QuarantineModal from './QuarantineModal';
import DailyOpsDesk from './DailyOpsDesk';
import DailyPatternReviewDesk from './DailyPatternReviewDesk';
import CeoAlwaysOnMonitor from './CeoAlwaysOnMonitor';
import { FOUNDER_EMAIL, isFounderEmail, isFounderSession } from '../lib/founder';
import { GITHUB_SOURCE_ZIP_URL } from '../lib/sourceRepo';
import ChooseYourPath from './ChooseYourPath';
import { navigateToDesk } from '../lib/traderDesks';

type SafePrivateMemberRow = {
  uid: string;
  email: string;
  displayName: string;
  createdAt: string;
  lastLoginAt?: string;
  identityStatus?: 'ok' | 'pending_confirm' | 'declined' | 'expired';
};

function identityBadge(status?: SafePrivateMemberRow['identityStatus']): {
  label: string;
  className: string;
} {
  if (status === 'pending_confirm') {
    return { label: 'pending', className: 'text-amber-300 bg-amber-500/15 border-amber-500/40' };
  }
  if (status === 'declined' || status === 'expired') {
    return { label: status, className: 'text-red-300 bg-red-500/15 border-red-500/40' };
  }
  return { label: status === 'ok' ? 'ok' : 'ok', className: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/40' };
}

type SafeWaitlistRow = {
  id: string;
  email: string;
  firstName?: string;
  country?: string;
  experienceLevel?: string;
  status?: string;
  createdAt?: string;
  source: 'firestore' | 'local';
};

type AdminMembersPayload = {
  ok: boolean;
  counts: { privateMembers: number; waitlist: number };
  privateMembers: SafePrivateMemberRow[];
  waitlist: SafeWaitlistRow[];
  meta?: {
    privateStorage?: string;
    privatePath?: string;
    privateCollection?: string;
    privateSource?: string;
    waitlistSource?: string;
    persistenceWarning?: string;
    durable?: boolean;
    writesAllowed?: boolean;
    productionHardFail?: boolean;
    stripeConfigured?: boolean;
    firebaseAdmin?: {
      configured?: boolean;
      firestore?: boolean;
      mode?: string;
      reason?: string;
    };
  };
};

type InviteMailRow = {
  email: string;
  firstName: string;
  displayName: string;
  uid: string;
  tempPassword?: string;
  activationKey?: string;
  hasPrivateAccount: boolean;
  subject: string;
  body: string;
  sendStatus: 'ready' | 'sent' | 'needs_password' | 'skipped_junk' | 'error';
  lastSentAt?: string;
  nameFlag?: string;
};

type SiteDoctorCheck = {
  id: string;
  label: string;
  ok: boolean;
  severity: 'critical' | 'warn' | 'info';
  detail: string;
  latencyMs?: number;
};

type SiteDoctorReport = {
  ranAt: string;
  overall: 'green' | 'yellow' | 'red';
  okCount: number;
  failCount: number;
  warnCount: number;
  checks: SiteDoctorCheck[];
  nextDueHint: string;
};

function formatJoined(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export default function CeoDashboard() {
  const db = getDb();
  const [ceoTab, setCeoTab] = useState<'system' | 'members'>('system');
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [investigatingUser, setInvestigatingUser] = useState<any | null>(null);
  
  // Real-time remote system logs states
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  // Private login members (server API — founder Bearer / catalog secret)
  const [membersPayload, setMembersPayload] = useState<AdminMembersPayload | null>(null);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [convertBusy, setConvertBusy] = useState(false);
  const [convertMsg, setConvertMsg] = useState<string | null>(null);
  const [invitesPreview, setInvitesPreview] = useState<
    Array<{ email: string; displayName: string; activationKey: string; tempPassword?: string }>
  >([]);
  const [invitesVisible, setInvitesVisible] = useState(false);
  const [inviteMailRows, setInviteMailRows] = useState<InviteMailRow[]>([]);
  const [inviteMailSmtp, setInviteMailSmtp] = useState<boolean | null>(null);
  const [inviteMailBusyEmail, setInviteMailBusyEmail] = useState<string | null>(null);
  const [inviteMailMsg, setInviteMailMsg] = useState<string | null>(null);
  const [importText, setImportText] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('itsahmadsaad@gmail.com');
  const [apiUnlocked, setApiUnlocked] = useState(false);
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [catalogSecretInput, setCatalogSecretInput] = useState(() => {
    try {
      return sessionStorage.getItem('cp_catalog_admin_secret') || '';
    } catch {
      return '';
    }
  });
  const [siteDoctor, setSiteDoctor] = useState<SiteDoctorReport | null>(null);
  const [siteDoctorLoading, setSiteDoctorLoading] = useState(false);
  const [siteDoctorError, setSiteDoctorError] = useState<string | null>(null);
  const [siteDoctorBusy, setSiteDoctorBusy] = useState(false);
  const [kickBusy, setKickBusy] = useState(false);

  const { user, userProfile } = useAuth();
  const founderOk = isFounderSession(user?.email, userProfile?.email, auth.currentUser?.email);
  const showsUnauthorized =
    /unauthorized|forbidden|founder auth|sign in|catalog admin/i.test(
      `${membersError || ''} ${convertMsg || ''}`
    ) && !apiUnlocked;

  const founderApiHeaders = async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-clearpath-founder-action': '1',
    };
    // Only attach Firebase Bearer when it is the founder email.
    const current = auth.currentUser;
    if (current && isFounderEmail(current.email)) {
      const token = await current.getIdToken(true);
      headers.Authorization = `Bearer ${token}`;
    }
    try {
      const secret = (sessionStorage.getItem('cp_catalog_admin_secret') || catalogSecretInput || '').trim();
      if (secret) headers['x-catalog-admin-secret'] = secret;
    } catch {
      /* ignore */
    }
    return headers;
  };

  const runFounderUnlock = async () => {
    setUnlockBusy(true);
    setConvertMsg(null);
    setMembersError(null);
    try {
      const current = auth.currentUser;
      if (!current || !isFounderEmail(current.email)) {
        throw new Error(
          `STEP 1 failed: Google is not signed in as ${FOUNDER_EMAIL}. Sign in with that Google account on this site, then click Unlock again.`
        );
      }
      const token = await current.getIdToken(true);
      const res = await fetch('/api/admin/founder-unlock', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: '{}',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || body.error || `Unlock failed (${res.status})`);
      }
      setApiUnlocked(true);
      setConvertMsg(
        body.next ||
          'Unlocked. Open Invite emails below — tap SEND EMAIL next to each person (one click).'
      );
      await loadAdminMembers();
      await loadInviteMail();
    } catch (err: any) {
      setApiUnlocked(false);
      setConvertMsg(err?.message || 'Unlock failed.');
    } finally {
      setUnlockBusy(false);
    }
  };

  const saveCatalogSecretAndRetry = async () => {
    const secret = catalogSecretInput.trim();
    if (!secret) {
      setConvertMsg('Paste your catalog admin secret first (from your server env CATALOG_ADMIN_SECRET).');
      return;
    }
    try {
      sessionStorage.setItem('cp_catalog_admin_secret', secret);
    } catch {
      /* ignore */
    }
    setUnlockBusy(true);
    setConvertMsg(null);
    try {
      const headers = await founderApiHeaders();
      const res = await fetch('/api/admin/members', { headers, credentials: 'include' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || body.error || `Still locked (${res.status})`);
      }
      setApiUnlocked(true);
      setMembersPayload(body as AdminMembersPayload);
      setMembersError(null);
      setConvertMsg(
        'Secret accepted. Open Invite emails below — tap SEND EMAIL next to each person (one click).'
      );
      await loadInviteMail();
    } catch (err: any) {
      setApiUnlocked(false);
      setConvertMsg(err?.message || 'Secret did not unlock the API.');
    } finally {
      setUnlockBusy(false);
    }
  };

  const loadAdminMembers = async () => {
    setMembersLoading(true);
    setMembersError(null);
    try {
      const headers = await founderApiHeaders();
      const res = await fetch('/api/admin/members', { headers, credentials: 'include' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (body && (body.message || body.error)) || `Members API failed (${res.status})`
        );
      }
      setMembersPayload(body as AdminMembersPayload);
      setApiUnlocked(true);
    } catch (err: any) {
      console.error('[CeoDashboard] /api/admin/members failed:', err);
      setMembersError(err?.message || 'Could not load members.');
      setMembersPayload(null);
      setApiUnlocked(false);
    } finally {
      setMembersLoading(false);
    }
  };

  const fetchFounderInvites = async (opts?: { keepBusy?: boolean; appendMsg?: string }) => {
    if (!opts?.keepBusy) {
      setConvertBusy(true);
      setConvertMsg(null);
    }
    try {
      const headers = await founderApiHeaders();
      const res = await fetch('/api/admin/members/invites?includeSecrets=1', {
        headers,
        credentials: 'include',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || body.error || `Invites failed (${res.status})`);
      setInvitesPreview(
        (body.invites || []).map((inv: any) => ({
          email: inv.email,
          displayName: inv.displayName,
          activationKey: inv.activationKey,
          tempPassword: inv.tempPassword,
        }))
      );
      setInvitesVisible(true);
      const inviteHint =
        body.howToSend ||
        'Invites loaded. Send email + temp password privately — do not paste into chat logs.';
      setConvertMsg(opts?.appendMsg ? `${opts.appendMsg}\n\n${inviteHint}` : inviteHint);
      return true;
    } catch (err: any) {
      const fail = err?.message || 'Could not load invites.';
      setConvertMsg(opts?.appendMsg ? `${opts.appendMsg}\n\n${fail}` : fail);
      return false;
    } finally {
      if (!opts?.keepBusy) setConvertBusy(false);
    }
  };

  const loadFounderInvites = async () => {
    await fetchFounderInvites();
  };

  const loadInviteMail = async () => {
    setConvertBusy(true);
    setInviteMailMsg(null);
    try {
      const headers = await founderApiHeaders();
      const res = await fetch('/api/admin/members/invite-mail', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: '{}',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || body.error || `Invite mail failed (${res.status})`);
      setInviteMailRows(Array.isArray(body.rows) ? body.rows : []);
      setInviteMailSmtp(Boolean(body.smtpConfigured));
      setInviteMailMsg(
        body.smtpConfigured
          ? `Invite list ready (${body.readyCount || 0} to send). Tap SEND EMAIL — one person, one click.`
          : 'Invite list loaded, but SMTP is not set on the server yet (SMTP_HOST / SMTP_USER / SMTP_PASS). SEND will fail until those Cloud Run env vars are added.'
      );
      setApiUnlocked(true);
    } catch (err: any) {
      setInviteMailMsg(err?.message || 'Could not load invite mail list.');
    } finally {
      setConvertBusy(false);
    }
  };

  const sendInviteMailOne = async (email: string) => {
    setInviteMailBusyEmail(email);
    setInviteMailMsg(null);
    try {
      const headers = await founderApiHeaders();
      const res = await fetch('/api/admin/members/invite-mail/send', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) {
        throw new Error(body.message || body.error || `Send failed (${res.status})`);
      }
      setInviteMailMsg(body.message || `Sent to ${email}.`);
      // Refresh row statuses without hiding the panel
      const headers2 = await founderApiHeaders();
      const refresh = await fetch('/api/admin/members/invite-mail', {
        method: 'POST',
        headers: headers2,
        credentials: 'include',
        body: '{}',
      });
      const refreshed = await refresh.json().catch(() => ({}));
      if (refresh.ok && Array.isArray(refreshed.rows)) {
        setInviteMailRows(refreshed.rows);
        setInviteMailSmtp(Boolean(refreshed.smtpConfigured));
      }
    } catch (err: any) {
      setInviteMailMsg(err?.message || `Could not send to ${email}.`);
    } finally {
      setInviteMailBusyEmail(null);
    }
  };

  const runEmergencySeed = async (dryRun: boolean) => {
    setConvertBusy(true);
    setConvertMsg(null);
    try {
      const headers = await founderApiHeaders();
      const res = await fetch('/api/admin/members/emergency-seed', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ dryRun, resetExisting: true }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || body.error || `Emergency seed failed (${res.status})`);
      setConvertMsg(
        dryRun
          ? `Emergency dry run: ${body.created} would be created, ${body.reset} would get new passwords (${body.members?.length || 0} known survivors).`
          : `Emergency restore: ${body.created} created, ${body.reset} passwords reset, ${body.invitesCreated} invites. Open “Show invite passwords” — send Dawn’s credentials privately.`
      );
      if (!dryRun) {
        await loadAdminMembers();
        await loadFounderInvites();
      }
    } catch (err: any) {
      setConvertMsg(err?.message || 'Emergency seed failed.');
    } finally {
      setConvertBusy(false);
    }
  };

  const runResetMemberPassword = async (emailRaw: string) => {
    const email = (emailRaw || '').trim().toLowerCase();
    if (!email.includes('@')) {
      setConvertMsg('Enter a valid member email to reset.');
      return;
    }
    setConvertBusy(true);
    setConvertMsg(null);
    try {
      const headers = await founderApiHeaders();
      const res = await fetch('/api/admin/members/reset-password', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || body.error || `Password reset failed (${res.status})`);
      setConvertMsg(
        `Reset OK for ${body.email} (${body.created ? 'account created' : 'password updated'}). Temp password: ${body.tempPassword}. Send privately — they use Private Login.`
      );
      await loadAdminMembers();
      await loadFounderInvites();
    } catch (err: any) {
      setConvertMsg(err?.message || 'Password reset failed.');
    } finally {
      setConvertBusy(false);
    }
  };

  const runResetDawnPassword = async () => {
    await runResetMemberPassword('dawnhobson@aol.com');
  };

  const kickEveryoneOut = async () => {
    const ok = window.confirm(
      'Sign every member out of their current login cookie?\n\nAccounts stay in Firestore. Nobody is deleted. Open tabs must refresh, then they log in again. You stay signed in on this CEO screen.',
    );
    if (!ok) return;
    setKickBusy(true);
    setConvertMsg(null);
    try {
      const headers = await founderApiHeaders();
      const res = await fetch('/api/admin/auth/kick-sessions', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: '{}',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || body.error || `Kick failed (${res.status})`);
      setConvertMsg(
        `Signed everyone else out. Cookies dropped: ${body.sessionsDeleted ?? 0} (${body.sessionStore || 'unknown'}). Accounts deleted: ${body.accountsDeleted ?? 0}. Ask the room to refresh, then log back in.`,
      );
    } catch (err: any) {
      setConvertMsg(err?.message || 'Could not sign everyone out.');
    } finally {
      setKickBusy(false);
    }
  };

  const downloadDisasterBackup = async () => {
    setConvertBusy(true);
    setConvertMsg(null);
    try {
      const headers = await founderApiHeaders();
      const res = await fetch('/api/admin/backup/download', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: '{}',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || body.error || `Backup download failed (${res.status})`);
      }
      const blob = await res.blob();
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clearpath-founder-backup-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      // Also persist a Firestore copy when possible.
      try {
        await fetch('/api/admin/backup/snapshot', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: '{}',
        });
      } catch {
        /* download already succeeded */
      }
      setConvertMsg(
        'Disaster backup downloaded. Keep that JSON on a drive you control. Never post it in chat. You always need backups — agents must never say otherwise.'
      );
    } catch (err: any) {
      setConvertMsg(err?.message || 'Backup download failed.');
    } finally {
      setConvertBusy(false);
    }
  };

  const runFounderImport = async (dryRun: boolean) => {
    setConvertBusy(true);
    setConvertMsg(null);
    try {
      let members: Array<{ email: string; displayName?: string; password?: string }> = [];
      const raw = importText.trim();
      if (!raw) throw new Error('Paste a JSON array of { email, displayName?, password? }.');
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('Import JSON must be an array.');
      members = parsed.map((row: any) => ({
        email: String(row?.email || ''),
        ...(row?.displayName ? { displayName: String(row.displayName) } : {}),
        ...(row?.password ? { password: String(row.password) } : {}),
      }));
      const headers = await founderApiHeaders();
      const res = await fetch('/api/admin/members/import', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ members, dryRun }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || body.error || `Import failed (${res.status})`);
      setConvertMsg(
        dryRun
          ? `Import dry run: ${body.created} would be created, ${body.already} already exist (${body.candidates} rows).`
          : `Import: ${body.created} created, ${body.already} already existed, ${body.invitesCreated} temp invites. Open “Show invite passwords” if passwords were auto-generated.`
      );
      if (!dryRun) await loadAdminMembers();
    } catch (err: any) {
      setConvertMsg(err?.message || 'Import failed.');
    } finally {
      setConvertBusy(false);
    }
  };

  useEffect(() => {
    if (!founderOk) {
      setLogsLoading(false);
      return;
    }
    let unsubscribeLogs = () => {};

    const setupLogsListener = () => {
      try {
        if (!auth.currentUser) {
          console.warn("No authorized Auth state active for system_logs subscription.");
          setLogsLoading(false);
          return;
        }

        unsubscribeLogs = onSnapshot(query(collection(getDb(), 'system_logs'), limit(100)), (snapshot) => {
          const fetchedLogs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Sort in-memory safely to protect against missing composite-index errors
          fetchedLogs.sort((a: any, b: any) => {
            const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
            const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
            return timeB - timeA;
          });

          setLogs(fetchedLogs);
          setLogsLoading(false);
        }, (error) => {
          console.error("Failed to subscribe to system logs realtime stream:", error);
          setLogsLoading(false);
        });
      } catch (err) {
        console.error("Failed to register logs stream:", err);
        setLogsLoading(false);
      }
    };

    setupLogsListener();
    return () => unsubscribeLogs();
  }, [founderOk]);

  useEffect(() => {
    if (!founderOk) {
      setIsLoading(false);
      return;
    }
    const fetchUsers = async () => {
      try {
        if (!auth.currentUser) {
          console.warn("No active Firebase Auth user, falling back to mock data.");
          setUsers([{
            id: 'mock-1',
            email: 'operator@clearpathtrader.com',
            displayName: 'System Operator',
            username: 'sys_op',
            interfaceType: 'calm_focus',
            createdAt: new Date()
          }]);
          setIsLoading(false);
          return;
        }
        const q = query(collection(getDb(), 'users'));
        const querySnapshot = await getDocs(q);
        const fetchedUsers = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(fetchedUsers);
      } catch (err) {
        // Silently handle error or log it if the user isn't authorized to read all users
        console.error("Failed to fetch users", err);
        setUsers([{
          id: 'mock-1',
          email: 'admin@clearpathtrader.com',
          displayName: 'Clear Path Admin',
          username: 'admin',
          interfaceType: 'calm_focus',
          createdAt: new Date()
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [founderOk]);

  useEffect(() => {
    if (!founderOk || ceoTab !== 'members') return;
    void loadAdminMembers();
  }, [founderOk, ceoTab]);

  const loadSiteDoctor = async () => {
    setSiteDoctorLoading(true);
    setSiteDoctorError(null);
    try {
      const headers = await founderApiHeaders();
      const res = await fetch('/api/admin/site-doctor', { headers, credentials: 'include' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || body.error || `Site Doctor unavailable (${res.status})`);
      }
      setSiteDoctor(body as SiteDoctorReport);
    } catch (err: any) {
      setSiteDoctor(null);
      setSiteDoctorError(err?.message || 'Failed to load Site Doctor');
    } finally {
      setSiteDoctorLoading(false);
    }
  };

  const runSiteDoctorNow = async () => {
    setSiteDoctorBusy(true);
    setSiteDoctorError(null);
    try {
      const headers = await founderApiHeaders();
      const res = await fetch('/api/admin/site-doctor/run', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: '{}',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || body.error || `Sweep failed (${res.status})`);
      }
      setSiteDoctor(body as SiteDoctorReport);
    } catch (err: any) {
      setSiteDoctorError(err?.message || 'Sweep failed');
    } finally {
      setSiteDoctorBusy(false);
    }
  };

  useEffect(() => {
    if (!founderOk || ceoTab !== 'system') return;
    void loadSiteDoctor();
    const id = window.setInterval(() => void loadSiteDoctor(), 60_000);
    return () => window.clearInterval(id);
  }, [founderOk, ceoTab]);

  const filteredUsers = users.filter(u => 
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.displayName && u.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const memberQ = memberSearch.trim().toLowerCase();
  const filteredPrivate = (membersPayload?.privateMembers || []).filter((m) => {
    if (!memberQ) return true;
    return (
      m.email.toLowerCase().includes(memberQ) ||
      (m.displayName && m.displayName.toLowerCase().includes(memberQ)) ||
      m.uid.toLowerCase().includes(memberQ) ||
      (m.identityStatus && m.identityStatus.toLowerCase().includes(memberQ))
    );
  });

  // CEO Dashboard is Rick Floyd founder-only — never render data for anyone else.
  if (!founderOk) {
    return (
      <div className="min-h-full flex items-center justify-center p-8 font-sans" style={{ backgroundColor: '#09090b' }}>
        <div className="max-w-md w-full rounded-2xl border border-red-500/30 bg-zinc-950 p-8 text-center space-y-4">
          <Lock className="w-10 h-10 text-red-400 mx-auto" aria-hidden="true" />
          <h1 className="text-xl font-black uppercase tracking-widest text-white">CEO Dashboard Locked</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            This console is restricted. If you landed here by mistake, go back to Markets.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="scrollbar-panel min-h-full p-6 md:p-12 font-sans overflow-y-auto custom-scrollbar pb-32" style={{ backgroundColor: '#09090b' }}>
      {/* Header Section */}
      <h1 className="text-4xl text-[#FF00FF] border-b-2 border-[#4B0082] pb-3 uppercase drop-shadow-[0_0_8px_rgba(255,0,255,0.8)] font-black tracking-widest mb-2">
        CEO Dashboard — Founder Console
      </h1>
      <p className="mb-6 font-mono text-sm font-bold uppercase tracking-wider text-zinc-400">
        Ops only · Daily Ops · Daily structure briefing · Budget · Members · Alerts · Disaster backup · Force everyone out · Source ZIP · Site Doctor
        <span className="mx-2 text-zinc-600">·</span>
        Deep link <a href="/ceo" className="text-[#00FFFF] underline-offset-2 hover:underline">/ceo</a>
      </p>

      <ChooseYourPath onChoosePath={navigateToDesk} />

      <CeoAlwaysOnMonitor />
      <DailyOpsDesk getHeaders={founderApiHeaders} />
      <DailyPatternReviewDesk getHeaders={founderApiHeaders} />

      {/* CEO Micro-Tabs */}
      <div className="flex border-b border-indigo-500/20 mb-8 gap-4 select-none flex-wrap">
        <button
          onClick={() => setCeoTab('system')}
          className={`px-5 py-3 font-mono text-xs uppercase tracking-widest font-black transition-all duration-250 border-b-2 ${
            ceoTab === 'system'
              ? 'text-[#00FFFF] border-[#00FFFF] bg-[#00FFFF]/5 shadow-[0_12px_24px_-12px_rgba(0,255,255,0.4)]'
              : 'text-zinc-500 border-transparent hover:text-zinc-350 hover:bg-white/5'
          }`}
        >
          🚨 ALERTS & USER DATABASE
        </button>
        <button
          onClick={() => setCeoTab('members')}
          className={`px-5 py-3 font-mono text-xs uppercase tracking-widest font-black transition-all duration-250 border-b-2 ${
            ceoTab === 'members'
              ? 'text-[#00FFFF] border-[#00FFFF] bg-[#00FFFF]/5 shadow-[0_12px_24px_-12px_rgba(0,255,255,0.4)]'
              : 'text-zinc-500 border-transparent hover:text-zinc-350 hover:bg-white/5'
          }`}
        >
          MEMBERS / ALL USERS
        </button>
      </div>

      {ceoTab === 'members' ? (
        <div className="space-y-8">
          {showsUnauthorized && (
            <div className="rounded-xl border-2 border-amber-400/50 bg-zinc-950 px-5 py-5 text-amber-50 space-y-4">
              <h3 className="text-lg font-black uppercase tracking-wider text-amber-200 m-0">
                Stop — fix Unauthorized first (3 steps)
              </h3>
              <ol className="m-0 pl-5 space-y-3 text-sm leading-relaxed text-zinc-100">
                <li>
                  <strong className="text-white">STEP 1:</strong> Make sure Google on this site is{' '}
                  <span className="font-mono text-[#00FFFF]">{FOUNDER_EMAIL}</span> (not a different Gmail).
                </li>
                <li>
                  <strong className="text-white">STEP 2:</strong> Click the big green button below — Unlock CEO
                  API. This creates the missing server login cookie.
                </li>
                <li>
                  <strong className="text-white">STEP 3:</strong> After Unlocked, open{' '}
                  <span className="text-emerald-200">Invite emails</span> and tap{' '}
                  <span className="text-amber-200">SEND EMAIL</span> next to each person (one click each).
                </li>
              </ol>
              <button
                type="button"
                onClick={() => void runFounderUnlock()}
                disabled={unlockBusy || convertBusy}
                className="w-full md:w-auto px-6 py-4 rounded-lg bg-emerald-500 text-black text-sm font-black uppercase tracking-widest hover:bg-emerald-400 disabled:opacity-50"
              >
                {unlockBusy ? 'Unlocking…' : 'STEP 2 — Unlock CEO API (Google founder)'}
              </button>
              <div className="border-t border-zinc-700 pt-4 space-y-2">
                <p className="text-xs text-zinc-400 m-0">
                  Optional backup unlock: paste <span className="font-mono">CATALOG_ADMIN_SECRET</span> if you
                  have it saved from server env.
                </p>
                <div className="flex flex-col md:flex-row gap-2">
                  <input
                    type="password"
                    value={catalogSecretInput}
                    onChange={(e) => setCatalogSecretInput(e.target.value)}
                    placeholder="catalog admin secret"
                    className="flex-1 px-3 py-2 rounded-lg border border-zinc-600 bg-black/60 text-zinc-100 text-xs font-mono"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => void saveCatalogSecretAndRetry()}
                    disabled={unlockBusy || convertBusy}
                    className="px-4 py-2 rounded-lg border border-zinc-500 text-zinc-100 text-xs font-mono uppercase tracking-widest hover:bg-zinc-800 disabled:opacity-50"
                  >
                    Unlock with secret
                  </button>
                </div>
              </div>
              {convertMsg ? (
                <p className="m-0 text-sm font-mono text-white bg-black/50 border border-zinc-700 rounded-lg px-3 py-3 whitespace-pre-wrap">
                  {convertMsg}
                </p>
              ) : null}
            </div>
          )}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl text-white font-black uppercase tracking-widest flex items-center gap-3">
                <UserPlus className="text-[#00FFFF]" size={26} />
                Private Login members
              </h2>
              <p className="text-zinc-400 text-sm mt-2 max-w-2xl leading-relaxed">
                Server-backed Firestore member list. Password hashes and activation keys are never returned.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void loadAdminMembers()}
                disabled={membersLoading || convertBusy}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 text-xs font-mono uppercase tracking-widest font-black hover:bg-cyan-500/20 disabled:opacity-50"
              >
                <RefreshCw size={14} className={membersLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
              <button
                type="button"
                onClick={() => void loadInviteMail()}
                disabled={convertBusy}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-500/50 bg-amber-500/15 text-amber-100 text-xs font-mono uppercase tracking-widest font-black hover:bg-amber-500/25 disabled:opacity-50"
              >
                <Mail size={14} />
                Invite emails (1-click send)
              </button>
              <button
                type="button"
                onClick={() => void loadFounderInvites()}
                disabled={convertBusy}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-500/40 bg-zinc-500/10 text-zinc-300 text-xs font-mono uppercase tracking-widest font-black hover:bg-zinc-500/20 disabled:opacity-50"
              >
                Show passwords only
              </button>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                Stripe recover removed — billing is off
              </p>
              <button
                type="button"
                onClick={() => void runEmergencySeed(true)}
                disabled={convertBusy}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-500/40 bg-orange-500/10 text-orange-200 text-xs font-mono uppercase tracking-widest font-black hover:bg-orange-500/20 disabled:opacity-50"
              >
                Dry-run emergency 16
              </button>
              <button
                type="button"
                onClick={() => void runEmergencySeed(false)}
                disabled={convertBusy || membersPayload?.meta?.writesAllowed === false}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-200 text-xs font-mono uppercase tracking-widest font-black hover:bg-rose-500/20 disabled:opacity-50"
              >
                Restore known 16 + reset passwords
              </button>
              <button
                type="button"
                onClick={() => void runResetDawnPassword()}
                disabled={convertBusy || membersPayload?.meta?.writesAllowed === false}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-pink-500/50 bg-pink-500/15 text-pink-100 text-xs font-mono uppercase tracking-widest font-black hover:bg-pink-500/25 disabled:opacity-50"
              >
                Reset Dawn password now
              </button>
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="member@email.com"
                  className="min-w-[220px] flex-1 px-3 py-2 rounded-lg border border-zinc-600 bg-black/60 text-zinc-100 text-xs font-mono"
                  aria-label="Email for password reset"
                />
                <button
                  type="button"
                  onClick={() => void runResetMemberPassword(resetEmail)}
                  disabled={convertBusy || membersPayload?.meta?.writesAllowed === false}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-pink-500/50 bg-pink-500/15 text-pink-100 text-xs font-mono uppercase tracking-widest font-black hover:bg-pink-500/25 disabled:opacity-50"
                >
                  Reset this email now
                </button>
              </div>
              <button
                type="button"
                onClick={() => void downloadDisasterBackup()}
                disabled={convertBusy}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-teal-500/40 bg-teal-500/10 text-teal-100 text-xs font-mono uppercase tracking-widest font-black hover:bg-teal-500/20 disabled:opacity-50"
              >
                Download disaster backup
              </button>
              <button
                type="button"
                data-ceo-kick-sessions
                onClick={() => void kickEveryoneOut()}
                disabled={kickBusy || convertBusy}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-500/50 bg-amber-500/15 text-amber-100 text-xs font-mono uppercase tracking-widest font-black hover:bg-amber-500/25 disabled:opacity-50"
              >
                <LogOut size={14} aria-hidden="true" />
                {kickBusy ? 'Signing everyone out…' : 'Force everyone out'}
              </button>
              <a
                href={GITHUB_SOURCE_ZIP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-violet-500/40 bg-violet-500/10 text-violet-100 text-xs font-mono uppercase tracking-widest font-black hover:bg-violet-500/20"
              >
                <Download size={14} aria-hidden="true" />
                Download source ZIP
              </a>
              <button
                type="button"
                onClick={() => setImportOpen((v) => !v)}
                disabled={convertBusy}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-sky-500/40 bg-sky-500/10 text-sky-200 text-xs font-mono uppercase tracking-widest font-black hover:bg-sky-500/20 disabled:opacity-50"
              >
                Import members
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-teal-500/25 bg-teal-500/5 px-4 py-3 text-teal-50/90 text-sm leading-relaxed">
            <strong className="uppercase tracking-wider text-teal-200/90">Always keep a backup</strong>
            <p className="mt-2 mb-0">
              Cloud Run disk is temporary. Download disaster backup stores Firestore private members,
              leftover site_registrations rows, invites, and Stripe customer emails as a JSON file
              on your machine. Do this after every member change. No agent is allowed to tell you
              backups are unnecessary.
            </p>
          </div>

          <div className="rounded-lg border border-violet-500/25 bg-violet-500/5 px-4 py-3 text-violet-50/90 text-sm leading-relaxed">
            <strong className="uppercase tracking-wider text-violet-200/90">Website source ZIP</strong>
            <p className="mt-2 mb-0">
              Tap Download source ZIP to get GitHub <span className="font-mono">main</span> as a
              ~25&nbsp;MB file. Sign in to GitHub on this phone first if asked. Save the ZIP in Files,
              then copy it to a flash drive. This is the website code only — not API keys, not{' '}
              <span className="font-mono">node_modules</span>, and not member accounts (use Download
              disaster backup for those).
            </p>
          </div>

          {membersPayload?.meta?.productionHardFail ? (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-rose-50 text-sm leading-relaxed">
              <strong className="uppercase tracking-wider text-rose-200">Production hard-fail</strong>
              <p className="mt-2 mb-0">
                No durable private-account store is available (Firestore Admin offline and Stripe
                unavailable). Private register/login and member writes are blocked so Cloud Run cannot
                silently store accounts on ephemeral disk. Ensure{' '}
                <span className="font-mono">STRIPE_SECRET_KEY</span> is set (already present in prod)
                and/or restore <span className="font-mono">FIREBASE_SERVICE_ACCOUNT</span>, then use
                Restore known 16 / Reset Dawn / Recover from Stripe.
              </p>
              {membersPayload.meta.firebaseAdmin?.reason ? (
                <p className="mt-2 mb-0 font-mono text-xs text-rose-100/80">
                  {membersPayload.meta.firebaseAdmin.reason}
                </p>
              ) : null}
            </div>
          ) : null}

          {importOpen ? (
            <div className="rounded-lg border border-sky-500/30 bg-sky-500/5 px-4 py-4 space-y-3">
              <p className="text-sky-100/90 text-sm m-0 leading-relaxed">
                Paste JSON array of members. Password optional — omitted passwords become founder
                invites. Example:{' '}
                <span className="font-mono text-xs">
                  {`[{"email":"a@example.com","displayName":"Alex"}]`}
                </span>
              </p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={6}
                spellCheck={false}
                className="w-full rounded-lg bg-[#0d0d1a] border border-sky-500/30 text-zinc-100 font-mono text-xs p-3"
                placeholder='[{"email":"member@example.com","displayName":"Member"}]'
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void runFounderImport(true)}
                  disabled={convertBusy}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-500/40 bg-zinc-500/10 text-zinc-200 text-xs font-mono uppercase tracking-widest font-black disabled:opacity-50"
                >
                  Dry-run import
                </button>
                <button
                  type="button"
                  onClick={() => void runFounderImport(false)}
                  disabled={convertBusy || membersPayload?.meta?.writesAllowed === false}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-sky-500/40 bg-sky-500/10 text-sky-200 text-xs font-mono uppercase tracking-widest font-black disabled:opacity-50"
                >
                  Import into durable store
                </button>
              </div>
            </div>
          ) : null}

          {convertMsg ? (
            <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/5 px-4 py-3 text-cyan-50/90 text-sm leading-relaxed">
              {convertMsg}
            </div>
          ) : null}

          {inviteMailMsg ? (
            <div
              className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${
                inviteMailSmtp === false
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-50'
                  : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-50'
              }`}
            >
              {inviteMailMsg}
            </div>
          ) : null}

          {inviteMailRows.length > 0 ? (
            <div className="rounded-xl border-2 border-amber-500/40 bg-[#1a1a2e] p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="text-amber-100 font-black uppercase tracking-wider text-base m-0 flex items-center gap-2">
                    <Mail className="text-amber-300" size={20} />
                    Invite emails — one button each
                  </h3>
                  <p className="text-zinc-400 text-sm mt-1 m-0 max-w-2xl leading-relaxed">
                    Spreadsheet lives on the server. Tap <strong className="text-white">SEND EMAIL</strong> —
                    that person gets their login email. No copy/paste. Handles flagged as not-real-name greet as
                    “Hi there,”.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void loadInviteMail()}
                  disabled={convertBusy || Boolean(inviteMailBusyEmail)}
                  className="px-4 py-2 rounded-lg border border-amber-500/40 text-amber-100 text-xs font-mono uppercase tracking-widest hover:bg-amber-500/10 disabled:opacity-50"
                >
                  Refresh list
                </button>
              </div>

              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {inviteMailRows
                  .filter((row) => row.sendStatus !== 'skipped_junk')
                  .map((row) => {
                    const busy = inviteMailBusyEmail === row.email;
                    const sent = row.sendStatus === 'sent';
                    const canSend =
                      row.sendStatus === 'ready' ||
                      row.sendStatus === 'needs_password' ||
                      row.sendStatus === 'sent';
                    return (
                      <div
                        key={row.email}
                        className="rounded-lg border border-white/10 bg-black/40 px-4 py-3 flex flex-col md:flex-row md:items-center gap-3 justify-between"
                      >
                        <div className="min-w-0">
                          <div className="font-mono text-[#00FFFF] text-sm break-all">{row.email}</div>
                          <div className="text-white text-sm font-bold">
                            {row.displayName || '—'}
                            {row.nameFlag === 'handle_not_real_name' ? (
                              <span className="ml-2 text-[10px] font-mono uppercase text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded">
                                name flagged → Hi there
                              </span>
                            ) : null}
                          </div>
                          <div className="text-[11px] font-mono text-zinc-500 mt-1">
                            {sent
                              ? `SENT${row.lastSentAt ? ` · ${formatJoined(row.lastSentAt)}` : ''}`
                              : row.sendStatus === 'needs_password'
                                ? 'No password yet — SEND will create one, then email them'
                                : 'Ready to send'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => void sendInviteMailOne(row.email)}
                          disabled={!canSend || busy || convertBusy || inviteMailSmtp === false}
                          className={`shrink-0 px-5 py-3 rounded-lg text-sm font-black uppercase tracking-widest disabled:opacity-40 ${
                            sent
                              ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                              : 'bg-amber-400 text-black hover:bg-amber-300'
                          }`}
                        >
                          {busy ? 'Sending…' : sent ? 'Send again' : 'SEND EMAIL'}
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : null}

          {invitesVisible && invitesPreview.length > 0 ? (
            <div className="rounded-lg border border-zinc-600/40 bg-[#1a1a2e] p-4 overflow-x-auto">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-zinc-200 font-bold uppercase tracking-wider text-sm m-0">
                  Password view only (prefer SEND EMAIL above)
                </h3>
                <button
                  type="button"
                  className="text-xs text-zinc-400 hover:text-white"
                  onClick={() => {
                    setInvitesVisible(false);
                    setInvitesPreview([]);
                  }}
                >
                  Hide
                </button>
              </div>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-zinc-500 uppercase text-[10px] tracking-widest">
                    <th className="py-2 pr-3">Email</th>
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Temp password</th>
                    <th className="py-2">Activation key</th>
                  </tr>
                </thead>
                <tbody>
                  {invitesPreview.map((inv) => (
                    <tr key={inv.email} className="border-t border-white/5 text-zinc-200 font-mono">
                      <td className="py-2 pr-3">{inv.email}</td>
                      <td className="py-2 pr-3 font-sans">{inv.displayName}</td>
                      <td className="py-2 pr-3 text-amber-200">{inv.tempPassword || '—'}</td>
                      <td className="py-2 text-pink-300">{inv.activationKey || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {membersPayload?.meta?.persistenceWarning ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-amber-100/90 text-sm leading-relaxed">
              {membersPayload.meta.persistenceWarning}
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-emerald-100/90 text-sm leading-relaxed">
              Private members are durable in Firestore (
              <span className="font-mono">
                {membersPayload?.meta?.privateCollection || 'private_accounts'}
              </span>
              ). Boot converts leftover waitlist emails into this collection without resetting
              existing passwords.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#1a1a2e] p-6 rounded-lg border-2 border-[#00FFFF] shadow-[0_0_15px_rgba(0,255,255,0.25)]">
              <h3 className="text-[#00FFFF] text-lg font-bold uppercase mb-3 flex items-center gap-2">
                <Users size={18} /> Private members
              </h3>
              <p className="text-white text-5xl font-black m-0">
                {membersLoading && !membersPayload ? '—' : membersPayload?.counts.privateMembers ?? 0}
              </p>
              <p className="text-gray-400 text-sm mt-3">
                Source:{' '}
                <span className="font-mono text-zinc-300">
                  {membersPayload?.meta?.privateSource ||
                    membersPayload?.meta?.privateStorage ||
                    '—'}
                </span>
              </p>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Filter by email, name, identity…"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full bg-black/50 border border-white/20 rounded-lg py-3 px-11 text-white placeholder-white/40 focus:outline-none focus:border-[#00FFFF] transition-all font-mono text-sm"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
          </div>

          {membersError && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300 text-sm font-mono">
              {membersError}
            </div>
          )}

          <div className="bg-[#1a1a2e] p-6 rounded-lg border border-white/10">
            <h3 className="text-xl text-white font-bold mb-4 uppercase tracking-wider">Private login accounts</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-white/80 text-sm">
                <thead className="bg-black/40 text-xs uppercase tracking-wider text-zinc-400">
                  <tr>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Display name</th>
                    <th className="px-4 py-3">Identity</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3">Last login</th>
                    <th className="px-4 py-3">UID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {membersLoading && !membersPayload ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-white/50 font-mono text-xs">
                        Loading private members…
                      </td>
                    </tr>
                  ) : filteredPrivate.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-white/55 text-sm leading-relaxed">
                        {memberQ
                          ? `No private members match “${memberSearch}”.`
                          : 'No private members on this server yet. If you expect signups here, Cloud Run may be using ephemeral disk — members persist only when storage is durable.'}
                      </td>
                    </tr>
                  ) : (
                    filteredPrivate.map((m) => {
                      const badge = identityBadge(m.identityStatus);
                      return (
                      <tr key={m.uid} className="hover:bg-white/5">
                        <td className="px-4 py-3 font-mono text-[#00FFFF]">{m.email}</td>
                        <td className="px-4 py-3 font-bold text-white">{m.displayName || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${badge.className}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-zinc-300">{formatJoined(m.createdAt)}</td>
                        <td className="px-4 py-3 font-mono text-xs text-zinc-400">{formatJoined(m.lastLoginAt)}</td>
                        <td className="px-4 py-3 font-mono text-[10px] text-zinc-500">{m.uid}</td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : (
      <>
          {/* Site Doctor — hourly detect+report pulse */}
          <div className="bg-[#1a1a2e] p-6 rounded-lg border-2 border-[#39FF14]/20 shadow-[0_0_18px_rgba(57,255,20,0.12)] mb-10">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-[#39FF14] text-xl font-bold uppercase mb-1 flex items-center gap-2">
                  <Activity size={20} />
                  Site Doctor — Hourly Pulse
                </h2>
                <p className="text-white/55 text-sm max-w-2xl">
                  Detect + report only (no auto code rewrites). Same model TradingView/Alpaca use: continuous checks, human fix, rollback when needed.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void loadSiteDoctor()}
                  disabled={siteDoctorLoading || siteDoctorBusy}
                  className="px-3 py-2 rounded-md border border-white/20 text-white/80 text-xs font-bold uppercase tracking-wider hover:bg-white/5 disabled:opacity-50"
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={() => void runSiteDoctorNow()}
                  disabled={siteDoctorBusy || siteDoctorLoading}
                  className="px-3 py-2 rounded-md border border-[#39FF14]/50 text-[#39FF14] text-xs font-bold uppercase tracking-wider hover:bg-[#39FF14]/10 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <RefreshCw size={14} className={siteDoctorBusy ? 'animate-spin' : ''} />
                  Run now
                </button>
              </div>
            </div>

            {siteDoctorError && (
              <p className="text-amber-300 text-sm mb-3 font-mono">{siteDoctorError}</p>
            )}

            {siteDoctorLoading && !siteDoctor ? (
              <p className="text-white/50 font-mono text-xs">Loading latest sweep…</p>
            ) : siteDoctor ? (
              <>
                <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
                  <span
                    className={`px-3 py-1 rounded font-black uppercase tracking-widest text-xs border ${
                      siteDoctor.overall === 'green'
                        ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/40'
                        : siteDoctor.overall === 'yellow'
                          ? 'text-amber-300 bg-amber-500/15 border-amber-500/40'
                          : 'text-red-300 bg-red-500/15 border-red-500/40'
                    }`}
                  >
                    {siteDoctor.overall}
                  </span>
                  <span className="text-white/70 font-mono text-xs">
                    ok={siteDoctor.okCount} warn={siteDoctor.warnCount} critical={siteDoctor.failCount}
                  </span>
                  <span className="text-white/45 font-mono text-xs">
                    last {formatJoined(siteDoctor.ranAt)} · {siteDoctor.nextDueHint}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-white/80 text-sm">
                    <thead className="bg-black/40 text-xs uppercase tracking-wider text-zinc-400">
                      <tr>
                        <th className="px-3 py-2">Check</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {siteDoctor.checks.map((c) => (
                        <tr key={c.id} className="hover:bg-white/5">
                          <td className="px-3 py-2 font-medium">{c.label}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${
                                c.ok && c.severity === 'info'
                                  ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/40'
                                  : c.severity === 'warn'
                                    ? 'text-amber-300 bg-amber-500/15 border-amber-500/40'
                                    : 'text-red-300 bg-red-500/15 border-red-500/40'
                              }`}
                            >
                              {c.ok ? (c.severity === 'warn' ? 'warn' : 'ok') : c.severity}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono text-xs text-zinc-300">
                            {c.detail}
                            {typeof c.latencyMs === 'number' ? ` (${c.latencyMs}ms)` : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-white/50 text-sm">
                No report yet — first sweep runs ~20s after server boot, then hourly. Use Run now after Unlock.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* Panel 1: Live Users */}
        <div className="bg-[#1a1a2e] p-6 rounded-lg border-2 border-[#00FFFF] shadow-[0_0_15px_rgba(0,255,255,0.3)]">
          <h2 className="text-[#00FFFF] text-xl font-bold uppercase mb-4 flex items-center">
            <Users size={20} className="mr-2" />
            Registered Users
          </h2>
          <p className="text-white text-5xl font-black m-0">{isLoading ? '--' : users.length}</p>
          <p className="text-gray-400 text-sm mt-3">Total distinct profiles loaded from database.</p>
        </div>

        {/* Panel 2: System Health */}
        <div className="bg-[#1a1a2e] p-6 rounded-lg border-2 border-[#FF4500] shadow-[0_0_15px_rgba(255,69,0,0.3)]">
          <h2 className="text-[#FF4500] text-xl font-bold uppercase mb-4 flex items-center">
            <Activity size={20} className="mr-2" />
            System Health
          </h2>
          <div className="flex justify-between mb-3">
            <span className="text-white text-lg">Website Uptime:</span>
            <span className="text-[#00FFFF] text-lg font-bold">ONLINE</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white text-lg">Core Engine:</span>
            <span className="text-[#00FFFF] text-lg font-bold">ONLINE</span>
          </div>
        </div>
      </div>

        {/* Database Search Section */}
      <div className="bg-[#1a1a2e] p-6 rounded-lg border border-white/10 mb-10">
        <h2 className="text-2xl text-red-500 font-bold mb-6 flex items-center uppercase tracking-widest gap-3">
          <ShieldAlert size={28} />
          System Alerts
        </h2>
        <div className="space-y-4">
          {users.filter(u => {
            const defaultAvatars = [
              'https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?w=400&q=80',
              'https://images.unsplash.com/photo-1611689342806-0863700ce7e4?w=400&q=80',
              'https://images.unsplash.com/photo-1590424744257-f112e4f0dc7f?w=400&q=80',
              'https://images.unsplash.com/photo-15ed38eb1eb9d-19cd1eb5dcdc?w=400&q=80',
              'https://images.unsplash.com/photo-1588392205575-10459aafaf38?w=400&q=80'
            ];
            const p = u.photoURL || u.photoUrl;
            const noRealPhoto = !p || defaultAvatars.includes(p);
            const cTime = u.createdAt?.toDate ? u.createdAt.toDate().getTime() : (u.createdAt ? new Date(u.createdAt).getTime() : Date.now());
            return noRealPhoto && (Date.now() - cTime > 7 * 24 * 60 * 60 * 1000);
          }).map(u => (
            <div key={u.id} className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg flex items-center justify-between shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              <div className="flex flex-col">
                <span className="text-red-400 font-bold text-lg">{u.displayName || u.email || 'Unknown User'}</span>
                <span className="text-red-300/60 text-sm">SECURITY ALERT: This person refuses to create a real profile.</span>
              </div>
              <button 
                onClick={() => setInvestigatingUser(u)}
                className="bg-red-500/20 hover:bg-red-500/40 text-red-500 px-4 py-2 rounded-md font-bold uppercase tracking-widest transition-colors border border-red-500/50"
              >
                Investigate
              </button>
            </div>
          ))}
          {users.filter(u => {
            const defaultAvatars = [
              'https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?w=400&q=80',
              'https://images.unsplash.com/photo-1611689342806-0863700ce7e4?w=400&q=80',
              'https://images.unsplash.com/photo-1590424744257-f112e4f0dc7f?w=400&q=80',
              'https://images.unsplash.com/photo-15ed38eb1eb9d-19cd1eb5dcdc?w=400&q=80',
              'https://images.unsplash.com/photo-1588392205575-10459aafaf38?w=400&q=80'
            ];
            const p = u.photoURL || u.photoUrl;
            const noRealPhoto = !p || defaultAvatars.includes(p);
            const cTime = u.createdAt?.toDate ? u.createdAt.toDate().getTime() : (u.createdAt ? new Date(u.createdAt).getTime() : Date.now());
            return noRealPhoto && (Date.now() - cTime > 7 * 24 * 60 * 60 * 1000);
          }).length === 0 && (
            <div className="text-green-500/70 font-mono text-sm tracking-wider">No active security alerts.</div>
          )}
        </div>
      </div>

      {/* Centralized Remote System Logs */}
      <div className="bg-[#151525] p-6 rounded-lg border-2 border-indigo-600/50 shadow-[0_0_20px_rgba(99,102,241,0.25)] mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 border-b border-white/10 pb-4 gap-4">
          <div>
            <h2 className="text-2xl text-indigo-400 font-extrabold flex items-center uppercase tracking-wider gap-3">
              <Terminal size={28} className="animate-pulse" />
              Centralized Remote Logs
            </h2>
            <p className="text-gray-400 text-sm mt-1 font-sans">
              Active zero-trust diagnostic audit stream of permission-related crashes and system errors.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 font-mono text-xs uppercase tracking-widest font-bold">Realtime Connected</span>
          </div>
        </div>

        {/* Filters and search info */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="Filter logs by message, user email, operation code, or path..." 
              value={logSearchQuery}
              onChange={(e) => setLogSearchQuery(e.target.value)}
              className="w-full bg-black/60 border border-indigo-500/20 rounded-lg py-3 px-11 text-sm text-white placeholder-white/40 focus:outline-none focus:border-indigo-500 transition-all font-mono"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
          </div>
          {logSearchQuery && (
            <button 
              onClick={() => setLogSearchQuery('')}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-mono text-gray-400 transition-colors border border-white/10 cursor-pointer"
            >
              CLEAR FILTER
            </button>
          )}
        </div>

        {/* Logs viewport */}
        <div className="max-h-[500px] overflow-y-auto custom-scrollbar border border-white/10 rounded-lg bg-black/40 divide-y divide-white/5">
          {logsLoading ? (
            <div className="py-20 text-center text-gray-400 font-mono text-xs">
              Establishing Firestore stream...
            </div>
          ) : logs.filter(log => {
            if (!logSearchQuery) return true;
            const query = logSearchQuery.toLowerCase();
            return (
              (log.error && log.error.toLowerCase().includes(query)) ||
              (log.operationType && log.operationType.toLowerCase().includes(query)) ||
              (log.userEmail && log.userEmail.toLowerCase().includes(query)) ||
              (log.path && log.path.toLowerCase().includes(query))
            );
          }).length === 0 ? (
            <div className="py-20 text-center text-gray-500 font-mono text-xs">
              No system logs found matching criteria.
            </div>
          ) : (
            logs.filter(log => {
              if (!logSearchQuery) return true;
              const query = logSearchQuery.toLowerCase();
              return (
                (log.error && log.error.toLowerCase().includes(query)) ||
                (log.operationType && log.operationType.toLowerCase().includes(query)) ||
                (log.userEmail && log.userEmail.toLowerCase().includes(query)) ||
                (log.path && log.path.toLowerCase().includes(query))
              );
            }).map((log) => {
              const dateObj = log.createdAt?.toDate ? log.createdAt.toDate() : (log.createdAt ? new Date(log.createdAt) : null);
              const formattedTime = dateObj ? dateObj.toLocaleTimeString() + ' ' + dateObj.toLocaleDateString() : 'N/A';
              const isSelected = selectedLog?.id === log.id;
              
              // Define tag styles for operation types
              let opBadgeClass = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
              if (log.operationType?.includes('unhandled')) {
                opBadgeClass = "bg-rose-500/15 text-rose-400 border border-rose-500/30 font-black";
              } else if (log.operationType?.includes('write') || log.operationType?.includes('delete')) {
                opBadgeClass = "bg-orange-600/15 text-orange-400 border border-orange-500/30";
              } else if (log.operationType?.includes('get') || log.operationType?.includes('list')) {
                opBadgeClass = "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20";
              }

              return (
                <div key={log.id} className={`p-4 transition-all ${isSelected ? 'bg-indigo-950/20' : 'hover:bg-white/[0.02]'}`}>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 cursor-pointer" onClick={() => setSelectedLog(isSelected ? null : log)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${opBadgeClass}`}>
                          {log.operationType || 'SYSTEM ERROR'}
                        </span>
                        <span className="text-gray-500 font-mono text-[10px]">
                          {formattedTime}
                        </span>
                        {log.path && log.path !== 'none' && (
                          <span className="text-indigo-400/80 font-mono text-[10px] truncate max-w-[200px]" title={log.path}>
                            path: {log.path}
                          </span>
                        )}
                      </div>
                      <p className="text-white text-xs font-mono font-bold leading-relaxed truncate max-w-4xl">
                        {log.error}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 text-right">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-white/95 font-bold">{log.userEmail || 'unauthenticated'}</p>
                        <p className="text-[10px] text-gray-500 font-mono">UID: {log.userId?.substring(0, 8)}...</p>
                      </div>
                      <button className="text-indigo-400 hover:text-indigo-300 text-xs font-mono uppercase tracking-widest font-black transition-colors shrink-0 cursor-pointer">
                        {isSelected ? '[-]' : '[+]'}
                      </button>
                    </div>
                  </div>

                  {/* Log Details Viewer inside line item */}
                  {isSelected && (
                    <div className="mt-4 p-4 rounded bg-black/80 border border-indigo-500/20 font-mono text-xs text-indigo-300 space-y-3 shadow-inner">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-indigo-500/10 pb-3">
                        <div>
                          <p className="text-gray-500 uppercase tracking-wider text-[9px] font-black">Logged URL</p>
                          <p className="text-white break-all">{log.url || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 uppercase tracking-wider text-[9px] font-black">Firebase Log Path</p>
                          <p className="text-yellow-400 break-all">/system_logs/{log.id}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 uppercase tracking-wider text-[9px] font-black">User Details</p>
                          <p className="text-white">Email: {log.userEmail || 'unknown'}</p>
                          <p className="text-white">UID: {log.userId || 'unknown'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 uppercase tracking-wider text-[9px] font-black">Operation</p>
                          <p className="text-emerald-400">{log.operationType || 'unknown_op'}</p>
                          <p className="text-cyan-400">path: {log.path || 'none'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-500 uppercase tracking-wider text-[9px] font-black mb-2 flex items-center gap-1.5">
                          <AlertCircle size={12} className="text-rose-400" /> Trace / Stack / Payload Details
                        </p>
                        <pre className="max-h-[300px] overflow-y-auto bg-black p-3.5 rounded border border-white/5 text-[11px] font-mono text-rose-400 whitespace-pre-wrap leading-relaxed select-text custom-scrollbar">
                          {log.error}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Database Search Section */}
      <div className="bg-[#1a1a2e] p-6 rounded-lg border border-white/10">
        <h2 className="text-2xl text-white font-bold mb-6 flex items-center">
          <Search className="mr-3 text-indigo-400" />
          User Database Search
        </h2>
        
        <div className="relative mb-6">
          <input 
            type="text" 
            placeholder="Search by email, name, or username..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/50 border border-white/20 rounded-lg py-4 px-12 text-white placeholder-white/40 focus:outline-none focus:border-[#FF00FF] focus:ring-1 focus:ring-[#FF00FF] transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-white/80">
            <thead className="bg-black/40 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 rounded-tl-lg">User</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4">Interface Type</th>
                <th className="px-6 py-4">User ID</th>
                <th className="px-6 py-4 rounded-tr-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-white/50">Loading user database...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-white/50">No users found matching "{searchQuery}"</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {(user.photoURL || user.photoUrl) ? (
                          isVideoUrl(user.photoURL || user.photoUrl) ? (
                            <video src={user.photoURL || user.photoUrl} className="w-10 h-10 rounded-full mr-4 border border-white/20 object-cover" autoPlay loop muted playsInline />
                          ) : isAudioUrl(user.photoURL || user.photoUrl) ? (
                            <div className="w-10 h-10 rounded-full mr-4 border border-white/20 bg-[#111] flex items-center justify-center overflow-hidden">
                              <audio src={user.photoURL || user.photoUrl} className="w-[300%] scale-[0.35] opacity-60" />
                            </div>
                          ) : (
                            <img 
                              referrerPolicy="no-referrer"
                              src={user.photoURL || user.photoUrl} 
                              alt="avatar" 
                              className="w-10 h-10 rounded-full mr-4 border border-white/20 object-cover"
                            />
                          )
                        ) : (
                          <div className="w-10 h-10 rounded-full mr-4 border border-white/20 bg-[#111] flex items-center justify-center">
                            <span className="text-white/30 text-xs font-bold">{(user.displayName || 'U').substring(0,1).toUpperCase()}</span>
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-white">{user.displayName || 'Unknown'}</p>
                          <p className="text-xs text-white/50">@{user.username || 'user'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm">{user.email || 'Hidden/Not provided'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        user.interfaceType === 'lava' ? 'bg-[#ff4500]/20 text-[#ff4500] border border-[#ff4500]/30' : 
                        user.interfaceType === 'accessible' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                        'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      }`}>
                        {user.interfaceType || 'Standard'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-white/40">{user.id}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setInvestigatingUser(user)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg border border-red-500/30 transition-colors"
                        title="Quarantine / Investigate User"
                      >
                        <ShieldAlert size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      <AnimatePresence>
        {investigatingUser && (
          <QuarantineModal 
            user={investigatingUser} 
            onClose={() => setInvestigatingUser(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
