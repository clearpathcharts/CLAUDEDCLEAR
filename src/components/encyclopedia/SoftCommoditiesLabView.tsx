// /src/components/encyclopedia/SoftCommoditiesLabView.tsx
import React, { useState } from 'react';
import { 
  Sprout, Info, ShieldCheck, ArrowRight, HelpCircle, 
  HelpCircleIcon, MessageCircle, AlertCircle, Wind, Sun, CloudRain
} from 'lucide-react';

interface SoftCommoditiesLabViewProps {
  selectFileNode?: (fileName: string) => void;
  pedagogyMode?: 'kids' | 'highschool' | 'college' | 'researcher';
  activeLanguage?: 'EN' | 'ZH' | 'ES' | 'PT' | 'KO';
}

export default function SoftCommoditiesLabView({ selectFileNode, pedagogyMode = 'college', activeLanguage = 'EN' }: SoftCommoditiesLabViewProps) {
  const [droughtIndex, setDroughtIndex] = useState<number>(30); // scale 0-100 normal is 30
  
  // Crop Pricing Sim Calculations
  const computedWheatPrice = Number((4.50 + ((droughtIndex - 30) * 0.085)).toFixed(2)); // Bushel soft red winter wheat
  const computedSoyPrice = Number((9.20 + ((droughtIndex - 30) * 0.165)).toFixed(2)); // Bushel soybeans reference cme

  const pedagogyTranslations = {
    kids: {
      intro: "Wheat is a tall yellow grass used to make your morning bread and cookies. Soy is a special green bean that feeds farm animals and helps make soybean oil for frying french fries!",
      cropDifference: "Soy plants are like magic Soil Doctors—they pull nitrogen fertilizer directly from the air to feed their roots! Wheat grass needs our farmers to add fertilizer to grow tall."
    },
    highschool: {
      intro: "Agricultural commodities represent direct human survival. Wheat remains a staple cereal grain ground into baking flour globally. Soy functions as a vital oilseed bean crushed to feed commercial livestock and produce biodiesel fuel.",
      cropDifference: "Soybeans are leguminous plants that perform biological nitrogen fixation. Wheat is a glutenous cereal grass sensitive to synthetic pricing fertilizers."
    },
    college: {
      intro: "The soft agricultural commodity ledger dominates global grain trading. Wheat operates as the baseline global caloric security asset with localized trade gates. Soybeans represent the premier vegetable protein/oil complex, driving global meat protein feed chains and clean biofuel sectors.",
      cropDifference: "Soybeans (Glycine max) biological structures use symbiotic rhizobia nodes for atmospheric nitrogen-fixing. Wheat (Triticum aestivum) requires heavy chemical fertilizer applications. Soy crushing yields soybean meal (high-density livestock feed) and oil (biofuel feedstock)."
    },
    researcher: {
      intro: "Agricultural macro balance-sheets. Wheat remains highly fragmented with critical regional trade vulnerabilities. Soybeans are concentrated in a deep US-Brazil-Argentina triad, making global logistics highly sensitive to El Niño cycles and transport corridors.",
      cropDifference: "Soybeans exhibit leguminous nitrogen-fixing genetics, lowering nitrogen fertilizer dependency but elevating phosphate needs. Wheat relies heavily on the N-P-K chemical fertilizer input matrix, making wheat margins deeply correlated with fossil-fuel synthesis costs."
    }
  };

  return (
    <div className="soft-commodities-lab-layout flex flex-col gap-6 text-white text-left select-text font-sans animate-fadeIn">
      
      {/* MONUMENTAL BLUEPRINT BANNER */}
      <div className="p-6 md:p-8 bg-gradient-to-br from-[#0c0f06] via-[#050616]/98 to-emerald-950/10 border border-lime-500/25 rounded-[32px] relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <Sprout className="w-64 h-64 text-lime-400" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-lime-400 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-lime-450 font-black text-lime-400">
              BLUEPRINT 04 // THE AGRICULTURAL GRAINS COMPREHENSIVE LAB
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white leading-none">
            Agricultural Soft Commodities: Wheat vs. Soy
          </h1>
          <p className="text-zinc-350 text-sm sm:text-base max-w-4xl leading-relaxed">
            Unveiling the botanical and geopolitical drivers of global food security. While oil and gold power machines and balance sheets, grains power human bodies and livestock herds. Study the biological, pricing, and clearing structures of wheat and soy!
          </p>
        </div>

        {/* PEDAGOGICAL DECK */}
        <div className="bg-[#FF00C8]/5 border border-[#FF00C8]/30 rounded-2xl p-4 mt-6 font-mono text-xs max-w-3xl flex gap-3.5 items-start">
          <Info className="w-5 h-5 text-[#FF00C8] shrink-0 mt-0.5" />
          <div className="space-y-1.5 leading-normal">
            <span className="text-[#FF00C8] font-black uppercase tracking-widest block text-[9px]">PEDAGOGICAL SYLLABUS INTERFACE</span>
            <p className="leading-relaxed font-sans text-sm font-semibold text-zinc-200">
              {pedagogyTranslations[pedagogyMode].intro}
            </p>
          </div>
        </div>
      </div>

      {/* COMPARATIVE SYSTEMATIC GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* CONTRACT / BIOLOGICAL HEAD-TO-HEAD MATRIX (8/12) */}
        <div className="lg:col-span-8 bg-black/65 border border-white/10 rounded-3xl p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-white font-black text-lg uppercase font-sans tracking-tight leading-none">WHEAT VS SOYBEAN BIOME-SPECS</h3>
            <span className="font-mono text-[9px] text-[#00D9FF] bg-[#00D9FF]/10 text-xs px-2 py-0.5 rounded border border-[#00D9FF]/20">COMMODITY ANALYSIS MATRIX</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
            
            {/* WHEAT COLUMN */}
            <div className="p-5 bg-yellow-950/5 border border-yellow-500/10 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full" />
                <span className="text-sm font-black font-mono text-yellow-400 uppercase">WHEAT (Triticum aestivum) // STAPLE</span>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <span className="font-mono text-[9px] text-zinc-500 uppercase font-black">BIOLOGICAL CONFIGURATION</span>
                  <p className="text-zinc-300 font-medium">A annual cereal grass. Harvest yields kernel seeds containing glutenous endosperm proteins, milled into essential baking flours.</p>
                </div>
                
                <div className="space-y-1">
                  <span className="font-mono text-[9px] text-zinc-500 uppercase font-black font-bold">SOVEREIGN NITROGEN DYNAMICS</span>
                  <p className="text-zinc-400 font-semibold leading-relaxed">Wheat is highly dependent on nitrogen-rich synthetic chemical fertilizers. Higher fossil fuel synthesis costs directly expand wheat crop budgets.</p>
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-[9px] text-zinc-500 uppercase font-bold">DEMAND INDUSTRIAL CHANNELS</span>
                  <p className="text-zinc-400 font-semibold">Direct caloric food security, commercial bakery supply networks, and sovereign famine relief reserves globally.</p>
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-[9px] text-zinc-500 uppercase font-bold">EXPORT WATER CHANNELS</span>
                  <p className="text-zinc-400 font-semibold">United States (Great Plains), Canada (Prairies), Russian Federation, Ukraine (Danube/Black Sea), and Australia.</p>
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-[9px] text-yellow-500 uppercase font-black">CME FUTURES CONTRACT SPECIFICATIONS</span>
                  <div className="p-3 bg-black/40 rounded-xl font-mono text-[10px] space-y-1 text-zinc-350">
                    <div>• Symbol: <b className="text-white">W</b></div>
                    <div>• Size: <b className="text-white">5,000 Bushels</b> (approx 136 metric tons)</div>
                    <div>• Delivery: <b className="text-white">Chicago Exchange Approved elevators</b></div>
                  </div>
                </div>
              </div>
            </div>

            {/* SOY COUM */}
            <div className="p-5 bg-emerald-950/5 border border-emerald-500/10 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full" />
                <span className="text-sm font-black font-mono text-emerald-400 uppercase">SOYBEANS (Glycine max) // OILSEED</span>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <span className="font-mono text-[9px] text-zinc-500 uppercase font-black">BIOLOGICAL CONFIGURATION</span>
                  <p className="text-zinc-300 font-medium">A leguminous annual oilseed. Crop pod seeds contain exceptionally high plant-protein densities and vegetable lipid/oils.</p>
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-[9px] text-zinc-500 uppercase font-black font-bold">SOVEREIGN NITROGEN DYNAMICS</span>
                  <p className="text-zinc-400 font-semibold leading-relaxed">
                    ★ {pedagogyTranslations[pedagogyMode].cropDifference}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-[9px] text-zinc-500 uppercase font-bold">DEMAND INDUSTRIAL CHANNELS</span>
                  <p className="text-zinc-400 font-semibold">Soybean crushing yields high-protein soy meal for commercial animal feed herds (swine/poultry) and oil for biodiesel refinery feeds.</p>
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-[9px] text-zinc-500 uppercase font-bold">EXPORT WATER CHANNELS</span>
                  <p className="text-zinc-400 font-semibold">Brazil (Cerrado/Mato Grosso), United States (Midwest Corn Belt), and Argentina (Pampa soils).</p>
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-[9px] text-emerald-500 uppercase font-black">CME FUTURES CONTRACT SPECIFICATIONS</span>
                  <div className="p-3 bg-black/40 rounded-xl font-mono text-[10px] space-y-1 text-zinc-350">
                    <div>• Symbol: <b className="text-white">ZS / S</b></div>
                    <div>• Size: <b className="text-white">5,000 Bushels</b> (approx 136 metric tons)</div>
                    <div>• Delivery: <b className="text-white">Illinois River delivery district terminals</b></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* CONTRACTION / CLIMATE SIMULATOR PANEL (4/12) */}
        <div className="lg:col-span-4 bg-[#030612]/95 border border-white/5 rounded-3xl p-6 flex flex-col justify-between gap-6">
          <div className="space-y-1.5 text-left">
            <span className="font-mono text-[9px] text-[#FF00C8] tracking-wider uppercase font-black font-bold">WEATHER & YIELD SIMULATOR</span>
            <h3 className="text-white font-black text-sm uppercase tracking-tight">EL NIÑO DROUGHT PRICING DECK</h3>
            <p className="text-zinc-400 text-xs leading-relaxed font-sans">
              Adjust the regional drought slider to simulate crop yield contractions due to systemic climate risk (El Niño/La Niña events) and observe grain market price feedback.
            </p>
          </div>

          {/* SIMULATOR CONTROLS */}
          <div className="p-5 bg-black/60 border border-white/5 rounded-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center font-mono text-xs">
              <span className="text-zinc-400 font-extrabold uppercase uppercase">CLIMATE ARIDITY INDEX</span>
              <span className="text-[#FF00C8] font-black text-lg">{droughtIndex}%</span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={droughtIndex}
              onChange={(e) => setDroughtIndex(Number(e.target.value))}
              className="w-full accent-[#FF00C8] cursor-pointer h-2 bg-neutral-900 rounded-lg appearance-none"
            />

            <div className="flex items-center gap-4 justify-between font-mono text-[8.5px] text-zinc-550 border-t border-white/5 pt-3">
              <span className="flex items-center gap-1"><CloudRain className="w-3 h-3 text-[#00D9FF]" /> Normal Rain</span>
              <span className="flex items-center gap-1"><Wind className="w-3 h-3 text-yellow-400" /> El Niño Crop Strain</span>
              <span className="flex items-center gap-1"><Sun className="w-3 h-3 text-red-500 animate-pulse" /> Extreme Drought</span>
            </div>
          </div>

          {/* OUTPUT CHANNELS */}
          <div className="flex flex-col gap-3">
            
            {/* WHEAT PRICE CH */}
            <div className="p-3.5 bg-[#171404]/30 border border-yellow-500/20 rounded-2xl flex items-center justify-between text-left">
              <div>
                <span className="text-[8.5px] font-mono text-zinc-550 block font-black uppercase">WHEAT CONTRACT VALUE</span>
                <span className="text-yellow-400 font-black text-sm uppercase font-mono tracking-tight text-[15px]">CHICAGO WHEAT (W)</span>
              </div>
              <div className="text-right font-mono">
                <span className="text-white font-black text-sm font-semibold">${computedWheatPrice}</span>
                <span className="text-[9px] block text-zinc-500 font-bold">per Bushel (BU)</span>
              </div>
            </div>

            {/* SOY PRICE CH */}
            <div className="p-3.5 bg-[#031c10]/20 border border-emerald-500/20 rounded-2xl flex items-center justify-between text-left">
              <div>
                <span className="text-[8.5px] font-mono text-zinc-550 block font-black uppercase">SOY CONTRACT VALUE</span>
                <span className="text-emerald-400 font-black text-sm uppercase font-mono tracking-tight text-[15px]">CME SOYBEANS (ZS)</span>
              </div>
              <div className="text-right font-mono">
                <span className="text-white font-black text-sm font-semibold">${computedSoyPrice}</span>
                <span className="text-[9px] block text-zinc-500 font-bold">per Bushel (BU)</span>
              </div>
            </div>

          </div>

          {/* WARNING MESSAGE SECTION */}
          {droughtIndex >= 65 && (
            <div className="p-4 bg-red-950/20 border border-red-500/25 rounded-2xl text-left flex items-start gap-3 animate-pulse text-red-400 font-mono text-[10px]">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-extrabold uppercase block tracking-wider">SOVEREIGN FOOD SECURITY CRISIS ALERT</span>
                <p className="font-sans font-semibold leading-relaxed">
                  Severe global grain reserves contraction. Import-dependent developing nations in North Africa and East Asia now face massive balance-of-trade drains and systemic inflationary wheat index triggers!
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
