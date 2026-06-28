"use client";

// ============================================================================
// ClearPath Education — Quiz Engine (Layer 2)
// ----------------------------------------------------------------------------
// Renders one unit quiz: one question at a time, immediate feedback with the
// plain-language "why", a running score, and a final pass/fail result.
//
// It does NOT know about Firestore or unlocking. It just reports the result
// upward via onComplete(passed, score, total). The parent (ClearPathEducation
// in the next file) decides what to do with a pass — that separation is what
// lets Layer 3 swap in Firestore without touching this file.
// ============================================================================

import { useState } from "react";
import { getQuiz, type Quiz } from "./quizData";

const BODY = "#E8EDF5";
const SUBTLE = "#9FB3C8";
const GOOD = "#00F5D4";
const BAD = "#FF6B6B";

export function QuizEngine({
  unitId,
  accent = "#22D3EE",
  onComplete,
  onClose,
}: {
  unitId: string;
  accent?: string;                 // school color, for buttons/headers
  onComplete?: (passed: boolean, score: number, total: number) => void;
  onClose?: () => void;
}) {
  const quiz: Quiz | undefined = getQuiz(unitId);

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false); // answer submitted for this question
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  if (!quiz) {
    return (
      <Panel accent={accent}>
        <p style={{ color: SUBTLE }}>
          No quiz is available for this unit yet. Check back once it's added.
        </p>
        {onClose && <CloseButton accent={accent} onClose={onClose} />}
      </Panel>
    );
  }

  const total = quiz.questions.length;
  const question = quiz.questions[current];
  const isCorrect = locked && selected === question.answer;

  const submit = () => {
    if (selected === null || locked) return;
    setLocked(true);
    if (selected === question.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (current + 1 < total) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setLocked(false);
    } else {
      const passed = score >= quiz.passingScore;
      setFinished(true);
      onComplete?.(passed, score, total);
    }
  };

  const restart = () => {
    setCurrent(0);
    setSelected(null);
    setLocked(false);
    setScore(0);
    setFinished(false);
  };

  // --- Results screen -------------------------------------------------------
  if (finished) {
    const passed = score >= quiz.passingScore;
    return (
      <Panel accent={accent}>
        <h3 style={{ margin: 0, color: passed ? GOOD : BAD, fontSize: 20 }}>
          {passed ? "Passed" : "Not yet"}
        </h3>
        <p style={{ color: BODY, marginTop: 8 }}>
          You scored {score} / {total}. {passed
            ? "The next unit is now unlocked."
            : `You need ${quiz.passingScore} to pass. Review the unit and try again — no penalty.`}
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          {!passed && (
            <button onClick={restart} style={primaryBtn(accent)}>
              Try again
            </button>
          )}
          {onClose && (
            <button onClick={onClose} style={ghostBtn}>
              {passed ? "Continue" : "Back to unit"}
            </button>
          )}
        </div>
      </Panel>
    );
  }

  // --- Question screen ------------------------------------------------------
  return (
    <Panel accent={accent}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: SUBTLE }}>
          Question {current + 1} of {total}
        </span>
        <span style={{ fontSize: 12, color: SUBTLE }}>Score: {score}</span>
      </div>

      <p style={{ fontSize: 17, fontWeight: 700, color: BODY, margin: "0 0 16px", lineHeight: 1.4 }}>
        {question.q}
      </p>

      <div role="radiogroup" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {question.options.map((opt, i) => {
          const chosen = selected === i;
          const showCorrect = locked && i === question.answer;
          const showWrong = locked && chosen && i !== question.answer;
          let border = "rgba(255,255,255,0.12)";
          if (showCorrect) border = GOOD;
          else if (showWrong) border = BAD;
          else if (chosen) border = accent;

          return (
            <button
              key={i}
              role="radio"
              aria-checked={chosen}
              disabled={locked}
              onClick={() => setSelected(i)}
              style={{
                textAlign: "left",
                background: chosen ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${border}`,
                borderRadius: 10,
                padding: "12px 14px",
                color: BODY,
                cursor: locked ? "default" : "pointer",
                fontSize: 14,
                lineHeight: 1.4,
              }}
            >
              {opt}
              {showCorrect && <span style={{ color: GOOD, marginLeft: 8 }}>✓</span>}
              {showWrong && <span style={{ color: BAD, marginLeft: 8 }}>✗</span>}
            </button>
          );
        })}
      </div>

      {/* Explanation appears only after submitting */}
      {locked && (
        <div
          style={{
            marginTop: 14,
            padding: "12px 14px",
            borderRadius: 10,
            background: "rgba(255,255,255,0.04)",
            borderLeft: `3px solid ${isCorrect ? GOOD : BAD}`,
            color: SUBTLE,
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: isCorrect ? GOOD : BAD }}>
            {isCorrect ? "Correct. " : "Not quite. "}
          </strong>
          {question.why}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
        {!locked ? (
          <button
            onClick={submit}
            disabled={selected === null}
            style={{ ...primaryBtn(accent), opacity: selected === null ? 0.5 : 1 }}
          >
            Check answer
          </button>
        ) : (
          <button onClick={next} style={primaryBtn(accent)}>
            {current + 1 < total ? "Next question" : "See result"}
          </button>
        )}
        {onClose && (
          <button onClick={onClose} style={ghostBtn}>
            Cancel
          </button>
        )}
      </div>
    </Panel>
  );
}

// --- Small presentational helpers ------------------------------------------
function Panel({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${accent}55`,
        borderRadius: 16,
        padding: 20,
        maxWidth: 640,
      }}
    >
      {children}
    </div>
  );
}

function CloseButton({ accent, onClose }: { accent: string; onClose: () => void }) {
  return (
    <button onClick={onClose} style={{ ...ghostBtn, marginTop: 14 }}>
      Close
    </button>
  );
}

const primaryBtn = (accent: string): React.CSSProperties => ({
  background: accent,
  color: "#06121A",
  border: "none",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
});

const ghostBtn: React.CSSProperties = {
  background: "none",
  color: SUBTLE,
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
};

export default QuizEngine;
