
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { themeProfiles, type ThemeProfile } from '../../lib/theme/profiles';
import { LightweightCandles } from '../charts/LightweightCandles';
import { ChartSymbolSearch } from '../charts/ChartSymbolSearch';
import { ChartIndicatorPicker } from '../charts/ChartIndicatorPicker';
import { DraggableChartPanel } from '../charts/DraggableChartPanel';
import { BackToDashboard } from '../nav/BackToDashboard';
import { PatternScannerPanel } from '../charts/PatternScannerPanel';
import { NeuroProfilePicker } from '../charts/NeuroProfilePicker';
import type { ThemeProfileId } from '../../lib/theme/profiles';
import { TradingHaltController } from '../../truth/TradingHaltController';
import { resolveMarketAsset } from '../../constants/marketAssets';
import {
  createEmptyMarketSlots,
  ensureMarketSlotsHaveSymbols,
  MARKET_CHART_HEIGHT,
  MARKET_CHART_SLOT_COUNT,
  type ChartLayoutSlot,
} from '../../constants/chartLayout';
import { usePersistedLayout } from '../../hooks/useDraggablePosition';

const timeframesMapping: Record<string, string> = {
  '1m': '1m', '2m': '2m', '3m': '3m', '5m': '5m', '10m': '10m', '15m': '15m', '30m': '30m',
  '1H': '1h', '2H': '2h', '3H': '3h', '4H': '4h',
  '1D': '1d', '1W': '1w', '1M': '1M', '3M': '3M', '6M': '6M', 'YTD': 'ytd'
};

const CHART_LAYOUT_STORAGE_KEY = 'cpt-market-terminal-chart-layout';

function loadMarketSlots(): ChartLayoutSlot[] {
  try {
    const raw = localStorage.getItem(CHART_LAYOUT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === MARKET_CHART_SLOT_COUNT) {
        const slots = parsed.map((slot: ChartLayoutSlot, i: number) => ({
          symbol: slot.symbol ?? null,
          x: typeof slot.x === 'number' ? slot.x : 0,
          y: typeof slot.y === 'number' ? slot.y : i * MARKET_CHART_HEIGHT,
        }));
        return ensureMarketSlotsHaveSymbols(slots);
      }
    }
    const legacy = localStorage.getItem('cpt-market-terminal-chart-slots');
    if (legacy) {
      const parsed = JSON.parse(legacy);
      const defaults = createEmptyMarketSlots();
      if (Array.isArray(parsed)) {
        const slots = defaults.map((slot, i) => ({
          ...slot,
          symbol: parsed[i]?.value ?? slot.symbol,
        }));
        return ensureMarketSlotsHaveSymbols(slots);
      }
    }
  } catch {
    /* ignore */
  }
  return createEmptyMarketSlots();
}

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
  const [chartSlots, saveChartSlots] = usePersistedLayout<ChartLayoutSlot[]>(
    CHART_LAYOUT_STORAGE_KEY,
    loadMarketSlots
  );
  const [activeTimeframe, setActiveTimeframe] = useState('1H');
  const [activeIndicators, setActiveIndicators] = useState<string[]>([]);

  const toggleIndicator = useCallback((abbr: string) => {
    setActiveIndicators((prev) =>
      prev.includes(abbr) ? prev.filter((i) => i !== abbr) : [...prev, abbr]
    );
  }, []);

  const primarySymbol = chartSlots[0]?.symbol ?? null;
  const compareSymbol = chartSlots[1]?.symbol ?? null;
  const patternPanelSymbol = chartSlots.find((s) => s.symbol)?.symbol ?? primarySymbol ?? '';
  const patternTimeframe = timeframesMapping[activeTimeframe] || '1h';

  const canvasMinHeight = useMemo(() => {
    const bottoms = chartSlots.map((s) => s.y + MARKET_CHART_HEIGHT);
    return Math.max(MARKET_CHART_HEIGHT * MARKET_CHART_SLOT_COUNT, ...bottoms, 0) + 40;
  }, [chartSlots]);

  useEffect(() => {
    return TradingHaltController.subscribe((isHalted, reason) => {
      setHalted(isHalted);
      setHaltReason(reason);
    });
  }, []);

  useEffect(() => {
    if (!isBlackoutMode) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsBlackoutMode(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isBlackoutMode]);

  const updateSlot = useCallback(
    (index: number, patch: Partial<ChartLayoutSlot>) => {
      saveChartSlots((prev) =>
        prev.map((slot, i) => (i === index ? { ...slot, ...patch } : slot))
      );
      if (index === 0 && patch.symbol) {
        onSelectMarketSymbol?.(patch.symbol);
      }
    },
    [saveChartSlots, onSelectMarketSymbol]
  );

  useEffect(() => {
    if (selectedMarketSymbol) {
      updateSlot(0, { symbol: resolveMarketAsset(selectedMarketSymbol).value });
    }
  }, [selectedMarketSymbol, updateSlot]);

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
              {primarySymbol ?? '—'} vs {compareSymbol ?? '—'} · {activeTimeframe}
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
          <div className="hidden lg:flex lg:w-80 xl:w-96 shrink-0 min-h-0">
            <PatternScannerPanel
              symbol={patternPanelSymbol || '—'}
              timeframe={patternTimeframe}
              compact
            />
          </div>
          <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-2">
          {[0, 1].map((slotIndex) => {
            const sym = chartSlots[slotIndex]?.symbol ?? null;
            const label = slotIndex === 0 ? 'Primary' : 'Compare';
            return (
              <div key={slotIndex} className="flex-1 min-h-0 rounded-2xl overflow-hidden border border-zinc-900 bg-black flex flex-col">
                <div className="shrink-0 px-3 py-2 border-b border-zinc-900 space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">{label} · {activeTimeframe}</span>
                  <ChartSymbolSearch
                    compact
                    placeholder="Search your chart…"
                    activeSymbol={sym}
                    onSubmit={(s) => updateSlot(slotIndex, { symbol: resolveMarketAsset(s).value })}
                  />
                </div>
                <div className="flex-1 min-h-0 relative">
                  {sym ? (
                    <LightweightCandles profileId={profile.id} isExpanded height={800} timeframe={patternTimeframe} symbol={sym} theme={chartTheme} blackoutMode useDedicatedPatternPanel activeIndicators={activeIndicators} />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-600 font-mono text-xs text-center px-6">
                      Search your chart above — your symbol, your choice
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return (
    <div
      className="market-terminal-ui flex flex-col min-h-full w-full transition-all duration-1000"
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
        <p className="text-[10px] font-mono text-zinc-500 max-w-xs text-right hidden md:block">
          Charts open with Gold, EUR/USD, and DXY so the pattern scanner can run immediately. Search to swap any slot — drag to arrange.
        </p>
      </div>

      <div className="flex-1 p-8" style={{ background: '#000000' }}>
        <div className="max-w-7xl mx-auto w-full space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-indigo-500/20 pb-6">
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
              <div className="px-4 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                Your charts · drag to move
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
            <div className="lg:col-span-1 flex flex-col lg:sticky lg:top-8 min-h-[520px]">
              <PatternScannerPanel
                symbol={patternPanelSymbol || '—'}
                timeframe={patternTimeframe}
              />
            </div>

            <div className="lg:col-span-3 space-y-6">
              <div className="lg:hidden">
                <PatternScannerPanel
                  symbol={patternPanelSymbol || '—'}
                  timeframe={patternTimeframe}
                  compact
                />
              </div>
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

              <ChartIndicatorPicker
                activeIndicators={activeIndicators}
                onToggle={toggleIndicator}
                onClear={() => setActiveIndicators([])}
              />

              <p className="text-[11px] font-mono text-zinc-500 leading-relaxed">
                Three chart slots — all empty until you search. Grab the handle on any chart and drag it anywhere in this workspace.
              </p>

              <div
                id="master-chart-stack"
                className="multi-chart-container relative w-full"
                style={{ minHeight: canvasMinHeight }}
              >
                {chartSlots.map((slot, idx) => (
                  <DraggableChartPanel
                    key={`market-chart-${idx}`}
                    mode="absolute"
                    width="100%"
                    zIndex={10 + idx}
                    position={{ x: slot.x, y: slot.y }}
                    onPositionChange={(pos) => updateSlot(idx, pos)}
                    className="!h-[500px] glass shadow-2xl"
                    header={
                      <div className="flex items-center gap-2 min-w-0 w-full">
                        <ChartSymbolSearch
                          compact
                          placeholder="Search your chart…"
                          activeSymbol={slot.symbol}
                          onSubmit={(sym) => updateSlot(idx, { symbol: resolveMarketAsset(sym).value })}
                        />
                        {slot.symbol && (
                          <button
                            type="button"
                            onClick={() => updateSlot(idx, { symbol: null })}
                            className="p-1 rounded text-zinc-600 hover:text-rose-400 transition-colors shrink-0"
                            aria-label="Clear chart"
                          >
                            <X size={12} />
                          </button>
                        )}
                        <span className="text-[8px] font-mono text-zinc-600 uppercase shrink-0 hidden lg:inline">
                          {activeTimeframe}
                        </span>
                      </div>
                    }
                  >
                    {slot.symbol ? (
                      <div className="flex-1 h-[452px] relative">
                        <LightweightCandles
                          profileId={profile.id}
                          height={440}
                          timeframe={patternTimeframe}
                          symbol={slot.symbol}
                          theme={chartTheme}
                          useDedicatedPatternPanel
                          activeIndicators={activeIndicators}
                        />
                        <div className="brand-mask-forced !bottom-4 !right-6">
                          <img src="/logo.png" alt="Clear Path Markets Science" className="h-7 w-auto max-w-[140px] object-contain opacity-90 drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]" />
                        </div>
                      </div>
                    ) : (
                      <div className="h-[452px] flex flex-col items-center justify-center gap-3 px-8 text-center border-t border-dashed border-white/10 bg-black/40">
                        <span className="text-sm font-mono text-zinc-400 uppercase tracking-wider">
                          Chart slot {idx + 1} — empty
                        </span>
                        <span className="text-xs text-zinc-600 max-w-sm leading-relaxed">
                          Type any symbol in the search bar above (EURUSD, AAPL, XAUUSD — whatever you want to watch). Nothing is chosen for you.
                        </span>
                      </div>
                    )}
                  </DraggableChartPanel>
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
