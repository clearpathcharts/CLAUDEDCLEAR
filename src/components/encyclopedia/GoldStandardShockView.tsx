// /src/components/encyclopedia/GoldStandardShockView.tsx
import React, { useState } from 'react';
import { 
  Landmark, Coins, HelpCircle, History, Info, 
  TrendingUp, ArrowDown, ChevronRight, AlertCircle, RefreshCw
} from 'lucide-react';

interface GoldStandardShockViewProps {
  selectFileNode?: (fileName: string) => void;
  pedagogyMode?: 'kids' | 'highschool' | 'college' | 'researcher';
  activeLanguage?: 'EN' | 'ZH' | 'ES' | 'PT' | 'KO';
}

export default function GoldStandardShockView({ selectFileNode, pedagogyMode = 'college', activeLanguage = 'EN' }: GoldStandardShockViewProps) {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [dollarInflatorValue, setDollarInflatorValue] = useState<number>(100);
  const [showGoldQuiz, setShowGoldQuiz] = useState<boolean>(false);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);

  // Depletion Simulation State
  const [euroClaims, setEuroClaims] = useState<number>(55); // $Billions in offshore claims
  const [usGoldReserves, setUsGoldReserves] = useState<number>(10); // $Billions in Fort Knox reserves

  const resetDepletionSim = () => {
    setEuroClaims(55);
    setUsGoldReserves(10);
  };

  const handleRedeemGold = () => {
    if (usGoldReserves > 1.5) {
      setUsGoldReserves(prev => Math.max(1.0, Number((prev - 1.5).toFixed(1))));
      setEuroClaims(prev => Math.max(0, Number((prev - 1.5).toFixed(1))));
    }
  };

  const steps = [
    {
      title: "The Bretton Woods Anchor (1944)",
      span: "1944 - 1965",
      desc: "Following World War II, 44 sovereign nations converged to establish a new monetary standard. To stabilize global commerce, all currencies were pegged directly to the US Dollar, and the US Dollar was legally convertible directly to physical gold at a fixed rate of exactly $35 per troy ounce. Fort Knox stood backed by 70% of the world's official gold bullion.",
      cause: "Post-war stabilizing consensus, backing international trade with a gold-collateralized dominant currency."
    },
    {
      title: "Double Deficit Strain (Late 1960s)",
      span: "1966 - 1970",
      desc: "To finance massive domestic state spending (the 'Great Society') and the costly, prolonged warfare of the Vietnam War, the US Federal Reserve expanded the supply of paper money enormously. This resulted in more paper dollars circulating offshore than the physical gold in Fort Knox could possibly redeem.",
      cause: "Sovereign funding overexpansion. Europe noticed that the number of paper dollars was rapidly outgrowing physical gold backing."
    },
    {
      title: "French Gold Runs & Speculative Raids",
      span: "Early 1971",
      desc: "French President Charles de Gaulle and his economic advisors recognized the dollar dilution. France dispatched navies to New York Harbor to physically exchange cargo holds of paper US dollar notes for physical gold bars. Germany followed, demanding conversion of massive mountains of Eurodollars.",
      cause: "Sovereign arbitrage run. Fort Knox was rapidly leaking physical gold reserves as sovereign nations rushed to secure their reserves."
    },
    {
      title: "August 15, 1971 - The Nixon Shock",
      span: "August 15, 1971",
      desc: "Recognizing that US gold reserves would be bled dry if redemptions continued, President Richard Nixon abruptly bypassed Congress, went live on television, and announced that the United States would 'temporarily adjust' the system: the window converting paper dollars into gold was slammed shut.",
      cause: "Sovereign default on the dollar convertibility clause. The 'temporary' gold suspension remains permanent today."
    },
    {
      title: "The Floating Fiat Universe",
      span: "1973 - Present",
      desc: "Without a gold anchor, the Bretton Woods system collapsed. All major national currencies unpegged and began to float freely against one another in an infinite sea of supply and demand. The era of total uncollateralized central bank fiat paper currency was born.",
      cause: "Sovereign currencies derive their value purely from public trust, tax liability enforcement, and the political or military weight of their issuing governments."
    }
  ];

  const pedagogyTranslations = {
    kids: {
      intro: "A long time ago, a green dollar bill was literally a promise for a shiny piece of real gold! But in 1971, the President took that promise away, and the dollar became just paper money backed by trust.",
      nixonReason: "Sovereign nations noticed there was way too much paper money printed, and not enough actual gold in Fort Knox to trade it in!"
    },
    highschool: {
      intro: "Before 1971, the US dollar was tied to real physical gold at $35 per ounce. When the supply of paper dollars expanded to pay for massive federal budgets, foreign countries lost trust, redeemed their paper dollars, and forced Nixon to shut down the golden window.",
      nixonReason: "To protect the remaining US gold supply from being completely drained by foreign governments demanding physical gold."
    },
    college: {
      intro: "The Bretton Woods monetary system established a global gold-exchange standard, anchoring all foreign exchange nodes to the USD, which was committed to redeeming dollars for gold at $35/oz. The expansion of Eurodollar liquidity via military expenditures eventually induced the Triffin Dilemma and systematic gold redemptions.",
      nixonReason: "The geopolitical balance shifted; outstanding foreign official claims on dollars expanded far beyond the US monetary gold reserve baseline, making default or closing the gold window mathematically inevitable."
    },
    researcher: {
      intro: "The systemic abandonment of the Bretton Woods par value framework. The expansion of liquid claims relative to the base asset created systemic insolvency. Richard Nixon terminated the gold window on August 15, 1971 on national TV, initiating the absolute floating fiat era.",
      nixonReason: "To preempt systemic gold reserve depletion amid French/German balance-of-payments hedging, resetting the US state balance sheet toward free floating legal tender backed by global Treasury demand."
    }
  };

  // Inflation Calculator Mock Index values based on historical CPI data from 1971 to 2026
  // Shifting $100 in 1971 to real purchasing power today is approx $760 of nominal currency.
  // In other words, purchasing power collapsed by ~86%.
  const equivalentPurchasingPower = Math.round(dollarInflatorValue * 7.6);
  const purchasingPowerErosion = "86.8%";

  return (
    <div className="gold-standard-layout flex flex-col gap-6 text-white text-left select-text font-sans animate-fadeIn">
      
      {/* SECTION BANNER */}
      <div className="p-6 md:p-8 bg-gradient-to-br from-[#0c031c] via-[#050616]/98 to-yellow-950/10 border border-yellow-500/25 rounded-[32px] relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <History className="w-64 h-64 text-yellow-400" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-yellow-400 font-black">
              BLUEPRINT 02 // HISTORICAL ARCHIVE: THE NIXON SHOCK OF 1971
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white leading-none">
            Fiat Genesis & Nixon Gold Standard Break
          </h1>
          <p className="text-zinc-350 text-sm sm:text-base max-w-4xl leading-relaxed">
            Unpacking the historical pivot point of the global model. In August 1971, President Richard Nixon slammed shut the gold conversion window. This single corporate default redefined modern economics, shifting humanity into a system of global floating fiat paper.
          </p>
        </div>

        {/* PEDAGOGICAL TOOL BLOCK */}
        <div className="bg-[#FF00C8]/5 border border-[#FF00C8]/30 rounded-2xl p-4 mt-6 font-mono text-xs max-w-3xl flex gap-3.5 items-start">
          <Info className="w-5 h-5 text-[#FF00C8] shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <span className="text-[#FF00C8] font-black uppercase tracking-widest block text-[9px]">PEDAGOGICAL SYLLABUS INTERFACE</span>
            <p className="leading-relaxed font-sans text-sm font-semibold text-zinc-200">
              {pedagogyTranslations[pedagogyMode].intro}
            </p>
          </div>
        </div>
      </div>

      {/* CHRONOLOGICAL TIMELINE CHRONICLES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* TIMELINE TREE CHANNELS (7/12) */}
        <div className="lg:col-span-8 bg-[#030612]/95 border border-white/5 rounded-3xl p-6 flex flex-col justify-between gap-6">
          <div className="flex flex-col text-left">
            <span className="font-mono text-[9px] text-yellow-500 tracking-wider uppercase font-black">CHRONOLOGY ROADMAP</span>
            <h3 className="text-white font-black text-lg sm:text-xl uppercase tracking-tight">THE ANATOMY OF MONETARY METAMORPHOSIS</h3>
          </div>

          <div className="flex flex-col gap-4">
            {steps.map((st, idx) => {
              const isActive = activeStep === idx;
              return (
                <div 
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`group p-4 bg-black/40 border rounded-2xl cursor-pointer transition-all ${
                    isActive 
                      ? 'border-yellow-400 bg-yellow-950/10 shadow-[0_0_15px_rgba(234,179,8,0.1)]' 
                      : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between text-left gap-2 flex-wrap">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-[11px] font-black ${
                        isActive ? 'bg-yellow-400 text-black' : 'bg-white/5 text-zinc-400'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className={`font-sans font-black text-sm uppercase tracking-tight ${isActive ? 'text-yellow-400' : 'text-zinc-200'}`}>
                        {st.title}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-500 font-bold">{st.span}</span>
                  </div>

                  {isActive && (
                    <div className="mt-3.5 pt-3 border-t border-white/5 text-xs text-zinc-300 font-sans leading-relaxed space-y-3 animate-slideDown">
                      <p className="font-medium text-[13px] text-zinc-100">{st.desc}</p>
                      <div className="p-3 bg-black/50 border border-white/5 rounded-xl">
                        <span className="font-mono text-[8px] text-yellow-500 font-extrabold uppercase block leading-none mb-1.5">PRIMARY SYSTEM TRIGGER</span>
                        <p className="text-zinc-400 font-semibold">{st.cause}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* INTERACTIVE COMPREHENSION SIMULATORS (5/12) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* THE 1971 GOLD RESERVE DEPLETION RUN SIMULATOR */}
          <div className="bg-[#050616] border border-yellow-500/10 rounded-3xl p-6 flex flex-col justify-between gap-5 relative overflow-hidden">
            <div className="space-y-1">
              <span className="font-mono text-[9px] text-[#FF00C8] font-bold uppercase tracking-wider block">INTERACTIVE SIMULATION</span>
              <h3 className="text-white font-black text-[14px] uppercase tracking-tight">Fort Knox Gold Depletion simulator (1971)</h3>
              <p className="text-zinc-450 text-[11px] leading-relaxed font-sans font-medium">
                Sovereign claims exceeded physical gold. Simulate European nations redeeming paper dollars for Fort Knox bars. See what Richard Nixon saw!
              </p>
            </div>

            {/* Sim Displays */}
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-zinc-500 uppercase">Fort Knox Base Gold Reserves</span>
                  <span className="text-yellow-400 font-black">${usGoldReserves} Billion</span>
                </div>
                <div className="h-2 bg-neutral-900 border border-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-400 transition-all duration-300" 
                    style={{ width: `${Math.min(100, (usGoldReserves / 10) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-zinc-500 uppercase font-black">Offshore Eurodollar claims</span>
                  <span className="text-cyan-400 font-black">${euroClaims} Billion</span>
                </div>
                <div className="h-2 bg-neutral-900 border border-[#00ffff]/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#00D9FF] transition-all duration-350" 
                    style={{ width: `${Math.min(100, (euroClaims / 55) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Sim Warning Node */}
            {usGoldReserves <= 4 && (
              <div className="p-3 bg-red-950/20 border border-red-500/25 rounded-xl flex items-start gap-2 text-left font-mono text-[9px] text-red-400 animate-pulse">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-black block uppercase">CRITICAL SYSTEM CRISIS OVER</span>
                  <span>US gold reserve threshold breached. National solvency collapse imminent if conversion remains unlocked!</span>
                </div>
              </div>
            )}

            {/* Sim actions */}
            <div className="flex gap-2 font-mono text-[9px] pt-1">
              <button
                disabled={usGoldReserves <= 1.5}
                onClick={handleRedeemGold}
                className={`flex-1 py-2.5 rounded-xl text-black font-black uppercase text-center transition-all ${
                  usGoldReserves <= 1.5 
                    ? 'bg-zinc-700 cursor-not-allowed opacity-40' 
                    : 'bg-yellow-400 hover:bg-yellow-300 cursor-pointer shadow-[0_0_12px_rgba(234,179,8,0.3)]'
                }`}
              >
                French Run: Redeem $1.5B ➔
              </button>

              <button
                onClick={resetDepletionSim}
                className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 uppercase text-zinc-400 hover:text-white border border-white/5 transition-all text-center cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="text-center font-mono text-[9px] text-zinc-550 border-t border-white/5 pt-2">
              Note: Nixon suspended the convertibility window when gold backing hit critical low scales in August 1971.
            </div>
          </div>

          {/* FIAT INFLATION EROSION CALCULATOR */}
          <div className="p-6 bg-gradient-to-tr from-indigo-950/15 via-[#030612]/95 to-[#FF00C8]/5 border border-white/5 rounded-3xl flex flex-col justify-between gap-5 text-left">
            <div className="space-y-1">
              <span className="font-mono text-[9px] text-[#00D9FF] font-black uppercase tracking-wider block">MACRO DEGRADATION SCALE</span>
              <h3 className="text-white font-black text-[14px] uppercase tracking-tight">FIAT INFLATION MATRIX SINCE 1971</h3>
              <p className="text-zinc-450 text-[11px] font-sans font-medium">
                Enter any sum of cash in 1971 dollars to see how much paper fiat money is required today to command the exact same purchasing power!
              </p>
            </div>

            {/* Interactive Inputs */}
            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="font-mono text-[9px] text-zinc-500 uppercase font-black">1971 Dollar Capital value</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-zinc-500 font-bold">$</span>
                  <input
                    type="number"
                    value={dollarInflatorValue}
                    onChange={(e) => setDollarInflatorValue(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-black border border-white/10 focus:border-[#FF00C8] py-3 pl-8 pr-4 rounded-xl text-white font-mono font-black"
                  />
                </div>
              </div>

              {/* Outputs display */}
              <div className="p-4 bg-black/60 border border-white/5 rounded-2xl flex items-center justify-between font-mono">
                <div className="text-left">
                  <span className="text-[8px] text-zinc-550 block font-black uppercase">NOMINAL FIAT TODAY</span>
                  <span className="text-yellow-400 font-extrabold text-[16px]">${equivalentPurchasingPower}</span>
                </div>
                <div className="text-right border-l border-white/5 pl-4">
                  <span className="text-[8px] text-zinc-550 block font-black uppercase">PURCHASING PARITY EROSION</span>
                  <span className="text-red-400 font-black text-sm">{purchasingPowerErosion} Loss</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-black/60 border border-white/5 rounded-2xl leading-relaxed text-zinc-350 text-[11px]">
              <span className="font-mono text-[8px] text-[#FF00C8] font-black uppercase block mb-1">THE SYSTEMIC REALITY</span>
              <p className="font-sans font-semibold text-zinc-400 leading-normal">
                Because unanchored paper money expands infinitely, the dollar has collapsed of its original purchase load compared to the $35/oz gold peg era.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
