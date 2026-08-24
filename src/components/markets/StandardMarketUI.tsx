
import React, { useState, useEffect } from 'react';
import { themeProfiles, type ThemeProfile } from '../../lib/theme/profiles';
import { LightweightCandles } from '../charts/LightweightCandles';
import { ChartLocalTimeAndPulse } from '../charts/ChartLocalTimeAndPulse';
import { BackToDashboard } from '../nav/BackToDashboard';
import { TradingHaltController } from '../../truth/TradingHaltController';
import {
  desktopMarketPanelHeight,
  desktopStackedMarketChartHeight,
} from '../../constants/chartLayout';

import { setClearState, getClearState } from '../../lib/trading/clearState';
import { describeTimeframe } from '../../services/marketData';

const ASSETS = [
  { label: 'EUR/USD', value: 'EURUSD' },
  { label: 'GBP/USD', value: 'GBPUSD' },
  { label: 'USD/JPY', value: 'USDJPY' },
  { label: 'AUD/USD', value: 'AUDUSD' },
  { label: 'USD/CAD', value: 'USDCAD' },
  { label: 'NZD/USD', value: 'NZDUSD' },
];

const timeframesMapping: Record<string, string> = {
  '1m': '1m', '2m': '2m', '3m': '3m', '5m': '5m', '10m': '10m', '15m': '15m', '30m': '30m',
  '1H': '1h', '2H': '2h', '3H': '3h', '4H': '4h',
  '1D': '1d', '1W': '1w', '1M': '1M', '3M': '3M', '6M': '6M', 'YTD': 'ytd',
};

function toDataSymbol(raw: string): string {
  const upper = raw.toUpperCase().trim();
  if (upper.includes(':')) return upper.split(':').pop()!;
  return upper.replace('/', '');
}

const ChartWidget = ({
  asset,
  profile,
  activeTimeframe = '1H',
  chartBodyH,
}: {
  asset: typeof ASSETS[0];
  profile: ThemeProfile;
  activeTimeframe?: string;
  chartBodyH: number;
}) => {
  const dataSymbol = toDataSymbol(asset.value);
  const panelH = desktopMarketPanelHeight(chartBodyH);

  return (
    <div
      className="individual-chart-wrapper flex flex-col relative overflow-hidden rounded-2xl border border-white/5 shadow-2xl glass mb-6"
      style={{ height: panelH, minHeight: panelH }}
      id={`wrapper_std_${dataSymbol.replace(/[^a-zA-Z0-9_-]/g, '_')}`}
    >
      <div className="px-3 py-1 border-b bg-black/40 backdrop-blur-md border-white/5 shrink-0">
        <ChartLocalTimeAndPulse slotId={`std-${dataSymbol}`} symbol={dataSymbol} />
      </div>
      <div className="flex items-center justify-between px-6 py-3 border-b bg-black/40 backdrop-blur-md border-white/5 select-none shrink-0">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-black tracking-widest text-[#00FFFF] uppercase font-mono bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20 shadow-[0_0_10px_rgba(0,255,255,0.15)]">
            {asset.label}
          </span>
          <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest">
            {dataSymbol}
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[9px] font-black tracking-widest uppercase text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00FFFF] shadow-[0_0_6px_rgba(0,255,255,0.8)] animate-pulse" />
          <span>{activeTimeframe} STREAM</span>
        </div>
      </div>
      <div className="w-full shrink-0 relative" style={{ height: chartBodyH, minHeight: chartBodyH }}>
        <LightweightCandles
          profileId={profile.id}
          height={chartBodyH}
          fillParent
          timeframe={timeframesMapping[activeTimeframe] || '1h'}
          symbol={dataSymbol}
        />
      </div>
      <div className="brand-mask-forced !bottom-4 !right-6">
        <img src="/logo.png" alt="Clear Path Markets Science" className="h-7 w-auto max-w-[140px] object-contain opacity-90 drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]" />
      </div>
    </div>
  );
};

interface StandardMarketUIProps {
  onBack: () => void;
  profile: ThemeProfile;
}

export const StandardMarketUI: React.FC<StandardMarketUIProps> = ({ onBack, profile }) => {
  const [halted, setHalted] = useState(TradingHaltController.isHalted());
  const [haltReason, setHaltReason] = useState(TradingHaltController.getHaltReason());
  const [chartBodyH, setChartBodyH] = useState(() => desktopStackedMarketChartHeight());

  useEffect(() => {
    return TradingHaltController.subscribe((isHalted, reason) => {
      setHalted(isHalted);
      setHaltReason(reason);
    });
  }, []);

  useEffect(() => {
    const syncHeight = () => setChartBodyH(desktopStackedMarketChartHeight());
    syncHeight();
    window.addEventListener('resize', syncHeight);
    window.visualViewport?.addEventListener('resize', syncHeight);
    return () => {
      window.removeEventListener('resize', syncHeight);
      window.visualViewport?.removeEventListener('resize', syncHeight);
    };
  }, []);

  const [searchSymbol, setSearchSymbol] = useState('');
  const [mainAsset, setMainAsset] = useState({ label: 'EUR/USD', value: 'EURUSD' });
  const [activeTimeframe, setActiveTimeframe] = useState('1H');

  const formatSymbol = (raw: string) => toDataSymbol(raw);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    import('../../lib/trading/clearState').then(({ subscribeToClearState }) => {
      unsubscribe = subscribeToClearState((state) => {
        if (state.selectedAsset && state.selectedAsset.toUpperCase() !== mainAsset.label.toUpperCase()) {
          const raw = state.selectedAsset.toUpperCase();
          const sym = formatSymbol(raw);
          setMainAsset({ label: raw, value: sym });
        }
      });
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [mainAsset.label]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchSymbol.trim()) {
      const raw = searchSymbol.toUpperCase().trim();
      const sym = formatSymbol(raw);
      setMainAsset({ label: raw, value: sym });
      setSearchSymbol('');
      setClearState({ selectedAsset: raw });
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
          <div className="h-6 w-[1px]" style={{ backgroundColor: `${profile.borderB}22` }} />
          <h1 className="text-2xl font-black tracking-tighter uppercase italic" style={{ color: profile.text }}>
            STANDARD <span style={{ color: profile.borderA }}>EXCHANGE</span>
          </h1>
        </div>

        <form onSubmit={handleSearch} className="flex items-center space-x-4">
          <div className="relative">
            <input 
              type="text"
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value)}
              placeholder="SEARCH SYMBOL"
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

      <div className="flex-1 p-3 sm:p-4" style={{ background: '#000000' }}>
        <div className="w-full max-w-none space-y-6">
          <div className="flex items-center justify-between border-b border-indigo-500/20 pb-6">
            <h1 className="text-3xl font-black tracking-tighter uppercase italic" style={{ color: profile.text }}>
              EXCHANGE <span style={{ color: profile.borderA }}>COMMAND CENTER</span>
            </h1>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2 mr-4">
                {ASSETS.slice(0, 4).map(asset => (
                  <button
                    key={asset.value}
                    onClick={() => setMainAsset(asset)}
                    className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest border transition-all ${
                      mainAsset.value === asset.value ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-transparent text-gray-500 border-gray-800 hover:border-gray-600'
                    }`}
                  >
                    {asset.label}
                  </button>
                ))}
              </div>
              <div className="px-4 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                System Active // Zero Grey Area
              </div>
            </div>
          </div>

          <div className="timeframe-bar overflow-x-auto whitespace-nowrap custom-scrollbar">
            {['1m', '2m', '3m', '5m', '10m', '15m', '30m', '1H', '2H', '3H', '4H', '1D', '1W', '1M', '3M', '6M', 'YTD'].map((tf, idx) => (
              <button
                key={`${tf}-${idx}`}
                type="button"
                title={describeTimeframe(timeframesMapping[tf] || tf)}
                onClick={() => setActiveTimeframe(tf)}
                className={`time-unit !py-1 !px-2 text-[10px] md:text-xs outline-none ${tf === activeTimeframe ? 'active' : ''}`}
              >
                {tf}
              </button>
            ))}
          </div>
          
          <div id="master-chart-stack-std" className="multi-chart-container">
            <ChartWidget key={`${mainAsset.value}-${activeTimeframe}`} asset={mainAsset} profile={profile} activeTimeframe={activeTimeframe} chartBodyH={chartBodyH} />
            {ASSETS.filter(a => a.value !== mainAsset.value).map((asset) => (
              <ChartWidget key={`${asset.value}-${activeTimeframe}`} asset={asset} profile={profile} activeTimeframe={activeTimeframe} chartBodyH={chartBodyH} />
            ))}
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
