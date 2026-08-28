import React, { useMemo, useState } from "react";
import {
  Award,
  Calculator,
  ExternalLink,
  FlaskConical,
  Library,
  LineChart,
  Newspaper,
  PiggyBank,
  Server,
  Wallet,
} from "lucide-react";
import {
  APPEALING_CERTIFICATES,
  AWESOME_CERTIFICATES_REPO,
} from "../content/appealingCertificates";
import {
  APPEALING_SELFHOSTED,
  AWESOME_SELFHOSTED_MONEY_SECTION,
  AWESOME_SELFHOSTED_REPO,
} from "../content/appealingSelfhosted";
import {
  APPEALING_ACADEMIC_RESEARCH,
  EBSCO_ACADEMIC_LIBRARIES,
  EBSCO_FREE_DATABASES,
} from "../content/appealingAcademicResearch";
import { PanelShell, TextButton, TextInput } from "./ui";
import type { LiteracyPanelId } from "./types";

const BUDGET_KEY = "clearpath_literacy_budget";
const CASH_KEY = "clearpath_literacy_cashflow";
const NW_KEY = "clearpath_literacy_networth";

type HubTool = "hub" | "budget" | "cashflow" | "networth" | "scenario";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function AppealingAdditionsPanel({
  onOpenRoom,
  onNavigate,
}: {
  onOpenRoom: (id: LiteracyPanelId) => void;
  onNavigate?: (tabId: string) => void;
}) {
  const [tool, setTool] = useState<HubTool>("hub");

  return (
    <PanelShell
      title="Appealing Additions"
      subtitle="Literacy sandboxes, free certificates, self-hosted study tools, and academic research entry points. You run the numbers. Educational only — not financial advice."
      accent="#FFD700"
    >
      {tool !== "hub" && (
        <div className="mb-4">
          <TextButton tone="muted" onClick={() => setTool("hub")}>
            ← Back to additions
          </TextButton>
        </div>
      )}
      {tool === "hub" && <Hub onOpenTool={setTool} onOpenRoom={onOpenRoom} onNavigate={onNavigate} />}
      {tool === "budget" && <BudgetSandbox />}
      {tool === "cashflow" && <CashFlowJournal />}
      {tool === "networth" && <NetWorthNotebook />}
      {tool === "scenario" && <ScenarioLab />}
    </PanelShell>
  );
}

function Hub({
  onOpenTool,
  onOpenRoom,
  onNavigate,
}: {
  onOpenTool: (t: HubTool) => void;
  onOpenRoom: (id: LiteracyPanelId) => void;
  onNavigate?: (tabId: string) => void;
}) {
  const tiles = [
    {
      title: "Budget sandbox",
      blurb: "Envelope-style categories using numbers you enter — pure math, your rules.",
      icon: Wallet,
      color: "#00E5FF",
      onClick: () => onOpenTool("budget"),
    },
    {
      title: "Cash-flow journal",
      blurb: "Log income and spending you already know. Visualize patterns, no tips.",
      icon: LineChart,
      color: "#FF7B00",
      onClick: () => onOpenTool("cashflow"),
    },
    {
      title: "Net-worth notebook",
      blurb: "Private assets / liabilities ledger you maintain. Track, don’t get told what to buy.",
      icon: PiggyBank,
      color: "#FFD700",
      onClick: () => onOpenTool("networth"),
    },
    {
      title: "Scenario lab",
      blurb: "What-if sliders for compound growth and inflation — illustrative models only.",
      icon: Calculator,
      color: "#B026FF",
      onClick: () => onOpenTool("scenario"),
    },
    {
      title: "Learning feeds",
      blurb: "Study RSS and explainers in Media Pantry — information diet, not trade signals.",
      icon: Newspaper,
      color: "#FF1493",
      onClick: () => onOpenRoom("pantry"),
    },
    {
      title: "Concept flask",
      blurb: "Short labs that unpack market vocabulary without recommending products.",
      icon: FlaskConical,
      color: "#00E5FF",
      onClick: () => onOpenRoom("encyclopedia"),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tiles.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              type="button"
              onClick={item.onClick}
              className="text-left rounded-xl border border-white/10 bg-black/35 p-4 hover:border-[#FFD700]/40 transition"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: `${item.color}1a` }}
              >
                <Icon size={18} style={{ color: item.color }} aria-hidden />
              </div>
              <div className="text-sm font-bold text-white">{item.title}</div>
              <p className="text-[11px] text-white/55 mt-1 leading-relaxed">{item.blurb}</p>
              <p className="mt-2 text-[10px] font-mono uppercase tracking-widest text-white/35">
                Educational · not advice
              </p>
            </button>
          );
        })}
      </div>

      <CertificateDesk />
      <SelfhostedDesk />
      <AcademicDesk />

      {onNavigate && (
        <p className="text-[11px] text-white/40">
          Structured courses live in{" "}
          <button type="button" className="text-[#B026FF] hover:underline" onClick={() => onNavigate("ClearPathEducation")}>
            ClearPath Education
          </button>
          .
        </p>
      )}
    </div>
  );
}

function BudgetSandbox() {
  const [rows, setRows] = useState<{ id: string; name: string; amount: string }[]>(() =>
    readJson(BUDGET_KEY, [
      { id: "1", name: "Housing", amount: "" },
      { id: "2", name: "Food", amount: "" },
      { id: "3", name: "Transport", amount: "" },
    ])
  );
  const total = rows.reduce((n, r) => n + (Number(r.amount) || 0), 0);

  const save = (next: typeof rows) => {
    setRows(next);
    writeJson(BUDGET_KEY, next);
  };

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-white">Budget sandbox</h3>
      <p className="text-xs text-white/50">Add categories and amounts you already know. Totals are arithmetic only.</p>
      {rows.map((row) => (
        <div key={row.id} className="flex gap-2">
          <TextInput
            value={row.name}
            onChange={(e) => save(rows.map((r) => (r.id === row.id ? { ...r, name: e.target.value } : r)))}
          />
          <TextInput
            value={row.amount}
            inputMode="decimal"
            onChange={(e) => save(rows.map((r) => (r.id === row.id ? { ...r, amount: e.target.value } : r)))}
          />
        </div>
      ))}
      <TextButton
        onClick={() => save([...rows, { id: String(Date.now()), name: "", amount: "" }])}
      >
        Add category
      </TextButton>
      <p className="text-sm text-[#FFD700] font-mono">Sum: {total.toLocaleString()}</p>
    </div>
  );
}

function CashFlowJournal() {
  const [rows, setRows] = useState<{ id: string; label: string; amount: string }[]>(() =>
    readJson(CASH_KEY, [])
  );
  const net = rows.reduce((n, r) => n + (Number(r.amount) || 0), 0);
  const save = (next: typeof rows) => {
    setRows(next);
    writeJson(CASH_KEY, next);
  };
  return (
    <div className="space-y-3">
      <h3 className="font-bold text-white">Cash-flow journal</h3>
      <p className="text-xs text-white/50">
        Positive numbers for money in, negative for money out. This is a notebook, not a recommendation.
      </p>
      {rows.map((row) => (
        <div key={row.id} className="flex gap-2">
          <TextInput
            value={row.label}
            onChange={(e) => save(rows.map((r) => (r.id === row.id ? { ...r, label: e.target.value } : r)))}
          />
          <TextInput
            value={row.amount}
            inputMode="decimal"
            onChange={(e) => save(rows.map((r) => (r.id === row.id ? { ...r, amount: e.target.value } : r)))}
          />
        </div>
      ))}
      <TextButton onClick={() => save([...rows, { id: String(Date.now()), label: "", amount: "" }])}>
        Add line
      </TextButton>
      <p className="text-sm text-[#FFD700] font-mono">Net of listed lines: {net.toLocaleString()}</p>
    </div>
  );
}

function NetWorthNotebook() {
  const [assets, setAssets] = useState<{ id: string; name: string; amount: string }[]>(() =>
    readJson(`${NW_KEY}_a`, [])
  );
  const [liabs, setLiabs] = useState<{ id: string; name: string; amount: string }[]>(() =>
    readJson(`${NW_KEY}_l`, [])
  );
  const a = assets.reduce((n, r) => n + (Number(r.amount) || 0), 0);
  const l = liabs.reduce((n, r) => n + (Number(r.amount) || 0), 0);
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-white">Net-worth notebook</h3>
      <p className="text-xs text-white/50">Private ledger. Assets minus liabilities is a snapshot of what you entered.</p>
      <div className="grid md:grid-cols-2 gap-4">
        <Ledger title="Assets" rows={assets} onChange={(next) => { setAssets(next); writeJson(`${NW_KEY}_a`, next); }} />
        <Ledger title="Liabilities" rows={liabs} onChange={(next) => { setLiabs(next); writeJson(`${NW_KEY}_l`, next); }} />
      </div>
      <p className="text-sm text-[#FFD700] font-mono">Entered assets − liabilities: {(a - l).toLocaleString()}</p>
    </div>
  );
}

function Ledger({
  title,
  rows,
  onChange,
}: {
  title: string;
  rows: { id: string; name: string; amount: string }[];
  onChange: (rows: { id: string; name: string; amount: string }[]) => void;
}) {
  return (
    <div>
      <h4 className="text-xs uppercase tracking-widest text-white/50 mb-2">{title}</h4>
      {rows.map((row) => (
        <div key={row.id} className="flex gap-2 mb-2">
          <TextInput value={row.name} onChange={(e) => onChange(rows.map((r) => (r.id === row.id ? { ...r, name: e.target.value } : r)))} />
          <TextInput value={row.amount} inputMode="decimal" onChange={(e) => onChange(rows.map((r) => (r.id === row.id ? { ...r, amount: e.target.value } : r)))} />
        </div>
      ))}
      <TextButton onClick={() => onChange([...rows, { id: String(Date.now()), name: "", amount: "" }])}>
        Add
      </TextButton>
    </div>
  );
}

function ScenarioLab() {
  const [principal, setPrincipal] = useState("10000");
  const [rate, setRate] = useState("5");
  const [years, setYears] = useState("10");
  const [inflation, setInflation] = useState("2");
  const result = useMemo(() => {
    const p = Number(principal);
    const r = Number(rate) / 100;
    const y = Number(years);
    const i = Number(inflation) / 100;
    if (![p, r, y, i].every((n) => Number.isFinite(n)) || y < 0 || y > 80) return null;
    const nominal = p * Math.pow(1 + r, y);
    const real = p * Math.pow(1 + r, y) / Math.pow(1 + i, y);
    return { nominal, real };
  }, [principal, rate, years, inflation]);

  return (
    <div className="space-y-3 max-w-md">
      <h3 className="font-bold text-white">Scenario lab</h3>
      <p className="text-xs text-white/50">
        Illustrative compound math only. Not a forecast, not a product, not advice.
      </p>
      <Field caption="Starting amount" value={principal} onChange={setPrincipal} />
      <Field caption="Annual rate (%)" value={rate} onChange={setRate} />
      <Field caption="Years" value={years} onChange={setYears} />
      <Field caption="Inflation (%)" value={inflation} onChange={setInflation} />
      {result ? (
        <div className="text-sm font-mono text-[#FFD700] space-y-1">
          <p>Nominal ending amount: {result.nominal.toFixed(2)}</p>
          <p>Inflation-adjusted illustration: {result.real.toFixed(2)}</p>
        </div>
      ) : (
        <p className="text-xs text-white/40">Enter finite numbers to see the illustration.</p>
      )}
    </div>
  );
}

function Field({ caption, value, onChange }: { caption: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">{caption}</p>
      <TextInput value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function CertificateDesk() {
  return (
    <div id="certificate-desk" className="rounded-xl border border-white/10 bg-black/30 p-4 scroll-mt-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#FFD700] font-black mb-2 flex items-center gap-1.5">
        <Award size={12} aria-hidden /> Certificate desk
      </p>
      <h3 className="text-base font-black text-white uppercase">Free literacy certificates</h3>
      <p className="mt-2 text-[12px] text-white/55 max-w-2xl">
        External beginner courses with free badges or certificates. ClearPath does not issue these credentials.
      </p>
      <a
        href={AWESOME_CERTIFICATES_REPO}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 mt-3 text-[10px] font-mono uppercase tracking-widest text-[#00E5FF]"
      >
        Full Awesome Certificates list <ExternalLink size={12} />
      </a>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 list-none p-0 m-0 mt-4">
        {APPEALING_CERTIFICATES.map((cert) => (
          <li key={`${cert.provider}-${cert.title}`}>
            <a
              href={cert.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full rounded-xl border border-white/10 bg-black/40 hover:border-[#FFD700]/45 p-4"
            >
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#FFD700]/90">{cert.category}</span>
              <div className="text-sm font-bold text-white mt-1">{cert.title}</div>
              <div className="text-[11px] text-zinc-400 mt-1">{cert.provider}</div>
              <div className="mt-3 flex flex-wrap gap-2 text-[9px] font-mono uppercase text-zinc-400">
                <span className="px-2 py-0.5 rounded-full border border-white/10">{cert.level}</span>
                <span className="px-2 py-0.5 rounded-full border border-white/10">{cert.hours}h</span>
                <span className="px-2 py-0.5 rounded-full border border-white/10">
                  {cert.reward === "badge" ? "Digital badge" : "Certificate"}
                </span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SelfhostedDesk() {
  return (
    <div id="selfhosted-toolkit" className="rounded-xl border border-white/10 bg-black/30 p-4 scroll-mt-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#00E5FF] font-black mb-2 flex items-center gap-1.5">
        <Server size={12} aria-hidden /> Self-hosted toolkit
      </p>
      <h3 className="text-base font-black text-white uppercase">Run-your-own literacy stack</h3>
      <p className="mt-2 text-[12px] text-white/55 max-w-2xl">
        Open-source apps you can host yourself. ClearPath does not operate these services.
      </p>
      <div className="flex flex-wrap gap-2 mt-3">
        <a href={AWESOME_SELFHOSTED_MONEY_SECTION} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono uppercase text-[#FF7B00]">
          Money section <ExternalLink size={11} className="inline" />
        </a>
        <a href={AWESOME_SELFHOSTED_REPO} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono uppercase text-[#00E5FF]">
          Awesome Selfhosted <ExternalLink size={11} className="inline" />
        </a>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 list-none p-0 m-0 mt-4">
        {APPEALING_SELFHOSTED.map((tool) => (
          <li key={tool.title} className="rounded-xl border border-white/10 bg-black/40 p-4">
            <a href={tool.href} target="_blank" rel="noopener noreferrer">
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#00E5FF]/90">{tool.category}</span>
              <div className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
                {tool.title}
                <ExternalLink size={12} className="text-zinc-500" />
              </div>
              <p className="text-[11px] text-zinc-300 mt-1.5">{tool.blurb}</p>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AcademicDesk() {
  return (
    <div id="academic-research-desk" className="rounded-xl border border-white/10 bg-black/30 p-4 scroll-mt-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#B9A6FF] font-black mb-2 flex items-center gap-1.5">
        <Library size={12} aria-hidden /> Academic research desk
      </p>
      <h3 className="text-base font-black text-white uppercase">Free scholarly &amp; open access</h3>
      <p className="mt-2 text-[12px] text-white/55 max-w-2xl">
        Complimentary research databases and open-access paths. Educational research only — not financial advice.
      </p>
      <div className="flex flex-wrap gap-2 mt-3">
        <a href={EBSCO_FREE_DATABASES} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono uppercase text-[#B9A6FF]">
          Free databases <ExternalLink size={11} className="inline" />
        </a>
        <a href={EBSCO_ACADEMIC_LIBRARIES} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono uppercase text-[#00E5FF]">
          Academic libraries <ExternalLink size={11} className="inline" />
        </a>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 list-none p-0 m-0 mt-4">
        {APPEALING_ACADEMIC_RESEARCH.map((item) => (
          <li key={item.title}>
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full rounded-xl border border-white/10 bg-black/40 hover:border-[#B9A6FF]/50 p-4"
            >
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#B9A6FF]">{item.category}</span>
              <div className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
                {item.title}
                <ExternalLink size={12} className="text-zinc-500" />
              </div>
              <p className="text-[11px] text-zinc-300 mt-1.5">{item.blurb}</p>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
