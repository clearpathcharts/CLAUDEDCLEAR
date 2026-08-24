import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getExplainContent } from './explainContent';
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
      className="fixed inset-0 z-[400] flex items-center justify-center p-5 bg-black/75"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`explain-title-${content.id}`}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[520px] max-h-[85vh] overflow-y-auto rounded-2xl p-6"
        style={{
          background: '#0A0A10',
          border: `1px solid ${content.color}`,
        }}
      >
        <div className="flex justify-between items-center mb-3.5 gap-3">
          <h2
            id={`explain-title-${content.id}`}
            className="m-0 text-lg font-medium"
            style={{ color: content.color }}
          >
            {content.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close explanation"
            className="bg-transparent border-0 text-zinc-400 text-[22px] leading-none cursor-pointer px-1"
          >
            ×
          </button>
        </div>

        {content.videoUrl ? (
          <div className="mb-4 rounded-xl overflow-hidden">
            <video src={content.videoUrl} controls className="w-full block" />
          </div>
        ) : (
          <div className="mb-4 rounded-xl bg-[#111116] px-7 py-7 text-center text-[13px] text-zinc-500">
            No video for this tab yet. The words below are the extra explanation.
          </div>
        )}

        <p className="m-0 text-[15px] leading-relaxed text-zinc-200">{content.text}</p>

        <QuizCheck questions={content.quiz} />
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
