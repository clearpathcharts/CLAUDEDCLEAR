import React from "react";
import { DollarSign, Triangle } from "lucide-react";
import { MONTHLY_BUDGET } from "../data/monthlyBudget";

function money(n: number) {
  return `$${n.toLocaleString("en-US")}`;
}

const PINK = "#FF1493";
const PURPLE = "#9D00FF";
const PRICE = "#E8EDF5";
const UP = "#00F5D4";
const DOWN = "#FF6B6B";
const MUTED = "#9FB3C8";
const BG = "#06121A";

type ShapeId = "rising-wedge" | "falling-wedge" | "ascending-triangle" | "descending-triangle";

const SHAPE_COPY: Record<ShapeId, { name: string; kid: string; stamp: string }> = {
  "rising-wedge": {
    name: "Rising wedge",
    kid: "Both lines tilt up. They meet at a point. Usually goes down.",
    stamp: "POINT",
  },
  "falling-wedge": {
    name: "Falling wedge",
    kid: "Both lines tilt down. They meet at a point. Usually goes up.",
    stamp: "POINT",
  },
  "ascending-triangle": {
    name: "Ascending triangle",
    kid: "Top is a flat wall. Bottom is a ramp. Usually goes up.",
    stamp: "WALL",
  },
  "descending-triangle": {
    name: "Descending triangle",
    kid: "Bottom is a flat wall. Top is a ramp. Usually goes down.",
    stamp: "WALL",
  },
};

function ShapeSvg({ id }: { id: ShapeId }) {
  const wedges = id.includes("wedge");
  const rising = id === "rising-wedge" || id === "ascending-triangle";
  const breakUp = id === "falling-wedge" || id === "ascending-triangle";
  const topY2 = wedges ? (rising ? 52 : 88) : 48;
  const botY2 = wedges ? (rising ? 88 : 52) : rising ? 88 : 168;
  const topY1 = rising && wedges ? 78 : wedges ? 52 : 48;
  const botY1 = rising && wedges ? 168 : wedges ? 168 : rising ? 168 : 168;
  return (
    <svg viewBox="0 0 360 180" width="100%" height={120} style={{ background: BG, display: "block" }}>
      <line x1="36" y1={topY1} x2="300" y2={topY2} stroke={PINK} strokeWidth={id.includes("triangle") && !rising ? 3.5 : 5} />
      <line x1="36" y1={botY1} x2="300" y2={botY2} stroke={PURPLE} strokeWidth={id.includes("triangle") && rising ? 3.5 : 5} />
      <polyline
        fill="none"
        stroke={PRICE}
        strokeWidth="2.2"
        points={
          id === "falling-wedge"
            ? "44,70 80,118 116,78 152,128 188,86 224,136 260,96 296,108"
            : id === "rising-wedge"
              ? "44,150 80,86 116,136 152,76 188,118 224,68 260,102 296,86"
              : id === "ascending-triangle"
                ? "44,150 80,86 116,136 152,52 188,118 224,52 260,96 296,52"
                : "44,52 80,118 116,62 152,148 188,72 224,148 260,86 296,148"
        }
      />
      <line
        x1="296"
        y1={breakUp ? 100 : 100}
        x2="336"
        y2={breakUp ? 42 : 158}
        stroke={breakUp ? UP : DOWN}
        strokeWidth="3.2"
      />
      <text x="36" y="18" fill={PINK} fontSize="11" fontWeight={800}>
        {id === "ascending-triangle" ? "WALL" : "RAMP"}
      </text>
      <text x="36" y="172" fill={PURPLE} fontSize="11" fontWeight={800}>
        {id === "descending-triangle" ? "WALL" : "RAMP"}
      </text>
      <text x="248" y={breakUp ? 36 : 172} fill={breakUp ? UP : DOWN} fontSize="11" fontWeight={800}>
        {breakUp ? "Usually UP" : "Usually DOWN"}
      </text>
    </svg>
  );
}

function RulePoster() {
  const cells: ShapeId[] = ["rising-wedge", "falling-wedge", "ascending-triangle", "descending-triangle"];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {cells.map((id) => (
        <figure key={id} className="m-0 overflow-hidden rounded-xl border border-white/10" style={{ background: BG }}>
          <ShapeSvg id={id} />
          <figcaption className="px-3 py-2.5">
            <div className="text-sm font-extrabold text-white">
              {SHAPE_COPY[id].name} · {SHAPE_COPY[id].stamp}
            </div>
            <div className="text-xs leading-snug mt-1" style={{ color: MUTED }}>
              {SHAPE_COPY[id].kid}
            </div>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

/** Stays on every CEO tab — budget + wedge/triangle cheat sheet. */
export default function CeoAlwaysOnMonitor() {
  return (
    <div className="space-y-6 mb-8">
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
      </div>

      <div className="bg-[#1a1a2e] p-5 md:p-6 rounded-lg border-2 border-[#FF1493]/30">
        <h2 className="text-[#FF1493] text-sm font-black uppercase tracking-widest mb-2 flex items-center gap-2">
          <Triangle size={16} />
          Wedge vs triangle — keep this on screen
        </h2>
        <p className="text-zinc-400 text-xs mb-4">
          Two ramps = wedge (comes to a point). One ramp + one wall = triangle. Falling wedge usually up.
          Descending triangle usually down. Check the floor.
        </p>
        <RulePoster />
      </div>
    </div>
  );
}
