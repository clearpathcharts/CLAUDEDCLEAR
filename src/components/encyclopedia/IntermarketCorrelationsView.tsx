// /src/components/encyclopedia/IntermarketCorrelationsView.tsx
import React, { useState } from 'react';
import { 
  TrendingUp, Activity, HelpCircle, Info, RefreshCw, 
  ArrowRight, ShieldCheck, Flame, Coins, CoinsIcon, AlertTriangle
} from 'lucide-react';

interface IntermarketCorrelationsViewProps {
  selectFileNode?: (fileName: string) => void;
  pedagogyMode?: 'kids' | 'highschool' | 'college' | 'researcher';
  activeLanguage?: 'EN' | 'ZH' | 'ES' | 'PT' | 'KO';
}

export default function IntermarketCorrelationsView({ selectFileNode, pedagogyMode = 'college', activeLanguage = 'EN' }: IntermarketCorrelationsViewProps) {
  const [goldPriceSlide, setGoldPriceSlide] = useState<number>(2000); // gold per oz

  // Correlation Formulas representing historical intermarket pricing relationships
  const computedSilver = Number((goldPriceSlide / 80).toFixed(2)); // gold-to-silver ratio historical mean ~ 80
  const computedOil = Number((goldPriceSlide * 0.04).toFixed(2)); // historical mean oil/gold correlation coefficient ~ 4%
  const computedDxyEffect = Number((100 - ((goldPriceSlide - 2000) * 0.015)).toFixed(1)); // Inverse relationship to USD index
  const computedCadUsd = Number((0.74 + ((computedOil - 80) * 0.002)).toFixed(3)); // Canadian Dollar (Loonie) tracks oil

  const pedagogyTranslations = {
    kids: {
      intro: "Gold, silver, and oil are best friends that usually move in the same direction! When oil gets expensive, it costs major money to run the digging machines to mine gold, which makes gold go up too!",
      oilConnect: "To dig up shiny gold, you need big heavy yellow trucks. Those trucks drink a LOT of diesel oil. Thus, gold cost tracks oil fuel!"
    },
    highschool: {
      intro: "Commodities correlate due to physical macro inputs. Precious metals (gold/silver) are defensive capital stores. Crude oil is the core energy input that fuels global supply lines and the massive machinery utilized to mine those metals.",
      oilConnect: "Industrial operations must diesel-power their extraction drills. Higher oil prices raise the operational extraction expense of metals, putting a firm floor beneath gold prices."
    },
    college: {
      intro: "The intermarket correlation nexus between precious bullion and fossil fuels. Metals function as monetary reserves and sovereign hedge assets, while oil acts as the master denominator of global systemic cost-push inflation. Their trends are highly synchronized due to liquidity cascades and production feedback loops.",
      oilConnect: "Extraction energy inputs represent up to 30% of gold mine operational cost arrays. Additionally, oil price surges drive global Consumer Price Index (CPI) readings, inducing capital flight into inflation-hedging precious metals like gold and silver."
    },
    researcher: {
      intro: "Cross-asset multi-variable macro correlation mechanisms. Crude oil, gold, silver, and commodity-centric currencies are bound by energy-intensity metrics, systemic liquidity multipliers, and central bank reserve purchasing-power adjustments.",
      oilConnect: "Oil functions as the master thermodynamic price numerator. Mine overheads (hauling trucks, grinding circuits, smelting complexes) are heavily sensitive to hydrocarbon pricing structures. Simultaneously, positive balance-of-trade shifts in net oil-exporting nations trigger systemic recycling into sovereign reserve assets (gold/silver)."
    }
  };

  const correlationMeltState = [
    {
      item: "Gold Bullion (XAU)",
      price: `$${goldPriceSlide} / oz`,
      correlation: "Master Reference Anchor",
      behavior: "The ultimate inflation hedge and sovereign central bank backing reserve. Moves inversely to DXY."
    },
    {
      item: "Silver Bullion (XAG)",
      price: `$${computedSilver} / oz`,
      correlation: "+0.88 Positive",
      behavior: "Highly levered gold companion. Acts as both a monetary reserve asset and a critical high-precision industrial raw material."
    },
    {
      item: "Crude Oil (WTI/Brent)",
      price: `$${computedOil} / bbl`,
      correlation: "+0.76 Positive",
      behavior: "The energy pricing benchmark of Earth. Directly establishes transport overheads and metal mine operational costs."
    },
    {
      item: "US Dollar Index (DXY)",
      price: `${computedDxyEffect} pts`,
      correlation: "-0.82 Inverse",
      behavior: "The world reserve currency. When the dollar strength contracts, commodity values (denominated in USD) mathematically appreciate."
    },
    {
      item: "CAD/USD Currency",
      price: `$${computedCadUsd}`,
      correlation: "Commodity Dollar Track",
      behavior: "The Canadian Dollar tracks crude oil prices highly because oil represents Canada's premier sovereign export merchandise."
    }
  ];

  return (
    <div className="intermarket-correlations-layout flex flex-col gap-6 text-white text-left select-text font-sans animate-fadeIn">
      
      {/* MONUMENTAL BANNER */}
      <div className="p-6 md:p-8 bg-gradient-to-br from-[#020516] via-[#0b1b11]/80 to-purple-950/10 border border-emerald-500/25 rounded-[32px] relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <Activity className="w-64 h-64 text-emerald-400" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-emerald-400 font-black">
              BLUEPRINT 03 // THE OIL CO-DEPENDENCY MATRIX & DECOMPOSITION ENGINE
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white leading-none">
            Intermarket Commodities Correlation Engine
          </h1>
          <p className="text-zinc-350 text-sm sm:text-base max-w-4xl leading-relaxed">
            Unveiling the molecular bond of the real economy: how gold, silver, crude oil, and national commodity currencies react and move as one synchronized structural organism. Slide the master metal pricing nodes to simulate full systemic feedback cascades!
          </p>
        </div>

        {/* PEDAGOGICAL DECK */}
        <div className="bg-[#FF00C8]/5 border border-[#FF00C8]/25 rounded-2xl p-4 mt-6 font-mono text-xs max-w-3xl flex gap-3.5 items-start">
          <Info className="w-5 h-5 text-[#FF00C8] shrink-0 mt-0.5" />
          <div className="space-y-1.5 leading-normal">
            <span className="text-[#FF00C8] font-black uppercase tracking-widest block text-[9px]">PEDAGOGICAL SYLLABUS INTERFACE</span>
            <p className="leading-relaxed font-sans text-sm font-semibold text-zinc-200">
              {pedagogyTranslations[pedagogyMode].intro}
            </p>
          </div>
        </div>
      </div>

      {/* DETAILED INTERACTIVE MULTIPLIER MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* SLIDER COCKPIT (6/12) */}
        <div className="lg:col-span-6 bg-[#030612]/98 border border-white/5 rounded-3xl p-6 flex flex-col justify-between gap-6">
          <div className="space-y-1">
            <span className="font-mono text-[9px] text-[#00D9FF] tracking-wider uppercase font-black">ACTIVE CONTROLLER COCKPIT</span>
            <h3 className="text-white font-black text-lg sm:text-xl uppercase tracking-tight">SOLAR GOLD PRICE SYSTEM SLIDER</h3>
            <p className="text-zinc-400 text-xs font-semibold leading-relaxed font-sans">
              Adjust the price node in United States Dollars per ounce to force real-time statistical readjustments of silver, crude oil, DXY, and international commodity currencies.
            </p>
          </div>

          <div className="space-y-5 p-5 bg-black/60 border border-white/5 rounded-2xl">
            <div className="flex justify-between items-center font-mono">
              <span className="text-xs text-zinc-400 font-extrabold uppercase">GOLD INPUT REFERENCE</span>
              <span className="text-[#00D9FF] font-black text-xl animate-pulse">${goldPriceSlide} / OZ</span>
            </div>

            {/* DYNAMIC COMPREHENSION SLIDER */}
            <div className="space-y-1 pt-1">
              <input
                type="range"
                min="1000"
                max="5000"
                step="50"
                value={goldPriceSlide}
                onChange={(e) => setGoldPriceSlide(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer h-2 bg-neutral-900 rounded-lg appearance-none"
              />
              <div className="flex justify-between font-mono text-[9px] text-zinc-500 pt-1">
                <span>$1,000 (Recession baseline)</span>
                <span>$3,000 (Inflation surge)</span>
                <span>$5,000 (Hyper-inflation spike)</span>
              </div>
            </div>
          </div>

          {/* THE GOLD-OIL METABOLIC FEEDBACK EXPLAINER */}
          <div className="p-5 bg-[#0a0f0d] border border-emerald-500/10 rounded-2xl space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-400">
              <Flame className="w-5 h-5 shrink-0 animate-pulse" />
              <span className="font-mono text-xs font-black uppercase tracking-wider">THE MOLECULAR CORRELATION: WHY THE OIL CORRELATION DOMINATES</span>
            </div>
            <p className="text-zinc-350 text-xs font-sans font-semibold leading-relaxed">
              ★ {pedagogyTranslations[pedagogyMode].oilConnect}
            </p>
          </div>
        </div>

        {/* FEEDBACK MONITOR CONSOLE (6/12) */}
        <div className="lg:col-span-6 bg-gradient-to-br from-neutral-950 to-[#030510] border border-white/5 rounded-3xl p-6 flex flex-col gap-5 justify-between">
          <div className="space-y-1">
            <span className="font-mono text-[9px] text-[#FF00C8] tracking-wider uppercase font-black font-semibold">FEEDBACK CHANNELS</span>
            <h3 className="text-white font-black text-lg uppercase tracking-tight">REAL-TIME COMMODITY FEEDBACK CHANNELS</h3>
          </div>

          <div className="flex flex-col gap-3">
            {correlationMeltState.map((cor, i) => (
              <div 
                key={i} 
                className="p-3.5 bg-black/40 border border-white/[0.03] rounded-2xl flex items-center justify-between text-left relative overflow-hidden hover:border-[#FF00C8]/20 transition-all"
              >
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono text-zinc-550 block font-black uppercase">COMMODITY SECTOR 0{i+1}</span>
                  <span className="text-white font-black text-sm uppercase tracking-tight font-sans block">{cor.item}</span>
                  <p className="text-zinc-450 text-[10.5px] leading-tight max-w-[280px] font-medium font-sans">{cor.behavior}</p>
                </div>

                <div className="text-right flex flex-col items-end gap-1 font-mono">
                  <span className="text-emerald-400 font-extrabold text-[15px]">{cor.price}</span>
                  <span className="text-[9px] px-2 py-0.5 bg-white/5 rounded text-zinc-500 font-black">{cor.correlation}</span>
                </div>
              </div>
            ))}
          </div>

          {/* CORRELATION MATRIX STYLED BLOCK */}
          <div className="p-4 bg-yellow-950/15 border border-yellow-500/20 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-mono text-[9px] text-yellow-400 font-extrabold uppercase block tracking-wider">SYSTEM RISK NOTE ON BROKEN CORRELATIONS</span>
              <p className="text-zinc-400 text-xs font-semibold leading-relaxed">
                During systemic liquidity panics or extreme market flash crashes, standard correlations typically converge to 1. All assets—including safe-havens like gold—may briefly dump together as hedge funds are forced to liquidate everything to cover short margin calls.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
