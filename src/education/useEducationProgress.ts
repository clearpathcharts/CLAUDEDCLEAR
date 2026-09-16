"use client";

// ============================================================================
// ClearPath Education — Progress Hook (Layer 2, Firestore-ready)
// ----------------------------------------------------------------------------
// Tracks which units are UNLOCKED and which quizzes are PASSED.
//
// Unlock rule: the first unit of every school is always open. Passing a unit's
// quiz unlocks the NEXT unit in that same school.
//
// STORAGE: right now this persists to localStorage so progress survives a
// refresh on the same device — no backend needed to test the full flow.
//
// LAYER 3 (Firestore): replace ONLY the two functions marked
//   // <-- FIRESTORE SWAP
// with reads/writes against the signed-in user's document. The hook's public
// shape (unlockedUnitIds, isUnlocked, recordQuizPass) stays identical, so the
// component and quiz engine never change.
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { CURRICULUM } from "./curriculumData";

const STORAGE_KEY = "clearpath_education_progress_v1";

type ProgressState = {
  passedUnitIds: string[]; // units whose quiz the user has passed
};

// --- The set of units that should be open, given what's been passed ---------
// First unit of each school is always unlocked. Each passed unit unlocks the
// next unit in the same school.
function computeUnlocked(passed: Set<string>): Set<string> {
  const unlocked = new Set<string>();
  CURRICULUM.forEach((school) => {
    school.units.forEach((unit, idx) => {
      if (idx === 0) {
        unlocked.add(unit.id); // first unit always open
        return;
      }
      const prev = school.units[idx - 1];
      if (passed.has(prev.id)) unlocked.add(unit.id);
    });
  });
  return unlocked;
}

// --- The id of the unit unlocked by passing a given unit (or null) ----------
function nextUnitId(passedUnitId: string): string | null {
  for (const school of CURRICULUM) {
    const i = school.units.findIndex((u) => u.id === passedUnitId);
    if (i !== -1) {
      const next = school.units[i + 1];
      return next ? next.id : null;
    }
  }
  return null;
}

// ===========================================================================
// STORAGE ADAPTER  — swap these two for Firestore in Layer 3
// ===========================================================================
function loadProgress(): ProgressState {
  // <-- FIRESTORE SWAP: read the user's progress doc instead of localStorage.
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ProgressState;
      if (Array.isArray(parsed.passedUnitIds)) return parsed;
    }
  } catch (e) {
    console.warn("[education] could not read progress", e);
  }
  return { passedUnitIds: [] };
}

function saveProgress(state: ProgressState): void {
  // <-- FIRESTORE SWAP: write the user's progress doc instead of localStorage.
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("[education] could not save progress", e);
  }
}
// ===========================================================================

export function useEducationProgress() {
  const [passed, setPassed] = useState<Set<string>>(new Set());

  // Load once on mount.
  useEffect(() => {
    const initial = loadProgress();
    setPassed(new Set(initial.passedUnitIds));
  }, []);

  const unlockedUnitIds = useMemo(() => computeUnlocked(passed), [passed]);

  const isUnlocked = useCallback(
    (unitId: string) => unlockedUnitIds.has(unitId),
    [unlockedUnitIds]
  );

  const isPassed = useCallback((unitId: string) => passed.has(unitId), [passed]);

  // Call this when a quiz is passed. Records the pass, unlocks the next unit,
  // persists, and returns the id of the newly-unlocked unit (or null).
  const recordQuizPass = useCallback(
    (unitId: string): string | null => {
      let unlockedNext: string | null = null;
      setPassed((prev) => {
        if (prev.has(unitId)) return prev; // already recorded
        const updated = new Set(prev);
        updated.add(unitId);
        saveProgress({ passedUnitIds: Array.from(updated) });
        unlockedNext = nextUnitId(unitId);
        return updated;
      });
      return unlockedNext;
    },
    []
  );

  // Optional: wipe all progress (useful for a "reset" button while testing).
  const resetProgress = useCallback(() => {
    setPassed(new Set());
    saveProgress({ passedUnitIds: [] });
  }, []);

  return {
    unlockedUnitIds, // Set<string> — pass straight into <ClearPathEducation />
    isUnlocked,      // (unitId) => boolean
    isPassed,        // (unitId) => boolean
    recordQuizPass,  // (unitId) => nextUnlockedId | null
    resetProgress,   // () => void
  };
}
