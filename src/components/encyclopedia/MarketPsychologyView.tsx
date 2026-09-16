import React, { useState } from 'react';
import { Brain, Smile, AlertTriangle, Lightbulb, Compass, Award, ShieldClose, ShieldAlert, Sparkles, AlertCircle, Eye } from 'lucide-react';

interface PsychologyStage {
  label: string;
  category: 'GREED' | 'FEAR' | 'TRANSITION';
  indexValue: number;
  description: string;
  investorRationalization: string;
  hedonicRiskCoefficient: string;
  counterTradeTactic: string;
}

export default function MarketPsychologyView({ selectFileNode }: { selectFileNode: (f: string) => void }) {
  const [fearGreedValue, setFearGreedValue] = useState<number>(72); // 0 to 100
  const [selectedCycleStage, setSelectedCycleStage] = useState<number>(4); // Default to Complacency / Euphoria

  const STAGES: PsychologyStage[] = [
    {
      label: 'Euphoria',
      category: 'GREED',
      indexValue: 92,
      description: 'Maximum financial risk. Prices have decoupled completely from fundamental valuations. Investors buy aggressively on leverage, convinced that "this time is different" and asset growth is infinite.',
      investorRationalization: '"I bought a luxury vehicle using profits from highly speculative call options. Traditional earnings multiples are obsolete artifacts of past eras."',
      hedonicRiskCoefficient: 'Extreme Peak (Hyperexcited)',
      counterTradeTactic: 'Aggressive distributed liquidation. Take profit systematically. Buy put options, raise cash thresholds, and short-market parabolic peaks.'
    },
    {
      label: 'Thrill / Belief',
      category: 'GREED',
      indexValue: 80,
      description: 'Mass public adoption is triggered. Skeptics capitulate and buy. Financial media reports massive gains daily, driving high FOMO (Fear Of Missing Out) among retail savers.',
      investorRationalization: '"I must invest my savings before prices double. Look at my friend who quit their job to trade. Valuation doesn\'t matter anymore."',
      hedonicRiskCoefficient: 'High Greed (Accelerating)',
      counterTradeTactic: 'Stop making new long-term capital deployments. Relentlessly tighten trailing stop-loss coordinates.'
    },
    {
      label: 'Optimism / Hope',
      category: 'GREED',
      indexValue: 65,
      description: 'Initial market expansion from historical bottoms. Earnings begin to grow, and retail interest cautiously returns to the primary speculative avenues.',
      investorRationalization: '"The worst of the recession is behind us. Government stimulus and loose monetary policies will create favorable conditions for expansion."',
      hedonicRiskCoefficient: 'Moderate Optimism (Stable)',
      counterTradeTactic: 'Systematic dollar-cost averaging. Maximize equity allocations and accumulate high-growth corporate stocks.'
    },
    {
      label: 'Complacency',
      category: 'TRANSITION',
      indexValue: 55,
      description: 'The first major structural crash. Investors rationalize it as a "healthy consolidation" or temporary correction, failing to recognize systemic cyclical peaks.',
      investorRationalization: '"We are just buying the dip. Structural trends remain unbroken. Valuation multiples are still totally fine."',
      hedonicRiskCoefficient: 'Deceptively High (Pre-Crisis Null)',
      counterTradeTactic: 'Lighten portfolio loading. Execute asset rotation toward protective defensive consumer goods and gold.'
    },
    {
      label: 'Anxiety / Denial',
      category: 'FEAR',
      indexValue: 40,
      description: 'The market fails to rebound, making lower lows. Anxiety sets in, but investor pride prevents them from selling at loss positions. They deny structural decay.',
      investorRationalization: '"High quality companies always recover. I\'ll hold onto these stocks until they return to my break-even price. No point in lock-in losses."',
      hedonicRiskCoefficient: 'Elevated Panic (Pre-panic build)',
      counterTradeTactic: 'Maintain substantial cash positions (T-Bills). Protect capital balance blocks at all costs.'
    },
    {
      label: 'Panic / Capitulation',
      category: 'FEAR',
      indexValue: 20,
      description: 'Margin calls trigger cascade selling. Savers sell assets unconditionally from absolute fear, seeking safety in currency holdings. Margin engines wipe balance sheets.',
      investorRationalization: '"I can\'t afford to lose another cent. Capital preservation is all that matters. Get me out of everything now!"',
      hedonicRiskCoefficient: 'Extreme Stress (Fear capitulation)',
      counterTradeTactic: 'Begin hunting deeply devalued high-moot assets. Liquidity is dry, offering premium margins. Watch for capitulation volumes.'
    },
    {
      label: 'Depression / Despondency',
      category: 'FEAR',
      indexValue: 10,
      description: 'The absolute bottom. The public has abandoned trading completely, declaring markets to be an "unethical casino." High quality assets trade for absolute pennies.',
      investorRationalization: '"Markets are fully rigged. All our wealth was stolen. I will never touch stocks or options again as long as I live."',
      hedonicRiskCoefficient: 'Peak Cynicism (Absolute Bottom)',
      counterTradeTactic: 'Maximum buying intensity. Buy high-quality sovereign assets. Reinvest cash reserves aggressively. The cycle starts again.'
    }
  ];

  const getDialColor = (val: number) => {
    if (val > 75) return '#ef4444'; // Red for extreme greed
    if (val > 55) return '#f97316'; // Orange for greed
    if (val > 45) return '#eab308'; // Yellow for transition
    if (val > 25) return '#3b82f6'; // Blue for fear
    return '#06b6d4'; // Cyan for extreme fear
  };

  const getDialLabel = (val: number) => {
    if (val > 75) return 'EXTREME GREED';
    if (val > 55) return 'GREED (FOMO)';
    if (val > 45) return 'NEUTRAL BIAS';
    if (val > 25) return 'SENSORY FEAR';
    return 'EXTREME DEVIATION (PANIC)';
  };

  const activeStage = STAGES[selectedCycleStage];

  // Rotate dial SVG path helper
  const angle = ((fearGreedValue / 100) * 180) - 180; // range from -180 to 0 degrees

  return (
    <div className="flex flex-col gap-6 font-sans select-none animate-fadeIn">
      {/* Visual Header */}
      <div className="p-8 bg-gradient-to-r from-[#FF00C8]/10 to-black/80 border border-[#FF00C8]/20 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#FF00C8]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-pink-500 rounded-full animate-ping" />
            <span className="text-[10px] font-mono tracking-widest text-[#FF00C8] font-black uppercase">PSYCO-SYSTEM MATRIX</span>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">MARKET PSYCHOLOGY OBSERVATORY</h2>
          <p className="text-zinc-400 text-xs leading-relaxed max-w-3xl font-medium">
            Markets are not mechanical computers; they are organic systems driven by the aggregate emotions of fear and greed. Mastery over financial science requires a deep understanding of psychological cycle waves and human self-rationalizations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Needle Gauge Dial */}
        <div className="lg:col-span-4 p-6 bg-black/60 border border-white/5 rounded-3xl flex flex-col items-center justify-between min-h-[380px] hover:border-[#FF00C8]/20 transition-all">
          <div className="text-center">
            <span className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest">FEAR & GREED OBSERVATORY</span>
            <h3 className="text-sm font-black text-white uppercase tracking-wider mt-1">{getDialLabel(fearGreedValue)}</h3>
          </div>

          <div className="relative w-full max-w-[240px] aspect-square flex items-center justify-center">
            {/* The SVG Dial semi-circle gauge */}
            <svg viewBox="0 0 100 60" className="w-full h-full">
              <defs>
                <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" /> {/* Cyan */}
                  <stop offset="30%" stopColor="#3b82f6" /> {/* Blue */}
                  <stop offset="50%" stopColor="#eab308" /> {/* Yellow */}
                  <stop offset="70%" stopColor="#f97316" /> {/* Orange */}
                  <stop offset="100%" stopColor="#ef4444" /> {/* Red */}
                </linearGradient>
              </defs>
              {/* Semi-circle track */}
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="url(#gaugeGrad)"
                strokeWidth="6"
                strokeLinecap="round"
              />
              
              {/* Pointer Needle */}
              <g transform="translate(50, 50)">
                <line
                  x1="0"
                  y1="0"
                  x2="-35"
                  y2="0"
                  stroke={getDialColor(fearGreedValue)}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  transform={`rotate(${angle})`}
                  style={{ transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
                />
                <circle cx="0" cy="0" r="4.5" fill="#ffffff" />
                <circle cx="0" cy="0" r="1.5" fill="#000000" />
              </g>
            </svg>

            {/* Numeric display overlay */}
            <div className="absolute bottom-5 text-center select-text">
              <span className="text-3xl font-black font-mono tracking-tighter text-white">{fearGreedValue}</span>
              <span className="text-zinc-500 text-[10px] block font-mono font-bold leading-none mt-1">SENTIMENT INDEX SCORE</span>
            </div>
          </div>

          {/* Draggable/clickable Slider to adjust Dial */}
          <div className="w-full flex flex-col gap-2 mt-2">
            <div className="flex justify-between items-center text-[8.5px] font-mono text-zinc-500 uppercase tracking-widest font-black">
              <span>Panic Shocks</span>
              <span>Speculation Grids</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={fearGreedValue}
              onChange={(e) => setFearGreedValue(parseInt(e.target.value))}
              className="w-full accent-pink-500 bg-zinc-900 border border-white/5 h-2.5 rounded-full outline-none focus:ring-1 focus:ring-pink-500/30 cursor-pointer"
            />
            <button
              onClick={() => {
                // Set random score
                setFearGreedValue(Math.floor(Math.random() * 101));
              }}
              className="mt-2 text-[8px] font-mono p-1 border border-white/5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg uppercase tracking-wider font-extrabold w-fit mx-auto cursor-pointer"
            >
              Trigger Market Shock
            </button>
          </div>
        </div>

        {/* Wall Street Psychology stages & Interactive Selection */}
        <div className="lg:col-span-8 p-6 bg-black/60 border border-white/5 rounded-3xl flex flex-col gap-5 hover:border-white/10 transition-all">
          <div className="border-b border-white/5 pb-3">
            <span className="text-[9px] font-mono font-black text-[#FF00C8] uppercase tracking-widest leading-none">THE WALL STREET PSYCHOLOGY MATRIX</span>
            <h3 className="text-base font-black text-white uppercase tracking-tight mt-1.5">Interactive Valuation Wave Mapping</h3>
            <p className="text-zinc-400 text-xs mt-1">Select an active sentiment node of the long-term capital rotation cycle to study its rationalizations and indicators.</p>
          </div>

          {/* Node selections */}
          <div className="flex flex-wrap gap-2">
            {STAGES.map((stg, index) => {
              const isSelected = selectedCycleStage === index;
              return (
                <button
                  key={stg.label}
                  onClick={() => {
                    setSelectedCycleStage(index);
                    setFearGreedValue(stg.indexValue);
                  }}
                  className={`px-4.5 py-2.5 border rounded-2xl text-[11px] font-black tracking-wide uppercase transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-pink-600 to-[#FF00C8] border-[#FF00C8]/40 text-white shadow-[0_0_15px_rgba(255,0,200,0.35)]'
                      : 'bg-white/[0.015] border-white/5 hover:border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  {stg.label}
                </button>
              );
            })}
          </div>

          {/* Active node presentation */}
          <div className="p-5.5 bg-black/45 border border-white/5 rounded-3.5xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-[#FF00C8] animate-pulse" />
                <span className="text-sm font-black text-white uppercase tracking-wide">{activeStage.label} Strategy Map</span>
              </div>
              <span className={`px-2.5 py-0.5 border text-[8.5px] font-mono rounded font-black tracking-widest ${
                activeStage.category === 'GREED' 
                  ? 'border-red-500/20 bg-red-500/5 text-red-400' 
                  : activeStage.category === 'FEAR'
                    ? 'border-cyan-500/20 bg-cyan-500/5 text-cyan-400'
                    : 'border-amber-500/20 bg-amber-500/5 text-amber-400'
              }`}>
                {activeStage.category} PHASE (INDICATOR: {activeStage.indexValue})
              </span>
            </div>

            <p className="text-zinc-300 text-xs leading-relaxed font-sans">{activeStage.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
              <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block font-black">Typical Investor Rationalization:</span>
                <span className="text-zinc-400 text-xs italic block mt-1.5 leading-relaxed">
                  {activeStage.investorRationalization}
                </span>
              </div>

              <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block font-black">Hedonic Risk Coefficient:</span>
                <span className="text-[#FF00C8] text-xs font-black block mt-1.5 uppercase font-mono">
                  {activeStage.hedonicRiskCoefficient}
                </span>
                <div className="w-full bg-white/5 h-[3px] mt-2 rounded overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-pink-500 to-[#FF00C8] h-full"
                    style={{ width: `${activeStage.indexValue}%`, transition: 'width 0.8s ease-in-out' }}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-500/[0.02] border border-green-500/10 rounded-2xl flex gap-3 select-text">
              <Sparkles className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[8.5px] font-mono text-green-400 uppercase tracking-widest font-black block">ClearPath Tactical Counter-Move:</span>
                <p className="text-zinc-400 text-xs leading-relaxed mt-1 font-medium">{activeStage.counterTradeTactic}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
