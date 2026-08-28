import React from "react";
import {
  EDUCATION_LIBRARY_DESKS,
  EDUCATION_TAB_ID,
  isEducationFamilyTab,
} from "./educationDesks";

export function EducationDeskBar({
  activeTab,
  onNavigate,
}: {
  activeTab: string;
  onNavigate: (tabId: string) => void;
}) {
  if (!isEducationFamilyTab(activeTab)) return null;

  return (
    <nav
      aria-label="ClearPath Education desks"
      className="mb-6 flex flex-col gap-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onNavigate(EDUCATION_TAB_ID)}
          className={`rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
            activeTab === EDUCATION_TAB_ID
              ? "border-[#B026FF] bg-[#B026FF]/20 text-white"
              : "border-[#B026FF]/35 bg-black/40 text-[#B026FF] hover:bg-[#B026FF]/10"
          }`}
        >
          Schools
        </button>
        {EDUCATION_LIBRARY_DESKS.map((desk) => {
          const active = activeTab === desk.tabId;
          return (
            <button
              key={desk.tabId}
              type="button"
              onClick={() => onNavigate(desk.tabId)}
              className="rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors"
              style={{
                borderColor: active ? desk.accent : `${desk.accent}55`,
                background: active ? `${desk.accent}22` : "rgba(0,0,0,0.4)",
                color: active ? "#fff" : desk.accent,
              }}
            >
              {desk.label}
            </button>
          );
        })}
      </div>
      {activeTab !== EDUCATION_TAB_ID && (
        <p className="text-[11px] text-zinc-500">
          These libraries sit inside ClearPath Education. Direct URLs still work for search engines.
        </p>
      )}
    </nav>
  );
}
