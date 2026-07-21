import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Hash,
  MessageCircle,
  Send,
  Sparkles,
  Users,
  Wifi,
  WifiOff,
  X,
  ChevronRight,
} from 'lucide-react';
import { useChatRoom } from '../../hooks/useChatRoom';

export interface ChatRoomOption {
  id: string;
  label: string;
  emoji: string;
  tagline: string;
  accent: string;
}

export const DEFAULT_CHAT_ROOMS: ChatRoomOption[] = [
  {
    id: 'lobby',
    label: 'Public Lobby',
    emoji: '🌐',
    tagline: 'Open desk — no account required',
    accent: '#00E5FF',
  },
  {
    id: 'macro-minds',
    label: 'Macro Minds',
    emoji: '🧬',
    tagline: 'Yield curves & central bank flow',
    accent: '#FF7B00',
  },
  {
    id: 'forex-syndicate',
    label: 'Forex Syndicate',
    emoji: '🦂',
    tagline: 'Session sweeps & FX structure',
    accent: '#FF1493',
  },
  {
    id: 'liquidity-alchemists',
    label: 'Liquidity Lab',
    emoji: '🧪',
    tagline: 'Repos, funding & depth',
    accent: '#4D00FF',
  },
];

interface ClearPathChatroomProps {
  variant?: 'embedded' | 'panel' | 'fullscreen';
  initialRoomId?: string;
  rooms?: ChatRoomOption[];
  accentColor?: string;
  title?: string;
  subtitle?: string;
  showRoomSidebar?: boolean;
  onClose?: () => void;
  className?: string;
  heightClass?: string;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ClearPathChatroom({
  variant = 'embedded',
  initialRoomId = 'lobby',
  rooms = DEFAULT_CHAT_ROOMS,
  accentColor = '#4D00FF',
  title,
  subtitle,
  showRoomSidebar = true,
  onClose,
  className = '',
  heightClass,
}: ClearPathChatroomProps) {
  const [activeRoomId, setActiveRoomId] = useState(initialRoomId);
  const [draft, setDraft] = useState('');
  const [editingHandle, setEditingHandle] = useState(false);
  const [handleDraft, setHandleDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeRoom = rooms.find((r) => r.id === activeRoomId) ?? rooms[0];
  const isLava = className.includes('cp-chatroom-lava') || accentColor.toUpperCase() === '#FF4500';
  const roomAccent = isLava ? '#FF4500' : (activeRoom?.accent || accentColor);

  const { messages, status, onlineCount, handle, sendMessage, updateHandle, isOwnMessage } =
    useChatRoom(activeRoomId);

  useEffect(() => {
    setActiveRoomId(initialRoomId);
  }, [initialRoomId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeRoomId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sendMessage(draft)) {
      setDraft('');
    }
  };

  const shellHeight =
    heightClass ||
    (variant === 'panel'
      ? 'h-full'
      : variant === 'fullscreen'
        ? 'min-h-[70vh]'
        : 'h-[520px] md:h-[560px]');

  return (
    <div
      className={`cp-chatroom relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#06060f]/95 backdrop-blur-2xl shadow-[0_0_60px_rgba(77,0,255,0.12)] ${shellHeight} flex flex-col ${className}`}
      style={{ ['--cp-chat-accent' as string]: roomAccent }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: isLava
            ? 'radial-gradient(circle at top right, rgba(255,69,0,0.28), transparent 48%), radial-gradient(circle at bottom left, rgba(255,140,0,0.16), transparent 42%), linear-gradient(180deg, #1a0800 0%, #0a0400 55%, #050505 100%)'
            : 'radial-gradient(circle at top right, rgba(255,20,147,0.12), transparent 45%), radial-gradient(circle at bottom left, rgba(0,229,255,0.08), transparent 40%)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] bg-[linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] bg-[size:24px_24px]" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 md:px-5">
        <div className="min-w-0 flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-lg shadow-[0_0_20px_rgba(77,0,255,0.25)]"
            style={{
              borderColor: `${roomAccent}55`,
              background: `linear-gradient(135deg, ${roomAccent}22, rgba(0,0,0,0.6))`,
            }}
          >
            {activeRoom?.emoji || '💬'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-black uppercase tracking-[0.18em] text-white">
                {title || activeRoom?.label || 'ClearPath Chat'}
              </h3>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                  status === 'ONLINE'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : status === 'CONNECTING'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-red-500/15 text-red-400 border border-red-500/30'
                }`}
              >
                {status === 'ONLINE' ? <Wifi size={10} /> : <WifiOff size={10} />}
                {status}
              </span>
            </div>
            <p className="truncate text-[10px] font-mono text-zinc-500">
              {subtitle || activeRoom?.tagline} • {onlineCount} online
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {editingHandle ? (
            <form
              className="flex items-center gap-1"
              onSubmit={(e) => {
                e.preventDefault();
                updateHandle(handleDraft);
                setEditingHandle(false);
              }}
            >
              <input
                value={handleDraft}
                onChange={(e) => setHandleDraft(e.target.value)}
                className="w-28 rounded-lg border border-white/10 bg-black/60 px-2 py-1 text-[10px] text-white outline-none focus:border-[var(--cp-chat-accent)]"
                placeholder="Display name"
                maxLength={32}
              />
              <button type="submit" className="rounded-lg bg-white/10 px-2 py-1 text-[10px] text-white">
                OK
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setHandleDraft(handle);
                setEditingHandle(true);
              }}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-mono text-zinc-300 hover:text-white"
            >
              @{handle}
            </button>
          )}
          {onClose && (
            <button
              type="button"
              aria-label="Close chatroom"
              onClick={onClose}
              className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1">
        {/* Room sidebar — inspired by CodePen glass channel rails */}
        {showRoomSidebar && variant !== 'panel' && (
          <aside className="hidden w-[210px] shrink-0 flex-col border-r border-white/10 bg-black/30 p-3 md:flex">
            <div className="mb-3 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500">
              <Users size={12} />
              Live Rooms
            </div>
            <div className="space-y-2 overflow-y-auto custom-scrollbar">
              {rooms.map((room) => {
                const active = room.id === activeRoomId;
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setActiveRoomId(room.id)}
                    className={`group w-full rounded-2xl border p-3 text-left transition-all ${
                      active
                        ? 'border-[var(--cp-chat-accent)] bg-[var(--cp-chat-accent)]/10 shadow-[0_0_20px_rgba(77,0,255,0.15)]'
                        : 'border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
                    }`}
                    style={active ? { borderColor: `${room.accent}88` } : undefined}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-lg">{room.emoji}</span>
                      {active && <ChevronRight size={12} className="text-[var(--cp-chat-accent)]" />}
                    </div>
                    <div className="mt-1 text-[10px] font-black uppercase tracking-wide text-white">
                      {room.label}
                    </div>
                    <div className="mt-0.5 text-[8px] leading-snug text-zinc-500">{room.tagline}</div>
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* Mobile room picker */}
        {showRoomSidebar && variant !== 'panel' && (
          <div className="flex gap-2 overflow-x-auto border-b border-white/10 px-3 py-2 md:hidden no-scrollbar">
            {rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => setActiveRoomId(room.id)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-wider ${
                  room.id === activeRoomId
                    ? 'text-white'
                    : 'border-white/10 bg-black/40 text-zinc-500'
                }`}
                style={
                  room.id === activeRoomId
                    ? { borderColor: `${room.accent}88`, background: `${room.accent}22`, color: room.accent }
                    : undefined
                }
              >
                {room.emoji} {room.label}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4 custom-scrollbar md:px-5"
          >
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-zinc-400">
                <MessageCircle size={28} className="mb-3 opacity-50" style={{ color: roomAccent }} />
                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-300">Room is quiet</p>
                <p className="mt-1 max-w-xs text-[11px] text-zinc-400">
                  No fake chatter here — be the first real voice in {activeRoom?.label}.
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((msg) => {
                  const own = isOwnMessage(msg.author);
                  const system = msg.isSystem;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.22 }}
                      className={`flex ${own ? 'justify-end' : 'justify-start'}`}
                    >
                      {system ? (
                        <div className="max-w-[90%] rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-center text-[10px] font-mono uppercase tracking-wider text-cyan-300">
                          <Sparkles size={10} className="mr-1 inline" />
                          {msg.text}
                        </div>
                      ) : (
                        <div className={`flex max-w-[88%] gap-2 ${own ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div
                            className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-[10px] font-black"
                            style={{
                              borderColor: own ? `${roomAccent}66` : 'rgba(255,255,255,0.08)',
                              background: own
                                ? `linear-gradient(135deg, ${roomAccent}33, rgba(0,0,0,0.5))`
                                : 'rgba(255,255,255,0.04)',
                              color: own ? roomAccent : '#cbd5e1',
                            }}
                          >
                            {(msg.avatar || msg.author.slice(0, 2)).toUpperCase()}
                          </div>
                          <div className={own ? 'items-end' : 'items-start'}>
                            <div className={`mb-1 flex items-center gap-2 ${own ? 'justify-end' : ''}`}>
                              <span className="text-[10px] font-black uppercase tracking-wide text-zinc-300">
                                {msg.author}
                              </span>
                              <span className="text-[9px] font-mono text-zinc-600">{formatTime(msg.timestamp)}</span>
                            </div>
                            <div
                              className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                own
                                  ? 'rounded-br-md text-white shadow-[0_0_24px_rgba(99,102,241,0.22)]'
                                  : 'rounded-bl-md border border-white/8 bg-zinc-900/80 text-zinc-100'
                              }`}
                              style={
                                own
                                  ? {
                                      background: isLava
                                        ? 'linear-gradient(135deg, #ff0000 0%, #ff4500 55%, #ff8c00 100%)'
                                        : `linear-gradient(135deg, ${roomAccent}cc 0%, #4f46e5 100%)`,
                                      color: isLava ? '#000' : undefined,
                                      boxShadow: `0 0 24px ${roomAccent}33`,
                                    }
                                  : undefined
                              }
                            >
                              {msg.text}
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={handleSubmit}
            className="relative border-t border-white/10 bg-black/40 p-3 md:p-4"
          >
            <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-[#0a0a14]/90 p-2 shadow-inner">
              <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-zinc-500">
                <Hash size={14} />
              </div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                rows={1}
                placeholder={`Message ${activeRoom?.label || 'room'} as @${handle}...`}
                disabled={status !== 'ONLINE'}
                className="max-h-28 min-h-[40px] flex-1 resize-none bg-transparent px-1 py-2 text-sm text-white placeholder:text-zinc-600 outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!draft.trim() || status !== 'ONLINE'}
                className="cp-chat-send flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-black transition-all disabled:opacity-40"
                style={{
                  background: isLava
                    ? 'linear-gradient(135deg, #ff0000 0%, #ff4500 52%, #ff8c00 100%)'
                    : `linear-gradient(135deg, ${roomAccent}, #7c3aed)`,
                  boxShadow: draft.trim() ? `0 0 20px ${roomAccent}55` : undefined,
                }}
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="mt-2 text-center text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-400">
              Live WebSocket room • Empty until real traders speak
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
