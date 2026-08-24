import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getExplainContent } from './explainContent';
import { hexToRgba } from './explainMedia';
import { ExplainVideoStage } from './ExplainVideoStage';
import { QuizCheck } from './QuizCheck';

interface ExplainOverlayProps {
  contentId: string;
  onClose: () => void;
}

export function ExplainOverlay({ contentId, onClose }: ExplainOverlayProps) {
  const content = getExplainContent(contentId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    // Do not lock body scroll — the full desk behind this sheet must stay usable.
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!content || typeof document === 'undefined') return null;

  const node = (
    <div className="pointer-events-none fixed inset-0 z-[400] flex items-end justify-end sm:items-stretch">
      <div
        className="pointer-events-auto flex min-h-0 w-full max-w-[560px] flex-col overflow-y-auto rounded-t-3xl p-4 sm:h-full sm:max-h-none sm:rounded-none sm:rounded-l-3xl sm:p-6"
        role="dialog"
        aria-modal="false"
        aria-labelledby={`explain-title-${content.id}`}
        style={{
          background: 'linear-gradient(180deg, #0c0c14 0%, #07070c 100%)',
          border: `1px solid ${hexToRgba(content.color, 0.55)}`,
          boxShadow: `0 0 48px ${hexToRgba(content.color, 0.18)}`,
        }}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className="m-0 mb-1 text-[9px] font-black uppercase tracking-[0.22em]"
              style={{ color: hexToRgba(content.color, 0.9) }}
            >
              Need extra understanding
            </p>
            <h2
              id={`explain-title-${content.id}`}
              className="m-0 text-xl font-medium sm:text-2xl"
              style={{ color: content.color, fontFamily: "'Cinzel', serif" }}
            >
              {content.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close explanation and use the full page"
            className="shrink-0 rounded-full border border-white/15 px-2.5 py-1 text-lg leading-none text-zinc-400 hover:text-white"
          >
            ×
          </button>
        </div>

        <p className="m-0 mb-4 text-[12px] leading-relaxed text-zinc-400">
          Same layout on every tab — cinema stage, plain-language card, one quiz. Only the color,
          title, and later Flow clip change. The full {content.title} desk stays on the left; close
          this sheet to use it.
        </p>

        <ExplainVideoStage
          id={content.id}
          title={content.title}
          color={content.color}
          videoUrl={content.videoUrl}
          posterUrl={content.posterUrl}
        />

        <p className="m-0 text-[15px] leading-relaxed text-zinc-200">{content.text}</p>

        <QuizCheck questions={content.quiz} accent={content.color} />

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-full border px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-black"
          style={{
            background: content.color,
            borderColor: content.color,
            fontFamily: "'Cinzel', serif",
          }}
        >
          Use full {content.title} desk
        </button>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
