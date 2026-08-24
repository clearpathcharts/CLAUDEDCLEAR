import React, { useEffect, useState } from 'react';
import {
  explainCaptionsSrc,
  explainPosterSrc,
  explainVideoSrc,
  hexToRgba,
  type ExplainFlowAspect,
} from './explainMedia';

type StageState = 'checking' | 'ready' | 'empty';

function isUsableMedia(res: Response, kind: 'video' | 'image' | 'text'): boolean {
  if (!res.ok) return false;
  const type = (res.headers.get('content-type') || '').toLowerCase();
  if (type.includes('text/html')) return false;
  if (kind === 'video') return type.includes('video') || type.includes('mp4') || type.includes('octet-stream');
  if (kind === 'image') return type.includes('image');
  return type.includes('text/vtt') || type.includes('text/plain');
}

export function ExplainVideoStage({
  id,
  title,
  color,
  videoUrl,
  posterUrl,
  aspect = '16:9',
}: {
  id: string;
  title: string;
  color: string;
  videoUrl?: string;
  posterUrl?: string;
  aspect?: ExplainFlowAspect;
}) {
  const src = explainVideoSrc(id, videoUrl);
  const poster = explainPosterSrc(id, posterUrl);
  const captions = explainCaptionsSrc(id);
  const [state, setState] = useState<StageState>(videoUrl?.trim() ? 'ready' : 'checking');
  const [posterOk, setPosterOk] = useState(false);
  const [captionsOk, setCaptionsOk] = useState(false);
  const reduced =
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-reduced-sensory') === 'true';

  useEffect(() => {
    if (videoUrl?.trim()) {
      setState('ready');
      return;
    }
    let cancelled = false;
    const ctrl = new AbortController();
    fetch(src, { method: 'HEAD', signal: ctrl.signal })
      .then((res) => {
        if (cancelled) return;
        setState(isUsableMedia(res, 'video') ? 'ready' : 'empty');
      })
      .catch(() => {
        if (!cancelled) setState('empty');
      });
    fetch(poster, { method: 'HEAD', signal: ctrl.signal })
      .then((res) => {
        if (!cancelled) setPosterOk(isUsableMedia(res, 'image'));
      })
      .catch(() => {
        if (!cancelled) setPosterOk(false);
      });
    fetch(captions, { method: 'HEAD', signal: ctrl.signal })
      .then((res) => {
        if (!cancelled) setCaptionsOk(isUsableMedia(res, 'text'));
      })
      .catch(() => {
        if (!cancelled) setCaptionsOk(false);
      });
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [src, poster, captions, videoUrl]);

  const ratio = aspect === '9:16' ? '9 / 16' : '16 / 9';
  const showSlotHint =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  return (
    <div
      className="relative mb-4 overflow-hidden rounded-2xl"
      style={{
        border: `1px solid ${hexToRgba(color, 0.55)}`,
        boxShadow: reduced
          ? 'none'
          : `0 0 28px ${hexToRgba(color, 0.22)}, inset 0 0 40px ${hexToRgba(color, 0.06)}`,
        background: '#050508',
      }}
    >
      <div className="pointer-events-none absolute inset-x-3 top-2 z-10 flex items-center justify-between">
        <span
          className="rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.18em]"
          style={{
            color,
            borderColor: hexToRgba(color, 0.45),
            background: 'rgba(0,0,0,0.55)',
            fontFamily: "'Cinzel', serif",
          }}
        >
          Extra understanding
        </span>
        <span className="text-[8px] font-mono uppercase tracking-widest text-zinc-500">
          {aspect} · Flow
        </span>
      </div>

      <div className="relative w-full bg-black" style={{ aspectRatio: ratio }}>
        {state === 'ready' ? (
          <video
            key={src}
            src={src}
            poster={posterOk ? poster : undefined}
            controls
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-contain bg-black"
            onError={() => setState('empty')}
          >
            {captionsOk ? (
              <track kind="captions" srcLang="en" src={captions} label="English" default />
            ) : null}
          </video>
        ) : (
          <EmptyFlowFrame
            title={title}
            color={color}
            checking={state === 'checking'}
            reduced={reduced}
          />
        )}

        {/* Film-corner brackets — same language as the nav play badge */}
        <span
          className="pointer-events-none absolute left-2 top-2 h-4 w-4 rounded-tl-md border-l-2 border-t-2"
          style={{ borderColor: color }}
          aria-hidden
        />
        <span
          className="pointer-events-none absolute right-2 top-2 h-4 w-4 rounded-tr-md border-r-2 border-t-2"
          style={{ borderColor: color }}
          aria-hidden
        />
        <span
          className="pointer-events-none absolute bottom-2 left-2 h-4 w-4 rounded-bl-md border-b-2 border-l-2"
          style={{ borderColor: color }}
          aria-hidden
        />
        <span
          className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 rounded-br-md border-b-2 border-r-2"
          style={{ borderColor: color }}
          aria-hidden
        />
      </div>

      {state !== 'ready' && (
        <p className="px-3 py-2 text-center text-[11px] leading-relaxed text-zinc-500">
          {state === 'checking'
            ? 'Looking for a short clip…'
            : 'No clip for this tab yet. The words below explain the same thing.'}
          {showSlotHint && state === 'empty' ? (
            <span className="mt-1 block font-mono text-[9px] text-zinc-600">
              Google Flow drop: public/explain-videos/{id}.mp4 (16:9, ~8s)
            </span>
          ) : null}
        </p>
      )}
    </div>
  );
}

function EmptyFlowFrame({
  title,
  color,
  checking,
  reduced,
}: {
  title: string;
  color: string;
  checking: boolean;
  reduced: boolean;
}) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center"
      style={{
        background: `radial-gradient(ellipse at center, ${hexToRgba(color, 0.16)} 0%, #050508 62%)`,
      }}
    >
      <svg
        viewBox="0 0 30 20"
        width="72"
        height="48"
        aria-hidden
        className={checking || reduced ? '' : 'animate-pulse'}
      >
        <rect
          x="1"
          y="1"
          width="28"
          height="18"
          rx="5"
          fill="none"
          stroke={color}
          strokeWidth="1.6"
        />
        <path d="M12 6 L12 14 L19 10 Z" fill={color} />
      </svg>
      <p
        className="m-0 text-[13px] font-medium tracking-wide"
        style={{ color, fontFamily: "'Cinzel', serif" }}
      >
        How {title} works
      </p>
      <p className="m-0 max-w-sm text-[11px] leading-relaxed text-zinc-500">
        A Google Flow clip sits here — same play badge as the tab, 16:9 landscape, quiet
        motion, no trade calls on screen.
      </p>
    </div>
  );
}
