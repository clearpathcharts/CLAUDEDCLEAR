"use client";

import React, { useState } from "react";
import { useLiteracyStore } from "./hooks/useLiteracyStore";
import {
  AdaptiveLmsPanel,
  CognitiveCoachPanel,
  ConceptWikiPanel,
  EncyclopediaWorldPanel,
  IdeaPinsPanel,
  ListenLearnPanel,
  MediaPantryPanel,
  MentorTrustPanel,
  MorningBriefPanel,
  PatternLiteracyPanel,
  SourceSentinelPanel,
  ThesisVaultPanel,
  TruthSearchPanel,
} from "./panels";
import type { LiteracyPanelId } from "./types";
import { PANEL_META } from "./ui";

export default function LiteracyOSPage({
  onNavigate,
  onProfileChange,
}: {
  onNavigate?: (tabId: string) => void;
  onProfileChange?: (profileId: string) => void;
}) {
  const api = useLiteracyStore();
  const [panel, setPanel] = useState<LiteracyPanelId>("brief");

  let body: React.ReactNode = null;
  switch (panel) {
    case "brief":
      body = <MorningBriefPanel api={api} onOpen={(id) => setPanel(id as LiteracyPanelId)} />;
      break;
    case "vault":
      body = <ThesisVaultPanel api={api} />;
      break;
    case "wiki":
      body = <ConceptWikiPanel api={api} />;
      break;
    case "sentinel":
      body = <SourceSentinelPanel api={api} />;
      break;
    case "lms":
      body = <AdaptiveLmsPanel api={api} onProfileChange={onProfileChange} />;
      break;
    case "pantry":
      body = <MediaPantryPanel api={api} />;
      break;
    case "listen":
      body = <ListenLearnPanel api={api} />;
      break;
    case "truth":
      body = <TruthSearchPanel api={api} />;
      break;
    case "trust":
      body = <MentorTrustPanel api={api} />;
      break;
    case "coach":
      body = <CognitiveCoachPanel api={api} />;
      break;
    case "pins":
      body = <IdeaPinsPanel api={api} />;
      break;
    case "patterns":
      body = <PatternLiteracyPanel api={api} />;
      break;
    case "encyclopedia":
      body = <EncyclopediaWorldPanel onNavigate={onNavigate} />;
      break;
    default:
      body = null;
  }

  const passed = api.store.progress.passedLessonIds.length;
  const vaultCount = api.store.vault.length;
  const diffs = Object.values(api.store.sentinel).filter((s) => s.changed).length;

  return (
    <div
      className="min-h-screen w-full px-3 md:px-6 py-4 md:py-6 pb-24"
      style={{
        background:
          "radial-gradient(1200px 600px at 10% -10%, rgba(0,229,255,0.12), transparent 55%), radial-gradient(900px 500px at 90% 0%, rgba(255,106,0,0.10), transparent 50%), #05070b",
        color: "#E8EDF5",
      }}
    >
      <header className="mb-5 md:mb-7 max-w-6xl">
        <p
          className="text-[10px] uppercase tracking-[0.35em] text-[#00E5FF]/80 mb-2"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          ClearPath Literacy OS
        </p>
        <h1
          className="text-2xl md:text-4xl font-black text-white leading-tight"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          Market science for learners
        </h1>
        <p className="mt-2 text-sm md:text-base text-white/55 max-w-2xl">
          Archive evidence, watch primary pages, build a concept wiki, and study with a neuro-adaptive desk.
          No securities brokerage. No financial advice.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-wider">
          <StatPill label="Vault" value={String(vaultCount)} />
          <StatPill label="Lessons" value={String(passed)} />
          <StatPill label="Sentinel diffs" value={String(diffs)} />
          <StatPill label="Wiki nodes" value={String(api.store.wiki.length)} />
        </div>
      </header>

      <div
        className="flex flex-wrap content-start gap-2 pb-3 mb-4 max-w-6xl"
        role="tablist"
        aria-label="Literacy OS rooms"
      >
        {PANEL_META.map((p) => {
          const active = panel === p.id;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setPanel(p.id)}
              className={`rounded-full border px-3.5 py-2.5 text-xs sm:text-sm font-black tracking-wide uppercase transition leading-tight ${
                active
                  ? "bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF] shadow-[0_0_18px_rgba(0,229,255,.35)]"
                  : "border-white/15 text-white/70 hover:border-[#00E5FF]/40 hover:text-[#00E5FF]"
              }`}
              style={{ fontFamily: "'Cinzel', serif" }}
              title={p.blurb}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="max-w-6xl animate-[fadeIn_0.35s_ease]">{body}</div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-white/60">
      <span className="text-[#00E5FF] font-black mr-1">{value}</span>
      {label}
    </span>
  );
}

export { LiteracyOSPage };
