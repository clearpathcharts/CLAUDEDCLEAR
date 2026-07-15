import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Share2, Sparkles, Link2 } from 'lucide-react';
import { POLSIA_PARTNER, POLSIA_REFERRAL_URL, POLSIA_REF_CODE } from '../content/polsiaPartner';

/**
 * Internal referral desk (logged-in Dashboard tab).
 * Same Polsia referral URL as the public paid-ad page.
 */
export default function ReferralPage({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(POLSIA_REFERRAL_URL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers / denied clipboard
      const el = document.createElement('textarea');
      el.value = POLSIA_REFERRAL_URL;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 md:px-6 py-6 md:py-10 text-zinc-200">
      <div className="flex items-center gap-2 mb-2">
        <Share2 size={16} className="text-[#00E5FF]" />
        <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#00E5FF]">
          Partner referral desk
        </p>
      </div>

      <h1
        className="text-2xl md:text-4xl font-black text-white tracking-tight mb-3"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        Refer {POLSIA_PARTNER.name}
      </h1>
      <p className="text-sm md:text-base text-zinc-400 max-w-2xl leading-relaxed mb-8">
        Share ClearPath&apos;s referral link for {POLSIA_PARTNER.name} — {POLSIA_PARTNER.tagline.toLowerCase()}.
        Copy it, open it, or send people to the public ad page.
      </p>

      <div className="rounded-2xl border border-[#B026FF]/30 bg-gradient-to-br from-[#B026FF]/10 via-black/40 to-[#00E5FF]/5 p-5 md:p-7 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <h2 className="text-xl font-black text-white mb-1">{POLSIA_PARTNER.name}</h2>
            <p className="text-sm text-[#00E5FF]">{POLSIA_PARTNER.tagline}</p>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-lg border border-[#FFD700]/30 text-[#FFD700] bg-[#FFD700]/10">
            Ref {POLSIA_REF_CODE}
          </span>
        </div>

        <p className="text-sm text-zinc-400 leading-relaxed mb-5">{POLSIA_PARTNER.blurb}</p>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
          {POLSIA_PARTNER.bullets.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-zinc-300">
              <Sparkles size={13} className="text-[#B026FF] shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        <div className="rounded-xl border border-white/10 bg-black/50 p-3 md:p-4 mb-4">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
            <Link2 size={12} />
            Your referral URL
          </div>
          <p className="text-xs md:text-sm font-mono text-[#00E5FF] break-all">{POLSIA_REFERRAL_URL}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-[#00E5FF]/40 bg-[#00E5FF]/10 text-[#00E5FF] text-xs font-black uppercase tracking-widest hover:bg-[#00E5FF]/20 transition-colors"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy link'}
          </button>
          <a
            href={POLSIA_REFERRAL_URL}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#FF1493] to-[#B026FF] text-white text-xs font-black uppercase tracking-widest hover:opacity-95 transition-opacity"
          >
            Open Polsia
            <ExternalLink size={14} />
          </a>
          <a
            href="/ads/polsia"
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-white/15 text-zinc-300 text-xs font-black uppercase tracking-widest hover:border-[#FFD700]/40 hover:text-[#FFD700] transition-colors"
          >
            Public ad page
          </a>
        </div>
      </div>

      <p className="text-[11px] text-zinc-500 leading-relaxed max-w-2xl">
        {POLSIA_PARTNER.disclosure}{' '}
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('Discovery')}
            className="text-[#00E5FF] hover:underline"
          >
            Back to Home
          </button>
        )}
      </p>
    </div>
  );
}
