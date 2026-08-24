import React, { useState } from 'react';
import type { QuizQuestion } from './explainContent';

interface QuizCheckProps {
  questions: QuizQuestion[];
}

export function QuizCheck({ questions }: QuizCheckProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  if (questions.length === 0) return null;

  return (
    <div className="mt-5">
      <p className="text-zinc-500 text-xs m-0 mb-2.5">Quick check</p>
      {questions.map((q) => {
        const selected = answers[q.id];
        const answered = Boolean(selected);
        const isCorrect = selected === q.correctOptionId;

        return (
          <div key={q.id} className="mb-4">
            <p className="text-white font-medium text-sm mb-2">{q.prompt}</p>
            <div className="flex flex-col gap-1.5">
              {q.options.map((opt) => {
                const isSelected = selected === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                    className="text-left px-3.5 py-2.5 rounded-lg text-[13px] text-zinc-200 cursor-pointer"
                    style={{
                      border: isSelected ? '1.5px solid #00E5FF' : '1px solid #333',
                      background: isSelected ? 'rgba(0,229,255,0.08)' : 'transparent',
                    }}
                  >
                    {opt.text}
                  </button>
                );
              })}
            </div>
            {answered && (
              <p
                className="text-[13px] mt-2"
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
