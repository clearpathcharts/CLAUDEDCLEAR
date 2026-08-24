import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Clapperboard, X } from 'lucide-react';
import { useAccessibleDialog } from '../../hooks/useAccessibleDialog';
import { bindVideoSource } from '../../lib/cpms/hlsPlayer';
import {
  SECTION_GUIDE_BEAT_COUNT,
  getSectionGuide,
  sectionGuideBeatHasVideo,
  sectionGuideReadyBeatCount,
  type SectionGuideBeat,
  type SectionGuideEntry,
} from '../../sectionGuides/catalog';
import {
  isSectionGuideOfferSnoozed,
  snoozeSectionGuideOffer,
} from '../../sectionGuides/storage';

type Props = {
  tabId: string;
  /** Hide on lean APK shell if desired. */
  disabled?: boolean;
};

function formatGuideLength(totalSeconds: number): string {
  if (totalSeconds < 90) return `~${totalSeconds}s`;
  const m = Math.max(1, Math.round(totalSeconds / 60));
  return m === 1 ? 'about 1 minute' : `about ${m} minutes`;
}

/**
 * Per-section “Would you like to watch a video?” offer + multi-beat player.
 * Mount once in Dashboard keyed by activeTab.
 * Each section plays a sequence of {@link SECTION_GUIDE_BEAT_COUNT} short clips.
 */
export default function SectionGuideOffer({ tabId, disabled = false }: Props) {
  const guide = getSectionGuide(tabId);
  const [snoozed, setSnoozed] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);

  useEffect(() => {
    setSnoozed(guide ? isSectionGuideOfferSnoozed(guide.tabId) : false);
    setPlayerOpen(false);
  }, [guide?.tabId]);

  if (disabled || !guide || snoozed) return null;

  const ready = sectionGuideReadyBeatCount(guide);

  return (
    <>
      <div className="mb-4 flex justify-end">
        <div
          role="region"
          aria-label={`Video guide for ${guide.title}`}
          className="inline-flex max-w-full items-stretch rounded-2xl border border-[#00E5FF]/30 bg-black/70 shadow-[0_0_24px_rgba(0,229,255,0.12)] overflow-hidden"
        >
          <button
            type="button"
            onClick={() => setPlayerOpen(true)}
            className="flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-[#00E5FF]/8 transition-colors min-w-0"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#00E5FF]/15 border border-[#00E5FF]/35 text-[#00E5FF]">
              <Clapperboard size={16} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] font-mono uppercase tracking-[0.22em] text-[#00E5FF]">
                Would you like to watch a video?
              </span>
              <span className="block text-[12px] text-zinc-300 mt-0.5 leading-snug truncate">
                {guide.title} · {SECTION_GUIDE_BEAT_COUNT} short clips ·{' '}
                {formatGuideLength(guide.targetSeconds)}
                {ready > 0 ? ` · ${ready}/${SECTION_GUIDE_BEAT_COUNT} ready` : ''}
              </span>
            </span>
          </button>
          <button
            type="button"
            aria-label="Dismiss video offer"
            onClick={() => {
              snoozeSectionGuideOffer(guide.tabId, 72);
              setSnoozed(true);
            }}
            className="px-3 border-l border-white/10 text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {playerOpen && (
        <SectionGuidePlayerModal
          guide={guide}
          onClose={() => setPlayerOpen(false)}
          onDontAskAgain={() => {
            snoozeSectionGuideOffer(guide.tabId, 0);
            setSnoozed(true);
            setPlayerOpen(false);
          }}
        />
      )}
    </>
  );
}

function SectionGuidePlayerModal({
  guide,
  onClose,
  onDontAskAgain,
}: {
  guide: SectionGuideEntry;
  onClose: () => void;
  onDontAskAgain: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [beatIndex, setBeatIndex] = useState(0);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const beat: SectionGuideBeat | null = guide.beats[beatIndex] ?? null;
  const hasVideo = beat ? sectionGuideBeatHasVideo(beat) : false;
  const isFirst = beatIndex <= 0;
  const isLast = beatIndex >= guide.beats.length - 1;

  useAccessibleDialog(dialogRef, { open: true, onClose });

  useEffect(() => {
    setMediaError(null);
    const el = videoRef.current;
    if (!el || !beat || !hasVideo) return;
    return bindVideoSource(el, beat.videoUrl.trim(), {
      autoPlay: true,
      onError: (message) => setMediaError(message || 'Could not play this guide clip.'),
    });
  }, [beat?.id, beat?.videoUrl, hasVideo]);

  const goPrev = () => {
    if (!isFirst) setBeatIndex((i) => i - 1);
  };

  const goNext = () => {
    if (!isLast) setBeatIndex((i) => i + 1);
  };

  const onVideoEnded = () => {
    if (!isLast) setBeatIndex((i) => i + 1);
  };

  return createPortal(
    <div className="fixed inset-0 z-[230] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="section-guide-title"
        tabIndex={-1}
        className="relative z-10 w-full max-w-4xl rounded-3xl border border-[#00E5FF]/30 bg-[#050508] shadow-[0_0_60px_rgba(0,229,255,0.15)] overflow-hidden outline-none"
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-white/10">
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#00E5FF]">
              Section guide · {beatIndex + 1} / {guide.beats.length}
            </p>
            <h2
              id="section-guide-title"
              className="text-lg font-black text-white tracking-tight mt-1"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {guide.title}
              {beat ? (
                <span className="text-zinc-400 font-semibold"> · {beat.title}</span>
              ) : null}
            </h2>
            <p className="text-[12px] text-zinc-500 mt-1 leading-relaxed">{guide.blurb}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-1"
            aria-label="Close video guide"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="bg-black aspect-video relative min-h-[200px]">
            {hasVideo && beat ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain bg-black"
                  controls
                  playsInline
                  poster={beat.posterUrl || undefined}
                  onEnded={onVideoEnded}
                />
                {mediaError && (
                  <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/80">
                    <p className="text-sm text-[#FF5277] text-center">{mediaError}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
                <Clapperboard size={28} className="text-[#00E5FF]" aria-hidden="true" />
                <p className="text-sm text-white font-semibold">
                  {beat ? `“${beat.title}” coming soon` : 'Guide clips coming soon'}
                </p>
                <p className="text-[12px] text-zinc-400 max-w-md leading-relaxed">
                  Beat {beatIndex + 1} of {guide.beats.length}
                  {beat ? ` (~${beat.targetSeconds}s)` : ''} is being produced in Google Flow.
                  Browse the list to preview titles, or ask C.P.T. Buddy how to use {guide.title}.
                </p>
              </div>
            )}
          </div>

          <nav
            aria-label="Guide beats"
            className="border-t md:border-t-0 md:border-l border-white/10 max-h-[280px] md:max-h-none overflow-y-auto bg-[#08080c]"
          >
            <ol className="p-2 space-y-1">
              {guide.beats.map((b, i) => {
                const ready = sectionGuideBeatHasVideo(b);
                const active = i === beatIndex;
                return (
                  <li key={b.id}>
                    <button
                      type="button"
                      onClick={() => setBeatIndex(i)}
                      aria-current={active ? 'true' : undefined}
                      className={`w-full text-left rounded-xl px-3 py-2 transition-colors ${
                        active
                          ? 'bg-[#00E5FF]/15 border border-[#00E5FF]/40'
                          : 'border border-transparent hover:bg-white/5'
                      }`}
                    >
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-[10px] font-mono text-[#00E5FF]/80">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span
                          className={`text-[9px] font-mono uppercase tracking-wider ${
                            ready ? 'text-emerald-400/80' : 'text-zinc-600'
                          }`}
                        >
                          {ready ? 'ready' : 'soon'}
                        </span>
                      </span>
                      <span
                        className={`block text-[12px] mt-0.5 leading-snug ${
                          active ? 'text-white' : 'text-zinc-400'
                        }`}
                      >
                        {b.title}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-white/10">
          <p className="text-[11px] text-zinc-500">
            {guide.beats.length} clips · ~{guide.targetSeconds}s total · education only · no
            trading signals
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              disabled={isFirst}
              aria-label="Previous clip"
              className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-widest px-3 py-2 rounded-xl border border-white/15 text-zinc-200 hover:border-[#00E5FF]/40 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft size={14} aria-hidden="true" />
              Prev
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={isLast}
              aria-label="Next clip"
              className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-widest px-3 py-2 rounded-xl border border-white/15 text-zinc-200 hover:border-[#00E5FF]/40 disabled:opacity-30 disabled:pointer-events-none"
            >
              Next
              <ChevronRight size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onDontAskAgain}
              className="text-[11px] text-zinc-500 hover:text-zinc-300 px-3 py-2"
            >
              Don’t ask again on this device
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-white/15 text-zinc-200 hover:border-[#00E5FF]/40"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
