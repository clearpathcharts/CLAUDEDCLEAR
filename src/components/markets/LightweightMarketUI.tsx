
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { themeProfiles, type ThemeProfile } from '../../lib/theme/profiles';
import { LightweightCandles } from '../charts/LightweightCandles';
import { BackToDashboard } from '../nav/BackToDashboard';
import TerminalConfigWidget from '../widgets/TerminalConfigWidget';
import CompactSocialTerminal from '../widgets/CompactSocialTerminal';
import { NeuroProfilePicker } from '../charts/NeuroProfilePicker';
import type { ThemeProfileId } from '../../lib/theme/profiles';
import { TradingHaltController } from '../../truth/TradingHaltController';
import { MARKET_ASSETS, resolveMarketAsset, type MarketAsset } from '../../constants/marketAssets';

const ASSETS = MARKET_ASSETS;

const timeframesMapping: Record<string, string> = {
  '1m': '1m', '2m': '2m', '3m': '3m', '5m': '5m', '10m': '10m', '15m': '15m', '30m': '30m',
  '1H': '1h', '2H': '2h', '3H': '3h', '4H': '4h',
  '1D': '1d', '1W': '1w', '1M': '1M', '3M': '3M', '6M': '6M', 'YTD': 'ytd'
};

const CHART_SLOT_COUNT = 3;
const CHART_SLOTS_STORAGE_KEY = 'cpt-market-terminal-chart-slots';

const DEFAULT_CHART_SLOTS: MarketAsset[] = [
  { label: 'XAU/USD', value: 'XAUUSD' },
  { label: 'EUR/USD', value: 'EURUSD' },
  { label: 'DXY', value: 'DXY' },
];

function loadChartSlots(): MarketAsset[] {
  try {
    const raw = localStorage.getItem(CHART_SLOTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === CHART_SLOT_COUNT) {
        return parsed.map((entry: MarketAsset) => resolveMarketAsset(entry.value));
      }
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_CHART_SLOTS;
}

const ChartWidget = ({
  asset,
  profile,
  activeTimeframe = '1H',
  chartTheme,
  slotIndex,
  onAssetChange,
}: {
  asset: MarketAsset;
  profile: ThemeProfile;
  activeTimeframe?: string;
  chartTheme?: any;
  slotIndex: number;
  onAssetChange?: (asset: MarketAsset) => void;
}) => {
  return (
    <div
      className="individual-chart-wrapper !h-[500px] flex flex-col relative overflow-hidden rounded-2xl border border-white/5 shadow-2xl glass"
      id={`wrapper_slot_${slotIndex}_${asset.value.replace(/[^a-zA-Z0-9_-]/g, '_')}`}
    >
      <div className="flex items-center justify-between px-6 py-3 border-b bg-black/40 backdrop-blur-md border-white/5 select-none shrink-0">
        <div className="flex items-center space-x-3 min-w-0">
          {onAssetChange ? (
            <select
              value={asset.value}
              onChange={(e) => onAssetChange(resolveMarketAsset(e.target.value))}
              className="bg-transparent text-xs font-black tracking-widest text-[#00FFFF] uppercase font-mono outline-none cursor-pointer max-w-[140px] truncate"
            >
              {ASSETS.map((a) => (
                <option key={a.value} value={a.value} className="bg-black text-white">
                  {a.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-black tracking-widest text-[#00FFFF] uppercase font-mono bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20 shadow-[0_0_10px_rgba(0,255,255,0.15)]">
              {asset.label}
            </span>
          )}
          <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest truncate">
            {asset.value}
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[9px] font-black tracking-widest uppercase text-zinc-400 shrink-0">
          <span className="hidden sm:inline text-zinc-600">CHART {slotIndex + 1}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00FFFF] shadow-[0_0_6px_rgba(0,255,255,0.8)] animate-pulse" />
          <span>{activeTimeframe} STREAM</span>
        </div>
      </div>
      <div className="flex-1 w-full min-h-0 relative">
        <LightweightCandles
          profileId={profile.id}
          height={440}
          timeframe={timeframesMapping[activeTimeframe] || '1h'}
          symbol={asset.value}
          theme={chartTheme}
        />
      </div>
      <div className="brand-mask-forced !bottom-4 !right-6">
        <i className="fas fa-chart-line mr-2"></i> CLEAR PATH TRADER
      </div>
    </div>
  );
};

interface LightweightMarketUIProps {
  onBack: () => void;
  profile: ThemeProfile;
  chartTheme?: any;
  selectedMarketSymbol?: string;
  onSelectMarketSymbol?: (symbol: string) => void;
  onProfileChange?: (profileId: ThemeProfileId) => void;
}

export const LightweightMarketUI: React.FC<LightweightMarketUIProps> = ({
  onBack,
  profile,
  chartTheme,
  selectedMarketSymbol,
  onSelectMarketSymbol,
  onProfileChange,
}) => {
  const [halted, setHalted] = useState(TradingHaltController.isHalted());
  const [haltReason, setHaltReason] = useState(TradingHaltController.getHaltReason());
  const [isBlackoutMode, setIsBlackoutMode] = useState(false);
  const [chartSlots, setChartSlots] = useState<MarketAsset[]>(loadChartSlots);

  const mainAsset = chartSlots[0] ?? DEFAULT_CHART_SLOTS[0];
  const secondaryAsset = chartSlots[1] ?? DEFAULT_CHART_SLOTS[1];

  useEffect(() => {
    return TradingHaltController.subscribe((isHalted, reason) => {
      setHalted(isHalted);
      setHaltReason(reason);
    });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CHART_SLOTS_STORAGE_KEY, JSON.stringify(chartSlots));
    } catch {
      /* ignore */
    }
  }, [chartSlots]);

  useEffect(() => {
    if (!isBlackoutMode) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsBlackoutMode(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isBlackoutMode]);

  const [searchSymbol, setSearchSymbol] = useState('');
  const [activeTimeframe, setActiveTimeframe] = useState('1H');

  const updateChartSlot = useCallback((index: number, asset: MarketAsset) => {
    setChartSlots((prev) => {
      const next = [...prev];
      next[index] = asset;
      return next;
    });
    if (index === 0) {
      onSelectMarketSymbol?.(asset.value);
    }
  }, [onSelectMarketSymbol]);

  useEffect(() => {
    if (selectedMarketSymbol) {
      updateChartSlot(0, resolveMarketAsset(selectedMarketSymbol));
    }
  }, [selectedMarketSymbol, updateChartSlot]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchSymbol.trim()) {
      const asset = resolveMarketAsset(searchSymbol);
      updateChartSlot(0, asset);
      setSearchSymbol('');
    }
  };

  if (halted) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center bg-black p-8 text-center" style={{ background: profile.bgTop }}>
        <div className="p-8 max-w-md bg-black/40 backdrop-blur-md rounded-3xl border border-red-900 border-dashed flex flex-col items-center">
          <span className="text-red-500 font-extrabold uppercase tracking-widest text-[#FF3131] mb-2">🔴 SYSTEM VALUATION TRADING HALT</span>
          <p className="text-xs text-zinc-400 font-mono uppercase mb-4">{haltReason || 'ALL INSTITUTIONAL AND CHART MODULES BLANKED'}</p>
          <BackToDashboard onBack={onBack} color={profile.text} />
        </div>
      </div>
    );
  }

  if (isBlackoutMode) {
    return createPortal(
      <div className="fixed inset-0 z-[150] bg-[#000000] flex flex-col">
        <div className="shrink-0 flex items-center justify-between gap-4 px-4 py-3 border-b border-zinc-900 bg-black">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse shrink-0" />
            <span className="text-zinc-400 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Blackout Mode</span>
            <span className="hidden md:inline text-zinc-600 font-mono text-[10px] uppercase truncate">
              {mainAsset.label} vs {secondaryAsset.label} · {activeTimeframe}
            </span>
          </div>
          <button
            onClick={() => setIsBlackoutMode(false)}
            className="shrink-0 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
          >
            <span>Exit Blackout</span>
            <span className="text-zinc-500 normal-case font-mono">(Esc)</span>
          </button>
        </div>
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-2 p-2">
            <div className="flex-1 min-h-0 rounded-2xl overflow-hidden border border-zinc-900 bg-black flex flex-col">
                <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-zinc-900">
                    <select
                        value={mainAsset.value}
                        onChange={(e) => updateChartSlot(0, resolveMarketAsset(e.target.value))}
                        className="bg-transparent text-zinc-200 font-mono text-xs font-bold outline-none cursor-pointer"
                    >
                         {ASSETS.map(asset => (
                             <option key={asset.value} value={asset.value} className="bg-black text-white">{asset.label}</option>
                         ))}
                    </select>
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Primary · {activeTimeframe}</span>
                </div>
                <div className="flex-1 min-h-0 relative">
                     <LightweightCandles profileId={profile.id} isExpanded height={800} timeframe={timeframesMapping[activeTimeframe] || '1h'} symbol={mainAsset.value} theme={chartTheme} blackoutMode={true} />
                </div>
            </div>
            <div className="flex-1 min-h-0 rounded-2xl overflow-hidden border border-zinc-900 bg-black flex flex-col">
                <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-zinc-900">
                    <select
                        value={secondaryAsset.value}
                        onChange={(e) => updateChartSlot(1, resolveMarketAsset(e.target.value))}
                        className="bg-transparent text-zinc-200 font-mono text-xs font-bold outline-none cursor-pointer"
                    >
                         {ASSETS.map(asset => (
                             <option key={asset.value} value={asset.value} className="bg-black text-white">{asset.label}</option>
                         ))}
                    </select>
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Compare · {activeTimeframe}</span>
                </div>
                <div className="flex-1 min-h-0 relative">
                     <LightweightCandles profileId={profile.id} isExpanded height={800} timeframe={timeframesMapping[activeTimeframe] || '1h'} symbol={secondaryAsset.value} theme={chartTheme} blackoutMode={true} />
                </div>
            </div>
        </div>
      </div>,
      document.body
    );
  }

  return (
    <div 
      className="flex flex-col min-h-full w-full transition-all duration-1000"
      style={{ background: profile.bgTop }}
    >
      <div 
        className="flex items-center justify-between px-8 py-4 border-b glass"
        style={{ 
          backgroundColor: 'rgba(0,0,0,0.5)',
          borderColor: `${profile.borderB}22`,
        }}
      >
        <div className="flex items-center space-x-6">
          <BackToDashboard onBack={onBack} color={profile.text} />
          <div className="h-6 w-[1px]" style={{ backgroundColor: `${profile.borderA}22` }} />
          <h1 className="text-2xl font-black tracking-tighter uppercase italic" style={{ color: profile.text }}>
            MARKET <span style={{ color: profile.borderA }}>TERMINAL</span>
          </h1>
        </div>

        <form onSubmit={handleSearch} className="flex items-center space-x-4">
          <div className="relative">
            <input 
              type="text"
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value)}
              placeholder="SEARCH SYMBOL (e.g. BTCUSD)"
              className="bg-black/50 border-2 px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-full focus:outline-none focus:ring-2 transition-all w-64"
              style={{ 
                color: profile.text,
                borderColor: `${profile.borderA}44`,
                boxShadow: `0 0 10px ${profile.borderA}11`
              }}
            />
            <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2">
              <i className="fas fa-search" style={{ color: profile.borderA }}></i>
            </button>
          </div>
          <button 
            type="button"
            className="px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-full border transition-all"
            style={{ 
              backgroundColor: 'rgb(38, 32, 95)', 
              borderColor: 'rgba(38, 32, 95, 0.5)',
              color: '#ffffff',
              boxShadow: '0 0 15px rgba(38, 32, 95, 0.6)'
            }}
          >
            All Markets
          </button>
        </form>
      </div>

      <div className="flex-1 p-8" style={{ background: '#000000' }}>
        <div className="max-w-7xl mx-auto w-full space-y-8">
          <div className="flex items-center justify-between border-b border-indigo-500/20 pb-6">
            <h1 className="text-3xl font-black tracking-tighter uppercase italic border-2 border-[#FF4500] shadow-[0_0_15px_#FF4500] px-4 py-2 rounded-lg" style={{ color: profile.text }}>
              CLEAR PATH <span style={{ color: profile.borderA }}>COMMAND TERMINAL</span>
            </h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsBlackoutMode(true)}
                className="px-4 py-1 rounded-full border border-zinc-700 bg-zinc-900 hover:bg-white hover:text-black transition-colors text-[10px] font-black uppercase tracking-widest text-zinc-400 group flex items-center gap-2"
              >
                  <span className="w-2 h-2 rounded-full bg-zinc-600 group-hover:bg-black transition-colors" />
                  BLACKOUT MODE
              </button>
              <div className="relative mr-4">
                <select
                  value={mainAsset.value}
                  onChange={(e) => updateChartSlot(0, resolveMarketAsset(e.target.value))}
                  className="bg-black/80 border-2 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg focus:outline-none focus:ring-1 cursor-pointer min-w-[160px]"
                  style={{
                    color: profile.text,
                    borderColor: `${profile.borderA}44`,
                    boxShadow: `0 0 10px ${profile.borderA}11`
                  }}
                >
                  {ASSETS.map((asset) => (
                    <option key={asset.value} value={asset.value} className="bg-[#111] text-white">
                      {asset.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="px-4 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                3 Charts Active
              </div>
            </div>
          </div>

          {onProfileChange && (
            <NeuroProfilePicker
              activeProfileId={profile.id}
              onProfileChange={onProfileChange}
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 flex flex-col space-y-6 lg:sticky lg:top-8">
              <div className="border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(0,217,255,0.15)] bg-black/60 backdrop-blur-md">
                <div className="p-4 border-b border-white/10 bg-[#FF00C8]/5 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#FF00C8] animate-pulse">
                    Terminal Matrix Control
                  </span>
                  <button
                    onClick={() => {
                      const event = new CustomEvent('trigger-terminal-telemetry-refresh');
                      window.dispatchEvent(event);
                    }}
                    title="Force refresh of all telemetry data channels"
                    className="flex items-center gap-1 text-[8px] font-mono text-zinc-400 hover:text-[#00D9FF] bg-black/60 hover:bg-[#00D9FF]/10 active:scale-95 border border-white/10 hover:border-[#00D9FF]/40 px-2 py-1 rounded transition-all duration-300 font-bold uppercase cursor-pointer"
                  >
                    <span>Refresh Data</span>
                  </button>
                </div>
                <TerminalConfigWidget />
              </div>

              <div className="border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(255,0,200,0.15)] bg-black/60 backdrop-blur-md">
                <div className="p-4 border-b border-white/10 bg-[#FF00C8]/5 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#00D9FF] animate-pulse">
                    WS Ticker Handshakes
                  </span>
                  <span className="text-[8px] font-mono text-zinc-500">CPMS-WS-FEED</span>
                </div>
                <CompactSocialTerminal />
              </div>
            </div>

            <div className="lg:col-span-3 space-y-6">
              <div className="timeframe-bar overflow-x-auto whitespace-nowrap custom-scrollbar flex items-center justify-between">
                <div>
                    {['1m', '2m', '3m', '5m', '10m', '15m', '30m', '1H', '2H', '3H', '4H', '1D', '1W', '1M', '3M', '6M', 'YTD'].map((tf, idx) => (
                      <button 
                        key={`${tf}-${idx}`} 
                        onClick={() => setActiveTimeframe(tf)}
                        className={`time-unit !py-1 !px-2 text-[10px] md:text-xs outline-none ${tf === activeTimeframe ? 'active' : ''}`}
                      >
                        {tf}
                      </button>
                    ))}
                </div>
              </div>
              
              <div id="master-chart-stack" className="multi-chart-container space-y-6">
                {chartSlots.map((asset, idx) => (
                  <ChartWidget
                    key={`slot-${idx}-${asset.value}-${activeTimeframe}`}
                    asset={asset}
                    profile={profile}
                    activeTimeframe={activeTimeframe}
                    chartTheme={chartTheme}
                    slotIndex={idx}
                    onAssetChange={(next) => updateChartSlot(idx, next)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div 
        className="px-8 py-4 border-t text-sm font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#ff3333] via-[#ff6633] to-[#ff9933] text-center glass"
        style={{ 
          backgroundColor: 'rgba(0,0,0,0.5)',
          borderColor: `${profile.borderA}22`,
          fontFamily: "'Cinzel', serif"
        }}
      >
        ⚖ Legal Positioning — “Provides financial data visualization with optional user-controlled presentation adjustments for accessibility and visual clarity. The system does not evaluate, alter, or advise on financial decisions.”
      </div>
    </div>
  );
};
