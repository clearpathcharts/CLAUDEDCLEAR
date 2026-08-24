import React, { useState } from 'react';
import type { QuizQuestion } from './explainContent';
import { hexToRgba } from './explainMedia';

interface QuizCheckProps {
  questions: QuizQuestion[];
  accent?: string;
}

export function QuizCheck({ questions, accent = '#00E5FF' }: QuizCheckProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  if (questions.length === 0) return null;

  return (
    <div
      className="mt-5 rounded-2xl p-4"
      style={{
        border: `1px solid ${hexToRgba(accent, 0.25)}`,
        background: hexToRgba(accent, 0.04),
      }}
    >
      <p
        className="m-0 mb-3 text-[10px] font-black uppercase tracking-[0.18em]"
        style={{ color: hexToRgba(accent, 0.85) }}
      >
        Quick check
      </p>
      {questions.map((q) => {
        const selected = answers[q.id];
        const answered = Boolean(selected);
        const isCorrect = selected === q.correctOptionId;

        return (
          <div key={q.id} className="mb-4 last:mb-0">
            <p className="mb-2 text-sm font-medium text-white">{q.prompt}</p>
            <div className="flex flex-col gap-1.5">
              {q.options.map((opt) => {
                const isSelected = selected === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                    className="cursor-pointer rounded-xl px-3.5 py-2.5 text-left text-[13px] text-zinc-200"
                    style={{
                      border: isSelected ? `1.5px solid ${accent}` : '1px solid #2a2a33',
                      background: isSelected ? hexToRgba(accent, 0.1) : 'rgba(0,0,0,0.35)',
                    }}
                  >
                    {opt.text}
                  </button>
                );
              })}
            </div>
            {answered && (
              <p
                className="mt-2 text-[13px]"
                style={{ color: isCorrect ? '#33FF99' : '#FF7B00' }}
                role="status"
              >
                {isCorrect ? 'Correct. ' : 'Not quite. '}
                {q.explanation}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
