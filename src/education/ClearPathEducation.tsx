"use client";

// ============================================================================
// ClearPath Education — Section Component (Layer 2 — FINAL WIRING)
// ----------------------------------------------------------------------------
// This version connects everything:
//   • useEducationProgress  -> tracks unlocked units, saves progress
//   • QuizEngine            -> the unit quiz UI
//   • quizData              -> the questions
//
// Flow: open a school -> locked/unlocked units -> open an unlocked unit ->
// read lessons -> take the unit quiz -> pass it -> the next unit unlocks.
//
// Still no Firestore here. Progress persists via the hook (localStorage for
// now). Layer 3 swaps storage inside the hook only — this file won't change.
// ============================================================================

import { useState } from "react";
import { CURRICULUM, getSchool, type School } from "./curriculumData";
import { hasQuiz } from "./quizData";
import { QuizEngine } from "./QuizEngine";
import { useEducationProgress } from "./useEducationProgress";

const PAGE_BG = "#0A0E14";
const BODY = "#E8EDF5";
const SUBTLE = "#9FB3C8";
const GOOD = "#00F5D4";

type View =
  | { kind: "schools" }
  | { kind: "units"; schoolId: string }
  | { kind: "lessons"; schoolId: string; unitId: string };

export function ClearPathEducation() {
  const [view, setView] = useState<View>({ kind: "schools" });
  const progress = useEducationProgress();

  return (
    <div
      style={{
        background: PAGE_BG,
        color: BODY,
        minHeight: "100%",
        padding: "24px 16px 64px",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      }}
    >
      <Header view={view} setView={setView} />

      {view.kind === "schools" && (
        <SchoolGrid onOpen={(schoolId) => setView({ kind: "units", schoolId })} />
      )}

      {view.kind === "units" && (
        <UnitList
          schoolId={view.schoolId}
          isUnlocked={progress.isUnlocked}
          isPassed={progress.isPassed}
          onOpenUnit={(unitId) =>
            setView({ kind: "lessons", schoolId: view.schoolId, unitId })
          }
        />
      )}

      {view.kind === "lessons" && (
        <LessonList
          schoolId={view.schoolId}
          unitId={view.unitId}
          isPassed={progress.isPassed}
          recordQuizPass={progress.recordQuizPass}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header / breadcrumb
// ---------------------------------------------------------------------------
function Header({ view, setView }: { view: View; setView: (v: View) => void }) {
  const school = "schoolId" in view ? getSchool(view.schoolId) : null;

  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          fontSize: 12,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: SUBTLE,
          marginBottom: 8,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <button onClick={() => setView({ kind: "schools" })} style={crumbStyle}>
          ClearPath Education
        </button>
        {school && (
          <>
            <span aria-hidden>›</span>
            <button
              onClick={() => setView({ kind: "units", schoolId: school.id })}
              style={{ ...crumbStyle, color: school.colors.head }}
            >
              {school.name}
            </button>
          </>
        )}
        {view.kind === "lessons" && <span aria-hidden>› Unit</span>}
      </div>

      {view.kind === "schools" && (
        <>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0, color: "#22D3EE" }}>
            ClearPath Education
          </h1>
          <p style={{ color: SUBTLE, marginTop: 6, maxWidth: 640 }}>
            A free, plain-language school for every market — written by humans,
            built to be read calmly. Pick a school to begin.
          </p>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// View 1 — all schools
// ---------------------------------------------------------------------------
function SchoolGrid({ onOpen }: { onOpen: (schoolId: string) => void }) {
  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
      }}
    >
      {CURRICULUM.map((school) => (
        <SchoolCard key={school.id} school={school} onOpen={onOpen} />
      ))}
    </div>
  );
}

function SchoolCard({ school, onOpen }: { school: School; onOpen: (id: string) => void }) {
  const lessonCount = school.units.reduce((n, u) => n + u.lessons.length, 0);
  return (
    <button
      onClick={() => onOpen(school.id)}
      style={{
        textAlign: "left",
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${school.colors.head}55`,
        borderRadius: 16,
        padding: 18,
        cursor: "pointer",
        color: BODY,
        transition: "border-color 0.2s, transform 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = school.colors.head;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `${school.colors.head}55`;
      }}
    >
      <div style={{ fontSize: 19, fontWeight: 800, color: school.colors.head, marginBottom: 6 }}>
        {school.name}
      </div>
      <div style={{ fontSize: 13, color: SUBTLE, lineHeight: 1.5, minHeight: 56 }}>
        {school.tagline}
      </div>
      <div
        style={{
          marginTop: 14,
          fontSize: 11,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: school.colors.unit,
        }}
      >
        {school.units.length} units · {lessonCount} lessons
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// View 2 — one school's units (LOCKING)
// ---------------------------------------------------------------------------
function UnitList({
  schoolId,
  isUnlocked,
  isPassed,
  onOpenUnit,
}: {
  schoolId: string;
  isUnlocked: (unitId: string) => boolean;
  isPassed: (unitId: string) => boolean;
  onOpenUnit: (unitId: string) => void;
}) {
  const school = getSchool(schoolId);
  if (!school) return <Empty>That school could not be found.</Empty>;

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: school.colors.head, margin: "4px 0 16px" }}>
        {school.name}
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {school.units.map((unit, idx) => {
          const unlocked = isUnlocked(unit.id);
          const passed = isPassed(unit.id);
          return (
            <div
              key={unit.id}
              style={{
                border: `1px solid ${unlocked ? school.colors.unit + "55" : "#2A2F3A"}`,
                background: unlocked ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.015)",
                borderRadius: 14,
                padding: 16,
                opacity: unlocked ? 1 : 0.6,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: unlocked ? school.colors.unit : SUBTLE }}>
                  {unit.title}
                  {passed && <span style={{ color: GOOD, marginLeft: 10, fontSize: 13 }}>✓ Passed</span>}
                </div>

                {unlocked ? (
                  <button
                    onClick={() => onOpenUnit(unit.id)}
                    style={{
                      whiteSpace: "nowrap",
                      background: school.colors.head,
                      color: "#06121A",
                      border: "none",
                      borderRadius: 10,
                      padding: "8px 14px",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Open unit
                  </button>
                ) : (
                  <span
                    aria-label="Locked"
                    style={{
                      whiteSpace: "nowrap",
                      fontSize: 12,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      color: SUBTLE,
                      border: "1px solid #2A2F3A",
                      borderRadius: 10,
                      padding: "8px 12px",
                    }}
                  >
                    🔒 Locked
                  </span>
                )}
              </div>

              <div style={{ fontSize: 12, color: SUBTLE, marginTop: 8 }}>
                {unit.lessons.length} lessons
                {!unlocked && idx > 0 && <> · Pass the previous unit's quiz to unlock.</>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// View 3 — one unit's lessons + the quiz
// ---------------------------------------------------------------------------
function LessonList({
  schoolId,
  unitId,
  isPassed,
  recordQuizPass,
}: {
  schoolId: string;
  unitId: string;
  isPassed: (unitId: string) => boolean;
  recordQuizPass: (unitId: string) => string | null;
}) {
  const school = getSchool(schoolId);
  const unit = school?.units.find((u) => u.id === unitId);
  const [quizOpen, setQuizOpen] = useState(false);
  const [justPassed, setJustPassed] = useState(false);

  if (!school || !unit) return <Empty>That unit could not be found.</Empty>;

  const alreadyPassed = isPassed(unit.id);
  const quizExists = hasQuiz(unit.id);

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: school.colors.unit, margin: "4px 0 16px" }}>
        {unit.title}
      </h2>

      <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {unit.lessons.map((lesson, i) => (
          <li
            key={lesson.id}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "baseline",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            <span style={{ color: SUBTLE, fontVariantNumeric: "tabular-nums", minWidth: 24 }}>
              {i + 1}.
            </span>
            <span style={{ color: school.colors.lesson, lineHeight: 1.5 }}>{lesson.title}</span>
          </li>
        ))}
      </ol>

      {/* --- The quiz section --- */}
      <div style={{ marginTop: 24 }}>
        {!quizOpen && (
          <div
            style={{
              padding: 16,
              border: `1px solid ${school.colors.head}66`,
              borderRadius: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ color: SUBTLE, fontSize: 13 }}>
              {alreadyPassed
                ? "You've passed this unit's quiz. The next unit is unlocked."
                : quizExists
                ? "Take the unit quiz. Passing it unlocks the next unit."
                : "A quiz for this unit is coming soon."}
            </div>
            {quizExists && (
              <button
                onClick={() => {
                  setQuizOpen(true);
                  setJustPassed(false);
                }}
                style={{
                  whiteSpace: "nowrap",
                  background: school.colors.head,
                  color: "#06121A",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 16px",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                {alreadyPassed ? "Retake quiz" : "Take the unit quiz"}
              </button>
            )}
          </div>
        )}

        {quizOpen && (
          <QuizEngine
            unitId={unit.id}
            accent={school.colors.head}
            onComplete={(passed) => {
              if (passed) {
                recordQuizPass(unit.id);
                setJustPassed(true);
              }
            }}
            onClose={() => setQuizOpen(false)}
          />
        )}

        {justPassed && !quizOpen && (
          <div style={{ marginTop: 12, color: GOOD, fontSize: 14 }}>
            ✓ Unit passed — the next unit is now unlocked.
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ color: SUBTLE, padding: 24 }}>{children}</div>;
}

const crumbStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: SUBTLE,
  cursor: "pointer",
  padding: 0,
  font: "inherit",
  letterSpacing: 2,
  textTransform: "uppercase",
};

export default ClearPathEducation;
