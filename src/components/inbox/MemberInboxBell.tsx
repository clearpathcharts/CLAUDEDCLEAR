import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, ShieldAlert, Sparkles, Info, X } from 'lucide-react';
import { fetchMemberInbox, markInboxRead, type MemberInboxMessage, type InboxSeverity } from '../../api/memberInbox';

const REFRESH_MS = 5 * 60_000;

const SEVERITY: Record<InboxSeverity, { label: string; icon: typeof Info; tone: string }> = {
  security: { label: 'SECURITY', icon: ShieldAlert, tone: 'text-red-400 border-red-500/40 bg-red-500/10' },
  update: { label: 'SITE UPDATE', icon: Sparkles, tone: 'text-[#00FFFF] border-[#00FFFF]/40 bg-[#00FFFF]/10' },
  info: { label: 'NOTICE', icon: Info, tone: 'text-zinc-300 border-white/15 bg-white/5' },
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/** Bell + inbox panel for founder notices. Renders nothing until the member is signed in. */
export const MemberInboxBell: React.FC = () => {
  const [messages, setMessages] = useState<MemberInboxMessage[]>([]);
  const [unread, setUnread] = useState(0);
  const [available, setAvailable] = useState(false);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const autoOpened = useRef(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchMemberInbox();
      if (!data) return;
      setAvailable(true);
      setMessages(data.messages);
      setUnread(data.unread);
      const urgent = data.messages.find((m) => m.severity === 'security' && !m.read);
      if (urgent && !autoOpened.current) {
        autoOpened.current = true;
        setExpanded(urgent.id);
        setOpen(true);
      }
    } catch {
      /* offline or signed out — keep the bell hidden */
    }
  }, []);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), REFRESH_MS);
    return () => window.clearInterval(t);
  }, [load]);

  const markRead = (ids: string[] | 'all') => {
    setMessages((prev) => prev.map((m) => (ids === 'all' || ids.includes(m.id) ? { ...m, read: true } : m)));
    setUnread((n) => (ids === 'all' ? 0 : Math.max(0, n - messages.filter((m) => !m.read && ids.includes(m.id)).length)));
    void markInboxRead(ids).catch(() => undefined);
  };

  const toggle = (m: MemberInboxMessage) => {
    setExpanded((cur) => (cur === m.id ? null : m.id));
    if (!m.read) markRead([m.id]);
  };

  if (!available) return null;

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread ? `Messages, ${unread} unread` : 'Messages'}
        data-testid="member-inbox-bell"
        className="relative flex items-center justify-center rounded-full w-9 h-9 border border-white/15 text-zinc-200 hover:bg-white/10 active:scale-95 transition"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Messages from ClearPath Trader"
          className="fixed inset-x-2 top-16 md:absolute md:inset-x-auto md:right-0 md:top-11 md:w-[420px] z-[200] max-h-[75vh] overflow-y-auto rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl"
        >
          <div className="sticky top-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-white/10 bg-zinc-950">
            <span className="text-sm font-black tracking-wider text-white">MESSAGES</span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button type="button" onClick={() => markRead('all')} className="text-xs text-zinc-400 hover:text-white">
                  Mark all read
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)} aria-label="Close messages" className="p-1 text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {messages.length === 0 ? (
            <p className="px-4 py-6 text-sm text-zinc-400">No messages yet. Security notices and site updates from ClearPath will appear here.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {messages.map((m) => {
                const sev = SEVERITY[m.severity] || SEVERITY.info;
                const Icon = sev.icon;
                const isOpen = expanded === m.id;
                return (
                  <li key={m.id}>
                    <button type="button" onClick={() => toggle(m)} className="w-full text-left px-4 py-3 hover:bg-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black tracking-wider ${sev.tone}`}>
                          <Icon className="w-3 h-3" />
                          {sev.label}
                        </span>
                        {!m.read && <span className="w-2 h-2 rounded-full bg-red-500" aria-label="Unread" />}
                        <span className="ml-auto text-[11px] text-zinc-500">{formatWhen(m.createdAt)}</span>
                      </div>
                      <div className={`text-sm ${m.read ? 'text-zinc-300' : 'text-white font-bold'}`}>{m.subject}</div>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap break-words">{m.body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
