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
//
// ADDED: at the bottom of every book (every school's unit list), a "for a
// deeper dive" prompt links out to the Encyclopedia of Finance and the
// Encyclopedia of Indicators. This is what lets those two links come off the
// home page — a reader who finishes a book naturally gets pointed to them.
// ============================================================================

import { useState, useEffect } from "react";
import { CURRICULUM, getSchool, type School } from "./curriculumData";
import { getLessonBody } from "./lessonContent";
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
  | { kind: "lessons"; schoolId: string; unitId: string }
  | { kind: "lesson"; schoolId: string; unitId: string; lessonId: string };

export function ClearPathEducation({
  onNavigate,
}: {
  // Lets this component send the reader to another tab in the main app
  // (used for the Encyclopedia links at the bottom of each book). Optional
  // so this component still works fine if it's ever rendered standalone.
  onNavigate?: (tabId: string) => void;
}) {
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
          onNavigate={onNavigate}
        />
      )}

      {view.kind === "lessons" && (
        <LessonList
          schoolId={view.schoolId}
          unitId={view.unitId}
          isPassed={progress.isPassed}
          recordQuizPass={progress.recordQuizPass}
          onOpenLesson={(lessonId) =>
            setView({
              kind: "lesson",
              schoolId: view.schoolId,
              unitId: view.unitId,
              lessonId,
            })
          }
        />
      )}

      {view.kind === "lesson" && (
        <LessonReader
          schoolId={view.schoolId}
          unitId={view.unitId}
          lessonId={view.lessonId}
          onBack={() =>
            setView({ kind: "lessons", schoolId: view.schoolId, unitId: view.unitId })
          }
          onOpenLesson={(lessonId) =>
            setView({
              kind: "lesson",
              schoolId: view.schoolId,
              unitId: view.unitId,
              lessonId,
            })
          }
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
  const unit =
    school && "unitId" in view
      ? school.units.find((u) => u.id === view.unitId)
      : null;
  const lesson =
    unit && view.kind === "lesson"
      ? unit.lessons.find((l) => l.id === view.lessonId)
      : null;

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
        {unit && (view.kind === "lessons" || view.kind === "lesson") && (
          <>
            <span aria-hidden>›</span>
            <button
              onClick={() =>
                setView({ kind: "lessons", schoolId: school!.id, unitId: unit.id })
              }
              style={{ ...crumbStyle, color: school!.colors.unit }}
            >
              {unit.title}
            </button>
          </>
        )}
        {lesson && (
          <>
            <span aria-hidden>›</span>
            <span style={{ color: school!.colors.lesson }}>{lesson.title}</span>
          </>
        )}
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
  onNavigate,
}: {
  schoolId: string;
  isUnlocked: (unitId: string) => boolean;
  isPassed: (unitId: string) => boolean;
  onOpenUnit: (unitId: string) => void;
  onNavigate?: (tabId: string) => void;
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

      {/* End-of-book resource prompt — points to the two encyclopedias instead
          of those links needing to live on the home page. */}
      <div
        style={{
          marginTop: 32,
          paddingTop: 24,
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <p style={{ color: SUBTLE, fontSize: 13, marginBottom: 12 }}>
          For a deeper dive into how the financial world works, click one of these links below.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={() => onNavigate?.("Encyclopedia")}
            style={resourceLinkStyle("#00E5FF")}
          >
            Encyclopedia of Finance
          </button>
          {/* Encyclopedia of Indicators link hidden while videos are broken — component kept */}
        </div>
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
  onOpenLesson,
}: {
  schoolId: string;
  unitId: string;
  isPassed: (unitId: string) => boolean;
  recordQuizPass: (unitId: string) => string | null;
  onOpenLesson: (lessonId: string) => void;
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
      <h2 style={{ fontSize: 22, fontWeight: 800, color: school.colors.unit, margin: "4px 0 8px" }}>
        {unit.title}
      </h2>
      <p style={{ color: SUBTLE, fontSize: 13, margin: "0 0 16px" }}>
        Tap a chapter to open and read it. When you finish the unit, take the quiz to unlock the next one.
      </p>

      <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {unit.lessons.map((lesson, i) => (
          <li key={lesson.id}>
            <button
              type="button"
              onClick={() => onOpenLesson(lesson.id)}
              style={{
                width: "100%",
                display: "flex",
                gap: 12,
                alignItems: "center",
                textAlign: "left",
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${school.colors.lesson}33`,
                borderRadius: 10,
                padding: "12px 14px",
                cursor: "pointer",
                color: BODY,
                transition: "border-color 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = school.colors.lesson;
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${school.colors.lesson}33`;
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              }}
            >
              <span style={{ color: SUBTLE, fontVariantNumeric: "tabular-nums", minWidth: 24 }}>
                {i + 1}.
              </span>
              <span style={{ color: school.colors.lesson, lineHeight: 1.5, flex: 1, fontWeight: 600 }}>
                {lesson.title}
              </span>
              <span
                style={{
                  color: school.colors.head,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                Open →
              </span>
            </button>
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
// View 4 — one lesson reader
// ---------------------------------------------------------------------------
function LessonReader({
  schoolId,
  unitId,
  lessonId,
  onBack,
  onOpenLesson,
}: {
  schoolId: string;
  unitId: string;
  lessonId: string;
  onBack: () => void;
  onOpenLesson: (lessonId: string) => void;
}) {
  const school = getSchool(schoolId);
  const unit = school?.units.find((u) => u.id === unitId);
  const lessonIndex = unit?.lessons.findIndex((l) => l.id === lessonId) ?? -1;
  const lesson = lessonIndex >= 0 ? unit!.lessons[lessonIndex] : undefined;

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [lessonId]);

  if (!school || !unit || !lesson) {
    return <Empty>That chapter could not be found.</Empty>;
  }

  const body = getLessonBody(lesson.id, lesson.title, school.name, unit.title);
  const prev = lessonIndex > 0 ? unit.lessons[lessonIndex - 1] : null;
  const next =
    lessonIndex < unit.lessons.length - 1 ? unit.lessons[lessonIndex + 1] : null;

  return (
    <article style={{ maxWidth: 760 }}>
      <button type="button" onClick={onBack} style={{ ...crumbStyle, marginBottom: 16, color: school.colors.head }}>
        ← Back to unit chapters
      </button>

      <p
        style={{
          fontSize: 12,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          color: SUBTLE,
          margin: "0 0 8px",
        }}
      >
        Chapter {lessonIndex + 1} of {unit.lessons.length}
      </p>
      <h2
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: school.colors.lesson,
          margin: "0 0 12px",
          lineHeight: 1.25,
        }}
      >
        {lesson.title}
      </h2>
      <p style={{ color: BODY, fontSize: 16, lineHeight: 1.65, margin: "0 0 24px" }}>
        {body.summary}
      </p>

      {body.sections.map((section) => (
        <section key={section.heading} style={{ marginBottom: 22 }}>
          <h3
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: school.colors.unit,
              margin: "0 0 10px",
            }}
          >
            {section.heading}
          </h3>
          {section.paragraphs.map((p, i) => (
            <p
              key={i}
              style={{
                color: BODY,
                fontSize: 15,
                lineHeight: 1.7,
                margin: "0 0 12px",
              }}
            >
              {p}
            </p>
          ))}
        </section>
      ))}

      <div
        style={{
          marginTop: 8,
          marginBottom: 28,
          padding: 16,
          borderRadius: 12,
          border: `1px solid ${school.colors.head}55`,
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <div
          style={{
            fontSize: 12,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: school.colors.head,
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          Key takeaways
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, color: BODY, lineHeight: 1.7 }}>
          {body.takeaways.map((t) => (
            <li key={t} style={{ marginBottom: 6 }}>
              {t}
            </li>
          ))}
        </ul>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {prev ? (
          <button
            type="button"
            onClick={() => onOpenLesson(prev.id)}
            style={navChapterStyle(school.colors.unit)}
          >
            ← Previous chapter
          </button>
        ) : (
          <span />
        )}
        {next ? (
          <button
            type="button"
            onClick={() => onOpenLesson(next.id)}
            style={navChapterStyle(school.colors.head)}
          >
            Next chapter →
          </button>
        ) : (
          <button type="button" onClick={onBack} style={navChapterStyle(school.colors.head)}>
            Done — back to unit quiz →
          </button>
        )}
      </div>
    </article>
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

function resourceLinkStyle(color: string): React.CSSProperties {
  return {
    background: "rgba(255,255,255,0.03)",
    border: `1px solid ${color}55`,
    color: color,
    borderRadius: 10,
    padding: "10px 16px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  };
}

function navChapterStyle(color: string): React.CSSProperties {
  return {
    background: color,
    color: "#06121A",
    border: "none",
    borderRadius: 10,
    padding: "10px 16px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  };
}

export default ClearPathEducation;
