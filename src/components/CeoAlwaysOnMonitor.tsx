import React from "react";
import { DollarSign } from "lucide-react";
import { MONTHLY_BUDGET } from "../data/monthlyBudget";

function money(n: number) {
  return `$${n.toLocaleString("en-US")}`;
}

/** Stays on every CEO tab — operating budget only. Chart patterns belong on MARKETS/CHARTS, not here. */
export default function CeoAlwaysOnMonitor() {
  return (
    <div className="mb-8">
      <div className="bg-[#1a1a2e] p-5 md:p-6 rounded-lg border-2 border-[#FFD700]/35">
        <h2 className="text-[#FFD700] text-sm font-black uppercase tracking-widest mb-3 flex items-center gap-2">
          <DollarSign size={16} />
          ClearPath monthly budget · {MONTHLY_BUDGET.month}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-black/40 border border-white/10 rounded-md p-3">
            <p className="text-white text-2xl font-black">{money(MONTHLY_BUDGET.named)}</p>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Named bills</p>
          </div>
          <div className="bg-black/40 border border-white/10 rounded-md p-3">
            <p className="text-amber-200 text-2xl font-black">{money(MONTHLY_BUDGET.missingLiveTotal)}</p>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Missing live</p>
          </div>
          <div className="bg-black/40 border border-[#FFD700]/30 rounded-md p-3">
            <p className="text-[#FFD700] text-2xl font-black">{money(MONTHLY_BUDGET.operatingFloor)}</p>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Must clear / month</p>
          </div>
          <div className="bg-black/40 border border-white/10 rounded-md p-3">
            <p className="text-white text-2xl font-black">{MONTHLY_BUDGET.twelveDataSharePct}%</p>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Twelve Data of named</p>
          </div>
        </div>
        <p className="text-amber-100/80 text-xs mb-4 leading-relaxed">{MONTHLY_BUDGET.warning}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-white/80 text-xs">
            <thead className="bg-black/40 text-[10px] uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-2 py-2">Vendor</th>
                <th className="px-2 py-2">Monthly</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {MONTHLY_BUDGET.namedBills.map((row) => (
                <tr key={row.vendor}>
                  <td className="px-2 py-2 font-semibold">{row.vendor}</td>
                  <td className="px-2 py-2 font-mono text-[#FFD700]">{row.monthly}</td>
                  <td className="px-2 py-2 text-emerald-300">{row.status}</td>
                  <td className="px-2 py-2 text-zinc-400">{row.note}</td>
                </tr>
              ))}
              {MONTHLY_BUDGET.missingLiveBills.map((row) => (
                <tr key={row.vendor} className="bg-amber-500/5">
                  <td className="px-2 py-2 font-semibold">{row.vendor}</td>
                  <td className="px-2 py-2 font-mono text-amber-200">{row.monthly}</td>
                  <td className="px-2 py-2 text-amber-200">{row.status}</td>
                  <td className="px-2 py-2 text-zinc-400">{row.note}</td>
                </tr>
              ))}
              <tr className="bg-white/5">
                <td className="px-2 py-2 font-black">Operating floor</td>
                <td className="px-2 py-2 font-mono font-black text-[#FFD700]">
                  {money(MONTHLY_BUDGET.operatingFloor)}
                </td>
                <td className="px-2 py-2" colSpan={2}>
                  ~{MONTHLY_BUDGET.cover.proMembers} Pro or ~{MONTHLY_BUDGET.cover.ultimateMembers} Ultimate to cover ops
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[10px] font-mono text-zinc-600 mt-3">
          Cloud Run: {MONTHLY_BUDGET.cloudRun.map((s) => `${s.service}@${s.region}`).join(" · ")}
        </p>
        <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
          Snapshot ({MONTHLY_BUDGET.source}). Not a live P&amp;L. Website deploy path:{" "}
          <span className="font-mono text-zinc-300">clear-path-markets-science / europe-west1</span>
          . Never Edit &amp; deploy <span className="font-mono">clearpath-voice-os</span> unless you mean Ava.
          Traffic must stay LATEST.
        </p>
      </div>
    </div>
  );
}
