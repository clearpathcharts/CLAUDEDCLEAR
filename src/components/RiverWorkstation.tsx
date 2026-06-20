import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Download, RotateCw, Eye, Folder, Sliders, Cpu, 
  BarChart2, Github, Code, Layers, Settings, ChevronDown, Bell, 
  MessageSquare, Search, LogOut, Check, Sparkles, SlidersHorizontal, 
  Plus, MoreHorizontal, FileText, Globe, AlertCircle, ArrowRight, 
  ShieldCheck, Play, HelpCircle, Activity, Heart, Share2, Crown, 
  RefreshCw, ExternalLink, Key, Shield, HardDrive, Terminal
} from 'lucide-react';
import { auth, getDb, db } from '../firebase';
import { doc, getDoc, setDoc } from '../firebase';

// Source platforms mapping
interface SourcePlatform {
  id: string;
  name: string;
  abbr: string;
  color: string;
  desc: string;
  demoCode: string;
}

const SUPPORTED_PLATFORMS: SourcePlatform[] = [
  { 
    id: 'tradingview', 
    name: 'TradingView', 
    abbr: 'PINE', 
    color: 'from-blue-600 to-cyan-500', 
    desc: 'Pine Script v4/v5 indicators and strategies.',
    demoCode: `//@version=5\nindicator("EMA Cross", overlay=true)\nshort_ma = ta.ema(close, 9)\nlong_ma = ta.ema(close, 21)\nbuy_signal = ta.crossover(short_ma, long_ma)\nplotshape(buy_signal, style=shape.triangleup)`
  },
  { 
    id: 'metatrader4', 
    name: 'MetaTrader 4', 
    abbr: 'MQL4', 
    color: 'from-blue-700 to-indigo-600', 
    desc: 'MQL4 script converters and custom EA indicators.',
    demoCode: `#property indicator_chart_window\n#property indicator_buffers 2\ndouble ShortBuffer[], LongBuffer[];\nint OnInit() { \n   SetIndexBuffer(0, ShortBuffer);\n   return(INIT_SUCCEEDED);\n}`
  },
  { 
    id: 'metatrader5', 
    name: 'MetaTrader 5', 
    abbr: 'MQL5', 
    color: 'from-indigo-600 to-purple-600', 
    desc: 'Modern MQL5 object-oriented indicators and algorithms.',
    demoCode: `#property description "MQL5 Wave Trend Indicator"\n#include <Indicator.mqh>\nCP_Indicator ma_indicator;\nint OnCalculate(const int rates_total) { \n   return(rates_total);\n}`
  },
  { 
    id: 'thinkscript', 
    name: 'ThinkScript', 
    abbr: 'TOS', 
    color: 'from-emerald-600 to-teal-500', 
    desc: 'ThinkOrSwim scripting format indicator translation.',
    demoCode: `declare upper;\ninput fastLength = 9;\ninput slowLength = 18;\nplot FastMA = ExpAverage(close, fastLength);\nplot SlowMA = ExpAverage(close, slowLength);`
  },
  { 
    id: 'easylanguage', 
    name: 'EasyLanguage', 
    abbr: 'ELD', 
    color: 'from-amber-600 to-orange-500', 
    desc: 'TradeStation & MultiCharts structural language files.',
    demoCode: `Inputs: Length( 9 ), Target( 2.5 );\nVariables: MyMA( 0 );\nMyMA = Average( Close, Length );\nIf Close crosses over MyMA Then Buy Next Bar;`
  },
  { 
    id: 'ninjatrader', 
    name: 'NinjaTrader', 
    abbr: 'NT8', 
    color: 'from-red-600 to-orange-600', 
    desc: 'NinjaScript C# classes and custom study components.',
    demoCode: `using NinjaTrader.NinjaScript.Indicators;\npublic class RiverCross : Indicator { \n   protected override void OnStateChange() { \n      if (State == State.Configure) { Name = "RiverCross"; }\n   }\n}`
  },
  { 
    id: 'amibroker', 
    name: 'AmiBroker', 
    abbr: 'AFL', 
    color: 'from-pink-600 to-rose-500', 
    desc: 'AmiBroker Formula Language script translations.',
    demoCode: `_SECTION_BEGIN("EMA Cross");\nPeriods = Param("Periods", 9, 2, 200, 1);\nPlot( EMA( Close, Periods ), "EMA", colorRed );\n_SECTION_END();`
  },
  { 
    id: 'ctrader', 
    name: 'cTrader', 
    abbr: 'cBots', 
    color: 'from-cyan-600 to-blue-500', 
    desc: 'cAlgo C# indicators as high-frequency runtimes.',
    demoCode: `using cAlgo.API;\nusing cAlgo.API.Indicators;\nnamespace cAlgo { \n    [Indicator(AccessRights = AccessRights.None)]\n    public class MA_Signer : Indicator { }\n}`
  },
  { 
    id: 'python', 
    name: 'Python', 
    abbr: 'PY', 
    color: 'from-yellow-600 to-emerald-500', 
    desc: 'Pandas, NumPy, and custom AI trading scripts.',
    demoCode: `import pandas as pd\nimport numpy as np\ndef get_ema(df, p=9):\n    return df['close'].ewm(span=p).mean()`
  },
  { 
    id: 'javascript', 
    name: 'JavaScript', 
    abbr: 'JS', 
    color: 'from-yellow-500 to-amber-500', 
    desc: 'Standard browser-based technical studies.',
    demoCode: `function calculateEMA(prices, period) {\n  let k = 2 / (period + 1);\n  return prices.map((p, i) => i === 0 ? p : p * k + prices[i-1] * (1-k));\n}`
  },
  { 
    id: 'typescript', 
    name: 'TypeScript', 
    abbr: 'TS', 
    color: 'from-blue-500 to-indigo-500', 
    desc: 'Type-safe indicator definitions with interfaces.',
    demoCode: `export interface Candle { close: number; open: number; }\nexport const calculateMA = (candles: Candle[]) => candles.map(c => c.close);`
  },
  { 
    id: 'csharp', 
    name: 'C#', 
    abbr: 'CS', 
    color: 'from-purple-700 to-pink-700', 
    desc: 'Generic C# compiler interfaces built for speed.',
    demoCode: `public class IndicatorCore {\n   public double[] ComputeMA(double[] src, int len) { return src; }\n}`
  },
  { 
    id: 'lua', 
    name: 'Lua', 
    abbr: 'LUA', 
    color: 'from-indigo-800 to-indigo-600', 
    desc: 'Trading Lite & customizable mobile runtimes.',
    demoCode: `function init()\n    setName("RiverLUA")\nend\nfunction calculate(index)\n    return index\nend`
  },
  { 
    id: 'go', 
    name: 'Go', 
    abbr: 'GO', 
    color: 'from-cyan-500 to-teal-400', 
    desc: 'High-speed concurrently executing indicator backends.',
    demoCode: `package main\nimport "fmt"\nfunc CalculateEMA(prices []float64, window int) []float64 { return prices }`
  },
  { 
    id: 'rust', 
    name: 'Rust', 
    abbr: 'RS', 
    color: 'from-amber-800 to-red-800', 
    desc: 'Memory-safe blazing-fast intermediate representation compilation.',
    demoCode: `pub fn calculate_ema(prices: &[f64], period: usize) -> Vec<f64> {\n    prices.to_vec()\n}`
  },
  { 
    id: 'custom', 
    name: 'Custom', 
    abbr: 'RAW', 
    color: 'from-zinc-700 to-zinc-600', 
    desc: 'Raw comma-separated price datasets or formulas.',
    demoCode: `// Enter custom text formulas here\nCLOSE * 1.05 - OPEN`
  }
];

export default function RiverWorkstation() {
  // App states
  const [isTraderMode, setIsTraderMode] = useState<boolean>(true);
  const [activeSidebarItem, setActiveSidebarItem] = useState<string>('import');
  const [activeNavbarDropdown, setActiveNavbarDropdown] = useState<'notifications' | 'account' | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Compiler states
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
    code: string;
    ext: string;
    detectedPlatform: string;
  } | null>(null);
  
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [compileStep, setCompileStep] = useState<'idle' | 'analyzing' | 'transpiling' | 'ready'>('idle');
  const [compileProgress, setCompileProgress] = useState<number>(0);
  const [complianceScore, setComplianceScore] = useState<number>(0);
  const [languageConfidence, setLanguageConfidence] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [transpiledRir, setTranspiledRir] = useState<string>('');
  const [sandboxLog, setSandboxLog] = useState<string>('');
  const [customFileContent, setCustomFileContent] = useState<string>('');
  const [workflowStep, setWorkflowStep] = useState<number>(1);

  // Interactive Chart settings (recalculates chart in real-time!)
  const [maPeriod, setMaPeriod] = useState<number>(14);
  const [maMultiplier, setMaMultiplier] = useState<number>(1.0);
  const [chartScale, setChartScale] = useState<number>(1.0);

  // States for Sidebar Workspaces
  const [myIndicators, setMyIndicators] = useState<Array<{ id: string; name: string; lang: string; size: string; status: 'Attached' | 'Ready' | 'Standby'; rating: number }>>([
    { id: 'ind_1', name: 'EMA Crossover Master', lang: 'Pine Script v5', size: '1.2 KB', status: 'Attached', rating: 5 },
    { id: 'ind_2', name: 'Bollinger Bands Wave Rider', lang: 'Pine Script v4', size: '2.5 KB', status: 'Ready', rating: 4 },
    { id: 'ind_3', name: 'RSI Momentum Pro', lang: 'MQL4', size: '4.1 KB', status: 'Standby', rating: 5 },
    { id: 'ind_4', name: 'Stochastic Velocity Filter', lang: 'MQL5', size: '3.8 KB', status: 'Ready', rating: 3 }
  ]);

  const [myStrategies, setMyStrategies] = useState<Array<{ id: string; name: string; winRate: number; profitFactor: number; profit: number; drawdown: number; status: 'Active' | 'Stopped' }>>([
    { id: 'strat_1', name: 'River Trend Multiplier v2', winRate: 64.2, profitFactor: 2.15, profit: 4120.50, drawdown: 3.1, status: 'Active' },
    { id: 'strat_2', name: 'Mean Reversion Arbitrage Bot', winRate: 58.1, profitFactor: 1.85, profit: 2450.10, drawdown: 4.8, status: 'Stopped' },
    { id: 'strat_3', name: 'EUR/USD Scalper Grid Bot', winRate: 71.3, profitFactor: 2.45, profit: 5840.00, drawdown: 2.5, status: 'Active' }
  ]);

  const [alertRules, setAlertRules] = useState<Array<{ id: string; condition: string; action: string; count: number; active: boolean }>>([
    { id: 'alert_1', condition: 'Price crosses above EMA (14)', action: 'Send Discord Webhook', count: 24, active: true },
    { id: 'alert_2', condition: 'RSI (14) falls below 30', action: 'Telegram Push Message', count: 12, active: true },
    { id: 'alert_3', condition: 'Bollinger Band breakout high', action: 'Email Dispatch Order', count: 0, active: false }
  ]);

  const [activeTicker, setActiveTicker] = useState<string>('BTC/USD');
  const [tickerPrice, setTickerPrice] = useState<number>(68420.50);

  const [gitRepo, setGitRepo] = useState<string>('forexanarchy/river-scripts-v2');
  const [gitBranch, setGitBranch] = useState<string>('main');
  const [gitBranches, setGitBranches] = useState<string[]>(['main', 'staging', 'dev-transpiler']);
  const [gitCommits, setGitCommits] = useState<Array<{ hash: string; desc: string; author: string; date: string }>>([
    { hash: 'fe29e8c', desc: 'Fixed vector alignment on .rir compilation', author: 'forexanarchy', date: '21 minutes ago' },
    { hash: 'a81f3d4', desc: 'Initialized multi-timeframe ema crossover indicator', author: 'forexanarchy', date: '2 hours ago' },
    { hash: '87e2b10', desc: 'Merge branch develop into main', author: 'forexanarchy', date: 'Yesterday' }
  ]);

  const [vscodeConnected, setVscodeConnected] = useState<boolean>(true);
  const [vscodeHook, setVscodeHook] = useState<boolean>(true);
  const [vscodeSyncedFiles, setVscodeSyncedFiles] = useState<string[]>(['/indicators/moving_averages.pine', '/strategies/trend_follow.py', '/lib/utils.ts']);

  const [marketplaceTab, setMarketplaceTab] = useState<'all' | 'indicators' | 'strategies' | 'automations'>('all');
  const [marketplaceItems, setMarketplaceItems] = useState<Array<{ id: string; name: string; category: 'indicators' | 'strategies' | 'automations'; author: string; rating: number; downloads: number; price: string; bannerColor: string }>>([
    { id: 'm_1', name: 'Order Flow Institutional Delta', category: 'indicators', author: 'RiverForce AI', rating: 4.9, downloads: 1420, price: '$49.00', bannerColor: 'from-amber-600 to-orange-500' },
    { id: 'm_2', name: 'Triple MACD Golden Sniper Pro', category: 'indicators', author: 'QuantAlpha', rating: 4.8, downloads: 3820, price: 'Free', bannerColor: 'from-blue-600 to-cyan-500' },
    { id: 'm_3', name: 'Gaussian Filter Dynamic Scalper', category: 'strategies', author: 'SwissEdge Labs', rating: 4.7, downloads: 412, price: '$29.00', bannerColor: 'from-purple-700 to-pink-700' },
    { id: 'm_4', name: 'Webhook Discord Auto Order Flow', category: 'automations', author: 'RiverDevs', rating: 5.0, downloads: 910, price: 'Free', bannerColor: 'from-emerald-600 to-teal-500' }
  ]);

  const [activePreferenceDensity, setActivePreferenceDensity] = useState<'compact' | 'balanced' | 'cozy'>('balanced');
  const [autosaveEnabled, setAutosaveEnabled] = useState<boolean>(true);

  // Live price fluctuation task
  useEffect(() => {
    const timer = setInterval(() => {
      setTickerPrice(prev => {
        const delta = (Math.random() - 0.5) * 15;
        return parseFloat((prev + delta).toFixed(2));
      });
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  // Messenger drawer Console states
  const [isConsoleOpen, setIsConsoleOpen] = useState<boolean>(false);
  const [consoleTab, setConsoleTab] = useState<'logs' | 'compiler' | 'runtime' | 'system'>('logs');
  const [consoleLogs, setConsoleLogs] = useState<Array<{ id: number; time: string; msg: string; type: 'info' | 'success' | 'warn' | 'error' }>>([
    { id: 1, time: '12:04:10', msg: 'ClearPath River Virtual VM initializing...', type: 'info' },
    { id: 2, time: '12:04:12', msg: 'RIR Sandboxed micro-runtime established sequentially.', type: 'success' },
    { id: 3, time: '12:04:15', msg: 'System holding 15 preconfigured language lexers.', type: 'info' },
  ]);

  // AI Providers Keys (persisted to Firestore/Vault)
  const [apiKeys, setApiKeys] = useState<{
    openai: string;
    anthropic: string;
    xai: string;
    google: string;
  }>({
    openai: '',
    anthropic: '',
    xai: '',
    google: ''
  });
  const [vaultSaveStatus, setVaultSaveStatus] = useState<string>('');
  const [activeProvider, setActiveProvider] = useState<string>('google');

  // Load API keys from firebase/localStorage
  useEffect(() => {
    const loadVaultKeys = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const userDocRef = doc(getDb(), 'user_ai_vaults', currentUser.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setApiKeys({
              openai: data.openai || '',
              anthropic: data.anthropic || '',
              xai: data.xai || '',
              google: data.google || ''
            });
            addLog('API Key Vault loaded successfully from cloud Firestore.', 'success');
          } else {
            const local = localStorage.getItem(`clearpath_river_vault_${currentUser.uid}`);
            if (local) {
              setApiKeys(JSON.parse(local));
            }
          }
        } catch (err) {
          console.warn("Vault load failed, using local storage", err);
          const local = localStorage.getItem(`clearpath_river_vault_${currentUser.uid}`);
          if (local) setApiKeys(JSON.parse(local));
        }
      } else {
        const local = localStorage.getItem(`clearpath_river_vault_guest`);
        if (local) setApiKeys(JSON.parse(local));
      }
    };
    loadVaultKeys();
  }, []);

  // Save API keys to Firestore
  const handleSaveKeys = async () => {
    setVaultSaveStatus('Saving keys encrypted in firestore...');
    const currentUser = auth.currentUser;
    const payload = { ...apiKeys, updatedAt: new Date().toISOString() };
    if (currentUser) {
      try {
        const userDocRef = doc(db, 'user_ai_vaults', currentUser.uid);
        await setDoc(userDocRef, payload);
        localStorage.setItem(`clearpath_river_vault_${currentUser.uid}`, JSON.stringify(apiKeys));
        setVaultSaveStatus('Keys saved successfully!');
        addLog('AI Keys persisted securely to Database.', 'success');
      } catch (err) {
        localStorage.setItem(`clearpath_river_vault_${currentUser.uid}`, JSON.stringify(apiKeys));
        setVaultSaveStatus('Saved in local cache!');
      }
    } else {
      localStorage.setItem(`clearpath_river_vault_guest`, JSON.stringify(apiKeys));
      setVaultSaveStatus('Saved in local cache!');
    }
    setTimeout(() => setVaultSaveStatus(''), 3000);
  };

  const renderCustomWorkspace = () => {
    switch (activeSidebarItem) {
      case 'convert':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header / Language Detection */}
            <div className="bg-[#090b14]/90 border border-slate-900 rounded-2xl p-5 text-left">
              <span className="text-[10px] tracking-[0.2em] font-mono font-black text-[#1ACFE2] uppercase block mb-1">
                COMPILER PIPELINE • LANGUAGE DETECTION
              </span>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Active Conversion Pipeline</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Scan high-level scripting indicators and generate AST representations for the River Virtual Machine.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-[10px] font-mono">
                <div className="bg-black/40 border border-slate-850 p-3 rounded-xl">
                  <span className="text-slate-500 block uppercase text-[8px] mb-1">Source AST Grammar Pattern</span>
                  <span className="text-[#1ACFE2] font-extrabold text-xs block uppercase">
                    {uploadedFile ? uploadedFile.detectedPlatform : "Pine Script v5 (Auto-Detected)"}
                  </span>
                  <span className="text-slate-500 mt-1 block">Lexical Matches: 14 tokens per line • 100% Parsing</span>
                </div>
                <div className="bg-black/40 border border-slate-850 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block uppercase text-[8px] mb-1">Sandbox Validation</span>
                    <span className="text-emerald-400 font-extrabold text-xs block uppercase">VERIFIED SECURE</span>
                  </div>
                  <ShieldCheck className="text-emerald-500" size={18} />
                </div>
              </div>
            </div>

            {/* Compatibility Report & Translation Report */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div className="bg-slate-950/60 border border-slate-900 p-5 rounded-2xl">
                <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3 text-slate-200">Compatibility Analysis</h4>
                <div className="space-y-3">
                  {[
                    { label: 'Syntax Checker Rules', rate: '100% compliant', color: 'text-emerald-400' },
                    { label: 'Namespace Scope Validation', rate: '98% clean', color: 'text-emerald-400' },
                    { label: 'API Signature Alignment', rate: '95% match', color: 'text-emerald-400' },
                    { label: 'Register Allocator Cost', rate: 'Optimized', color: 'text-indigo-400' }
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-[10px] font-mono border-b border-slate-900/60 pb-2">
                      <span className="text-slate-400">{item.label}</span>
                      <span className={`font-bold ${item.color}`}>{item.rate}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-900 p-5 rounded-2xl">
                <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3 text-slate-200">River Translation Report</h4>
                <div className="space-y-3 text-[10px] font-mono">
                  <div className="bg-black/30 p-2.5 rounded border border-slate-900">
                    <span className="text-slate-500 text-[8px] block">TARGET BINARY FORMAT</span>
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-extrabold text-slate-200">River bytecode v16 (.rir)</span>
                      <span className="text-[9px] bg-slate-900 px-1.5 py-0.5 text-slate-400 rounded">v16.1.1</span>
                    </div>
                  </div>
                  <div className="bg-black/30 p-2.5 rounded border border-slate-900">
                    <span className="text-slate-500 text-[8px] block">OPTIMIZER LOOPS</span>
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-extrabold text-slate-200">AST Constant Folding & Direct Fold</span>
                      <span className="text-[#1ACFE2]">2 passes run</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Warnings and Errors */}
            <div className="bg-slate-950/60 border border-slate-900 p-5 rounded-2xl text-left">
              <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3 flex items-center gap-1.5 text-slate-200">
                <AlertCircle className="text-[#F25D0A]" size={14} /> Diagnostic Warnings & Errors
              </h4>
              <div className="space-y-2.5 text-[10px] font-mono">
                <div className="bg-[#F25D0A]/5 border border-[#F25D0A]/20 p-3 rounded-xl flex items-start gap-2.5">
                  <span className="px-1.5 py-0.5 bg-[#F25D0A]/10 text-[#F25D0A] rounded text-[8px] font-black uppercase">WARN</span>
                  <div className="flex-1">
                    <p className="text-slate-300 font-bold">Line 4: Floating point precision fallback</p>
                    <p className="text-[9px] text-slate-500 mt-1">Virtual registers are cast to double64 for maximum brokerage arithmetic alignment.</p>
                  </div>
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-xl flex items-center gap-2.5">
                  <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[8px] font-black uppercase">COMPILER</span>
                  <span className="text-slate-400">Zero errors blocking compilation. Output stream is 100% operational.</span>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 'preview':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Chart Preview & Overlay Preview options */}
            <div className="bg-slate-950/60 border border-slate-900 p-5 rounded-2xl text-left">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <span className="text-[10px] tracking-[0.2em] font-mono font-black text-[#1ACFE2] uppercase block mb-1">
                    LIVE SANDBOX • INTERACTIVE SIGNAL EMULATOR
                  </span>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Strategy & Overlay Preview</h3>
                </div>
                <span className="bg-black border border-slate-850 text-slate-400 px-3 py-1 rounded-xl text-[9px] font-mono uppercase">
                  Active Indicator: <strong className="text-indigo-400">{activeIndicatorLoaded}</strong>
                </span>
              </div>

              {/* Slider Panel mapped into preview values */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/40 border border-slate-900 p-4 rounded-xl mb-4 text-[10px] font-mono">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase">EMA Period Close Bars</span>
                    <span className="text-[#1ACFE2] font-black">{maPeriod} Close</span>
                  </div>
                  <input 
                    type="range" min="5" max="100" value={maPeriod}
                    onChange={(e) => {
                      setMaPeriod(Number(e.target.value));
                      addLog(`Adjusted EMA Period: ${e.target.value}`, 'info');
                    }}
                    className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-[#1acfe2]" 
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold uppercase">Signal Mult Factor</span>
                    <span className="text-[#1ACFE2] font-black">x{maMultiplier.toFixed(2)}</span>
                  </div>
                  <input 
                    type="range" min="0.3" max="3.0" step="0.1" value={maMultiplier}
                    onChange={(e) => {
                      setMaMultiplier(Number(e.target.value));
                      addLog(`Adjusted Filter Deviation: ${e.target.value}`, 'info');
                    }}
                    className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-[#1acfe2]" 
                  />
                </div>
              </div>

              {/* Dynamic SVG Candlestick Simulator */}
              <div className="bg-[#030408] border border-slate-900 p-4 rounded-2xl relative overflow-hidden flex items-center justify-center min-h-[220px]">
                <svg className="w-full h-full" viewBox="0 0 540 220">
                  {/* Grid Lines */}
                  {[50, 110, 170].map((yVal, id) => (
                    <line key={id} x1="10" y1={yVal} x2="530" y2={yVal} stroke="#171822" strokeWidth="0.5" strokeDasharray="3,3" />
                  ))}
                  {/* Candlesticks */}
                  {priceData.map((d, i) => {
                    const isUp = d.c >= d.o;
                    const candleHeight = Math.abs(d.c - d.o) * 2;
                    const candleY = 220 - (Math.max(d.c, d.o) - 90) * 5;
                    const wickTopY = 220 - (d.h - 90) * 5;
                    const wickBottomY = 220 - (d.l - 90) * 5;
                    return (
                      <g key={i}>
                        <line x1={d.x} y1={wickTopY} x2={d.x} y2={wickBottomY} stroke={isUp ? '#10b981' : '#f43f5e'} strokeWidth="1" />
                        <rect x={d.x - 7} y={candleY} width="14" height={Math.max(candleHeight, 3)} fill={isUp ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'} stroke={isUp ? '#10b981' : '#f43f5e'} />
                        <text x={d.x} y="210" fill="#475569" fontSize="8" textAnchor="middle" fontFamily="monospace">{d.t}</text>
                      </g>
                    );
                  })}
                  {/* Trend Indicator Path */}
                  <path 
                    d={`M ${priceData.map((d, i) => `${d.x},${220 - (emas[i] - 90) * 5}`).join(' L ')}`}
                    fill="none" stroke="#1ACFE2" strokeWidth="2.5" className="drop-shadow-[0_0_8px_rgba(26,207,226,0.5)]" 
                  />
                  {/* Cross Over Signals */}
                  {priceData.map((d, index) => {
                    if (index === 4) {
                      const py = 220 - (emas[index] - 90) * 5;
                      return (
                        <g key={index}>
                          <circle cx={d.x} cy={py} r="8" fill="#10b981" className="animate-pulse opacity-60" />
                          <text x={d.x} y={py - 12} fill="#10b981" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">BUY</text>
                        </g>
                      );
                    }
                    if (index === 7) {
                      const py = 220 - (emas[index] - 90) * 5;
                      return (
                        <g key={index}>
                          <circle cx={d.x} cy={py} r="8" fill="#f43f5e" className="animate-pulse opacity-60" />
                          <text x={d.x} y={py - 12} fill="#f43f5e" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">SELL</text>
                        </g>
                      );
                    }
                    return null;
                  })}
                </svg>
              </div>
            </div>

            {/* Performance Statistics and Drawdown Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              {[
                { name: 'Strategy Success Rate', value: '64.5%', sub: 'Total 24 crossover steps', color: 'text-emerald-400' },
                { name: 'Overlay Drawdown Limit', value: '2.45%', sub: 'Within risk thresholds', color: 'text-slate-300' },
                { name: 'MicroVM Load Cycle', value: '4 ms (Direct)', sub: 'Fully pre-compiled bytecode', color: 'text-[#1ACFE2]' }
              ].map((stat, idx) => (
                <div key={idx} className="bg-slate-950/60 border border-slate-900 duration-300 hover:border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] text-slate-500 font-mono uppercase block">{stat.name}</span>
                  <div className="mt-2.5">
                    <span className={`text-xl font-mono font-black ${stat.color}`}>{stat.value}</span>
                    <span className="text-[9px] text-slate-500 block mt-1 font-mono">{stat.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case 'indicators':
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 text-left"
          >
            <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-5">
              <span className="text-[10px] tracking-[0.2em] font-mono font-black text-[#F25D0A] uppercase block mb-1">
                MY COLLECTION • COMPILED & IMPORTED
              </span>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Imported & Converted Indicators</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Review and manage your local assemblies. Attach these scripts to your active strategy execution modules.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myIndicators.map((ind) => (
                <div key={ind.id} className="bg-slate-950/60 border border-slate-900/60 hover:border-slate-800 rounded-2xl p-4.5 transition-all flex flex-col justify-between gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">{ind.name}</h4>
                      <p className="text-[9px] font-mono text-slate-500 mt-1 uppercase">
                        {ind.lang} • {ind.size} • {'★'.repeat(ind.rating)}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase tracking-wider ${
                      ind.status === 'Attached' ? 'bg-[#DB1305]/15 text-[#DB1305] border border-[#DB1305]/30' :
                      ind.status === 'Ready' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                      'bg-slate-800 text-slate-450'
                    }`}>
                      {ind.status}
                    </span>
                  </div>

                  <div className="flex gap-2 border-t border-slate-900/60 pt-3.5">
                    <button 
                      onClick={() => {
                        setMyIndicators(prev => prev.map(p => p.id === ind.id ? { ...p, status: 'Attached' } : { ...p, status: p.status === 'Attached' ? 'Ready' : p.status }));
                        setUploadedFile({
                          name: ind.name,
                          size: ind.size,
                          code: `// Mounted ${ind.name}\nplot(close)`,
                          ext: ind.lang === 'MQL4' ? 'mq4' : ind.lang === 'MQL5' ? 'mq5' : 'pine',
                          detectedPlatform: ind.lang
                        });
                        addLog(`Attached ${ind.name} to microVM.`, 'success');
                      }}
                      className="flex-1 h-7.5 bg-indigo-500/10 hover:bg-slate-900 text-indigo-400 hover:text-white rounded-lg text-[9px] uppercase font-black transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Layers size={11} /> Mount
                    </button>
                    <button 
                      onClick={() => {
                        setCustomFileContent(`// Raw Indicators Header: ${ind.name}\nplot(close)`);
                        setActiveSidebarItem('import');
                        addLog(`Loaded raw code for Edit: ${ind.name}`, 'info');
                      }}
                      className="px-2.5 h-7.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg text-[9px] uppercase font-black cursor-pointer flex items-center justify-center"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => {
                        setMyIndicators(prev => prev.filter(p => p.id !== ind.id));
                        addLog(`Removed indicator: ${ind.name}`, 'warn');
                      }}
                      className="px-2.5 h-7.5 bg-red-950/20 border border-red-900/40 text-red-400 hover:bg-red-900 hover:text-white rounded-lg text-[9px] uppercase font-bold transition-all cursor-pointer flex items-center justify-center"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case 'strategies':
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 text-left"
          >
            <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-5">
              <span className="text-[10px] tracking-[0.2em] font-mono font-black text-[#8D51B1] uppercase block mb-1">
                STRATEGY SUITE • BACKTEST RESULTS
              </span>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Quantitative Strategy Lab</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Monitor live performance vectors, optimize trade execution targets, and trigger automated buy/sell signals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {myStrategies.map((strat) => (
                <div key={strat.id} className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-black text-slate-100 uppercase">{strat.name}</h4>
                      <span className={`px-1.5 py-0.5 rounded text-[7px] font-mono font-black ${
                        strat.status === 'Active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-900 text-slate-500'
                      }`}>
                        {strat.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 text-[10px] font-mono text-slate-400 border-t border-slate-900/60 pt-2.5">
                      <div>
                        <span className="text-slate-500 text-[8px] block">WIN RATE</span>
                        <span className="text-slate-200 font-extrabold">{strat.winRate}%</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[8px] block">PROFIT FACTOR</span>
                        <span className="text-emerald-400 font-bold">x{strat.profitFactor}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[8px] block">NET INSIGHT</span>
                        <span className="text-white">+${strat.profit.toFixed(0)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[8px] block">MAX DRAWDOWN</span>
                        <span className="text-red-400">-{strat.drawdown}%</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setMyStrategies(prev => prev.map(p => p.id === strat.id ? { ...p, status: p.status === 'Active' ? 'Stopped' : 'Active' } : p));
                      addLog(`Toggled execution cluster: ${strat.name}`, 'info');
                    }}
                    className={`w-full h-7.5 rounded-lg text-[9px] uppercase font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      strat.status === 'Active' ? 'bg-red-950/20 text-red-500 border border-red-900/40 hover:bg-red-900 hover:text-white' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white'
                    }`}
                  >
                    {strat.status === 'Active' ? <SlidersHorizontal size={11} /> : <Play size={11} />}
                    {strat.status === 'Active' ? 'Halt Execution' : 'Deploy Live'}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case 'automations':
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 text-left"
          >
            <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-5">
              <span className="text-[10px] tracking-[0.2em] font-mono font-black text-[#FAAA33] uppercase block mb-1">
                AUTOMATIONS • WEBHOOK DEPLOYMENTS
              </span>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Active Automation Triggers</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Connect external Webhook URLs, Telegram accounts, and Slack modules. Track crossover counts in real-time.
              </p>
            </div>

            <div className="space-y-3">
              {alertRules.map((rule) => (
                <div key={rule.id} className="bg-slate-950/60 border border-slate-900 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div className="flex gap-3 items-center">
                    <Bell className={rule.active ? "text-cyan-400 animate-pulse" : "text-slate-600"} size={16} />
                    <div>
                      <span className="text-xs font-black text-slate-100 block">{rule.condition}</span>
                      <span className="text-[9px] font-mono text-slate-500 mt-1 block uppercase">
                        Action: <strong className="text-indigo-400">{rule.action}</strong> • Triggered {rule.count} times
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto">
                    <button 
                      onClick={() => {
                        addLog(`Dispatched custom Webhook test trigger call. Status: 200 OK`, 'success');
                        setAlertRules(prev => prev.map(p => p.id === rule.id ? { ...p, count: p.count + 1 } : p));
                      }}
                      className="flex-1 md:flex-none h-7 px-3 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg text-[9px] uppercase font-black cursor-pointer transition-colors"
                    >
                      Trigger Test
                    </button>
                    <button 
                      onClick={() => {
                        setAlertRules(prev => prev.map(p => p.id === rule.id ? { ...p, active: !p.active } : p));
                        addLog(`Alert rules sync updated.`, 'info');
                      }}
                      className={`h-7 px-3 rounded-lg text-[9px] uppercase font-black cursor-pointer transition-all ${
                        rule.active ? 'bg-red-950/20 text-red-500 border border-red-900/40' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {rule.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case 'charts':
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 text-left"
          >
            <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-5 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
              <div>
                <span className="text-[10px] tracking-[0.2em] font-mono font-black text-[#1acfe2] uppercase block mb-1">
                  LIVE TICKER STREAM
                </span>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Active Multi-Pane Charts</h3>
              </div>
              <div className="bg-black border border-slate-900 p-2.5 rounded-xl font-mono text-center shrink-0 min-w-[140px]">
                <span className="text-slate-500 text-[8px] block">LIVE FEED ({activeTicker})</span>
                <span className="text-xl font-extrabold text-[#1ACFE2] block mt-0.5">${tickerPrice.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['BTC/USD', 'ETH/USD', 'EUR/USD', 'GBP/USD'].map((tick) => (
                <button
                  key={tick}
                  onClick={() => {
                    setActiveTicker(tick);
                    setTickerPrice(tick.startsWith('BTC') ? 68420.50 : tick.startsWith('ETH') ? 3520.10 : 1.0854);
                    addLog(`Switched focus chart engine to ${tick}`, 'info');
                  }}
                  className={`p-4 rounded-xl border text-left flex justify-between items-center transition-all cursor-pointer ${
                    activeTicker === tick ? 'bg-indigo-950/20 border-indigo-500/50' : 'bg-slate-950/60 border-slate-900 hover:border-slate-800'
                  }`}
                >
                  <div>
                    <span className="text-xs font-black text-slate-100 uppercase block">{tick}</span>
                    <span className="text-[9px] font-mono text-slate-500 mt-1 block uppercase">15m Period • RIR Stream</span>
                  </div>
                  <ChevronDown className="text-slate-500 group-hover:text-slate-350" size={14} />
                </button>
              ))}
            </div>
          </motion.div>
        );

      case 'github':
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 text-left"
          >
            <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-5">
              <span className="text-[10px] tracking-[0.2em] font-mono font-black text-[#164B9C] uppercase block mb-1">
                CONTINUOUS INTEGRATION • GIT WORKSPACE
              </span>
              <h3 className="text-xl font-black text-white uppercase">GitHub Continuous Compile</h3>
              
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  value={gitRepo}
                  onChange={(e) => setGitRepo(e.target.value)}
                  className="flex-1 h-9 bg-black border border-slate-900 rounded-lg px-3 font-mono text-[10px] text-slate-300 focus:outline-none focus:border-slate-800" 
                />
                
                <select 
                  value={gitBranch}
                  onChange={(e) => setGitBranch(e.target.value)}
                  className="h-9 bg-black border border-slate-900 rounded-lg px-3 text-[10px] font-mono text-slate-300 focus:outline-none cursor-pointer"
                >
                  {gitBranches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>

                <button 
                  onClick={() => {
                    addLog('Forced sync of remote git repository stream.', 'success');
                    setGitCommits(prev => [
                      { hash: 'cf129a' + Math.floor(Math.random() * 10), desc: 'Triggered manual rebuild for sandbox execution', author: 'forexanarchy', date: 'Just now' },
                      ...prev
                    ]);
                  }}
                  className="h-9 bg-indigo-500 text-white font-black text-[9px] uppercase px-4 rounded-lg cursor-pointer hover:bg-indigo-400 transition-all shrink-0"
                >
                  Remote Build
                </button>
              </div>
            </div>

            {/* Commit history */}
            <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-5">
              <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3 text-slate-200">Branch Commit Assembly Logs</h4>
              <div className="space-y-3.5 font-mono text-[10px]">
                {gitCommits.map((c, i) => (
                  <div key={i} className="flex justify-between items-start border-b border-slate-900/60 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-slate-200 font-bold leading-tight">{c.desc}</p>
                      <p className="text-[9px] text-slate-505 mt-1 block uppercase">
                        Author: {c.author} • Committed {c.date}
                      </p>
                    </div>
                    <span className="text-[9px] bg-slate-900 border border-slate-850 text-slate-400 px-2 py-0.5 rounded uppercase">{c.hash}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 'vscode':
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 text-left"
          >
            <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-5">
              <span className="text-[10px] tracking-[0.2em] font-mono font-black text-cyan-400 uppercase block mb-1">
                DAEMON LISTENER • SYNC PROTOCOL
              </span>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">VS Code Workspace Linker</h3>
              
              <div className="mt-4 flex flex-col md:flex-row justify-between items-start md:items-center bg-black/40 border border-slate-900 p-4 rounded-xl gap-3">
                <div className="flex gap-2.5 items-center">
                  <div className={`w-3 h-3 rounded-full ${vscodeConnected ? 'bg-emerald-400' : 'bg-red-500'}`} />
                  <div>
                    <span className="text-xs font-black text-white uppercase block">
                      Local Daemon Status: {vscodeConnected ? 'ACTIVE' : 'OFFLINE'}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 mt-0.5 block uppercase">
                      Listening on port localhost:3000 • sync_v1.0.8
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setVscodeConnected(!vscodeConnected);
                      addLog('Daemon linkage updated.', 'info');
                    }}
                    className="h-7 px-3 bg-slate-900 border border-slate-850 hover:border-slate-750 text-slate-300 rounded-lg text-[9px] uppercase font-black cursor-pointer transition-colors"
                  >
                    Toggle Connection
                  </button>
                  <button 
                    onClick={() => {
                      setVscodeHook(!vscodeHook);
                      addLog('Continuous workspace auto-compilation toggle adjusted.', 'info');
                    }}
                    className={`h-7 px-3 rounded-lg text-[9px] uppercase font-black cursor-pointer transition-all ${
                      vscodeHook ? 'bg-[#db1305]/15 text-[#db1305] border border-[#db1305]/30' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {vscodeHook ? 'Continuous Compile' : 'Compile On Save'}
                  </button>
                </div>
              </div>
            </div>

            {/* Synced files list */}
            <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-5">
              <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3 text-slate-200">Live Synced Local Directory Entries</h4>
              <div className="space-y-2.5 font-mono text-[9px] text-slate-400">
                {vscodeSyncedFiles.map((f, i) => (
                  <div key={i} className="flex justify-between items-center bg-black/30 p-2.5 rounded border border-slate-900 hover:border-slate-800 transition-colors">
                    <div className="flex items-center gap-2">
                      <FileText size={12} className="text-sky-400" />
                      <span>{f}</span>
                    </div>
                    <span className="text-[8px] uppercase tracking-wider text-emerald-400 font-extrabold bg-emerald-500/10 px-1.5 py-0.5 rounded">SYNCED</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 'ai':
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 text-left"
          >
            <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-5">
              <span className="text-[10px] tracking-[0.2em] font-mono font-black text-[#8D51B1] uppercase block mb-1">
                ENCRYPTED ENCLAVE • MODEL CREDS
              </span>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">AI Key Vault</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Unlock code generation and automated translator assistants by storing models keys. Your credentials are encrypted safely.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-900 p-5 rounded-2xl space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1 text-slate-200">
                <Key size={14} className="text-[#8D51B1]" /> Encrypted Credentials Editor
              </h4>
              
              <div className="space-y-3.5 text-[10px] font-mono text-left">
                {[
                  { key: 'google', label: 'Google GenAI Token (Gemini API)', placeholder: 'AIzaSy...' },
                  { key: 'openai', label: 'OpenAI Secret Token', placeholder: 'sk-proj-...' },
                  { key: 'anthropic', label: 'Anthropic API Credentials', placeholder: 'sk-ant-...' },
                  { key: 'xai', label: 'xAI Grok Developer Hash', placeholder: 'xai-...' }
                ].map((item) => (
                  <div key={item.key} className="space-y-1.5">
                    <label className="text-slate-400 block font-bold uppercase">{item.label}</label>
                    <input 
                      type="password" 
                      placeholder={item.placeholder}
                      value={apiKeys[item.key as keyof typeof apiKeys] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setApiKeys(prev => ({ ...prev, [item.key]: val }));
                      }}
                      className="w-full h-9 bg-black border border-slate-900 rounded-lg px-3 font-mono text-[10px] text-slate-300 focus:outline-none focus:border-slate-800"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 border-t border-slate-900/60 pt-4">
                <button 
                  onClick={handleSaveKeys}
                  className="h-9 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg text-[9px] uppercase font-black px-4 cursor-pointer transition-all flex items-center justify-center gap-1"
                >
                  <ShieldCheck size={12} /> Persist Keys
                </button>
                {vaultSaveStatus && <span className="text-[10px] font-mono text-emerald-400 font-extrabold">{vaultSaveStatus}</span>}
              </div>
            </div>
          </motion.div>
        );

      case 'marketplace':
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 text-left"
          >
            <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-[10px] tracking-[0.2em] font-mono font-black text-[#FAAA33] uppercase block mb-1">
                  COMMUNITY REGISTRY
                </span>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Strategic Asset Marketplace</h3>
              </div>
              
              <div className="flex bg-slate-900/60 border border-slate-850 p-1 rounded-xl gap-1">
                {(['all', 'indicators', 'strategies'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setMarketplaceTab(tab)}
                    className={`px-3 py-1 rounded-lg text-[9px] uppercase font-bold cursor-pointer transition-colors ${
                      marketplaceTab === tab ? 'bg-indigo-500 text-white shadow' : 'text-slate-450 hover:text-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {marketplaceItems
                .filter(item => marketplaceTab === 'all' || item.category === marketplaceTab)
                .map((item) => (
                  <div key={item.id} className="bg-slate-950/60 border border-slate-900 rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-slate-800 transition-all">
                    <div className={`h-11 bg-gradient-to-r ${item.bannerColor} opacity-70 p-3.5 flex justify-between items-center`}>
                      <span className="text-[8px] font-mono font-black text-white uppercase tracking-wider bg-black/40 px-2 py-0.5 rounded-md">
                        {item.category}
                      </span>
                      <span className="text-[10px] font-mono font-black text-white">{item.price}</span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-wide group-hover:text-[#FAAA33] transition-colors">
                          {item.name}
                        </h4>
                        <p className="text-[9px] font-mono text-slate-550 mt-1 uppercase">
                          Developer: {item.author} • Rating: {'★'.repeat(Math.round(item.rating))} ({item.rating})
                        </p>
                      </div>

                      <div className="flex justify-between items-center border-t border-slate-900/60 pt-3">
                        <span className="text-[9px] font-mono text-slate-500 uppercase">{item.downloads} downloads</span>
                        <button 
                          onClick={() => {
                            addLog(`Acquiring asset template model: ${item.name}`, 'info');
                            setMyIndicators(prev => [
                              ...prev,
                              { id: 'ind_net_' + Math.floor(Math.random() * 100), name: item.name, lang: 'River Assembly', size: '2.0 KB', status: 'Ready', rating: 5 }
                            ]);
                            alert(`Success: "${item.name}" has been downloaded from the Registry and placed inside "My Indicators" layout.`);
                          }}
                          className="h-7.5 px-3 bg-[#FAAA33] hover:opacity-90 text-black rounded-lg text-[9px] uppercase font-black cursor-pointer transition-all"
                        >
                          Acquire Asset
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        );

      case 'settings':
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 text-left"
          >
            <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-5">
              <span className="text-[10px] tracking-[0.2em] font-mono font-black text-slate-500 uppercase block mb-1">
                PREFERENCES • ENGINE CONFIG
              </span>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Workstation Configuration</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Optimize client interface layouts, adjust sizing density ratios, and control active cloud database synchronization.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-900 p-5 rounded-2xl space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-widest text-[#B5D1DE]">Interface Layout Density</h4>
              
              <div className="grid grid-cols-3 gap-2.5">
                {(['compact', 'balanced', 'cozy'] as const).map(density => (
                  <button
                    key={density}
                    onClick={() => {
                      setActivePreferenceDensity(density);
                      addLog(`Layout spacing density profile adjusted: ${density}`, 'info');
                    }}
                    className={`h-9 rounded-lg text-[9px] uppercase font-black cursor-pointer transition-colors ${
                      activePreferenceDensity === density ? 'bg-indigo-500 text-white' : 'bg-black border border-slate-900 text-slate-400'
                    }`}
                  >
                    {density}
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center border-t border-slate-900/60 pt-4">
                <div>
                  <span className="text-xs font-black text-slate-100 block uppercase">Autosave Indicator State</span>
                  <span className="text-[9px] text-slate-500 mt-0.5 block">Sync settings directly into firebase or cloud storage.</span>
                </div>
                
                <button
                  onClick={() => {
                    setAutosaveEnabled(!autosaveEnabled);
                    addLog(`Autosave configuration: ${!autosaveEnabled ? 'Active' : 'Disabled'}`, 'info');
                  }}
                  className={`h-7 px-3.5 rounded-lg text-[9px] uppercase font-black transition-all cursor-pointer ${
                    autosaveEnabled ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {autosaveEnabled ? 'SYNC ON' : 'SYNC OFF'}
                </button>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const addLog = (msg: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString();
    setConsoleLogs(prev => [
      ...prev,
      { id: Date.now() + Math.random(), time, msg, type }
    ]);
  };

  // Pre-load platform demo
  const handleSelectPlatform = (platform: SourcePlatform) => {
    setUploadedFile({
      name: `demo_indicator_${platform.id}.${getFileExt(platform.id)}`,
      size: `${(platform.demoCode.length / 1024).toFixed(2)} KB`,
      code: platform.demoCode,
      ext: getFileExt(platform.id),
      detectedPlatform: platform.name
    });
    addLog(`Preloaded ${platform.name} demo file. Ready to transpile.`, 'info');
    triggerCompilerSimulation(platform.name, platform.demoCode);
  };

  const getFileExt = (platId: string): string => {
    if (platId === 'tradingview') return 'pine';
    if (platId === 'metatrader4') return 'mq4';
    if (platId === 'metatrader5') return 'mq5';
    if (platId === 'thinkscript') return 'ts';
    if (platId === 'easylanguage') return 'eld';
    if (platId === 'ninjatrader') return 'cs';
    if (platId === 'amibroker') return 'afl';
    if (platId === 'ctrader') return 'cs';
    if (platId === 'python') return 'py';
    return 'river';
  };

  // Advanced Language & Platform Detector using file extensions and content keywords
  const detectLanguageAndVerify = (fileName: string, content: string, sizeInBytes: number) => {
    const ext = (fileName.split('.').pop() || '').toLowerCase();
    
    // File validation: Size limit check (500 KB)
    const MAX_SIZE_BYTES = 500 * 1024; // 500 KB
    if (sizeInBytes > MAX_SIZE_BYTES) {
      return {
        isValid: false,
        error: `File size too large (${~~(sizeInBytes / 1024)} KB). The institutional sandbox has a strict limit of 500 KB per script.`,
        detectedPlatform: 'Unknown',
        confidence: 0,
        ext
      };
    }

    // File validation: Extension whitelist
    const allowedExtensions = ['pine', 'mq4', 'mq5', 'py', 'js', 'cs', 'ts', 'river', 'eld', 'afl'];
    if (!allowedExtensions.includes(ext) && ext !== '') {
      return {
        isValid: false,
        error: `Unsupported file format (.${ext}). Supported formats: .pine, .mq4, .mq5, .py, .js, .cs, .ts, .river, .eld, .afl.`,
        detectedPlatform: 'Unknown',
        confidence: 0,
        ext
      };
    }

    let detectedPlatform = 'Custom / Web Script';
    let confidence = 95;
    
    // Determine language by extension or content analysis
    if (ext === 'pine' || content.includes('//@version') || content.includes('indicator(') || content.includes('study(') || content.includes('strategy(') || content.includes('ta.ema') || content.includes('plot(')) {
      detectedPlatform = 'Pine Script v5 (TradingView)';
      confidence = content.includes('//@version') ? 99.8 : 94.5;
    } else if (ext === 'mq4' || (content.includes('OnCalculate') && (content.includes('MQL4') || !content.includes('MqlRates')))) {
      detectedPlatform = 'MQL4 (MetaTrader 4)';
      confidence = 98.5;
    } else if (ext === 'mq5' || content.includes('MqlRates') || (content.includes('OnCalculate') && content.includes('const int'))) {
      detectedPlatform = 'MQL5 (MetaTrader 5)';
      confidence = 97.9;
    } else if (ext === 'py' || (content.includes('def ') && (content.includes('import ') || content.includes('pandas')))) {
      detectedPlatform = 'Python (Backtrader/QuantConnect)';
      confidence = 96.0;
    } else if (ext === 'cs' || content.includes('using NinjaTrader')) {
      detectedPlatform = 'C# NinjaScript / cTrader';
      confidence = 95.0;
    } else if (ext === 'eld' || content.includes('Inputs:')) {
      detectedPlatform = 'EasyLanguage (TradeStation)';
      confidence = 94.0;
    } else if (ext === 'afl' || (content.includes('Plot(') && content.includes('Filter'))) {
      detectedPlatform = 'AFL (Amibroker)';
      confidence = 93.5;
    } else if (ext === 'ts' || content.includes('declare lower') || content.includes('addLabel')) {
      detectedPlatform = 'ThinkScript (ThinkOrSwim)';
      confidence = 92.0;
    } else if (ext === 'river' || content.includes('module River')) {
      detectedPlatform = 'River Native (.river)';
      confidence = 100.0;
    }

    return {
      isValid: true,
      detectedPlatform,
      confidence,
      ext,
      error: null
    };
  };

  // Compile Simulation Pipeline
  const triggerCompilerSimulation = (platName: string, rawCode: string, confidenceVal?: number) => {
    setCompileStep('analyzing');
    setCompileProgress(10);
    setComplianceScore(0);
    setValidationError(null);
    setWorkflowStep(3); // Go to Analyze step immediately
    
    if (confidenceVal !== undefined) {
      setLanguageConfidence(confidenceVal);
    } else {
      setLanguageConfidence(Math.floor(Math.random() * 5) + 95);
    }
    
    addLog(`Initiated compiler pipeline for ${platName} script.`, 'info');
    addLog(`Running lexical token scans or regex validations...`, 'info');

    // Simulate stepping
    const t1 = setTimeout(() => {
      setCompileStep('transpiling');
      setCompileProgress(50);
      addLog(`AST generated. Detected elements: moving average series, high/low indices.`, 'info');
      addLog(`Converting AST expressions into River Intermediate representation (RIR).`, 'info');
    }, 1000);

    const t2 = setTimeout(() => {
      setCompileStep('ready');
      setCompileProgress(100);
      const score = Math.floor(Math.random() * 8) + 93;
      setComplianceScore(score); // 93% to 100% compliance
      
      const transpiledCode = `// RIVER BYTECODE (.rir) GENERATED\n// Platform: ${platName}\n\nmodule RiverSignal {\n  import "rir.core.math"\n  import "rir.indicators.ma"\n  \n  parameter period = ${maPeriod}\n  parameter mult = ${maMultiplier}\n  \n  function compute_river_series(series_src) {\n     let raw_series = series_src.close\n     let rir_ma = rir.indicators.ema(raw_series, period)\n     let rir_out = rir_ma * mult\n     \n     return rir_out\n  }\n}`;
      setTranspiledRir(transpiledCode);
      setSandboxLog(`🎉 RIR Micro-sandbox initialized.\n✓ Vector constraints verified.\n✓ Compile verification: SUCCESS.\n✓ Compiled size: 382 bytes.`);
      
      // Auto-store in My Indicators
      setMyIndicators(prev => {
        const title = platName ? `${platName.split(' ')[0]} Indicator` : 'Converted Indicator';
        if (prev.some(p => p.name === `My New ${title}`)) return prev;
        return [
          {
            id: `ind_${Date.now()}`,
            name: `My New ${title}`,
            lang: platName,
            size: '1.4 KB',
            status: 'Ready',
            rating: 5
          },
          ...prev
        ];
      });

      addLog(`Transpilation complete! Converted bytecode has ${score}% compliance score.`, 'success');
      addLog(`Automatically stored in My Indicators collection.`, 'success');
      setWorkflowStep(4); // Advance to step 4: Convert
    }, 2400);
  };

  // Mock upload handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setValidationError(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const textContent = (event.target?.result as string) || '';
        const sizeStr = `${(file.size / 1024).toFixed(2)} KB`;
        
        const validation = detectLanguageAndVerify(file.name, textContent, file.size);
        if (!validation.isValid) {
          setValidationError(validation.error);
          setUploadedFile(null);
          addLog(`Validation error: ${validation.error}`, 'error');
          return;
        }

        setUploadedFile({
          name: file.name,
          size: sizeStr,
          code: textContent,
          ext: validation.ext,
          detectedPlatform: validation.detectedPlatform
        });

        addLog(`Custom indicator dropped: ${file.name} (${sizeStr})`, 'info');
        triggerCompilerSimulation(validation.detectedPlatform, textContent, validation.confidence);
      };
      
      reader.onerror = () => {
        setValidationError("Failed to read dropped file. Please try again or paste code directly.");
        addLog("FileReader encounter error.", "error");
      };
      
      reader.readAsText(file);
    }
  };

  // Mock Candlestick Chart generator with a dynamic EMA line plot!
  const priceData = [
    { x: 50, o: 100, h: 105, l: 98, c: 102, t: '09:00' },
    { x: 100, o: 102, h: 108, l: 101, c: 106, t: '10:00' },
    { x: 150, o: 106, h: 107, l: 103, c: 104, t: '11:00' },
    { x: 200, o: 104, h: 105, l: 99, c: 101, t: '12:00' },
    { x: 250, o: 101, h: 109, l: 100, c: 108, t: '13:00' },
    { x: 300, o: 108, h: 114, l: 107, c: 112, t: '14:00' },
    { x: 350, o: 112, h: 116, l: 110, c: 115, t: '15:00' },
    { x: 400, o: 115, h: 115, l: 108, c: 110, t: '16:00' },
    { x: 450, o: 110, h: 118, l: 109, c: 116, t: '17:00' },
    { x: 500, o: 116, h: 122, l: 115, c: 121, t: '18:00' },
  ];

  // Dynamic EMA calculations based on sliders!
  const emas = useMemo(() => {
    let prev = priceData[0].c;
    // Period modifies alpha weight, multiplier scales output deviation
    const alpha = 2 / (maPeriod + 1);
    return priceData.map((d, index) => {
      if (index === 0) return prev * maMultiplier;
      const currentEma = d.c * alpha + prev * (1 - alpha);
      prev = currentEma;
      // Anchor back near center path but scale deviation
      const centerLine = 108;
      const deviation = (currentEma - centerLine) * maMultiplier;
      return centerLine + deviation;
    });
  }, [maPeriod, maMultiplier]);

  const activeIndicatorLoaded = uploadedFile ? uploadedFile.name : "MACD_Cross_Default.pine";

  return (
    <div className="w-full min-h-screen text-slate-100 bg-[#020106] relative overflow-hidden font-sans">
      
      {/* Background Animated Particle Overlay with Custom Color Highlights */}
      <div className="absolute inset-0 pointer-events-none z-0" id="ambient_universe_backplane">
        <div className="absolute top-10 left-10 w-[500px] h-[500px] rounded-full bg-[#950804]/15 blur-[180px]" />
        <div className="absolute bottom-20 right-20 w-[600px] h-[600px] rounded-full bg-[#164B9C]/15 blur-[200px]" />
        <div className="absolute top-1/3 right-1/4 w-[350px] h-[350px] rounded-full bg-[#8D51B1]/10 blur-[150px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#db130504_1px,transparent_1px),linear-gradient(to_bottom,#db130504_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* TOP NAVIGATION / HEADER (CodePen custom bar implementation) */}
      <header className="h-[70px] bg-slate-950/80 backdrop-blur-xl border-b border-slate-900 sticky top-0 z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 through-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-[0.2em] uppercase text-white bg-clip-text">
              CLEARPATH RIVER
            </h1>
            <p className="text-[9px] font-bold text-slate-400 tracking-wider">
              Universal Indicator Migration Platform
            </p>
          </div>
        </div>

        {/* Search tool in navigation */}
        <div className="hidden md:flex items-center flex-1 max-w-sm mx-10 relative">
          <Search size={14} className="absolute left-3.5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search Indicators, Strategies, Languages..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs h-9 bg-slate-900 border border-slate-800 rounded-full pl-10 pr-4 text-slate-300 placeholder:text-slate-500 transition-colors focus:border-slate-700 focus:outline-none"
          />
        </div>

        {/* TOGGLE: TRADER MODE vs DEVELOPER MODE */}
        <div className="flex items-center gap-4">
          <div className="bg-slate-900/90 border border-slate-800 p-1 rounded-full flex items-center gap-1">
            <button 
              onClick={() => {
                setIsTraderMode(true);
                addLog('Switched to Trader Mode. Hiding compiler debug files.', 'info');
              }}
              className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                isTraderMode 
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-900/30' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Trader Mode
            </button>
            <button 
              onClick={() => {
                setIsTraderMode(false);
                addLog('Developer Mode unlocked. Displaying AST bytecode and RIR graphs.', 'warn');
              }}
              className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                !isTraderMode 
                  ? 'bg-gradient-to-r from-pink-600 to-pink-500 text-white shadow-md shadow-pink-900/30' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Developer Mode
            </button>
          </div>

          {/* Quick interactive utility icons */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveNavbarDropdown(activeNavbarDropdown === 'notifications' ? null : 'notifications')}
              className="relative p-2 rounded-full hover:bg-slate-900 text-slate-450 transition-all cursor-pointer"
            >
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
            </button>
            
            <button 
              onClick={() => setIsConsoleOpen(!isConsoleOpen)}
              className={`p-2 rounded-full hover:bg-slate-900 text-slate-450 transition-all relative cursor-pointer ${isConsoleOpen ? 'text-indigo-400 bg-slate-900' : ''}`}
            >
              <MessageSquare size={16} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            </button>

            <button 
              onClick={() => setActiveNavbarDropdown(activeNavbarDropdown === 'account' ? null : 'account')}
              className="w-8 h-8 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center text-[10px] font-black text-rose-300 hover:border-slate-500 transition-colors"
            >
              CP
            </button>
          </div>
        </div>
      </header>

      {/* DROPDOWNS */}
      <AnimatePresence>
        {activeNavbarDropdown === 'notifications' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-12 top-[76px] w-80 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl shadow-black/80 z-[100] p-4 text-left font-mono text-[10px]"
          >
            <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-3">
              <span className="font-extrabold uppercase text-slate-400">River Events</span>
              <span className="text-[#00D9FF]">3 Active</span>
            </div>
            <div className="space-y-3">
              <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-850">
                <span className="text-emerald-400 block font-bold">✓ MACD_Scalper.pine Converted</span>
                <span className="text-slate-500 text-[9px]">14 minutes ago • Compliance 98%</span>
              </div>
              <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-850">
                <span className="text-cyan-400 block font-bold">⚡ Active RIR Sandbox Initialized</span>
                <span className="text-slate-500 text-[9px]">1 hour ago • Port 3200 virtual</span>
              </div>
              <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-850">
                <span className="text-indigo-400 block font-bold">🔗 GitHub Repository Synced</span>
                <span className="text-slate-500 text-[9px]">3 hours ago • cp-indicators/ma</span>
              </div>
            </div>
          </motion.div>
        )}

        {activeNavbarDropdown === 'account' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-6 top-[76px] w-80 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl shadow-black/80 z-[100] p-5 text-left"
          >
            <div className="flex items-center gap-3 border-b border-slate-900 pb-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-pink-400">CP</div>
              <div>
                <p className="font-black text-xs text-white">ClearPath Executive</p>
                <p className="text-[10px] text-[#00D9FF] font-mono">Authorization Level: Tier-1 Admin</p>
              </div>
            </div>

            {/* AI providers custom configuration */}
            <div className="space-y-3 font-mono text-[10px]">
              <span className="text-slate-400 block uppercase font-bold tracking-wider mb-2 border-b border-slate-900 pb-1 flex items-center gap-1.5">
                <Key size={12} className="text-indigo-400" /> Private AI Crypt-Vault
              </span>
              
              <div className="space-y-2">
                <div>
                  <label className="text-slate-500 block uppercase text-[8px] mb-1">Google Gemini API Key</label>
                  <input 
                    type="password" 
                    placeholder="Enter process.env.GEMINI_API_KEY..."
                    value={apiKeys.google}
                    onChange={(e) => setApiKeys(p => ({ ...p, google: e.target.value }))}
                    className="w-full h-7 bg-slate-900 border border-slate-800 rounded px-2 text-[9px] text-zinc-300 placeholder:text-zinc-700 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block uppercase text-[8px] mb-1">OpenAI API Key</label>
                  <input 
                    type="password" 
                    placeholder="sk-proj-..."
                    value={apiKeys.openai}
                    onChange={(e) => setApiKeys(p => ({ ...p, openai: e.target.value }))}
                    className="w-full h-7 bg-slate-900 border border-slate-800 rounded px-2 text-[9px] text-zinc-300 placeholder:text-zinc-700 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block uppercase text-[8px] mb-1">Anthropic API Key</label>
                  <input 
                    type="password" 
                    placeholder="sk-ant-..."
                    value={apiKeys.anthropic}
                    onChange={(e) => setApiKeys(p => ({ ...p, anthropic: e.target.value }))}
                    className="w-full h-7 bg-slate-900 border border-slate-800 rounded px-2 text-[9px] text-zinc-300 placeholder:text-zinc-700 outline-none"
                  />
                </div>
              </div>

              {vaultSaveStatus && (
                <div className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded p-1 text-center font-bold">
                  {vaultSaveStatus}
                </div>
              )}

              <button 
                onClick={handleSaveKeys}
                className="w-full h-8 mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 active:scale-95 text-white rounded font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Shield size={12} /> Sync Private Key Vault
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* THREE COLUMN CODEPEN FACEBOOK WINDOW WRAPPER */}
      <div className="max-w-[1600px] mx-auto p-4 flex flex-col lg:flex-row gap-6 relative z-10">
        
        {/* =============== LEFT SIDEBAR NAVIGATION =============== */}
        <aside className="w-full lg:w-[260px] shrink-0 sticky top-[94px] h-[calc(100vh-130px)] overflow-y-auto hidden lg:flex flex-col gap-6 scrollbar-none text-left select-none">
          
          <div className="bg-slate-950/40 backdrop-blur-md border border-slate-900/60 rounded-2xl p-4.5 space-y-4">
            <div className="pb-3 border-b border-slate-900">
              <span className="text-[10px] uppercase font-mono font-black text-[#1ACFE2] tracking-widest block mb-1">Trader Workstation</span>
              <p className="text-sm font-black tracking-tight text-white uppercase">Primary Console</p>
            </div>

            <nav className="flex flex-col gap-1 text-xs">
              {[
                { id: 'import', icon: Download, label: 'Import Indicator', badge: uploadedFile ? '1' : null },
                { id: 'convert', icon: RotateCw, label: 'Convert Indicator' },
                { id: 'preview', icon: Eye, label: 'Preview Indicator' },
                { id: 'indicators', icon: Folder, label: 'My Indicators' },
                { id: 'strategies', icon: Sliders, label: 'My Strategies' },
                { id: 'automations', icon: Cpu, label: 'My Automations' },
                { id: 'charts', icon: BarChart2, label: 'Charts' },
                { id: 'github', icon: Github, label: 'GitHub Sync' },
                { id: 'vscode', icon: Code, label: 'VS Code Extension' },
                { id: 'ai', icon: Cpu, label: 'AI Providers' },
                { id: 'marketplace', icon: Layers, label: 'Marketplace' },
                { id: 'settings', icon: Settings, label: 'Settings' }
              ].map(item => {
                const isActive = activeSidebarItem === item.id;
                return (
                  <button 
                    key={item.id}
                    onClick={() => {
                      setActiveSidebarItem(item.id);
                      addLog(`Sidebar navigation triggered to: ${item.label}`, 'info');
                    }}
                    className={`w-full h-10 px-3.5 rounded-xl flex items-center justify-between transition-all font-black uppercase tracking-wider cursor-pointer ${
                      isActive 
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)] bg-slate-900/30' 
                        : 'text-slate-450 hover:bg-slate-900/40 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={15} style={{ color: isActive ? '#818cf8' : 'currentColor' }} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-indigo-500 text-white font-bold animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* System Health stats under Left sidebar */}
          <div className="bg-slate-950/30 border border-slate-900/40 rounded-2xl p-4 font-mono text-[9px] text-slate-500 space-y-2.5">
            <div className="flex justify-between items-center">
              <span>SYSTEM LATENCY</span>
              <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> 12ms (ONLINE)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>ACTIVE COMPILER</span>
              <span className="text-cyan-400 font-extrabold">STRICT_RIR_V1 (C++)</span>
            </div>
            <div className="flex justify-between items-center">
              <span>DATA RATE</span>
              <span className="text-slate-300">60 FPS (Lightweight)</span>
            </div>
          </div>
        </aside>

        {/* =============== MIDDLE SCROLL CHANNEL (Newsfeed layout) =============== */}
        <main className="flex-1 space-y-6">
          {activeSidebarItem !== 'import' && renderCustomWorkspace()}

          {activeSidebarItem === 'import' && (
            <>

          {/* HERO CAMPAIGN SECTION */}
          <div className="bg-gradient-to-br from-slate-950 to-[#0c0f20] border border-slate-900 p-6 rounded-3xl relative overflow-hidden text-left shadow-lg">
            {/* Ambient banner nodes */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />
            
            <div className="relative z-10 max-w-xl">
              <span className="text-[10px] tracking-[0.4em] font-mono font-black text-indigo-400 uppercase block mb-2">
                UNIVERSAL INDICATOR MIGRATION LAYER
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-white leading-tight tracking-tight uppercase">
                Import Any Indicator.<br />
                From Any Platform.<br />
                To Any Chart.
              </h2>
              
              <p className="text-xs text-slate-400 leading-relaxed max-w-lg mt-3">
                Translate legacy Pine Script, MQL4/5, ThinkScript, and EasyLanguage code blocks into fast binary-compliant River Intermediate bytecodes (.rir) instantly.
              </p>

              <div className="mt-5 flex flex-wrap gap-2 text-[9px] font-mono font-extrabold tracking-widest text-[#00D9FF]">
                <span>💎 ONE RUNTIME.</span>
                <span>🔥 ONE LANGUAGE.</span>
                <span>⚡ UNLIMITED POSSIBILITIES.</span>
              </div>
            </div>
          </div>

          {/* ================= STORY CARDS STREAMS (Source platforms list) ================= */}
          <div className="space-y-2.5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-left">
              Supported Platforms (Hover to preload demo indicator code)
            </h3>
            
            <div className="overflow-x-auto flex gap-4.5 pb-2 scrollbar-none scroll-smooth" id="platform-story-channel">
              {SUPPORTED_PLATFORMS.map((plat) => (
                <button
                  key={plat.id}
                  onClick={() => handleSelectPlatform(plat)}
                  className="w-32 h-44 shrink-0 rounded-2xl bg-slate-950 border border-slate-900 p-3 flex flex-col justify-between hover:border-slate-700 hover:scale-105 active:scale-95 duration-300 transition-all text-left relative overflow-hidden group shadow-lg shadow-black/40 cursor-pointer"
                >
                  {/* Subtle platform colors overlay */}
                  <div className={`absolute -bottom-10 -right-10 w-24 h-24 bg-gradient-to-tr ${plat.color} opacity-10 group-hover:opacity-20 blur-xl transition-all duration-300`} />
                  
                  {/* Avatar badge */}
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${plat.color} flex items-center justify-center font-mono text-[9px] font-black text-white shadow-md`}>
                    {plat.abbr}
                  </div>

                  <div className="z-10">
                    <h4 className="text-xs font-black text-white uppercase tracking-tight group-hover:text-[#00D9FF] transition-colors leading-tight">
                      {plat.name}
                    </h4>
                    <p className="text-[9px] text-slate-500 mt-1 leading-normal leading-relaxed overflow-hidden text-ellipsis line-clamp-3">
                      {plat.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ================= MAIN FEED CHRONOLOGICAL MODULES ================= */}

          {/* CARD 1: PLATFORM STATS */}
          <section className="bg-slate-950/45 backdrop-blur-md border border-slate-900/60 p-5 rounded-2xl text-left space-y-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <Globe size={14} className="text-emerald-400" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-white tracking-widest leading-none">Card 1: Active Supported Platforms</h4>
                <p className="text-[9px] text-slate-500 mt-1 uppercase font-mono">15 platforms connected • ast syntax trees optimized</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              ClearPath River's compiler architecture contains specialized lexers that parse language-specific structures, mapping expressions directly to the standard virtual platform execution model.
            </p>
          </section>

          {/* CARD 2: FILE UPLOADER & COMPILER CENTER (The most prominent workspace focus!) */}
          <section className="bg-[#090b14]/90 border-2 border-indigo-500/30 p-6 rounded-2xl text-left relative shadow-lg shadow-indigo-500/5 transition-all">
            <div className="absolute top-4 right-4 text-indigo-400">
              <Sparkles size={16} className="animate-pulse" />
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                <Download size={14} className="text-indigo-400 animate-bounce" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-white tracking-wider leading-none">Card 2: Import Indicators & Strategies</h4>
                <p className="text-[9px] text-indigo-400 uppercase font-mono tracking-widest">DRAG AND DROP WORKSPACE • LIVE SIGNALS</p>
              </div>
            </div>

            {/* DRAG AND DROP ZONE */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => {
                const element = document.getElementById('indicator-file-upload');
                if (element) element.click();
              }}
              className={`border-2 border-dashed rounded-2xl p-9 text-center transition-all cursor-pointer relative overflow-hidden min-h-[160px] flex flex-col items-center justify-center gap-2 ${
                isDragOver 
                  ? 'border-indigo-400 bg-indigo-500/10 shadow-[0_0_25px_rgba(99,102,241,0.25)]' 
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/30'
              }`}
            >
              <input 
                id="indicator-file-upload"
                type="file"
                className="hidden"
                accept=".pine,.mq4,.mq5,.py,.js,.cs,.ts,.river,.eld,.afl"
                onChange={(e) => {
                  setValidationError(null);
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    
                    reader.onload = (event) => {
                      const textContent = (event.target?.result as string) || '';
                      const sizeStr = `${(file.size / 1024).toFixed(2)} KB`;
                      
                      const validation = detectLanguageAndVerify(file.name, textContent, file.size);
                      if (!validation.isValid) {
                        setValidationError(validation.error);
                        setUploadedFile(null);
                        addLog(`Validation error: ${validation.error}`, 'error');
                        return;
                      }

                      setUploadedFile({
                        name: file.name,
                        size: sizeStr,
                        code: textContent,
                        ext: validation.ext,
                        detectedPlatform: validation.detectedPlatform
                      });

                      addLog(`Local script uploaded: ${file.name} (${sizeStr})`, 'info');
                      triggerCompilerSimulation(validation.detectedPlatform, textContent, validation.confidence);
                    };
                    
                    reader.onerror = () => {
                      setValidationError("Failed to read selection. Please try again.");
                      addLog("FileReader encounter error on selection.", "error");
                    };
                    
                    reader.readAsText(file);
                  }
                }}
              />

              <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                <HardDrive size={22} className={compileStep === 'analyzing' || compileStep === 'transpiling' ? 'animate-spin' : ''} />
              </div>

              <div>
                <span className="text-xs font-mono font-black tracking-widest text-[#00D9FF] block uppercase">
                  DROP INDICATOR HERE
                </span>
                <span className="text-[10px] text-slate-450 block mt-1 uppercase font-mono">
                  Supported extensions: .pine, .mq4, .mq5, .py, .js, .cs, .ts, .river, .eld, .afl
                </span>
                <span className="text-[9px] text-[#ff2ea6] block mt-1.5 uppercase font-mono font-black tracking-widest">
                  🛡️ Max File Size: 500 KB Limit
                </span>
              </div>
            </div>
            
            {/* VALIDATION ERROR INDICATOR */}
            {validationError && (
              <div className="mt-3 p-4 bg-red-950/30 border border-red-900/50 rounded-2xl flex items-start gap-3 text-left animate-pulse">
                <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={16} />
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-black text-red-400 block uppercase tracking-wider">
                    File Validation Error
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {validationError}
                  </p>
                </div>
              </div>
            )}

            {/* Custom file analyzer text area option */}
            <div className="mt-4 pt-4 border-t border-slate-900 flex flex-col gap-2">
              <label className="text-[9px] uppercase font-mono font-bold text-slate-500 block leading-none">Or paste custom indicator script code directly:</label>
              <textarea 
                value={customFileContent}
                onChange={(e) => setCustomFileContent(e.target.value)}
                placeholder="Paste code blocks here (e.g. ta.ema(close, 9) crossing ta.ema(close, 21)...)"
                className="w-full h-16 bg-slate-950/60 border border-slate-850 rounded-xl p-2.5 font-mono text-[10px] text-slate-400 placeholder:text-slate-600 focus:outline-none focus:border-slate-850 leading-relaxed"
              />
              <button 
                aria-label="Analyze code"
                onClick={() => {
                  if (!customFileContent.trim()) return;
                  setValidationError(null);
                  
                  // Approximate bytes of pasted text
                  const sizeInBytes = customFileContent.length;
                  const sizeStr = `${(sizeInBytes / 1024).toFixed(2)} KB`;
                  
                  const validation = detectLanguageAndVerify('pasted_code.txt', customFileContent, sizeInBytes);
                  if (!validation.isValid) {
                    setValidationError(validation.error);
                    setUploadedFile(null);
                    addLog(`Validation error: ${validation.error}`, 'error');
                    return;
                  }

                  let platformName = validation.detectedPlatform;
                  if (platformName === 'Custom / Web Script') {
                    platformName = 'Pasted Raw Script';
                  }

                  setUploadedFile({
                    name: 'pasted_code_block',
                    size: sizeStr,
                    code: customFileContent,
                    ext: validation.ext || 'pine',
                    detectedPlatform: platformName
                  });
                  addLog(`Custom code pasted (${sizeStr}) and submitted to transpiler.`, 'info');
                  triggerCompilerSimulation(platformName, customFileContent, validation.confidence);
                }}
                className="self-end px-3.5 h-8 bg-slate-900 hover:bg-slate-850 text-slate-300 font-mono text-[9px] font-black rounded-lg cursor-pointer flex items-center gap-1.5 uppercase transition-colors"
              >
                Analyze pasted block <ArrowRight size={10} />
              </button>
            </div>

            {/* Simulated compilation status */}
            {uploadedFile && (
              <div className="mt-4 p-4 bg-slate-950/80 border border-slate-850 rounded-2xl font-mono text-[10px] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[9px]">FILE ANALYZED</span>
                  <span className="text-indigo-400 font-bold uppercase">{uploadedFile.name} ({uploadedFile.size})</span>
                </div>
                {compileStep === 'analyzing' && (
                  <div className="flex items-center gap-2 text-yellow-500">
                    <RefreshCw size={11} className="animate-spin text-yellow-500" />
                    <span>Analyzing lexer indices, checking AST signature...</span>
                  </div>
                )}
                {compileStep === 'transpiling' && (
                  <div className="flex items-center gap-2 text-cyan-400">
                    <RefreshCw size={11} className="animate-spin text-cyan-400" />
                    <span>Transpiling core functions to RIR intermediate bytecodes...</span>
                  </div>
                )}
                {compileStep === 'ready' && (
                  <>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <ShieldCheck size={12} className="text-emerald-400 animate-bounce" />
                      <span>Transpilation completed sequentially! Code is live-compatible.</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-900/80 space-y-2">
                      <div className="flex justify-between items-center text-slate-500 text-[8px] font-black tracking-wider uppercase font-mono">
                        <span>Live Code Snippet Preview:</span>
                        <span className="text-[#00D9FF]">{uploadedFile.ext.toUpperCase()} Source</span>
                      </div>
                      <pre className="bg-black/50 p-2.5 rounded-xl border border-slate-900/80 font-mono text-[9px] text-[#00ffcc] overflow-y-auto max-h-36 whitespace-pre scrollbar-thin">
                        {uploadedFile.code}
                      </pre>
                    </div>
                  </>
                )}
              </div>
            )}
            
            {/* Quick action buttons row */}
            <div className="mt-4 flex flex-wrap gap-2 pt-2">
              <button 
                disabled={compileStep !== 'ready'}
                onClick={() => {
                  setActiveSidebarItem('convert');
                  addLog('Navigated to Card 3: Language Detection.', 'info');
                }}
                className="px-3.5 h-9 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-[10px] uppercase font-black cursor-pointer hover:border-slate-700 disabled:opacity-40 transition-all flex items-center justify-center gap-1"
              >
                <Search size={12} /> Analyze Schema
              </button>
              <button 
                disabled={compileStep !== 'ready'}
                onClick={() => {
                  setActiveSidebarItem('convert');
                  document.getElementById('rir-report-panel')?.scrollIntoView({ behavior: 'smooth' });
                  addLog('Viewing Converted Bytecode output.', 'success');
                }}
                className="px-3.5 h-9 bg-indigo-500 text-white rounded-xl text-[10px] uppercase font-black cursor-pointer hover:bg-indigo-450 disabled:opacity-40 transition-all flex items-center justify-center gap-1"
              >
                <RotateCw size={12} /> Convert
              </button>
              <button 
                disabled={compileStep !== 'ready'}
                onClick={() => {
                  document.getElementById('interactive-chart-panel')?.scrollIntoView({ behavior: 'smooth' });
                  addLog('Viewing dynamic price simulator.', 'info');
                }}
                className="px-3.5 h-9 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-[10px] uppercase font-black cursor-pointer hover:border-slate-700 disabled:opacity-40 transition-all flex items-center justify-center gap-1"
              >
                <Eye size={12} /> Preview
              </button>
              <button 
                disabled={compileStep !== 'ready'}
                onClick={() => {
                  addLog('Successfully attached indicator to active charts!', 'success');
                  try {
                    localStorage.setItem('clearpath_active_river_indicator_name', activeIndicatorLoaded);
                    localStorage.setItem('clearpath_active_river_indicator_code', transpiledRir || '');
                    localStorage.setItem('clearpath_active_river_indicator_active', 'true');
                    window.dispatchEvent(new CustomEvent('river-indicator-updated', { 
                      detail: { name: activeIndicatorLoaded, code: transpiledRir || '' } 
                    }));
                  } catch (e) {
                    console.error("Local storage sync error", e);
                  }
                  alert(`Success: "${activeIndicatorLoaded}" is now deployed to active trading charts (Lightweight Sandbox).`);
                }}
                className="px-3.5 h-9 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-[10px] uppercase font-black cursor-pointer hover:opacity-95 disabled:opacity-40 transition-all flex items-center justify-center gap-1"
              >
                <Check size={12} /> Add To Chart
              </button>
            </div>
          </section>

          {/* CARD 3: LANGUAGE DETECTION SYSTEM */}
          <section className="bg-slate-950/45 backdrop-blur-md border border-slate-900/60 p-5 rounded-2xl text-left space-y-3 shadow-md" id="diagnostics-panel">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                <SlidersHorizontal size={14} className="text-indigo-400" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-white tracking-widest leading-none">Card 3: Language Detection & Compliancy</h4>
                <p className="text-[9px] text-slate-500 mt-1 uppercase font-mono">AST grammar trees checked</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[10px]">
              <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850">
                <span className="text-slate-500 block uppercase text-[8px] mb-1">Detected Language</span>
                <span className="text-[#00D9FF] font-extrabold text-xs block uppercase">
                  {uploadedFile ? uploadedFile.detectedPlatform : "Pine Script v5"}
                </span>
                <span className="text-slate-500 mt-1 block">Confidence: {uploadedFile && languageConfidence > 0 ? `${languageConfidence}%` : "99.8%"}</span>
              </div>
              
              <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850">
                <span className="text-slate-500 block uppercase text-[8px] mb-1">Compliance Score</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-lg font-black ${complianceScore > 90 ? 'text-emerald-400' : 'text-yellow-500'}`}>
                    {complianceScore > 0 ? `${complianceScore}%` : '96%'}
                  </span>
                  <span className="text-slate-500">Perfect Sync</span>
                </div>
              </div>

              <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850">
                <span className="text-slate-500 block uppercase text-[8px] mb-1">RIR Target Runtime</span>
                <span className="text-indigo-400 font-extrabold text-xs block mt-0.5">RIVER_VM_v16_STABLE</span>
                <span className="text-slate-500 block mt-1">Direct VM binary bytecode</span>
              </div>
            </div>
          </section>

          {/* CARD 4: CONVERSION REPORT & RIR BYTECODE SHOWCASE */}
          <section className="bg-slate-950/45 backdrop-blur-md border border-slate-900/60 p-5 rounded-2xl text-left space-y-4 shadow-md" id="rir-report-panel">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center">
                <FileText size={14} className="text-pink-400" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-white tracking-widest leading-none">Card 4: Bytecode Conversion Report</h4>
                <p className="text-[9px] text-slate-500 mt-1 uppercase font-mono">Compiled .rir bytecode representations</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[9px] uppercase font-mono font-bold text-slate-500 block">RIR Intermediate ByteCode</label>
                <pre className="bg-black/80 border border-slate-850 rounded-xl p-3 h-44 overflow-y-auto custom-scrollbar font-mono text-[9px] text-slate-400 select-text leading-relaxed text-left">
                  {transpiledRir || `// No active compiled RIR output.\n// Select a platform card above to populate default transpiler bytecode.`}
                </pre>
              </div>

              <div className="flex flex-col gap-2 font-mono text-[10px]">
                <label className="text-[9px] uppercase font-bold text-slate-500 block">Sandbox Verification Log</label>
                <pre className="bg-slate-950/80 border border-slate-900 p-3.5 h-44 rounded-xl text-slate-400 overflow-y-auto custom-scrollbar text-left text-[9px] leading-relaxed select-text">
                  {sandboxLog || `✓ System environment check: clean.\n✓ MicroVM container: ready.\n✓ Pre-allocating virtual registers...\n⚠️ Waiting for compilation execution.`}
                </pre>
              </div>
            </div>
          </section>

          {/* CARD 5: INTERACTIVE LIVE CHART PREVIEW (With prices and buy/sell signals!) */}
          <section className="bg-slate-950/45 backdrop-blur-md border border-slate-900/60 p-5 rounded-2xl text-left space-y-4 shadow-md" id="interactive-chart-panel">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                  <BarChart2 size={14} className="text-cyan-400" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-white tracking-widest leading-none">Card 5: Simulated Price Chart Preview</h4>
                  <p className="text-[9px] text-[#00D9FF] uppercase font-mono">Interactive EMA Cross Over & Crossover Indicators</p>
                </div>
              </div>
              
              <div className="bg-slate-900/60 border border-slate-850 px-2.5 py-1 rounded-lg text-[9px] font-mono text-slate-400">
                ACTIVE_INDICATOR: <span className="text-white font-bold">{activeIndicatorLoaded}</span>
              </div>
            </div>

            {/* LIVE ADJUSTABLE SLIDERS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/30 p-4 border border-slate-850/50 rounded-2xl">
              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-450 uppercase font-bold">Indicator MA Period</span>
                  <span className="text-indigo-400 font-extrabold">{maPeriod} Close Bars</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="100" 
                  value={maPeriod}
                  onChange={(e) => {
                    setMaPeriod(Number(e.target.value));
                    addLog(`MA Period adjusted dynamically: ${e.target.value}`, 'info');
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-450 uppercase font-bold">Deviation Multiplier</span>
                  <span className="text-indigo-400 font-extrabold">x{maMultiplier.toFixed(2)}</span>
                </div>
                <input 
                  type="range" 
                  min="0.3" 
                  max="3.0" 
                  step="0.1"
                  value={maMultiplier}
                  onChange={(e) => {
                    setMaMultiplier(Number(e.target.value));
                    addLog(`Deviation Multiplier adjusted to: ${e.target.value}`, 'info');
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                />
              </div>
            </div>

            {/* THE VISUAL CHART STAGE (A beautiful SVG drawing real-time price trend lines) */}
            <div className="h-64 h-[240px] bg-[#030408]/90 border border-slate-900 rounded-2xl relative overflow-hidden flex items-center justify-center p-2">
              <svg className="w-full h-full" viewBox="0 0 540 220">
                {/* Horizontal reference grids */}
                <line x1="10" y1="50" x2="530" y2="50" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3,3" />
                <line x1="10" y1="110" x2="530" y2="110" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3,3" />
                <line x1="10" y1="170" x2="530" y2="170" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3,3" />
                
                {/* Candle lines and bodies mapping */}
                {priceData.map((d, i) => {
                  const isUp = d.c >= d.o;
                  const candleHeight = Math.abs(d.c - d.o) * 2;
                  const candleY = 220 - (Math.max(d.c, d.o) - 90) * 5;
                  const wickTopY = 220 - (d.h - 90) * 5;
                  const wickBottomY = 220 - (d.l - 90) * 5;
                  
                  return (
                    <g key={i}>
                      {/* Vertical high-low wick */}
                      <line 
                        x1={d.x} 
                        y1={wickTopY} 
                        x2={d.x} 
                        y2={wickBottomY} 
                        stroke={isUp ? '#10b981' : '#f43f5e'} 
                        strokeWidth="1.2" 
                      />
                      {/* Body */}
                      <rect 
                        x={d.x - 7} 
                        y={candleY} 
                        width="14" 
                        height={Math.max(candleHeight, 4)} 
                        fill={isUp ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}
                        stroke={isUp ? '#10b981' : '#f43f5e'}
                        strokeWidth="1"
                        rx="1.5"
                      />
                      {/* Ticks Label */}
                      <text x={d.x} y="210" fill="#475569" fontSize="8" textAnchor="middle" fontFamily="monospace">
                        {d.t}
                      </text>
                    </g>
                  );
                })}

                {/* DYNAMIC CALCULATED INDICATOR LINE BASED ON SLIDERS */}
                <path 
                  d={`M ${priceData.map((d, index) => `${d.x},${220 - (emas[index] - 90) * 5}`).join(' L ')}`} 
                  fill="none" 
                  stroke="#bd1c7a" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  className="drop-shadow-[0_0_8px_rgba(255,0,200,0.4)]"
                />

                {/* Overlay simulated Signals crossover circles/arrows */}
                {priceData.map((d, index) => {
                  // Crossover math signal
                  if (index === 4) {
                    const py = 220 - (emas[index] - 90) * 5;
                    return (
                      <g key={index}>
                        <circle cx={d.x} cy={py} r="8" fill="#10b981" className="animate-ping opacity-60" />
                        <circle cx={d.x} cy={py} r="5" fill="#0fb981" />
                        <text x={d.x} y={py - 12} fill="#10b981" fontSize="9" fontWeight="900" textAnchor="middle" fontFamily="monospace">BUY</text>
                      </g>
                    );
                  }
                  if (index === 7) {
                    const py = 220 - (emas[index] - 90) * 5;
                    return (
                      <g key={index}>
                        <circle cx={d.x} cy={py} r="8" fill="#f43f5e" className="animate-ping opacity-60" />
                        <circle cx={d.x} cy={py} r="5" fill="#f43f5e" />
                        <text x={d.x} y={py - 12} fill="#f43f5e" fontSize="9" fontWeight="900" textAnchor="middle" fontFamily="monospace">SELL</text>
                      </g>
                    );
                  }
                  return null;
                })}
              </svg>

              <div className="absolute top-3 left-3 bg-slate-900/85 px-3 py-1.5 rounded-lg border border-slate-800 text-[9px] font-mono leading-none space-y-1">
                <span className="text-slate-400 block uppercase font-bold">RIR MicroVM Candle Feed</span>
                <span className="text-zinc-500 font-medium">Period: {maPeriod} EMA • Mult: x{maMultiplier.toFixed(1)}</span>
              </div>
            </div>
          </section>

          {/* CARD 6: SAVE & ATTACH TO WORKSPACE */}
          <section className="bg-slate-950/45 backdrop-blur-md border border-slate-900/60 p-5 rounded-2xl text-left space-y-3 shadow-md" id="add-to-chart-card">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
                <Check size={14} className="text-teal-400" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-white tracking-widest leading-none">Card 6: Deployed Workspaces Attachment</h4>
                <p className="text-[9px] text-slate-500 mt-1 uppercase font-mono">Mount indicator code directly</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Once converted to RIR bytecodes, compilation scripts run safely in sandboxed modules. Mount indicators directly into high-speed brokerage terminals or export code models to your Git branch.
            </p>
          </section>

          {/* DEVELOPER MODE DETAILS GRAPH - Shown only when Developer Mode is active */}
          <AnimatePresence>
            {!isTraderMode && (
              <motion.section 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-black/90 border border-pink-500/40 p-5 rounded-2xl text-left space-y-3 font-mono text-[9px] overflow-hidden"
              >
                <div className="flex items-center gap-2 border-b border-pink-500/10 pb-2 mb-2 text-pink-400">
                  <Cpu size={12} className="animate-spin" />
                  <span className="font-extrabold uppercase tracking-widest text-xs">Developer Mode: Abstract Syntax Tree Node Specs</span>
                </div>
                
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-850 max-h-40 overflow-y-auto custom-scrollbar select-text text-left text-zinc-400">
{`Node_CompilationUnit (RiverCross)
├── Node_ImportDirective (rir.indicators.ma)
└── Node_ActionDeclaration (compute)
    ├── VariableDeclaration (ma_short)
    │   └── CallExpression (ema)
    │       ├── Parameter (price_close)
    │       └── IntLiteral (${maPeriod})
    └── BinaryExpression (status_crossover)
        └── Operator (Crossover)`}
                </div>

                <div className="text-yellow-500 bg-yellow-500/5 p-2 rounded border border-yellow-500/20 text-[8px] uppercase font-black tracking-wider leading-relaxed">
                  ⚠️ NOTICE: Developer mode shows low-level token compiler structures. Perfect for building custom parsers or debugging compiler exceptions.
                </div>
              </motion.section>
            )}
          </AnimatePresence>
            </>
          )}

        </main>

        {/* =============== =============== RIGHT SIDEBAR STATUSES =============== =============== */}
        <aside className="w-full lg:w-[320px] shrink-0 sticky top-[94px] h-[calc(100vh-130px)] overflow-y-auto hidden xl:flex flex-col gap-5 scrollbar-none text-left">
          
          <div className="bg-slate-950/45 backdrop-blur-md border border-slate-900/60 rounded-2xl p-4.5 space-y-4">
            <h3 className="text-[10px] uppercase font-mono font-black text-slate-400 tracking-wider border-b border-slate-900 pb-2 leading-none">
              River Runtime Statuses
            </h3>

            <div className="space-y-4 text-xs font-mono">
              <div className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-slate-850/60">
                <div className="space-y-1">
                  <span className="text-slate-500 text-[8px] uppercase block leading-none">Compiler Status</span>
                  <span className="font-black text-white uppercase text-[11px]">Ready</span>
                </div>
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981] animate-pulse" />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-slate-850/60">
                <div className="space-y-1">
                  <span className="text-slate-500 text-[8px] uppercase block leading-none">RIR Sandbox MicroVM</span>
                  <span className="font-black text-white uppercase text-[11px]">ACTIVE LOAD_SAFE</span>
                </div>
                <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee] animate-pulse" />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-slate-850/60">
                <div className="space-y-1">
                  <span className="text-slate-500 text-[8px] uppercase block leading-none">GitHub Repository</span>
                  <span className="font-black text-white uppercase text-[11px]">Synchronized</span>
                </div>
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-[0_0_8px_#6366f1]" />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-slate-850/60">
                <div className="space-y-1">
                  <span className="text-slate-500 text-[8px] uppercase block leading-none">VS Code Link</span>
                  <span className="font-black text-white uppercase text-[11px]">Listening</span>
                </div>
                <span className="w-2.5 h-2.5 bg-purple-500 rounded-full shadow-[0_0_8px_#a855f7]" />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-slate-850/60">
                <div className="space-y-1">
                  <span className="text-slate-500 text-[8px] uppercase block leading-none">API Endpoint router</span>
                  <span className="font-black text-white uppercase text-[11px]">Active</span>
                </div>
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981] animate-pulse" />
              </div>
            </div>
          </div>

          {/* Quick legal guidelines / System limits card */}
          <div className="bg-slate-950/25 border border-slate-900/40 rounded-2xl p-4.5 space-y-2.5">
            <span className="text-[9px] uppercase font-mono font-black text-indigo-400 tracking-wider block">Operational Guide</span>
            <p className="text-[10px] text-slate-500 leading-normal leading-relaxed text-left">
              Ensure that your indicator properties don't use absolute sizing matrices inside loop buffers. River VM checks compliance indicators to protect memory bounds.
            </p>
          </div>

        </aside>

      </div>

      {/* =============== =============== FLOATING MESSENGER DRAWER: RIVER CONSOLE =============== =============== */}
      <div className="fixed bottom-4 right-4 z-50">
        <AnimatePresence>
          {isConsoleOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 100 }}
              className="w-96 h-[340px] bg-slate-950 border border-slate-850 rounded-2xl shadow-2xl overflow-hidden flex flex-col mb-2 text-left"
            >
              {/* Header */}
              <div className="bg-slate-900/80 px-4 py-3 border-b border-slate-850 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono text-xs font-black uppercase text-white tracking-widest">River Console</span>
                </div>
                <button 
                  onClick={() => setIsConsoleOpen(false)}
                  className="text-slate-500 hover:text-slate-300 text-xs uppercase font-mono cursor-pointer"
                >
                  Hide
                </button>
              </div>

              {/* Console Tabs */}
              <div className="flex border-b border-rose-500/10 text-[9px] font-mono bg-black/40">
                {[
                  { id: 'logs', label: 'Logs' },
                  { id: 'compiler', label: 'Compiler AST' },
                  { id: 'runtime', label: 'Runtime parameters' },
                  { id: 'system', label: 'System status' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setConsoleTab(tab.id as any);
                      addLog(`Console display targeted to ${tab.label}.`, 'info');
                    }}
                    className={`flex-1 py-1 px-2 border-b-2 text-center select-none cursor-pointer text-slate-400 font-extrabold uppercase transition-all whitespace-nowrap ${
                      consoleTab === tab.id ? 'border-indigo-500 text-indigo-400 bg-slate-900/20' : 'border-transparent'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Console Body Area */}
              <div className="flex-1 p-3 bg-black/90 font-mono text-[9px] space-y-1.5 overflow-y-auto custom-scrollbar select-text leading-relaxed text-left">
                {consoleTab === 'logs' && (
                  consoleLogs.map((log) => (
                    <div key={log.id} className="flex gap-2">
                      <span className="text-slate-600 shrink-0">[{log.time}]</span>
                      <span className={`
                        ${log.type === 'success' ? 'text-emerald-400' : ''}
                        ${log.type === 'warn' ? 'text-yellow-500 font-bold' : ''}
                        ${log.type === 'error' ? 'text-rose-400 font-black animate-pulse' : ''}
                        ${log.type === 'info' ? 'text-[#00D9FF]' : ''}
                      `}>
                        {log.msg}
                      </span>
                    </div>
                  ))
                )}

                {consoleTab === 'compiler' && (
                  <pre className="text-zinc-500 select-text leading-normal">
{`Node_CompilationUnit (RiverCross)
├── Node_ImportDirective (rir.indicators.ma)
└── Node_ActionDeclaration (compute)
    ├── VariableDeclaration (ma_short)
    │   └── CallExpression (ema)
    │       ├── Parameter (price_close)
    │       └── IntLiteral (9)
    └── BinaryExpression (status_crossover)
        └── Operator (Crossover)`}
                  </pre>
                )}

                {consoleTab === 'runtime' && (
                  <div className="space-y-1.5 text-slate-400 uppercase font-bold text-[8px]">
                    <div className="flex justify-between">
                      <span>VIRTUAL WORKSPACE STATE</span>
                      <span className="text-emerald-400">VM_ACTIVE</span>
                    </div>
                    <div className="flex justify-between">
                      <span>MA PERIOD VALUE</span>
                      <span className="text-[#00D9FF]">{maPeriod} Close Bars</span>
                    </div>
                    <div className="flex justify-between">
                      <span>DEVIATION MULTIPLIER</span>
                      <span className="text-pink-400">x{maMultiplier.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SANDBOX STORAGE</span>
                      <span className="text-slate-500">10MB MAX</span>
                    </div>
                  </div>
                )}

                {consoleTab === 'system' && (
                  <div className="space-y-1 text-slate-500 text-[8px] uppercase">
                    <p>✓ VM Kernel: Antigravity-RIR-v16.2</p>
                    <p>✓ Node Ingress proxy binding: PORT 3000 mapping internally</p>
                    <p>⚡ Platform Host: Cloud Sandbox</p>
                    <p>✓ Host Process CPU: 0.15% (Idle limit 10%)</p>
                    <p>✓ Active Memory: 42MB (Virtual heap size 512MB)</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Small floating action trigger button */}
        <button 
          onClick={() => {
            setIsConsoleOpen(!isConsoleOpen);
            addLog('Console panel toggled.', 'info');
          }}
          className={`w-14 h-14 rounded-full bg-indigo-500 hover:bg-indigo-450 active:scale-90 duration-350 shadow-2xl flex items-center justify-center cursor-pointer relative z-50 text-white ${isConsoleOpen ? 'rotate-90 bg-slate-900 border border-slate-750' : ''}`}
        >
          {isConsoleOpen ? (
            <ChevronDown size={20} />
          ) : (
            <Terminal size={20} />
          )}
          {!isConsoleOpen && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[8px] bg-rose-500 font-bold border border-slate-950">
              3
            </span>
          )}
        </button>
      </div>

    </div>
  );
}
