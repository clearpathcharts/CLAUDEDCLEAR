import React, { useEffect, useState } from 'react';
import SEO from './SEO';
import { SurfBackground } from './SurfBackground';
import { loadPublicProfile, type PublicMemberProfile } from '../api/profileApi';
import { normalizeProfileUsername, publicProfileUrl } from '../lib/profileUsername';

function handleFromPath(): string {
  if (typeof window === 'undefined') return '';
  const raw = window.location.pathname.replace(/^\/u\//i, '');
  return normalizeProfileUsername(decodeURIComponent(raw));
}

export default function PublicMemberProfile() {
  const [handle] = useState(handleFromPath);
  const [profile, setProfile] = useState<PublicMemberProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next = handle ? await loadPublicProfile(handle) : null;
      if (!cancelled) {
        setProfile(next);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [handle]);

  const shareUrl =
    typeof window !== 'undefined' ? publicProfileUrl(window.location.origin, handle) : '';

  return (
    <div className="min-h-[100dvh] w-full bg-[#050505] text-white relative overflow-x-hidden">
      <SEO
        title={profile ? `${profile.displayName} (@${profile.username})` : 'Member profile'}
        description="Public ClearPath Trader member page. Education and analytics — not a brokerage."
        canonical={shareUrl || undefined}
      />
      <SurfBackground />
      <nav className="relative z-10 w-full p-6 lg:px-12 flex justify-between items-center border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
        <a href="/" className="font-black tracking-tighter text-sm uppercase italic text-[#00E5FF]">
          ClearPath Trader
        </a>
        <a
          href="/?login=1"
          className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white"
        >
          Private Login
        </a>
      </nav>
      <main className="relative z-10 max-w-3xl mx-auto px-4 py-12">
        {loading ? (
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Loading profile…</p>
        ) : !profile ? (
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-8">
            <h1 className="font-orbitron text-2xl font-bold mb-3">Profile unavailable</h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              This page is private, unpublished, or the link is not a real member handle. Ask the
              person for their public ClearPath URL, or go back to the terminal.
            </p>
            <a
              href="/"
              className="inline-block mt-6 text-xs font-black uppercase tracking-widest text-[#00E5FF]"
            >
              ← Home
            </a>
          </div>
        ) : (
          <article className="rounded-[28px] border border-white/10 bg-white/5 overflow-hidden">
            <div className="h-36 bg-gradient-to-r from-[#ff2ea6]/40 to-[#00e5ff]/30">
              {profile.coverUrl ? (
                <img
                  src={profile.coverUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : null}
            </div>
            <div className="px-6 pb-8 -mt-12">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#ff2ea6] to-[#00e5ff] p-1 shadow-[0_0_18px_rgba(0,229,255,0.35)]">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt=""
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#111] flex items-center justify-center font-bold">
                    {profile.displayName.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <h1 className="mt-4 text-2xl font-orbitron font-bold">{profile.displayName}</h1>
              <p className="text-[#00E5FF] font-mono text-sm">@{profile.username}</p>
              {profile.bio ? (
                <p className="mt-4 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {profile.bio}
                </p>
              ) : (
                <p className="mt-4 text-sm text-zinc-500">No bio yet.</p>
              )}
              {profile.contractorBadges.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {profile.contractorBadges.map((badge) => (
                    <span
                      key={badge.id}
                      className="text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full border border-[#FF00AA]/40 text-[#00F5FF]"
                    >
                      {badge.label}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-8 text-[10px] font-mono uppercase tracking-widest text-zinc-600">
                Educational profile only — not a brokerage, not financial advice.
              </p>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
