import React, { useCallback, useEffect, useState } from 'react';
import { Send, Trash2, RefreshCw } from 'lucide-react';

type Severity = 'security' | 'update' | 'info';
type Audience = 'all' | 'list';

type SentMessage = {
  id: string;
  subject: string;
  body: string;
  severity: Severity;
  audience: Audience;
  recipients?: string[];
  createdAt: string;
};

type Props = { getHeaders: () => Promise<Record<string, string>> };

const SEVERITY_LABEL: Record<Severity, string> = {
  security: 'Security notice',
  update: 'Site update',
  info: 'General notice',
};

function countRecipients(raw: string): number {
  return new Set(
    raw
      .split(/[\s,;]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  ).size;
}

/** CEO Dashboard: send in-app messages to every member or a list of emails. */
export const MemberMessagesDesk: React.FC<Props> = ({ getHeaders }) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [severity, setSeverity] = useState<Severity>('update');
  const [audience, setAudience] = useState<Audience>('all');
  const [recipients, setRecipients] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [sent, setSent] = useState<SentMessage[]>([]);
  const [loadingSent, setLoadingSent] = useState(false);

  const loadSent = useCallback(async () => {
    setLoadingSent(true);
    try {
      const res = await fetch('/api/admin/member-messages', { headers: await getHeaders(), credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setSent(Array.isArray(data.messages) ? data.messages : []);
      else setStatus({ ok: false, text: data.error || data.message || `Could not load sent messages (${res.status}).` });
    } finally {
      setLoadingSent(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    void loadSent();
  }, [loadSent]);

  const recipientCount = audience === 'list' ? countRecipients(recipients) : 0;
  const canSend = subject.trim() && body.trim() && (audience === 'all' || recipientCount > 0) && !busy;

  const send = async () => {
    const who = audience === 'all' ? 'EVERY member' : `${recipientCount} member${recipientCount === 1 ? '' : 's'}`;
    if (!window.confirm(`Send "${subject.trim()}" to ${who}? Members see it the next time they open the site.`)) return;
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/member-messages', {
        method: 'POST',
        headers: await getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ subject, body, severity, audience, recipients: audience === 'list' ? recipients : undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ ok: false, text: data.error || data.message || `Send failed (${res.status}).` });
        return;
      }
      setStatus({ ok: true, text: `Sent to ${who}.` });
      setSubject('');
      setBody('');
      setRecipients('');
      void loadSent();
    } finally {
      setBusy(false);
    }
  };

  const retract = async (m: SentMessage) => {
    if (!window.confirm(`Remove "${m.subject}" from every inbox?`)) return;
    const res = await fetch(`/api/admin/member-messages/${encodeURIComponent(m.id)}`, {
      method: 'DELETE',
      headers: await getHeaders(),
      credentials: 'include',
    });
    if (res.ok) setSent((prev) => prev.filter((x) => x.id !== m.id));
    else setStatus({ ok: false, text: `Could not remove message (${res.status}).` });
  };

  const field = 'w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FFFF]/60';

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-[#00FFFF]/20 bg-zinc-950 p-5 space-y-4">
        <h3 className="m-0 text-lg font-black tracking-wider text-[#00FFFF]">SEND A MESSAGE TO MEMBERS</h3>
        <p className="m-0 text-sm text-zinc-400">
          Shows in the bell inbox at the top of the site. Security notices open automatically the next time the member signs in. This does
          not send an email.
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-xs text-zinc-400">
            Type
            <select value={severity} onChange={(e) => setSeverity(e.target.value as Severity)} className={field}>
              {(Object.keys(SEVERITY_LABEL) as Severity[]).map((s) => (
                <option key={s} value={s}>
                  {SEVERITY_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="space-y-1 text-xs text-zinc-400">
            <legend>Send to</legend>
            <div className="flex gap-4 pt-2 text-sm text-white">
              <label className="flex items-center gap-2">
                <input type="radio" checked={audience === 'all'} onChange={() => setAudience('all')} /> Every member
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={audience === 'list'} onChange={() => setAudience('list')} /> Specific emails
              </label>
            </div>
          </fieldset>
        </div>

        {audience === 'list' && (
          <label className="block space-y-1 text-xs text-zinc-400">
            Member emails (one per line or comma-separated) · {recipientCount} entered
            <textarea value={recipients} onChange={(e) => setRecipients(e.target.value)} rows={4} className={field} />
          </label>
        )}

        <label className="block space-y-1 text-xs text-zinc-400">
          Subject ({subject.length}/140)
          <input value={subject} maxLength={140} onChange={(e) => setSubject(e.target.value)} className={field} />
        </label>
        <label className="block space-y-1 text-xs text-zinc-400">
          Message ({body.length}/8000) · plain text, line breaks are kept
          <textarea value={body} maxLength={8000} onChange={(e) => setBody(e.target.value)} rows={12} className={field} />
        </label>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!canSend}
            onClick={() => void send()}
            className="inline-flex items-center gap-2 rounded-full border border-[#00FFFF] px-5 py-2 text-sm font-black text-[#00FFFF] hover:bg-[#00FFFF]/10 disabled:opacity-40"
          >
            <Send className="w-4 h-4" /> {busy ? 'Sending…' : 'Send message'}
          </button>
          {status && <span className={`text-sm ${status.ok ? 'text-emerald-400' : 'text-red-400'}`}>{status.text}</span>}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-zinc-950 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="m-0 text-sm font-black tracking-wider text-white">SENT MESSAGES</h3>
          <button type="button" onClick={() => void loadSent()} className="text-zinc-400 hover:text-white" aria-label="Refresh sent messages">
            <RefreshCw className={`w-4 h-4 ${loadingSent ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {sent.length === 0 ? (
          <p className="m-0 text-sm text-zinc-500">Nothing sent yet.</p>
        ) : (
          <ul className="m-0 p-0 list-none divide-y divide-white/5">
            {sent.map((m) => (
              <li key={m.id} className="flex items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-white">{m.subject}</div>
                  <div className="text-xs text-zinc-500">
                    {SEVERITY_LABEL[m.severity] || m.severity} ·{' '}
                    {m.audience === 'all' ? 'Every member' : `${m.recipients?.length || 0} recipients`} ·{' '}
                    {new Date(m.createdAt).toLocaleString()}
                  </div>
                </div>
                <button type="button" onClick={() => void retract(m)} className="text-zinc-500 hover:text-red-400" aria-label={`Remove ${m.subject}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
