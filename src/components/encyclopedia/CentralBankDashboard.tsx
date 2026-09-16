import React, { useState } from 'react';
import { Sliders, Landmark, TrendingUp, HelpCircle, HardDrive, DollarSign, Activity, Percent } from 'lucide-react';

export default function CentralBankDashboard() {
  const [baseRate, setBaseRate] = useState<number>(5.25); // Fed Funds Rate
  const [showExplanation, setShowExplanation] = useState<boolean>(true);

  // Derive academic transmission outputs based on central bank benchmark pricing
  const cpiInflation = parseFloat((12.5 - Math.sqrt(baseRate * 12)).toFixed(2)); // High rates crush inflation
  const stockIndex = Math.max(1000, Math.floor(18000 - baseRate * 1200));       // High rates crash stock values
  const currencyStrength = parseFloat((80 + baseRate * 3.5).toFixed(1));          // High rates strengthen index (DXY)
  
  // Bond Yield Curve (Maturities)
  // Short-term rates react strongly to baseRate. Long-term rates are driven by future economic expectation
  const yield2Year = parseFloat((baseRate * 0.9 + 0.3).toFixed(2));
  const yield10Year = parseFloat((4.2 - (baseRate - 4.5) * 0.2).toFixed(2)); // inverse curve slope on high rates
  
  const isCurveInverted = yield2Year > yield10Year;
  const spreadBasisPoints = Math.round((yield10Year - yield2Year) * 100);

  return (
    <div id="central-bank-hub" className="p-6 bg-zinc-950 border border-white/5 rounded-2xl flex flex-col gap-6 shadow-[0_4px_30px_rgba(0,0,0,0.8)] font-sans">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <Landmark className="w-5 h-5 text-emerald-500" />
          <h4 className="text-sm font-semibold tracking-wide text-white uppercase font-sans">Monetary Policy Machine (FOMC Simulator)</h4>
        </div>
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="text-[10px] font-mono tracking-widest text-[#00FFFF] hover:underline uppercase flex items-center gap-1 cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" /> {showExplanation ? 'HIDE DETAILS' : 'LEARN TRANSMISSION'}
        </button>
      </div>

      {showExplanation && (
        <div className="p-4 bg-emerald-950/20 border border-emerald-500/10 rounded-xl leading-relaxed text-xs text-emerald-400/90 flex flex-col gap-2">
          <strong className="text-emerald-300 font-sans tracking-wide uppercase">THE INTERBANK TRANSMISSION PROTOCOL:</strong>
          <p>
            When a central bank adjusts the benchmark interbank lending rate (such as the Fed Funds Rate), it influences the physical reserve charges inside commercial banking systems. High rates restrict loan creation, deflating bubbles but slowing growth. Low rates generate asset price expansion but risk high consumer pricing spikes (inflation).
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* RATE REGULATION SLIDER */}
        <div className="lg:col-span-5 flex flex-col gap-6 bg-zinc-900/40 p-5 border border-white/5 rounded-xl">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase font-black text-zinc-500 tracking-widest font-sans flex items-center justify-between">
              BENCHMARK BASE RATE (FED FUNDS) <span>RATE: {baseRate.toFixed(2)}%</span>
            </span>
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono text-zinc-500">0.0%</span>
              <input
                type="range"
                min="0.0"
                max="10.0"
                step="0.25"
                value={baseRate}
                onChange={(e) => setBaseRate(parseFloat(e.target.value))}
                className="flex-grow h-1.5 bg-black/80 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-xs font-mono text-zinc-500">10.0%</span>
            </div>
          </div>

          <div className="flex flex-col gap-4 divide-y divide-white/5 border-t border-white/5 pt-4 text-xs font-mono">
            <div className="grid grid-cols-2 py-1">
              <span className="text-zinc-500 uppercase">Policy Stance</span>
              <span className={`text-right font-bold ${baseRate > 6.0 ? 'text-red-400 font-bold' : baseRate > 3.5 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}`}>
                {baseRate > 6.0 ? 'SUPER-HAWKISH (RESTRICTIVE)' : baseRate > 3.5 ? 'NEUTRAL ACCESSIBILITY' : 'DOVISH (STIMULATIVE)'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 py-1 pt-1.5">
              <span className="text-zinc-500 uppercase">Balance Sheet Flow</span>
              <span className="text-right text-zinc-200">
                {baseRate > 5.0 ? 'Active Quantitative Tightening' : baseRate < 2.0 ? 'Quantitative Easing Flowing' : 'Stabilized Roll-off Cycle'}
              </span>
            </div>
          </div>
        </div>

        {/* TRANSMISSION TELEMETRY METRICS */}
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CPI Inflation */}
          <div className="p-4 bg-black/40 border border-white/5 rounded-xl flex flex-col justify-between h-[120px]">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
              <span>CPI INFLATION INDEX</span>
              <Percent className="w-3.5 h-3.5 text-zinc-500" />
            </div>
            <div className="flex items-end justify-between">
              <span className={`text-2xl font-mono tracking-tight font-black ${cpiInflation > 4.5 ? 'text-red-400 font-bold' : cpiInflation > 1.8 ? 'text-green-400 font-bold' : 'text-blue-400 font-bold'}`}>
                {cpiInflation}%
              </span>
              <span className="text-[10px] font-sans pb-1 bg-white/[0.03] p-1 rounded">
                Target: 2.0%
              </span>
            </div>
            <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${cpiInflation > 4.5 ? 'bg-red-500' : cpiInflation > 1.8 ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(100, Math.max(5, cpiInflation * 8))}%` }}
              />
            </div>
          </div>

          {/* Stock Index Pricing */}
          <div className="p-4 bg-black/40 border border-white/5 rounded-xl flex flex-col justify-between h-[120px]">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
              <span>STOCK EVALUATION INDEX</span>
              <TrendingUp className="w-3.5 h-3.5 text-zinc-500" />
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-mono tracking-tight text-white font-black">
                {stockIndex.toLocaleString()}
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                P/E Ratio: {(35 - baseRate * 2.2).toFixed(1)}x
              </span>
            </div>
            <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${(stockIndex / 20000) * 100}%` }}
              />
            </div>
          </div>

          {/* US Dollar Forex Strength Index (DXY) */}
          <div className="p-4 bg-black/40 border border-white/5 rounded-xl flex flex-col justify-between h-[120px]">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
              <span>CURRENCY INDEX (DXY)</span>
              <DollarSign className="w-3.5 h-3.5 text-zinc-500" />
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-mono tracking-tight text-white font-black">
                {currencyStrength}
              </span>
              <span className="text-[10px] text-emerald-400 font-sans">
                Yield Accrual
              </span>
            </div>
            <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${(currencyStrength / 130) * 100}%` }}
              />
            </div>
          </div>

          {/* Bound Yield Curve */}
          <div className="p-4 bg-black/40 border border-white/5 rounded-xl flex flex-col justify-between h-[120px]">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
              <span>YIELD CURVE MATRIX</span>
              <Activity className="w-3.5 h-3.5 text-zinc-500" />
            </div>
            <div className="flex items-center justify-between font-mono text-[11px] gap-2">
              <div className="flex flex-col">
                <span className="text-zinc-500 text-[9px] uppercase">2-Year Yield</span>
                <span className="text-white font-bold">{yield2Year}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-zinc-500 text-[9px] uppercase">10-Year Yield</span>
                <span className="text-white font-bold">{yield10Year}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-white/[0.05] pt-1 text-[10px]">
              <span className="text-zinc-500 font-mono">Spread: {spreadBasisPoints} bps</span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-sans font-bold uppercase ${isCurveInverted ? 'bg-red-500/10 text-red-400 border border-red-500/2 transition-all shadow-[0_0_10px_rgba(239,68,68,0.15)]' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                {isCurveInverted ? '★ CURVE INVERTED' : 'STANDARD STEEP'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
