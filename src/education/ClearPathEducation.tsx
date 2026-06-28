"use client";

// ============================================================================
// ClearPath Education — Section Component (Layer 1)
// ----------------------------------------------------------------------------
// Three views, driven by local state:
//   1. "schools"  — grid of all 9 school cards
//   2. "units"    — the chosen school's units (this is where unit LOCKING lives)
//   3. "lessons"  — the chosen unit's lessons
//
// LAYER 2 (quizzes) plugs in at the two spots marked  // <-- QUIZ HOOK.
// Nothing here touches Firestore or your live data yet — it's self-contained
// and safe to drop in and render.
// ============================================================================

import { useState, useMemo } from "react";
import { CURRICULUM, getSchool, type School } from "./curriculumData";

const PAGE_BG = "#0A0E14";
const BODY = "#E8EDF5";
const SUBTLE = "#9FB3C8";

type View =
  | { kind: "schools" }
  | { kind: "units"; schoolId: string }
  | { kind: "lessons"; schoolId: string; unitId: string };

export function ClearPathEducation({
  // LAYER 2 will pass real unlock state in here. For now it defaults to
  // "only the first unit of each school is unlocked" so you can SEE the
  // locked/unlocked UI working without any backend.
  unlockedUnitIds,
}: {
  unlockedUnitIds?: Set<string>;
}) {
  const [view, setView] = useState<View>({ kind: "schools" });

  // --- Default unlock rule (placeholder until Layer 2 / Firestore) ----------
  // First unit of every school is open; the rest are locked. Layer 2 replaces
  // this with real saved progress.
  const defaultUnlocked = useMemo(() => {
    if (unlockedUnitIds) return unlockedUnitIds;
    const s = new Set<string>();
    CURRICULUM.forEach((school) => {
      if (school.units[0]) s.add(school.units[0].id);
    });
    return s;
  }, [unlockedUnitIds]);

  const isUnlocked = (unitId: string) => defaultUnlocked.has(unitId);

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
          isUnlocked={isUnlocked}
          onOpenUnit={(unitId) =>
            setView({ kind: "lessons", schoolId: view.schoolId, unitId })
          }
        />
      )}

      {view.kind === "lessons" && (
        <LessonList schoolId={view.schoolId} unitId={view.unitId} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header / breadcrumb
// ---------------------------------------------------------------------------
function Header({
  view,
  setView,
}: {
  view: View;
  setView: (v: View) => void;
}) {
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

function SchoolCard({
  school,
  onOpen,
}: {
  school: School;
  onOpen: (id: string) => void;
}) {
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
      <div
        style={{
          fontSize: 19,
          fontWeight: 800,
          color: school.colors.head,
          marginBottom: 6,
        }}
      >
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
// View 2 — one school's units (LOCKING happens here)
// ---------------------------------------------------------------------------
function UnitList({
  schoolId,
  isUnlocked,
  onOpenUnit,
}: {
  schoolId: string;
  isUnlocked: (unitId: string) => boolean;
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
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: unlocked ? school.colors.unit : SUBTLE,
                  }}
                >
                  {unit.title}
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
                {!unlocked && idx > 0 && (
                  // <-- QUIZ HOOK (Layer 2):
                  // This message will become the real rule once quizzes exist:
                  // "Pass the Unit N quiz to unlock."
                  <> · Pass the previous unit's quiz to unlock.</>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// View 3 — one unit's lessons
// ---------------------------------------------------------------------------
function LessonList({ schoolId, unitId }: { schoolId: string; unitId: string }) {
  const school = getSchool(schoolId);
  const unit = school?.units.find((u) => u.id === unitId);
  if (!school || !unit) return <Empty>That unit could not be found.</Empty>;

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

      {/* <-- QUIZ HOOK (Layer 2):
          The "Take the Unit Quiz" button will be rendered here. Passing it
          will unlock the next unit via saved Firestore progress. */}
      <div
        style={{
          marginTop: 20,
          padding: 16,
          border: `1px dashed ${school.colors.head}66`,
          borderRadius: 12,
          color: SUBTLE,
          fontSize: 13,
        }}
      >
        A unit quiz will appear here. Passing it unlocks the next unit.
        <span style={{ color: SUBTLE, opacity: 0.7 }}> (Coming in the next build step.)</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small helpers
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
