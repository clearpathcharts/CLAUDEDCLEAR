import React from "react";
import type { LiteracyPanelId } from "./types";

export const PANEL_META: Array<{ id: LiteracyPanelId; label: string; blurb: string }> = [
  { id: "brief", label: "Morning Brief", blurb: "One composition from your study world" },
  { id: "vault", label: "Thesis Vault", blurb: "Private research archive" },
  { id: "wiki", label: "Concept Wiki", blurb: "Interlinked literacy graph" },
  { id: "sentinel", label: "Source Sentinel", blurb: "Watch public pages for real diffs" },
  { id: "lms", label: "Neuro LMS", blurb: "Adaptive lessons + neuro profiles" },
  { id: "pantry", label: "Media Pantry", blurb: "Owned RSS / education feeds" },
  { id: "listen", label: "Listen → Learn", blurb: "Audio to glossary concepts" },
  { id: "truth", label: "Truth Search", blurb: "Search vault + verified data" },
  { id: "trust", label: "Mentor Trust", blurb: "Score tutor answers with receipts" },
  { id: "coach", label: "Study Coach", blurb: "Stim load & focus sessions" },
  { id: "pins", label: "Idea Pins", blurb: "Notes that decay until re-verified" },
  { id: "patterns", label: "Pattern Studio", blurb: "Chart structures as lessons" },
  { id: "encyclopedia", label: "Encyclopedia", blurb: "Cinematic conceptual world" },
];

export function PanelShell({
  title,
  subtitle,
  children,
  accent = "#00E5FF",
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <section
      className="rounded-2xl border border-white/10 bg-black/40 p-4 md:p-6"
      style={{ boxShadow: `inset 0 0 0 1px ${accent}22` }}
    >
      <header className="mb-4">
        <h2
          className="text-lg md:text-xl font-black tracking-wide"
          style={{ fontFamily: "'Cinzel', serif", color: accent }}
        >
          {title}
        </h2>
        <p className="text-xs md:text-sm text-white/55 mt-1 max-w-3xl">{subtitle}</p>
      </header>
      {children}
    </section>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] uppercase tracking-[0.18em] text-white/45 mb-1 font-bold">
      {children}
    </label>
  );
}

export function TextButton({
  children,
  onClick,
  disabled,
  tone = "cyan",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "cyan" | "gold" | "pink" | "muted";
}) {
  const colors =
    tone === "gold"
      ? "border-[#FFD700]/40 text-[#FFD700] hover:bg-[#FFD700]/10"
      : tone === "pink"
        ? "border-[#FF1493]/40 text-[#FF1493] hover:bg-[#FF1493]/10"
        : tone === "muted"
          ? "border-white/20 text-white/70 hover:bg-white/5"
          : "border-[#00E5FF]/40 text-[#00E5FF] hover:bg-[#00E5FF]/10";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`px-3 py-2 rounded-full border text-[10px] md:text-xs font-black tracking-wider uppercase transition disabled:opacity-40 ${colors}`}
      style={{ fontFamily: "'Cinzel', serif" }}
    >
      {children}
    </button>
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl bg-black/50 border border-white/15 px-3 py-2 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-[#00E5FF]/50 ${props.className || ""}`}
    />
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl bg-black/50 border border-white/15 px-3 py-2 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-[#00E5FF]/50 ${props.className || ""}`}
    />
  );
}
