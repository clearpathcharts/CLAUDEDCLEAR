import React, { useState, useEffect } from 'react';
import { 
  Building2, Leaf, Zap, Shield, Sparkles, Smile, GraduationCap, 
  TrendingUp, BarChart3, HelpCircle, ArrowRight, ShieldCheck, 
  Users, Layers, Award, Terminal, HardDrive, KeyRound, Lightbulb,
  Cpu, Globe, Hourglass, DollarSign, Heart, AlertOctagon, AlertTriangle,
  Flame, CloudRain, Sun, Info, Play, RefreshCw, BarChart4, MoveRight,
  ShoppingBag, Home, Truck, Briefcase, Activity, Compass, Hammer, ChevronRight
} from 'lucide-react';
import { usePageAutoUpdate } from '../../hooks/usePageAutoUpdate';

interface CivilizationEngineViewProps {
  selectFileNode: (fileName: string) => void;
}

// Interactive Data Types
type MacroWeather = 'normal' | 'inflation_heat' | 'recession_fog' | 'liquidity_glow' | 'energy_crisis' | 'ai_pulse';
type EmotionState = 'greed' | 'fear' | 'euphoria' | 'despair';
type ShockTrigger = 'none' | 'opec_embargo' | 'sanction_wall' | 'neural_displacement' | 'alliance_split';

export default function CivilizationEngineView({ selectFileNode }: CivilizationEngineViewProps) {
  
  // 1. Environment & Atmosphere States
  const [activeWeather, setActiveWeather] = useState<MacroWeather>('normal');
  const [isPlayingWeather, setIsPlayingWeather] = useState<boolean>(true);
  
  // Interactive Planetary Knobs (Requirement 1 & 2)
  const [globalTradeFriction, setGlobalTradeFriction] = useState<number>(30); // 0-100
  const [sovereignDebtLeverage, setSovereignDebtLeverage] = useState<number>(45); // 0-100
  const [liquidityNozzle, setLiquidityNozzle] = useState<number>(55); // 0-100
  const [geopoliticalFriction, setGeopoliticalFriction] = useState<number>(25); // 0-100

  // Interactive Human Dependency Map Nodes states (Requirement 3)
  const [disruptedNodes, setDisruptedNodes] = useState<string[]>([]);
  const [activeDependencySystem, setActiveDependencySystem] = useState<'electricity' | 'food_supply' | 'credit_flow'>('electricity');

  // Interactive Systemic Stress Scenarios (Requirement 4)
  const [activeStressScenario, setActiveStressScenario] = useState<string>('none');

  // Human History Recursion Engine States (Requirement 6)
  const [selectedHistoricalCrisis, setSelectedHistoricalCrisis] = useState<string>('none');
  
  // 2. Tab Navigation for different subsystems
  const [activeTab, setActiveTab] = useState<'observatory' | 'nervous' | 'timeline' | 'shocks' | 'cop_index' | 'everyday' | 'future'>('observatory');

  // 3. Shock Simulator State
  const [activeShock, setActiveShock] = useState<ShockTrigger>('none');
  const [simulationOutput, setSimulationOutput] = useState<string[]>([]);
  const [isSimulatingShock, setIsSimulatingShock] = useState<boolean>(false);

  // 4. Market Consciousness State
  const [activeEmotion, setActiveEmotion] = useState<EmotionState>('greed');

  // 5. Future Simulator Parameters
  const [automationRate, setAutomationRate] = useState<number>(45); // %
  const [energyGridCapacity, setEnergyGridCapacity] = useState<number>(80); // %
  const [futureOutputLog, setFutureOutputLog] = useState<string[]>([]);
  const [isRunningFutureSim, setIsRunningFutureSim] = useState<boolean>(false);

  // 6. Corporate Dependency Selection
  const [selectedCorp, setSelectedCorp] = useState<'msft' | 'nvda' | 'amzn' | 'aapl'>('nvda');

  // Handler that applies presets dynamically for a visual change (Requirement 2)
  const applyWeatherPreset = (weather: MacroWeather, stopAutoCycle: boolean = false) => {
    setActiveWeather(weather);
    if (stopAutoCycle) {
      setIsPlayingWeather(false);
    }
    switch (weather) {
      case 'inflation_heat':
        setGlobalTradeFriction(65);
        setSovereignDebtLeverage(75);
        setLiquidityNozzle(90);
        setGeopoliticalFriction(45);
        break;
      case 'recession_fog':
        setGlobalTradeFriction(45);
        setSovereignDebtLeverage(85);
        setLiquidityNozzle(15);
        setGeopoliticalFriction(35);
        break;
      case 'liquidity_glow':
        setGlobalTradeFriction(20);
        setSovereignDebtLeverage(35);
        setLiquidityNozzle(98);
        setGeopoliticalFriction(15);
        break;
      case 'energy_crisis':
        setGlobalTradeFriction(85);
        setSovereignDebtLeverage(60);
        setLiquidityNozzle(30);
        setGeopoliticalFriction(80);
        break;
      case 'ai_pulse':
        setGlobalTradeFriction(35);
        setSovereignDebtLeverage(40);
        setLiquidityNozzle(85);
        setGeopoliticalFriction(25);
        break;
      case 'normal':
      default:
        setGlobalTradeFriction(30);
        setSovereignDebtLeverage(45);
        setLiquidityNozzle(50);
        setGeopoliticalFriction(20);
        break;
    }
  };

  // Sync sliders dynamically with active weather configuration
  useEffect(() => {
    applyWeatherPreset(activeWeather, false);
  }, [activeWeather]);

  // Multi-step simulator for environmental cycle pulses
  usePageAutoUpdate(() => {
    const statuses: MacroWeather[] = ['normal', 'inflation_heat', 'recession_fog', 'liquidity_glow', 'energy_crisis', 'ai_pulse'];
    setActiveWeather((prev) => {
      const nextIdx = (statuses.indexOf(prev) + 1) % statuses.length;
      return statuses[nextIdx];
    });
  }, { intervalMs: 10_000, enabled: isPlayingWeather, immediate: false });

  // Simulation run for high-impact world events
  const triggerWorldShock = (shock: ShockTrigger) => {
    setIsSimulatingShock(true);
    setActiveShock(shock);
    setSimulationOutput(['[SYSTEM REACTION INITIALIZED]', 'Deploying macroeconomic sensors globally...']);

    // Staggered output simulation to capture systemic shock transmission
    const timelines: Record<ShockTrigger, string[]> = {
      none: ['Normal systemic flows active.'],
      opec_embargo: [
        '⚠️ OIL SHOCK TRIGGERED: Crude Oil imports drop by 4.2 million barrels daily.',
        '🚚 Freight transport costs increase by 42% instantaneous margin calculation.',
        '🛒 Agricultural cost tracking increases: Fertilizer shipping fees rise.',
        '🍞 Retail consequences felt: Wheat product and milk shelf values surge by 15%.',
        '⚡ Core CPI Inflation leaps to 8.4%; Central bank triggers urgent interest rate hikes.'
      ],
      sanction_wall: [
        '⚠️ SANCTION WAR INITIATED: Advanced electronics supply lines separated.',
        '🔌 Raw semiconductor wafer packaging bottlenecks at global shipping straits.',
        '🛑 Neon gas refining operations halt; microchip assembly schedules slashed by 60%.',
        '💼 Hardware manufacturing layoffs begin across automotive and computing giants.',
        '📉 Regional currency values debase as trade deficits grow.'
      ],
      neural_displacement: [
        '⚠️ COGNITIVE AI AGENT EXPANSION: Software agencies assume front-office operations.',
        '💻 Logic output costs drop 99%, driving enterprise cloud margins to historic peaks.',
        '💼 Service center and legal research desk layoffs reach a rate of 12,000 weekly.',
        '🪙 Sovereign tax levels decline; public welfare spending budgets are adjusted.',
        '🚀 Universal Basic Dividend proposals enter parliamentary session debate.'
      ],
      alliance_split: [
        '⚠️ GEOPOLITICAL ALLIANCE BLOCK SPLIT: Swift transaction lines decoupled.',
        '🪙 Parallel settlement ledger systems activated in energy-dominant corridors.',
        '📉 Foreign capital seeks safe-haven treasury bonds, causing short-term liquidity freezes.',
        '🍞 Basic food staples and coal reserves face export restrictions from major producing states.',
        '🛡️ Defense infrastructure spend reaches 6% of national GDP counters.'
      ]
    };

    let idx = 0;
    const interval = setInterval(() => {
      if (idx < timelines[shock].length) {
        setSimulationOutput((prev) => [...prev, timelines[shock][idx]]);
        idx++;
      } else {
        setIsSimulatingShock(false);
        clearInterval(interval);
      }
    }, 1200);
  };

  // Human future simulation engine
  const runFutureSpeculation = () => {
    setIsRunningFutureSim(true);
    setFutureOutputLog(['[GENERATOR PROJECTION SEED ESTABLISHED]', 'Calculating future human labor, energy, and social structures...']);

    const outputs = [
      `⚙️ Automated Computation Rate: ${automationRate}% of computational processing tasks automated.`,
      `⚡ Energy Grid Load Forecast: ${energyGridCapacity}% output baseline capacity under high computation server constraints.`,
      `📦 Logistics Autonomy Grade: Calculated at 70% automated drone and autonomous shipping integration.`,
      automationRate > 60 
        ? '💡 Welfare Model: Traditional wages no longer support basic households. Shift toward Sovereign Logic Dividends required.' 
        : '💡 Welfare Model: Hybrid workforce remains active with heavy retraining requirements.',
      energyGridCapacity > 90 
        ? '🔴 GRID CRISIS ALERT: High server load demands require local fossil combustion restarts or rapid nuclear builds.' 
        : '🟢 GRID STABLE: Baseline energy supports computing clusters safely.',
      '🔮 Civilization Forecast: Humanity transitions to a high-density digital infrastructure era.'
    ];

    let idx = 0;
    const interval = setInterval(() => {
      if (idx < outputs.length) {
        setFutureOutputLog((prev) => [...prev, outputs[idx]]);
        idx++;
      } else {
        setIsRunningFutureSim(false);
        clearInterval(interval);
      }
    }, 1000);
  };

  // Weather-specific design templates (The Real-Time Macro Environment)
  const getWeatherStyling = () => {
    switch (activeWeather) {
      case 'inflation_heat':
        return {
          title: 'INFLATION HEATWAVE ACTIVE',
          bg: 'from-amber-950/20 via-orange-950/20 to-black',
          border: 'border-orange-500/30',
          glow: 'shadow-[0_0_50px_rgba(249,115,22,0.1)]',
          textColor: 'text-orange-400',
          accent: '#f97316',
          desc: 'Money velocity is too high. Consumer price indexes are expanding, causing severe purchasing power erosion.'
        };
      case 'recession_fog':
        return {
          title: 'RECESSION FOG ENCROACHING',
          bg: 'from-slate-900/40 via-zinc-950 to-black',
          border: 'border-slate-500/20',
          glow: 'shadow-[0_0_50px_rgba(100,116,139,0.08)]',
          textColor: 'text-slate-400',
          accent: '#64748b',
          desc: 'Credit markets are locking. Consumer transactions decline, and business spending plans are postponed.'
        };
      case 'liquidity_glow':
        return {
          title: 'LIQUIDITY GLOW SURGE',
          bg: 'from-emerald-950/20 via-teal-950/15 to-black',
          border: 'border-emerald-500/30',
          glow: 'shadow-[0_0_50px_rgba(16,185,129,0.12)]',
          textColor: 'text-emerald-450 text-emerald-400',
          accent: '#10b981',
          desc: 'Central printing systems are injecting digital reserves. Capital flows easily into risk assets and stocks.'
        };
      case 'energy_crisis':
        return {
          title: 'ENERGY CRISIS OVERLAY',
          bg: 'from-red-950/25 via-stone-950 to-black',
          border: 'border-red-500/30',
          glow: 'shadow-[0_0_50px_rgba(239,68,68,0.12)]',
          textColor: 'text-red-400',
          accent: '#ef4444',
          desc: 'Key petroleum pipelines and electric grids are strained. Transportation fees and power costs soar.'
        };
      case 'ai_pulse':
        return {
          title: 'AI ENGINE EXPANSION PULSE',
          bg: 'from-purple-950/25 via-violet-950/20 to-black',
          border: 'border-purple-500/30',
          glow: 'shadow-[0_0_50px_rgba(168,85,247,0.15)]',
          textColor: 'text-purple-400',
          accent: '#a855f7',
          desc: 'Advanced machine learning chips consume immense electricity while reducing logical cost functions to zero.'
        };
      default:
        return {
          title: 'SYSTEMS BALANCED • STEADY CONDITIONS',
          bg: 'from-[#0d162d]/20 to-neutral-950',
          border: 'border-[#00D9FF]/10',
          glow: '',
          textColor: 'text-[#00D9FF]',
          accent: '#00D9FF',
          desc: 'Sovereign credit and supply lines represent steady operating parameters.'
        };
    }
  };

  const weatherStyle = getWeatherStyling();

  // Derived Simulation Metrics based on Planetary Knobs (Requirement 1 & 2)
  const derivedInflation = +(2.0 + (liquidityNozzle * 0.11) + (globalTradeFriction * 0.05) - (sovereignDebtLeverage * 0.015)).toFixed(1);
  const derivedFragility = +(15 + (sovereignDebtLeverage * 0.45) + (geopoliticalFriction * 0.40)).toFixed(0);
  const derivedSurvivalIndex = +Math.max(0, Math.min(100, 100 - (derivedFragility * 0.5) - (Math.max(0, derivedInflation - 3) * 2.5))).toFixed(0);
  const derivedComputeFlux = +( (liquidityNozzle * 75) + (100 - globalTradeFriction) * 25 ).toFixed(0);

  return (
    <div className="flex flex-col gap-6 font-sans select-none animate-fadeIn select-text pb-12 text-zinc-350">
      
      {/* 
        =========================================
        PART 9: THE FINAL HOLOGRAPHIC ATMOSPHERE (MAIN HUB HERO)
        =========================================
      */}
      <section 
        id="observatory-hero"
        className={`relative overflow-hidden border p-8 md:p-10 rounded-[32px] bg-gradient-to-br ${weatherStyle.bg} ${weatherStyle.border} ${weatherStyle.glow} transition-all duration-1000 shadow-2xl relative`}
      >
        {/* Layered neon fog design & ambient indicators */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/40 to-black/90 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[120px] pointer-events-none" 
          style={{ backgroundColor: `${weatherStyle.accent}12` }} />
        
        {/* Floating tech metrics bar */}
        <div className="absolute top-0 right-0 p-4 flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-[9px] font-black tracking-widest text-zinc-500 bg-neutral-900/80 px-2.5 py-1 rounded-md border border-white/5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>OBSERVATORY LIVE</span>
          </div>
          <button 
            id="weather-cycle-toggle"
            onClick={() => setIsPlayingWeather(!isPlayingWeather)} 
            className="p-1 px-1.5 bg-neutral-900/60 rounded border border-white/5 text-[9px] font-mono text-zinc-400 hover:text-white cursor-pointer"
          >
            {isPlayingWeather ? '⏸ AUTO-CYCLE' : '▶ MANUAL'}
          </button>
        </div>

        <div className="relative z-10 max-w-[850px] flex flex-col gap-3">
          <span className={`inline-block px-3 py-0.5 bg-black/40 border ${weatherStyle.border} ${weatherStyle.textColor} text-[9.5px] font-black tracking-widest uppercase font-mono rounded-full max-w-fit`}>
            {weatherStyle.title}
          </span>
          <h2 className="text-white font-black text-2.5xl md:text-3.5xl tracking-tight leading-none uppercase">
            A Living Civilization Observatory <br/>
            <span className="text-[#00D9FF] text-2xl md:text-3xl">& Economic Intelligence Engine</span>
          </h2>
          <p className="text-zinc-400 text-xs md:text-sm leading-relaxed max-w-[750px]">
            {weatherStyle.desc} Humanity's survival has evolved from primitive trade to highly dense logic systems. 
            Step into the planetary cockpit below to observe the economic nervous system of civilization.
          </p>

          <div className="flex flex-wrap gap-2 items-center mt-3 pt-3 border-t border-white/5">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">ATMOSPHERIC RE-ALIGNMENT CONTROLS:</span>
            <div className="flex flex-wrap gap-1">
              {(['normal', 'inflation_heat', 'recession_fog', 'liquidity_glow', 'energy_crisis', 'ai_pulse'] as MacroWeather[]).map((weather) => (
                <button
                  id={`weather-btn-${weather}`}
                  key={weather}
                  onClick={() => {
                    applyWeatherPreset(weather, true);
                  }}
                  className={`px-2.5 py-0.5 rounded text-[8.5px] font-bold font-mono uppercase tracking-wider transition-all border cursor-pointer ${activeWeather === weather ? 'bg-white/10 text-white border-white/30' : 'bg-neutral-950/40 text-zinc-500 border-white/5 hover:text-zinc-350'}`}
                >
                  {weather.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 
        =========================================
        REAL-TIME CORE TABS
        =========================================
      */}
      <div 
        id="observatory-tabs"
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-1.5 bg-neutral-950/60 p-1 border border-white/5 rounded-2xl"
      >
        {[
          { id: 'observatory', label: '1. Central Observatory', icon: <Compass className="w-3.5 h-3.5" /> },
          { id: 'nervous', label: '2. Nervous System', icon: <Activity className="w-3.5 h-3.5" /> },
          { id: 'timeline', label: '3. Humanity Timeline', icon: <Hourglass className="w-3.5 h-3.5" /> },
          { id: 'shocks', label: '4. Shock Waves', icon: <AlertOctagon className="w-3.5 h-3.5" /> },
          { id: 'cop_index', label: '5. Corporate Constellation', icon: <Cpu className="w-3.5 h-3.5" /> },
          { id: 'everyday', label: '6. Everyday Living', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
          { id: 'future', label: '7. Human Future Spec', icon: <Sparkles className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            id={`tab-select-${tab.id}`}
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2 px-1 text-center font-mono text-[9px] uppercase font-bold tracking-wider rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${activeTab === tab.id ? 'bg-[#00D9FF]/10 text-white border border-[#00D9FF]/30 shadow-[0_0_15px_rgba(0,217,255,0.1)]' : 'text-zinc-550 border border-transparent hover:text-zinc-300'}`}
          >
            {tab.icon}
            <span>{tab.label.substring(3)}</span>
          </button>
        ))}
      </div>

      {/* 
        =========================================
        TAB CONTENT MODULES
        =========================================
      */}

      {/*
        -----------------------------------------
        TAB 1: CENTRAL OBSERVATORY
        -----------------------------------------
      */}
      {activeTab === 'observatory' && (
        <div id="subview-observatory" className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          
          {/* Main world economy pulsation visualization widget */}
          <div className="lg:col-span-2 p-6 bg-neutral-950/80 border border-white/5 rounded-3xl flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid pointer-events-none" />
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#00D9FF] animate-spin" style={{ animationDuration: '40s' }} />
                <div>
                  <h3 className="text-white font-extrabold text-xs uppercase tracking-wider">Planetary Macro Stress & Pulse</h3>
                  <p className="text-[10px] font-mono text-zinc-500 font-bold">REAL-TIME GLOBAL FLOW STRESS MONITORING MATRIX</p>
                </div>
              </div>
              <span className={`font-mono text-[9px] px-2.5 py-1 rounded-md border shadow-sm ${derivedFragility > 70 ? 'text-red-400 bg-red-950/20 border-red-500/30' : derivedFragility > 50 ? 'text-yellow-400 bg-yellow-950/20 border-yellow-500/30' : 'text-emerald-400 bg-emerald-950/20 border-emerald-500/30'}`}>
                LIVE STATUS: {derivedFragility > 70 ? '⚠️ EMERGENCY PRESSURES' : derivedFragility > 50 ? '⚡ STRAINED CHANNELS' : '🟢 STABLE COEXISTENCE'}
              </span>
            </div>

            {/* Glowing planetary interactive map block */}
            <div className="h-64 rounded-2xl bg-black/60 border border-white/5 relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px]" />
              
              {/* Central Pulsating Core */}
              <div className="absolute w-44 h-44 rounded-full border border-zinc-900/60 flex items-center justify-center animate-pulse" style={{ animationDuration: `${Math.max(1.5, 6 - (derivedFragility / 20))}s` }}>
                <div className="w-32 h-32 rounded-full border border-zinc-850 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full border bg-black flex flex-col items-center justify-center relative cursor-pointer group hover:scale-105 transition-all"
                    style={{ borderColor: weatherStyle.accent, boxShadow: `0 0 40px ${weatherStyle.accent}20` }}>
                    <span className="text-xl">{activeWeather === 'normal' ? '🪐' : activeWeather === 'inflation_heat' ? '🔥' : activeWeather === 'recession_fog' ? '🌫️' : activeWeather === 'liquidity_glow' ? '🟢' : activeWeather === 'energy_crisis' ? '🚨' : '🤖'}</span>
                    <span className="font-mono text-[8px] text-zinc-500 mt-1 uppercase">ORBIT CORE</span>
                  </div>
                </div>
              </div>

              {/* Surrounding Constellation nodes (Energy, Shipping, Treasury flows) */}
              <div id="const-node-north" className="absolute top-6 flex flex-col items-center animate-translateY" style={{ animationDuration: '6s' }}>
                <div className="p-2.5 bg-[#03060c] border border-[#00D9FF]/20 rounded-xl flex items-center gap-2">
                  <Zap className="w-3 h-3 text-yellow-500" />
                  <span className="font-mono text-[9px] text-zinc-300 font-bold">GRID SUPPLY: {Math.max(10, 120 - globalTradeFriction)}%</span>
                </div>
                <div className="h-4 w-px bg-gradient-to-b from-[#00D9FF]/40 to-transparent" />
              </div>

              <div id="const-node-east" className="absolute right-8 flex items-center">
                <div className="w-4 h-px bg-gradient-to-r from-transparent to-purple-500/40" />
                <div className="p-2.5 bg-[#03060c] border border-purple-500/20 rounded-xl flex items-center gap-2">
                  <Cpu className="w-3 h-3 text-purple-400" />
                  <span className="font-mono text-[9px] text-zinc-300 font-bold">COMPUTE: {derivedComputeFlux} FLOPS</span>
                </div>
              </div>

              <div id="const-node-west" className="absolute left-8 flex items-center">
                <div className="p-2.5 bg-[#03060c] border border-emerald-500/20 rounded-xl flex items-center gap-2">
                  <DollarSign className="w-3 h-3 text-emerald-400" />
                  <span className="font-mono text-[9px] text-zinc-300 font-bold">RESERVES: ${(120 - (sovereignDebtLeverage * 0.8)).toFixed(0)}T FIAT</span>
                </div>
                <div className="w-4 h-px bg-gradient-to-l from-transparent to-emerald-500/40" />
              </div>

              <div id="const-node-south" className="absolute bottom-6 flex flex-col items-center">
                <div className="h-4 w-px bg-gradient-to-t from-red-500/40 to-transparent" />
                <div className="p-2.5 bg-[#03060c] border border-red-500/20 rounded-xl flex items-center gap-2">
                  <Truck className="w-3 h-3 text-red-500" />
                  <span className="font-mono text-[9px] text-zinc-300 font-bold">TRADE SHIELDS: {Math.max(10, 100 - geopoliticalFriction)}%</span>
                </div>
              </div>

              {/* Real-time ticker overlaid in space */}
              <div className="absolute bottom-2 left-4 right-4 flex justify-between items-center text-[8px] font-mono text-zinc-500">
                <span>PLANET COORDINATES: LAT=37.5°N, LNG=122.4°W</span>
                <span>SYSTEMIC WEAKNESS LEVEL: {derivedFragility}/100</span>
              </div>
            </div>

            {/* The 4 Planetary Knobs (Requirement 1 & 2) */}
            <div className="p-4 bg-neutral-900/40 border border-white/5 rounded-2xl flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="font-mono text-[9.5px] text-[#00D9FF] font-black uppercase tracking-wider">Planetary Cockpit System Knobs</span>
                <span className="font-mono text-[8.5px] text-zinc-500 font-bold">INTERACTIVE VARIATION CONTROLLORS</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="flex justify-between items-center text-[9px] font-mono">
                    <span className="text-zinc-400 uppercase">Trade Friction</span>
                    <span className="text-orange-400 font-extrabold">{globalTradeFriction}%</span>
                  </div>
                  <input
                    id="obs-knob-trade"
                    type="range"
                    min="5"
                    max="95"
                    value={globalTradeFriction}
                    onChange={(e) => {
                      setGlobalTradeFriction(parseInt(e.target.value));
                      setIsPlayingWeather(false);
                    }}
                    className="w-full mt-1.5 accent-orange-500 h-1 bg-zinc-850 rounded-lg cursor-pointer animate-none"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center text-[9px] font-mono">
                    <span className="text-zinc-400 uppercase">Debt Leverage</span>
                    <span className="text-rose-450 text-rose-400 font-extrabold">{sovereignDebtLeverage}%</span>
                  </div>
                  <input
                    id="obs-knob-debt"
                    type="range"
                    min="5"
                    max="95"
                    value={sovereignDebtLeverage}
                    onChange={(e) => {
                      setSovereignDebtLeverage(parseInt(e.target.value));
                      setIsPlayingWeather(false);
                    }}
                    className="w-full mt-1.5 accent-rose-500 h-1 bg-zinc-855 rounded-lg cursor-pointer animate-none"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center text-[9px] font-mono">
                    <span className="text-zinc-400 uppercase">Liquidity Nozzle</span>
                    <span className="text-emerald-400 font-extrabold">{liquidityNozzle}%</span>
                  </div>
                  <input
                    id="obs-knob-liquidity"
                    type="range"
                    min="5"
                    max="95"
                    value={liquidityNozzle}
                    onChange={(e) => {
                      setLiquidityNozzle(parseInt(e.target.value));
                      setIsPlayingWeather(false);
                    }}
                    className="w-full mt-1.5 accent-emerald-500 h-1 bg-zinc-855 rounded-lg cursor-pointer animate-none"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center text-[9px] font-mono">
                    <span className="text-zinc-400 uppercase">Geopol Tension</span>
                    <span className="text-purple-400 font-extrabold">{geopoliticalFriction}%</span>
                  </div>
                  <input
                    id="obs-knob-geopol"
                    type="range"
                    min="5"
                    max="95"
                    value={geopoliticalFriction}
                    onChange={(e) => {
                      setGeopoliticalFriction(parseInt(e.target.value));
                      setIsPlayingWeather(false);
                    }}
                    className="w-full mt-1.5 accent-purple-500 h-1 bg-zinc-855 rounded-lg cursor-pointer animate-none"
                  />
                </div>
              </div>
            </div>

            {/* Sub-explanation text mapping back to the observatory theme */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-neutral-900/40 border border-white/5 rounded-xl">
                <span className="font-mono text-[8.5px] text-zinc-500 uppercase font-black block">WORLD TRADE INDICES</span>
                <span className="text-white font-extrabold text-xs block mt-1">Friction Coeff: {(globalTradeFriction / 30).toFixed(2)}x</span>
                <p className="text-zinc-400 text-[10px] mt-0.5">Maritime bottlenecks scale based on raw regional trade policy friction parameters.</p>
              </div>

              <div className="p-3 bg-neutral-900/40 border border-white/5 rounded-xl">
                <span className="font-mono text-[8.5px] text-zinc-500 uppercase font-black block">LIQUIDITY SURGE VALUE</span>
                <span className={`font-extrabold text-xs block mt-1 ${liquidityNozzle > 75 ? 'text-emerald-450 text-emerald-400' : 'text-zinc-350'}`}>
                  +${(liquidityNozzle * 2.4).toFixed(1)}B / Month Surplus
                </span>
                <p className="text-zinc-400 text-[10px] mt-0.5">Central banking corridors adjusting direct money expansion coefficients globally.</p>
              </div>

              <div className="p-3 bg-neutral-900/40 border border-white/5 rounded-xl">
                <span className="font-mono text-[8.5px] text-zinc-500 uppercase font-black block">PULSE GENERATION RATE</span>
                <span className="text-white font-extrabold text-xs block mt-1">{derivedComputeFlux} Exaflops load</span>
                <p className="text-zinc-400 text-[10px] mt-0.5">Baseline computational infrastructure extraction required to route sovereign decisions.</p>
              </div>
            </div>
          </div>

          {/* Sibling card: THE GLOBAL STRESS MAP AT-A-GLANCE (Right Column) */}
          <div className="p-6 bg-neutral-950/80 border border-white/5 rounded-3xl flex flex-col justify-between gap-4 animate-fadeIn">
            <div>
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <Activity className="w-4 h-4 text-rose-455 text-rose-400 animate-pulse" />
                <div>
                  <h3 className="text-white font-extrabold text-xs uppercase tracking-wider">Planetary Pulse & Projections</h3>
                  <span className="text-[10px] font-mono text-zinc-500">ATMOSPHERIC MACRO INDICATORS</span>
                </div>
              </div>

              {/* Dynamic Derived Readouts (Requirement 2 & 4) */}
              <div className="space-y-2 mt-4">
                <span className="font-mono text-[9px] uppercase tracking-wider font-extrabold text-[#00D9FF] block">DYNAMIC COCKPIT GAUGE READOUTS</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-black/60 border border-white/5 hover:border-white/10 rounded-xl text-center">
                    <span className="text-[8px] font-mono text-zinc-500 block uppercase">CALCULATED INFLATION</span>
                    <span className={`text-base font-mono font-black block mt-1 ${derivedInflation > 8.0 ? 'text-red-400 animate-pulse' : derivedInflation > 5.0 ? 'text-yellow-400' : 'text-emerald-400'}`}>{derivedInflation}%</span>
                  </div>
                  <div className="p-3 bg-black/60 border border-white/5 hover:border-white/10 rounded-xl text-center">
                    <span className="text-[8px] font-mono text-zinc-500 block uppercase">SYS FRAGILITY RATIO</span>
                    <span className={`text-base font-mono font-black block mt-1 ${derivedFragility > 70 ? 'text-red-400 animate-pulse' : derivedFragility > 40 ? 'text-yellow-400' : 'text-[#00D9FF]'}`}>{derivedFragility}/100</span>
                  </div>
                  <div className="p-3 bg-black/60 border border-white/5 hover:border-white/10 rounded-xl text-center col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[8px] font-mono text-zinc-500 uppercase">SURVIVAL CONFIDENCE RATE</span>
                      <span className={`text-[10px] font-mono font-black ${derivedSurvivalIndex < 50 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>{derivedSurvivalIndex}%</span>
                    </div>
                    <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-500 ${derivedSurvivalIndex < 50 ? 'bg-red-500' : derivedSurvivalIndex < 75 ? 'bg-yellow-500' : 'bg-emerald-500'}`} style={{ width: `${derivedSurvivalIndex}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive macro stress scenario trigger buttons (Requirement 4) */}
            <div className="my-2 border-t border-b border-white/5 py-3">
              <span className="font-mono text-[9px] uppercase tracking-wider font-extrabold text-rose-455 text-rose-450 block mb-2">CINEMATIC SCENARIO SIMULATORS</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'normal_preset', name: 'Balanced State', icon: '🪐', raw: [30, 45, 50, 20] },
                  { id: 'hyper_spiral', name: 'Inflation Helix', icon: '🔥', raw: [65, 80, 95, 45] },
                  { id: 'decoupling_block', name: 'Supply Breakdown', icon: '🛡️', raw: [90, 60, 25, 90] },
                  { id: 'compute_goldrush', name: 'Silicon Surge', icon: '🤖', raw: [25, 40, 85, 15] }
                ].map((preset) => (
                  <button
                    id={`obs-preset-btn-${preset.id}`}
                    key={preset.id}
                    onClick={() => {
                      setGlobalTradeFriction(preset.raw[0]);
                      setSovereignDebtLeverage(preset.raw[1]);
                      setLiquidityNozzle(preset.raw[2]);
                      setGeopoliticalFriction(preset.raw[3]);
                      setIsPlayingWeather(false);
                      setActiveStressScenario(preset.name);
                    }}
                    className={`py-1.5 px-2 bg-[#02050e] border rounded-lg text-[9.5px] font-mono font-bold uppercase transition-all cursor-pointer flex items-center justify-start gap-1 ${activeStressScenario === preset.name ? 'border-[#00D9FF] text-white shadow-[0_0_8px_rgba(0,186,220,0.15)] bg-slate-900' : 'border-white/5 text-zinc-450 hover:text-zinc-350'}`}
                  >
                    <span>{preset.icon}</span>
                    <span className="truncate">{preset.name}</span>
                  </button>
                ))}
              </div>
              
              {activeStressScenario !== 'none' && (
                <div className="mt-3 p-2 bg-black/40 border border-white/5 rounded-lg text-[10px] text-zinc-400 leading-normal animate-fadeIn">
                  <span className="text-zinc-500 font-mono text-[8px] uppercase font-black block">SYS DEBATE CORRELATION LOG</span>
                  When <strong className="text-white">{activeStressScenario}</strong> is forced: Indicators shift and downstream subsystems immediately feel structural pressures.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/5 text-center">
              {/* Jump shortcut link */}
              <button 
                id="jump-to-global-atlas"
                onClick={() => selectFileNode('global-atlas.html')} 
                className="py-1.5 w-full bg-[#00D9FF]/10 text-[#00D9FF] hover:bg-[#00D9FF]/20 text-[10px] font-mono font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>🚀 Travel to Interactive Sovereign Atlas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/*
        -----------------------------------------
        TAB 2: THE CIVILIZATION NERVOUS SYSTEM
        -----------------------------------------
      */}
      {activeTab === 'nervous' && (
        <div id="subview-nervous" className="p-6 bg-[#040915]/95 border border-white/10 rounded-3xl flex flex-col gap-6 shadow-xl animate-fadeIn">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-500 animate-pulse" />
              <div>
                <h3 className="text-white font-extrabold text-xs uppercase tracking-wider">The Living Human Dependency Map</h3>
                <span className="text-[10px] font-mono text-zinc-500 font-bold">SYSTEMIC CASCADE FAILURE & BOTTLENECK SIMULATOR</span>
              </div>
            </div>
            
            <button
              id="reset-dependency-nodes"
              onClick={() => setDisruptedNodes([])}
              className="px-2.5 py-1 bg-zinc-900/80 border border-white/5 text-[9px] font-mono text-zinc-300 hover:text-white hover:border-white/20 transition-all rounded"
            >
              🔄 RESET PIPELINES
            </button>
          </div>

          <p className="text-zinc-400 text-xs leading-relaxed max-w-[800px]">
            Societal survival is highly fragile. Physical electricity pipelines, shipping corridors, and credit lines form the baseline architecture. 
            <strong> Click on any structural node in the pipelines below to toggle its state.</strong> Watch how a single breakdown cascades downstream to collapse dependent human networks.
          </p>

          {/* Pipeline Switch Tab Buttons */}
          <div className="flex gap-1.5 border-b border-white/5 pb-3">
            {[
              { id: 'electricity', label: '⚡ Electricity Grid Corridor', color: 'text-yellow-450 text-yellow-400' },
              { id: 'food_supply', label: '🌾 Food Supply Pipelines', color: 'text-orange-450 text-orange-400' },
              { id: 'credit_flow', label: '💳 Capital & Credit Pipeline', color: 'text-emerald-450 text-emerald-400' }
            ].map(sys => (
              <button
                id={`dep-sys-switch-${sys.id}`}
                key={sys.id}
                onClick={() => {
                  setActiveDependencySystem(sys.id as any);
                }}
                className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase border rounded-lg transition-all cursor-pointer ${activeDependencySystem === sys.id ? 'bg-slate-900/60 text-white border-[#00D9FF]' : 'bg-black/20 text-zinc-500 border-white/5 hover:text-zinc-350'}`}
              >
                <span className={sys.color}>{sys.label}</span>
              </button>
            ))}
          </div>

          {/* Cascade Logic Implementation */}
          {(() => {
            const pipelines = {
              electricity: [
                { id: 'plant', name: 'Baseload Power Plants', icon: '⚡', desc: 'Central hydro, gas and nuclear reactors providing basic grid voltage.' },
                { id: 'sub', name: 'High-Voltage Transformer Stations', icon: '🎛️', desc: 'Step-down sub-stations distribution nodes routing flows to cities.' },
                { id: 'route', name: 'Internet Routing Servers', icon: '🌐', desc: 'Decentralized optical fibre relays powering internet databases.' },
                { id: 'f_serv', name: 'Sovereign Bank Servers', icon: '🖥️', desc: 'Cloud financial ledgers managing national card transactions.' },
                { id: 'hops', name: 'Hospital Care Facilities', icon: '🏥', desc: 'Emergency response, care wards, and local life-support grids.' }
              ],
              food_supply: [
                { id: 'farm', name: 'Agricultural Cultivation', icon: '🌾', desc: 'Industrial farming tracts seeding and harvesting global grains.' },
                { id: 'freight', name: 'Maritime Cargo Vessels', icon: '🚢', desc: 'Bulk ocean container ships moving harvests across global straits.' },
                { id: 'super', name: 'Retail Supermarkets', icon: '🛒', desc: 'Just-in-time neighborhood grocery hubs relying on lean inventories.' },
                { id: 'nourish', name: 'Family Nourishment', icon: '🍎', desc: 'Everyday home nutrition preventing social distress.' }
              ],
              credit_flow: [
                { id: 'central', name: 'Central Reserves Spigot', icon: '🏦', desc: 'Interbank liquidity controls set by global central banking actors.' },
                { id: 'comm_banks', name: 'Commercial Lending Hubs', icon: '💳', desc: 'Fractional reserve accounts generating credit products.' },
                { id: 'sm_biz', name: 'Small Business Payrolls', icon: '🏢', desc: 'Local community employers dispersing wages and purchasing stock.' },
                { id: 'wages', name: 'Household Wage Security', icon: '💵', desc: 'Consumer balance buffers stabilizing daily purchase power.' }
              ]
            };

            const activeList = pipelines[activeDependencySystem];

            // Cascade broken formula checker
            const isDisrupted = (nodeId: string) => {
              const index = activeList.findIndex(n => n.id === nodeId);
              if (index === -1) return false;
              for (let i = 0; i <= index; i++) {
                if (disruptedNodes.includes(activeList[i].id)) return true;
              }
              return false;
            };

            const toggleDisruption = (nodeId: string) => {
              if (disruptedNodes.includes(nodeId)) {
                setDisruptedNodes(disruptedNodes.filter(id => id !== nodeId));
              } else {
                setDisruptedNodes([...disruptedNodes, nodeId]);
              }
            };

            return (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative mt-2">
                  {activeList.map((node, idx) => {
                    const broken = isDisrupted(node.id);
                    const isDirectSource = disruptedNodes.includes(node.id);

                    return (
                      <div
                        id={`dep-node-${node.id}`}
                        key={node.id}
                        onClick={() => toggleDisruption(node.id)}
                        className={`relative p-4 border rounded-2xl flex flex-col justify-between gap-3 cursor-pointer transition-all ${broken ? 'bg-red-950/20 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'bg-zinc-900/40 border-white/5 hover:border-white/10'}`}
                      >
                        <div className="absolute top-2 right-2 text-[8px] font-mono font-black text-zinc-500">
                          NODE 0{idx + 1}
                        </div>
                        <div>
                          <div className={`text-xl ${broken ? 'text-red-400 animate-pulse' : 'text-[#00D9FF]'}`}>
                            {node.icon}
                          </div>
                          <h4 className="text-white font-extrabold text-xs uppercase font-mono mt-2 leading-tight">
                            {node.name}
                          </h4>
                          <p className="text-zinc-400 text-[10px] mt-1.5 leading-relaxed">
                            {node.desc}
                          </p>
                        </div>

                        <div className={`text-[8.5px] font-mono leading-none py-1.5 px-2 rounded-lg border mt-2 flex items-center justify-between ${broken ? 'text-red-400 bg-red-950/40 border-red-500/30 font-black' : 'text-emerald-400 bg-emerald-950/10 border-emerald-500/20'}`}>
                          <span>{broken ? '❌ COLLAPSED' : '🟢 ACTIVE flow'}</span>
                          <span>{isDirectSource ? '🎯 DIRECT BREACH' : broken ? '🔗 CASCADE' : ''}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Poetic narration gravity context */}
                <div className="p-4 bg-black/40 border border-[#00D9FF]/10 rounded-xl mt-3 flex items-start gap-3">
                  <div className="text-xl">💡</div>
                  <div className="text-xs text-zinc-400 leading-relaxed font-sans">
                    <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest block font-black mb-1">Poetic Gravity Narration</span>
                    {disruptedNodes.length > 0 ? (
                      <p className="text-red-400 font-medium">
                        "A physical circuit or logistical bottleneck has fractured. In modern civilization, no sector lives in isolation. When one node collapses, human buffers deplete within days, demonstrating how beautifully fragile humanity's systems truly are."
                      </p>
                    ) : (
                      <p>
                        "A single electrical circuit is all that separates modern hygiene and safety from pre-industrial chaos. Capital, energy, and physical grains are bound together in the same living nervous system."
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/*
        -----------------------------------------
        TAB 3: THE CONTINUOUS HUMANITY TIMELINE
        -----------------------------------------
      */}
      {activeTab === 'timeline' && (
        <div id="subview-timeline" className="p-6 bg-[#040915]/95 border border-white/10 rounded-3xl flex flex-col gap-6 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Hourglass className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-white font-extrabold text-xs uppercase tracking-wider">The Continuous Humanity Timeline</h3>
              <span className="text-[10px] font-mono text-zinc-500">HOW CIVILIZATION EVOLVED ITS PHYSICAL & FIAT PLUMBINGS</span>
            </div>
          </div>

          <p className="text-zinc-400 text-xs leading-relaxed">
            Humanity did not start with sophisticated central bank algorithms. Travel through the primary tectonic eras of human organization:
          </p>

          <div className="space-y-4">
            {[
              { era: 'Barter and Metal Weights', timing: 'Prehistory - 1800s', key: 'Direct commodity ledger trades', desc: 'Humans traded physical crops and weight blocks of copper, gold, and silver. High transaction friction limited trade volume, but physical scarcity set precise constraints.' },
              { era: 'The Classical Iron & Steam standard', timing: '1800s - 1914', key: 'Rigid gold-backed paper bills', desc: 'The rise of physical factories led to paper currency pegging. Because bills had direct gold redemption guarantees, uncontrolled money printing was impossible. This limited inflation but prolonged recessions.' },
              { era: 'Central banking integration', timing: '1914 - 1971', key: 'Sovereign lender credit mechanisms', desc: 'Central banks took control to stabilize commercial collapses. In 1971, Nixon decoupled modern cash from metal backings, giving birth to the pure floating fiat system.' },
              { era: 'Globalization & Digital ledger expansion', timing: '1971 - 2022', key: 'Trillion dollar cross-border lines', desc: 'Multinational corporations outsourced manufacturing while banks securitized consumer debt. This kept consumer pricing stable but asset inflation soared.' },
              { era: 'The Silicon Cognitive era', timing: '2022 - Beyond', key: 'Computational AI civilization systems', desc: 'Human cognitive labor hours decoupling into algorithmic cloud compute models. Modern money aligns directly with microchip capabilities, silicon access, and power baseload grids.' }
            ].map((node, i) => (
              <div key={i} className="p-4 bg-black/40 border border-white/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-500/20 transition-all">
                <div className="md:w-1/4">
                  <span className="font-mono text-[9px] text-indigo-400 font-black block">STAGE 0{i+1} • {node.timing}</span>
                  <h4 className="text-white font-extrabold text-xs uppercase font-mono mt-1 pr-4">{node.era}</h4>
                </div>
                <div className="md:w-1/4">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold block">ANCHOR MECHANISM</span>
                  <span className="text-[#00D9FF] font-mono text-[10.5px] font-bold">{node.key}</span>
                </div>
                <div className="md:w-2/4">
                  <p className="text-zinc-400 text-[10.5px] leading-relaxed pt-2 md:pt-0 border-t md:border-t-0 border-white/5 md:border-l md:pl-4">
                    {node.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-right pt-2">
            <button 
              id="jump-to-time-matrix"
              onClick={() => selectFileNode('economic-memory-matrix.html')} 
              className="py-1.5 px-4 bg-purple-500 hover:bg-purple-400 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 max-w-fit ml-auto"
            >
              <span>⏳ Launch Economic Memory Time Machine</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/*
        -----------------------------------------
        TAB 4: WORLD EVENT SHOCK SIMULATOR
        -----------------------------------------
      */}
      {activeTab === 'shocks' && (
        <div id="subview-shocks" className="p-6 bg-[#040915]/95 border border-white/10 rounded-3xl flex flex-col gap-6 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <AlertOctagon className="w-5 h-5 text-red-400" />
            <div>
              <h3 className="text-white font-extrabold text-xs uppercase tracking-wider">The Systemic World Event Shock Simulator</h3>
              <span className="text-[10px] font-mono text-zinc-500">TEST HOW GLOBAL CONFLICTS & DISRUPTIONS CASCADE ACROSS VARIABLES</span>
            </div>
          </div>

          <p className="text-zinc-400 text-xs leading-relaxed">
            Macroeconomics is highly interconnected. Select any major structural stress event below to trace how it waves through fuel, transport, chip hubs, and grocery costs:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              { id: 'opec_embargo', label: 'Petroleum Embargo (OPEC)', icon: '🔥', desc: 'Arab oil producers choke choke point transport routes.' },
              { id: 'sanction_wall', label: 'Chip Export Sanction Wall', icon: '🔌', desc: 'Western alliances enforce sub-5nm microchip fab embargoes.' },
              { id: 'neural_displacement', label: 'Neural Labor Breakthrough', icon: '🤖', desc: 'Generative software agents automate white-collar desk tasks.' },
              { id: 'alliance_split', label: 'Bilateral Swap Ledger Crack', icon: '🛡️', desc: 'States decouple trade lines, setting up currency barriers.' }
            ].map((shock) => (
              <button
                id={`shock-set-${shock.id}`}
                key={shock.id}
                onClick={() => triggerWorldShock(shock.id as any)}
                className={`p-4 bg-black/60 border rounded-2xl flex flex-col text-left gap-2 cursor-pointer transition-all ${activeShock === shock.id ? 'border-red-500 bg-red-950/10' : 'border-white/5 hover:border-white/20'}`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-lg">{shock.icon}</span>
                  <span className={`w-2 h-2 rounded-full ${activeShock === shock.id ? 'bg-red-500 animate-ping' : 'bg-transparent'}`} />
                </div>
                <h4 className="text-white font-extrabold text-[11px] uppercase tracking-wide mt-1.5">{shock.label}</h4>
                <p className="text-zinc-500 text-[10px] leading-relaxed">{shock.desc}</p>
              </button>
            ))}
          </div>

          {/* Simulator telemetry display console */}
          <div className="p-5 bg-black border border-red-500/20 rounded-2xl font-mono text-xs text-red-400 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 text-[8px] text-zinc-650">SIM_TELEMETRICS_MATRIX_LOG</div>
            <div className="flex items-center gap-2 border-b border-white/5 pb-2.5 mb-2.5">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[10px] font-bold tracking-widest uppercase">System Shock Log Output Stream</span>
            </div>
            
            {simulationOutput.length === 0 ? (
              <div className="text-zinc-600 italic">Select a world shock parameter block above to initiate calculation cascade.</div>
            ) : (
              <div className="space-y-1">
                {simulationOutput.map((log, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-zinc-700">[{idx+1}]</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            )}

            {isSimulatingShock && (
              <div className="flex items-center gap-1.5 mt-4 text-zinc-500 italic text-[10px]">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Simulating pipeline variables...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/*
        -----------------------------------------
        TAB 5: THE CORPORATE CIVILIZATION INDEX
        -----------------------------------------
      */}
      {activeTab === 'cop_index' && (
        <div id="subview-corporate" className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          
          {/* Corporate list */}
          <div className="p-6 bg-neutral-950/80 border border-white/5 rounded-3xl flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <div>
                  <h3 className="text-white font-extrabold text-xs uppercase tracking-wider">Corporate Civilization Index</h3>
                  <span className="text-[10px] font-mono text-zinc-500">HOW MUCH OF CIV DEPENDS ON THESE MONOPOLIES?</span>
                </div>
              </div>
              <p className="text-zinc-400 text-[10.5px] mt-2.5 leading-relaxed">
                Large technology firms are no longer simple businesses selling products. They operate the underlying infrastructure arrays of human organization:
              </p>
            </div>

            <div className="space-y-2">
              {[
                { id: 'nvda', name: 'Nvidia Corp (NVDA)', sector: 'Compute Autonomy Layer', rate: '88% of Advanced AI Grids' },
                { id: 'msft', name: 'Microsoft (MSFT)', sector: 'Sovereign Business Plumbings', rate: '92% of Global Corporations' },
                { id: 'amzn', name: 'Amazon (AMZN)', sector: 'Physical Retail & Warehousing', rate: '44% of Cloud Servers' },
                { id: 'aapl', name: 'Apple Inc (AAPL)', sector: 'Personal Connected Devices', rate: '1.4B Active Daily Screens' },
              ].map((corp) => (
                <button
                  id={`corp-choice-${corp.id}`}
                  key={corp.id}
                  onClick={() => setSelectedCorp(corp.id as any)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${selectedCorp === corp.id ? 'bg-purple-500/10 border-purple-500 text-white' : 'bg-neutral-950 border-white/5 text-zinc-400 hover:border-white/15'}`}
                >
                  <div>
                    <span className="font-bold text-xs uppercase font-mono block">{corp.name}</span>
                    <span className="text-[9.5px] text-zinc-500 block leading-none mt-1">{corp.sector}</span>
                  </div>
                  <span className="font-mono text-[9.5px] text-[#00D9FF] bg-[#00D9FF]/5 px-2 py-0.5 rounded border border-[#00D9FF]/20">{corp.rate}</span>
                </button>
              ))}
            </div>

            <div className="pt-2">
              <span className="text-[9.5px] font-mono text-zinc-500">
                Sovereign Anti-Trust monitoring score calculated continuously.
              </span>
            </div>
          </div>

          {/* Corporate Dependency maps */}
          <div className="p-6 bg-neutral-950/80 border border-white/5 rounded-3xl lg:col-span-2 flex flex-col justify-between gap-5 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-purple-500/5 blur-[80px] pointer-events-none" />
            
            <div className="border-b border-white/5 pb-3">
              <span className="text-[9px] font-mono text-purple-400 uppercase font-black block">DEPENDENCY CONSTELLATION ANALYSIS</span>
              <h4 className="text-white font-extrabold text-sm uppercase mt-1">
                {selectedCorp === 'nvda' ? 'NVIDIA Corporation (NVDA) • Deep Impact' : selectedCorp === 'msft' ? 'Microsoft (MSFT) • Core Software Platform' : selectedCorp === 'amzn' ? 'Amazon (AMZN) • Global Delivery Grid' : 'Apple Inc (AAPL) • Personal Consumer Gates'}
              </h4>
              <p className="text-zinc-450 text-[10.5px] italic mt-0.5">
                "Quantifying how much human survival would fracture without this entity's continuous operation."
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {selectedCorp === 'nvda' && (
                <>
                  <div className="p-4 bg-black/40 border border-white/5 hover:border-white/10 rounded-xl transition-all">
                    <Cpu className="w-5 h-5 text-[#00D9FF] mb-2" />
                    <span className="font-mono text-[9.5px] text-[#00D9FF] font-black block">AI CHIP MONOPOLY</span>
                    <p className="text-zinc-400 text-[10px] mt-1 leading-relaxed">
                      Etching advanced Tensor cores at TSMC fables. AI startup software cannot compile logic maps without GPU allocations.
                    </p>
                  </div>
                  <div className="p-4 bg-black/40 border border-white/5 hover:border-white/10 rounded-xl transition-all">
                    <Zap className="w-5 h-5 text-yellow-400 mb-2" />
                    <span className="font-mono text-[9.5px] text-yellow-400 font-black block">ENERGY ALLOCATION</span>
                    <p className="text-zinc-400 text-[10px] mt-1 leading-relaxed">
                      Nvidia server blocks consume enormous power grids, forcing nations to allocate direct energy to compute farms.
                    </p>
                  </div>
                  <div className="p-4 bg-black/40 border border-white/5 hover:border-white/10 rounded-xl transition-all">
                    <Briefcase className="w-5 h-5 text-purple-400 mb-2" />
                    <span className="font-mono text-[9.5px] text-purple-400 font-black block">LABOR TRANSITION</span>
                    <p className="text-zinc-400 text-[10px] mt-1 leading-relaxed">
                      Nvidia graphics and microcomputing networks drive automation systems, replacing human cognitive workforce hours.
                    </p>
                  </div>
                </>
              )}

              {selectedCorp === 'msft' && (
                <>
                  <div className="p-4 bg-black/40 border border-white/5 hover:border-white/10 rounded-xl transition-all">
                    <Home className="w-5 h-5 text-indigo-400 mb-2" />
                    <span className="font-mono text-[9.5px] text-indigo-455 text-indigo-400 font-black block">BUSINESS SYSTEM BEDROCK</span>
                    <p className="text-zinc-400 text-[10px] mt-1 leading-relaxed">
                      Commercial banks, medical record desks, and airline schedules run directly on Windows OS systems.
                    </p>
                  </div>
                  <div className="p-4 bg-black/40 border border-white/5 hover:border-white/10 rounded-xl transition-all">
                    <CloudRain className="w-5 h-5 text-blue-450 text-blue-400 mb-2" />
                    <span className="font-mono text-[9.5px] text-blue-400 font-black block">AZURE CLOUD DATA</span>
                    <p className="text-zinc-400 text-[10px] mt-1 leading-relaxed">
                      Millions of corporate files and cloud databases settle hourly within regional Microsoft Azure host sites.
                    </p>
                  </div>
                  <div className="p-4 bg-black/40 border border-white/5 hover:border-white/10 rounded-xl transition-all">
                    <Sparkles className="w-5 h-5 text-amber-400 mb-2" />
                    <span className="font-mono text-[9.5px] text-amber-400 font-black block">AI COMPANION SHIELD</span>
                    <p className="text-zinc-400 text-[10px] mt-1 leading-relaxed">
                      Copilot models process commercial enterprise data, becoming the cognitive assistant of the workforce.
                    </p>
                  </div>
                </>
              )}

              {selectedCorp === 'amzn' && (
                <>
                  <div className="p-4 bg-black/40 border border-white/5 hover:border-white/10 rounded-xl transition-all">
                    <Truck className="w-5 h-5 text-yellow-450 text-yellow-400 mb-2" />
                    <span className="font-mono text-[9.5px] text-yellow-400 font-black block">LOGISTICS DOMINANCE</span>
                    <p className="text-zinc-400 text-[10px] mt-1 leading-relaxed">
                      Amazon shipping clusters move millions of grocery and retail items daily, keeping neighborhoods supplied.
                    </p>
                  </div>
                  <div className="p-4 bg-black/40 border border-white/5 hover:border-white/10 rounded-xl transition-all">
                    <HardDrive className="w-5 h-5 text-cyan-405 text-cyan-400 mb-2" />
                    <span className="font-mono text-[9.5px] text-cyan-400 font-black block">WEB CLOUD SERVERS (AWS)</span>
                    <p className="text-zinc-400 text-[10px] mt-1 leading-relaxed">
                      AWS serves 40%+ of global internet systems, meaning an AWS system lock freezes half of global internet assets.
                    </p>
                  </div>
                  <div className="p-4 bg-black/40 border border-white/5 hover:border-white/10 rounded-xl transition-all">
                    <Layers className="w-5 h-5 text-emerald-400 mb-2" />
                    <span className="font-mono text-[9.5px] text-emerald-400 font-black block">AUTOMATED ROBOT WAREHOUSE</span>
                    <p className="text-zinc-400 text-[10px] mt-1 leading-relaxed">
                      Warehouses coordinate robots to sorting grids, minimizing human packing costs to near-zero.
                    </p>
                  </div>
                </>
              )}

              {selectedCorp === 'aapl' && (
                <>
                  <div className="p-4 bg-black/40 border border-white/5 hover:border-white/10 rounded-xl transition-all">
                    <Users className="w-5 h-5 text-purple-400 mb-2" />
                    <span className="font-mono text-[9.5px] text-purple-400 font-black block">CUSTOMER RETENTION</span>
                    <p className="text-zinc-400 text-[10px] mt-1 leading-relaxed">
                      Billions are locked inside Apple pay and iCloud storage channels, making user device transitions impossible.
                    </p>
                  </div>
                  <div className="p-4 bg-black/40 border border-white/5 hover:border-white/10 rounded-xl transition-all">
                    <Cpu className="w-5 h-5 text-amber-400 mb-2" />
                    <span className="font-mono text-[9.5px] text-amber-400 font-black block">APPLE SILICON ENGINE</span>
                    <p className="text-zinc-400 text-[10px] mt-1 leading-relaxed">
                      In-house M-series chips allow computing packages to deploy high neural processes locally with low thermal loads.
                    </p>
                  </div>
                  <div className="p-4 bg-black/40 border border-white/5 hover:border-white/10 rounded-xl transition-all">
                    <Globe className="w-5 h-5 text-[#00D9FF] mb-2" />
                    <span className="font-mono text-[9.5px] text-[#00D9FF] font-black block">APP DEVELOPER ACCESS</span>
                    <p className="text-zinc-400 text-[10px] mt-1 leading-relaxed">
                      Apple controls access to its App Store, taking a 30% cut on modern digital services.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className={`p-4 rounded-xl border flex items-center gap-3 bg-[#03060c] ${weatherStyle.border}`}>
              <Info className="w-5 h-5 text-[#00D9FF] shrink-0" />
              <div className="text-[10px] text-zinc-400 leading-normal">
                <strong className="text-white uppercase font-sans">Civilization dependence index limit:</strong>
                {selectedCorp === 'nvda' && ' 88% of planetary AI compute clusters depend direct on GPU lithography wafers, indicating severe pipeline fragility if trade corridors freeze.'}
                {selectedCorp === 'msft' && ' 92% of corporate desktops run Windows software protocols, meaning software bugs immediately freeze global transportation schedules.'}
                {selectedCorp === 'amzn' && ' AWS forms the structural floor of modern web software. Amazon delivery networks form the daily caloric supply system of city networks.'}
                {selectedCorp === 'aapl' && ' Apple acts as the physical terminal portal to the internet for 1.4B high-wealth consumers, directing capital flow parameters daily.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/*
        -----------------------------------------
        TAB 6: THE HUMAN SURVIVAL LAYER (DAILY LIFE ENGINE)
        -----------------------------------------
      */}
      {activeTab === 'everyday' && (
        <div id="subview-everyday" className="p-6 bg-[#040915]/95 border border-white/10 rounded-3xl flex flex-col gap-6 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Heart className="w-5 h-5 text-rose-450 text-rose-400 animate-pulse" />
            <div>
              <h3 className="text-white font-extrabold text-xs uppercase tracking-wider">The Everyday Human Survival Layer</h3>
              <span className="text-[10px] font-mono text-zinc-500">CONNECTING COMPLEX MACRO TOPICS TO STAPLES IN DAILY LIFE</span>
            </div>
          </div>

          <p className="text-zinc-400 text-xs leading-relaxed">
            Central bank reports describe "Core inflation margins adjusting 25bps." But what do these parameters translate to for an actual household?
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex flex-col gap-2 relative overflow-hidden">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <span className="font-mono text-[9px] text-amber-400 uppercase font-bold">Grocery Bill Core</span>
              <h4 className="text-white font-extrabold text-xs">Groceries & Milk costs</h4>
              <p className="text-zinc-400 text-[10px] leading-relaxed">
                Fertilizer manufacturing demands sulfuric acid. When shipping corridors delay transport, farms pay 18% higher premiums, which shows up as expensive eggs on Main Street tables.
              </p>
            </div>

            <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex flex-col gap-2 relative overflow-hidden">
              <Home className="w-5 h-5 text-indigo-400" />
              <span className="font-mono text-[9px] text-indigo-400 uppercase font-bold">Shelter Rent Anchor</span>
              <h4 className="text-white font-extrabold text-xs">Rent & Mortgages</h4>
              <p className="text-zinc-400 text-[10px] leading-relaxed">
                Central interest rate spikes drive mortgage bills up. Real estate companies pass these costs directly onto tenants, increasing average monthly shelter stresses by $180.
              </p>
            </div>

            <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex flex-col gap-2 relative overflow-hidden">
              <Truck className="w-5 h-5 text-[#00D9FF]" />
              <span className="font-mono text-[9px] text-[#00D9FF] uppercase font-bold">Fuel Transit Friction</span>
              <h4 className="text-white font-extrabold text-xs">Daily Commute costs</h4>
              <p className="text-zinc-400 text-[10px] leading-relaxed">
                OPEC crude barrel restrictions increase public gas station rates. Working class households spend 14% of their wage income just keeping fuel in their cars to commute to shifts.
              </p>
            </div>

            <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex flex-col gap-2 relative overflow-hidden">
              <Briefcase className="w-5 h-5 text-emerald-400" />
              <span className="font-mono text-[9px] text-emerald-400 uppercase font-bold">Wage Index Lag</span>
              <h4 className="text-white font-extrabold text-xs">Wages vs Expenses</h4>
              <p className="text-zinc-400 text-[10px] leading-relaxed">
                If national utility bills expand by 9% but standard wages remain flat, the household experiences a real wage cut. Surviving daily requires dipping into credit card debt lines.
              </p>
            </div>

          </div>

          <div className="p-5 bg-[#14050d] border border-rose-500/15 rounded-2xl text-zinc-300 text-xs">
            <h4 className="text-rose-400 font-extrabold text-xs uppercase font-mono">Economics is the physical substrate of human survival</h4>
            <p className="text-zinc-400 text-[10.5px] mt-2 leading-relaxed">
              When we analyze interest rates and trade currencies, we are not looking at arbitrary lines on tickers. 
              We are looking at the direct factors that dictate whether families can afford milk, buy homes, pay medical insurance, 
              or survive daily without crushing debts. 
              <strong> The economy is the nervous system of human civilization.</strong>
            </p>
          </div>
        </div>
      )}

      {/*
        -----------------------------------------
        TAB 7: THE FUTURE HUMANITY SIMULATOR
        -----------------------------------------
      */}
      {activeTab === 'future' && (
        <div id="subview-future" className="p-6 bg-[#040915]/95 border border-white/10 rounded-3xl flex flex-col gap-6 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Sparkles className="w-5 h-5 text-yellow-400 animate-bounce" />
            <div>
              <h3 className="text-white font-extrabold text-xs uppercase tracking-wider">The Future Humanity Simulator & Speculation Engine</h3>
              <span className="text-[10px] font-mono text-zinc-500">WHAT KIND OF CIVILIZATION ARE WE BECOMING?</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Simulation controls panel */}
            <div className="p-5 bg-neutral-900 bg-neutral-900/60 border border-white/5 rounded-2xl flex flex-col justify-between gap-4">
              <div>
                <span className="font-mono text-[9px] text-[#00D9FF] font-black uppercase block">PROJECT VARIABLE SETS</span>
                <h4 className="text-white font-extrabold text-xs mt-1">Adjust Future Indicators</h4>
                <p className="text-zinc-450 text-[10px] mt-1.5 leading-relaxed">
                  Modify the sliders below to calculate systemic predictions for humanity's labor, power networks, and welfare systems:
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-zinc-400">AUTOMATION RATE:</span>
                    <span className="text-[#00D9FF] font-bold">{automationRate}%</span>
                  </div>
                  <input 
                    id="slider-automation"
                    type="range" 
                    min="10" 
                    max="95" 
                    value={automationRate} 
                    onChange={(e) => setAutomationRate(parseInt(e.target.value))}
                    className="w-full mt-2 accent-[#00D9FF] h-1 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-[8.5px] font-mono text-zinc-550 block mt-1">Percentage of logical cognitive jobs automated by agents.</span>
                </div>

                <div>
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-zinc-400">DATA LOAD & GRID %:</span>
                    <span className="text-yellow-400 font-bold">{energyGridCapacity}%</span>
                  </div>
                  <input 
                    id="slider-energy"
                    type="range" 
                    min="20" 
                    max="100" 
                    value={energyGridCapacity} 
                    onChange={(e) => setEnergyGridCapacity(parseInt(e.target.value))}
                    className="w-full mt-2 accent-yellow-400 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-[8.5px] font-mono text-zinc-550 block mt-1">Electrical power baseload utilized by server centers and grids.</span>
                </div>
              </div>

              <button
                id="btn-run-future-sim"
                onClick={runFutureSpeculation}
                disabled={isRunningFutureSim}
                className="py-2 w-full bg-gradient-to-r from-purple-500 to-indigo-505 hover:brightness-110 text-white font-mono text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isRunningFutureSim ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>CALCULATING COEXISTENCE...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>RUN SYSTEM TRANFORMS</span>
                  </>
                )}
              </button>
            </div>

            {/* Speculator log results panel */}
            <div className="lg:col-span-2 p-5 bg-black border border-purple-500/20 rounded-2xl font-mono text-xs text-purple-400 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
              <div className="absolute top-0 right-0 p-3 text-[8px] text-zinc-650">PROJECTOR_F HUMANITY_STATE_A</div>
              
              <div>
                <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-3">
                  <Terminal className="w-4 h-4 text-purple-400" />
                  <span className="text-[10px] font-bold tracking-widest uppercase">System projections & predictions</span>
                </div>

                {futureOutputLog.length === 0 ? (
                  <div className="text-zinc-600 italic">Adjust sliders on the left and trigger compilation to see systemic predictions.</div>
                ) : (
                  <div className="space-y-1.5 text-[10.5px]">
                    {futureOutputLog.map((log, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-zinc-700">[{idx+1}]</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 text-[9.5px] text-zinc-500 italic bg-purple-500/5 p-3 rounded-xl border border-purple-500/10">
                <span className="font-sans font-black text-purple-300 block mb-1">CIVIC INQUIRY CHALLENGE:</span>
                "What historical era are we entering now?" - With high logic automation indexes, human value shifts from cognitive labor output back to empathy, creative guidance, and baseline raw materials.
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 
        =========================================
        PART 10: BOTTOM SYSTEM RULE EMBEDDING
        =========================================
      */}
      <div 
        id="observatory-footer"
        className="mt-6 p-6 bg-neutral-950/60 border border-white/5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <ChevronRight className="w-5 h-5 text-[#00D9FF] animate-pulse" />
          <div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#00D9FF] font-black block">CIVILIZATION OBSERVATORY MANDATE</span>
            <p className="text-zinc-500 text-[10px] mt-0.5">
              Refusing dashboard configurations. Building systemic macro literacy and emotional human awareness.
            </p>
          </div>
        </div>
        <div className="text-[10px] font-mono text-zinc-500 text-right">
          INTELLIGENCE ENGINE CODES: STABLE STAMP - 2026.06.03
        </div>
      </div>

    </div>
  );
}
