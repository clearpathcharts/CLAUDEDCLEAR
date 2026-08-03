import React from 'react';
import SEO from './SEO';

/**
 * clearpathtrader.com no longer hosts Social OS.
 * The publisher runs on its own domain (SOCIAL_OS_PUBLIC_URL).
 */
export default function SocialOsMovedPage() {
  const target =
    (typeof import.meta !== 'undefined' &&
      (import.meta as { env?: { VITE_SOCIAL_OS_PUBLIC_URL?: string } }).env?.VITE_SOCIAL_OS_PUBLIC_URL) ||
    '';

  return (
    <div className="min-h-screen bg-[#07080f] text-zinc-100 flex flex-col items-center justify-center px-6 text-center">
      <SEO
        title="Social OS moved"
        description="ClearPath Social OS runs on its own domain — disconnected from clearpathtrader.com."
        canonical="https://clearpathtrader.com/ops/social"
      />
      <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-cyan-400 mb-3">Disconnected</p>
      <h1 className="text-3xl font-semibold text-white mb-3" style={{ fontFamily: 'Georgia, serif' }}>
        Social OS has its own domain
      </h1>
      <p className="text-sm text-zinc-400 max-w-md leading-relaxed mb-6">
        The publisher is no longer part of clearpathtrader.com. Open the dedicated Social OS host to compose and send.
      </p>
      {target ? (
        <a
          href={target}
          className="rounded-lg bg-cyan-500/20 border border-cyan-400/40 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-500/30"
        >
          Open Social OS
        </a>
      ) : (
        <p className="text-xs text-zinc-500 font-mono">
          Set SOCIAL_OS_PUBLIC_URL / VITE_SOCIAL_OS_PUBLIC_URL to your publisher domain.
        </p>
      )}
      <a href="/" className="mt-8 text-xs uppercase tracking-wider text-zinc-500 hover:text-white">
        Back to ClearPath Trader
      </a>
    </div>
  );
}
