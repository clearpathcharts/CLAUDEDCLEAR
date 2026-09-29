import React, { useCallback, useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { communityRoomPlanLabel, type CommunityRoom } from '../../lib/communityRooms';

type RoomRow = CommunityRoom & { planLabel: string; locked: boolean };

type PostRow = {
  id: string;
  authorName: string;
  text: string;
  createdAt: number;
  mine: boolean;
};

export default function CommunityHub({ onUpgrade }: { onUpgrade: () => void }) {
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string>('education');
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [draft, setDraft] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  const loadRooms = useCallback(async () => {
    const res = await fetch('/api/communities', { credentials: 'include' });
    const data = await res.json();
    const list: RoomRow[] = Array.isArray(data.rooms) ? data.rooms : [];
    setRooms(list);
    setSignedIn(Boolean(data.signedIn));
    setPlan(data.plan || null);
    setActiveId((current) => (list.some((r) => r.id === current) ? current : list[0]?.id || 'education'));
  }, []);

  const loadPosts = useCallback(async (roomId: string, locked: boolean) => {
    if (locked) {
      setPosts([]);
      return;
    }
    const res = await fetch(`/api/communities/${roomId}/posts`, { credentials: 'include' });
    if (!res.ok) {
      setPosts([]);
      const data = await res.json().catch(() => ({}));
      setNote(data.error || 'Could not load this room.');
      return;
    }
    const data = await res.json();
    setPosts(Array.isArray(data.posts) ? data.posts : []);
    setNote('');
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadRooms();
      } catch {
        if (!cancelled) setNote('Communities are unavailable right now.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadRooms]);

  const active = rooms.find((r) => r.id === activeId) ?? null;

  useEffect(() => {
    if (!active) return;
    void loadPosts(active.id, active.locked);
  }, [active, loadPosts]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || active.locked) return;
    setNote('');
    const res = await fetch(`/api/communities/${active.id}/posts`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: draft }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setNote(data.error || 'Could not post.');
      return;
    }
    setDraft('');
    if (data.post) setPosts((prev) => [...prev, data.post]);
  };

  const remove = async (postId: string) => {
    if (!active) return;
    const res = await fetch(`/api/communities/${active.id}/posts/${postId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-3 md:p-6" data-testid="community-hub">
      <header className="space-y-1">
        <h1 className="text-xl font-black uppercase tracking-wide text-white">Communities</h1>
        <p className="max-w-2xl text-sm text-zinc-400">
          One room for each paid feature. You can read and post only in rooms your plan includes.
          Educational talk. No trade calls and no price predictions.
        </p>
        <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">
          {signedIn ? `Signed in · ${plan || 'basic'}` : 'Sign in to open a room your plan includes'}
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading rooms…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          <ul className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
            {rooms.map((room) => {
              const on = room.id === activeId;
              return (
                <li key={room.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(room.id)}
                    className={`flex w-full min-w-[10rem] items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs ${
                      on ? 'border-cyan-400/50 bg-cyan-400/10 text-white' : 'border-white/10 text-zinc-300'
                    }`}
                  >
                    <span className="font-bold">{room.label}</span>
                    {room.locked ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase text-zinc-500">
                        <Lock size={10} /> {room.planLabel}
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase text-emerald-400">Open</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <section className="flex min-h-[420px] flex-col rounded-2xl border border-white/10 bg-black/50">
            {active ? (
              <>
                <header className="border-b border-white/10 px-4 py-3">
                  <h2 className="text-sm font-black uppercase tracking-wider text-white">{active.label}</h2>
                  <p className="text-xs text-zinc-500">{active.blurb}</p>
                </header>
                {active.locked ? (
                  <div className="flex flex-1 flex-col items-start justify-center gap-3 px-4 py-8">
                    <p className="text-sm text-zinc-300">
                      {active.label} opens on {communityRoomPlanLabel(active)}.
                    </p>
                    <button
                      type="button"
                      onClick={onUpgrade}
                      className="rounded-full border border-amber-400/40 px-4 py-2 text-xs font-black uppercase tracking-widest text-amber-200"
                    >
                      View memberships
                    </button>
                  </div>
                ) : (
                  <>
                    <ul className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
                      {posts.length === 0 ? (
                        <li className="text-sm text-zinc-500">No posts in this room yet.</li>
                      ) : (
                        posts.map((post) => (
                          <li key={post.id} className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-bold uppercase tracking-wide text-cyan-200">{post.authorName}</span>
                              <time className="text-[10px] text-zinc-600">
                                {new Date(post.createdAt).toLocaleString()}
                              </time>
                            </div>
                            <p className="mt-1 text-sm text-zinc-200">{post.text}</p>
                            {post.mine ? (
                              <button
                                type="button"
                                onClick={() => void remove(post.id)}
                                className="mt-1 text-[10px] uppercase tracking-widest text-zinc-500 hover:text-rose-300"
                              >
                                Remove
                              </button>
                            ) : null}
                          </li>
                        ))
                      )}
                    </ul>
                    <form onSubmit={(e) => void send(e)} className="flex gap-2 border-t border-white/10 p-3">
                      <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        maxLength={800}
                        placeholder="Ask about this feature…"
                        className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black px-3 py-2 text-sm text-white"
                      />
                      <button
                        type="submit"
                        className="rounded-xl bg-cyan-400 px-4 py-2 text-xs font-black uppercase tracking-widest text-black"
                      >
                        Post
                      </button>
                    </form>
                  </>
                )}
              </>
            ) : null}
            {note ? <p className="px-4 pb-3 text-xs text-amber-200">{note}</p> : null}
          </section>
        </div>
      )}
    </div>
  );
}
