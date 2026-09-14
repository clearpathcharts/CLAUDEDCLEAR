import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getExplainContent } from './explainContent';
import { getExplainFlowScript } from './flowScripts';
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
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!content || typeof document === 'undefined') return null;

  const node = (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[400] flex items-center justify-center p-3 sm:p-6"
      style={{
        background: 'rgba(0,0,0,0.82)',
        backdropFilter: 'blur(10px)',
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`explain-title-${content.id}`}
        onClick={(e) => e.stopPropagation()}
        className="scrollbar-panel w-full max-w-[760px] max-h-[90vh] overflow-y-auto rounded-3xl p-4 sm:p-6"
        style={{
          background: 'linear-gradient(180deg, #0c0c14 0%, #07070c 100%)',
          border: `1px solid ${hexToRgba(content.color, 0.55)}`,
          boxShadow: `0 0 48px ${hexToRgba(content.color, 0.18)}`,
        }}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
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
            aria-label="Close explanation"
            className="shrink-0 rounded-full border border-white/15 px-2.5 py-1 text-lg leading-none text-zinc-400 hover:text-white"
          >
            ×
          </button>
        </div>

        <ExplainVideoStage
          id={content.id}
          title={content.title}
          color={content.color}
          videoUrl={content.videoUrl}
          posterUrl={content.posterUrl}
        />

        <p className="m-0 text-[15px] leading-relaxed text-zinc-200">{content.text}</p>

        <FlowScriptReadAlong contentId={content.id} color={content.color} />

        <QuizCheck questions={content.quiz} accent={content.color} />
      </div>
    </div>
  );

  return createPortal(node, document.body);
}

function FlowScriptReadAlong({ contentId, color }: { contentId: string; color: string }) {
  const flow = getExplainFlowScript(contentId);
  if (!flow) return null;

  return (
    <details className="mt-4 rounded-2xl border border-white/10 bg-black/30 px-3 py-2">
      <summary
        className="cursor-pointer text-[10px] font-black uppercase tracking-[0.16em]"
        style={{ color: hexToRgba(color, 0.85) }}
      >
        Full {flow.targetSeconds}s walkthrough script · {flow.shots.length} Flow shots
      </summary>
      <ol className="mt-3 mb-1 list-none space-y-3 p-0">
        {flow.shots.map((shot) => (
          <li key={shot.id} className="text-[13px] leading-relaxed text-zinc-300">
            <p className="m-0 mb-1 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              {shot.startSeconds}–{shot.endSeconds}s · {shot.title}
              {shot.super ? ` · “${shot.super}”` : ''}
            </p>
            <p className="m-0">{shot.narration}</p>
          </li>
        ))}
      </ol>
    </details>
  );
}
