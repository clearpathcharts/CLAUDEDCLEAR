import React, { useState } from 'react';
import { Eye, ShieldAlert, Sparkles, AlertTriangle, BookOpen } from 'lucide-react';

interface Pattern {
  id: string;
  name: string;
  category: 'Reversal' | 'Continuation' | 'Institutional Wave';
  description: string;
  anatomy: string;
  liquidityZone: string;
}

const patterns: Pattern[] = [
  {
    id: 'fvg',
    name: 'Fair Value Gap (FVG / Imbalance)',
    category: 'Institutional Wave',
    description: 'A three-candle structural block displaying severe buying or selling velocity, leaving behind price levels that are unfilled/unhedged. Institutional algos often gravitate back to re-balance these deficits.',
    anatomy: 'Candle 1 is a regular sizing candle. Candle 2 expands with high-volume velocity. Candle 3 is a regular sizing candle. The gap exists between the Low of Candle 1 and the High of Candle 3.',
    liquidityZone: 'The FVG Midpoint (Consequent Encroachment) serves as the primary technical magnetism. Risk orders nest right beyond the extremes of Candle 1.'
  },
  {
    id: 'pinbar',
    name: 'Hammer / Bullish Pin Bar',
    category: 'Reversal',
    description: 'A single candle with a tiny upper body and a giant lower wick, signifying that sell attempts ran head-first into massive resting limit buy orders (absorption of Sell-Side Liquidity).',
    anatomy: 'The lower tail must be at least 2/3 of the total candle length. Represents a failed intraday breakout below support zones where stop-losses were harvested.',
    liquidityZone: 'Resting buy liquidity enters immediately on wick retracement. Stop-losses of new buyers are placed tightly below the absolute lowest point of the pin wick.'
  },
  {
    id: 'engulfing',
    name: 'Bullish Engulfing Block',
    category: 'Reversal',
    description: 'A small bearish candle is immediately engulfed by a much larger bullish candle. This demonstrates a sudden, complete turnover of control from retail momentum speculators into major banks.',
    anatomy: 'The body of Candle 2 completely overlays the vertical span of Candle 1 weighter limits. Usually marks high-volume order initiation.',
    liquidityZone: 'Stop-losses clump immediately below the low of the second (engulfing) candle. This high-volume low is heavily defended if price returns there.'
  },
  {
    id: 'london-sweep',
    name: 'Asian Range Liquidity Sweep',
    category: 'Institutional Wave',
    description: 'A false breakout preceding a massive trend reversal. In the London Session, price sweeps high range limits of Asian consolidation to grab resting short stops before crashing the asset back down.',
    anatomy: 'Asian Session stays in a 40-pip horizontal box. Early London candle spikes up 20 pips past the Asian ceiling, then closes inside the box as a bearish pin or engulfing.',
    liquidityZone: 'Short stops above Asian High are triggered, matching large institutional sell order blocks. Stop-loss protection sits above the new London high wick.'
  }
];

export default function PatternVisualizer() {
  const [selectedId, setSelectedId] = useState<string>('fvg');
  const activePattern = patterns.find(p => p.id === selectedId) || patterns[0];

  return (
    <div id="candle-pattern-visualizer" className="p-6 bg-zinc-950 border border-white/5 rounded-2xl flex flex-col gap-6 shadow-[0_4px_30px_rgba(0,0,0,0.8)] font-sans">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <h4 className="text-sm font-semibold tracking-wide text-white uppercase font-sans">Candlestick Anatomy & Liquidity Blueprint</h4>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* PATTERN SELECTOR */}
        <div className="lg:col-span-4 flex flex-col gap-2">
          <span className="text-[10px] uppercase font-black text-zinc-500 tracking-wider">SELECT STRUCTURAL TEMPLATE:</span>
          <div className="flex flex-col gap-2">
            {patterns.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex flex-col gap-1 cursor-pointer
                  ${p.id === selectedId
                    ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-[0_0_15px_rgba(99,102,241,0.25)]'
                    : 'border-white/5 bg-zinc-900/30 text-zinc-400 hover:border-white/15 hover:text-white hover:bg-zinc-900/50'}`}
              >
                <div className="flex items-center justify-between font-bold uppercase tracking-wide">
                  <span>{p.name}</span>
                </div>
                <span className="text-[10px] font-sans text-zinc-500 italic lowercase">{p.category} block</span>
              </button>
            ))}
          </div>
        </div>

        {/* SVG DRAW AND BLUEPRINT ANALYSIS */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-900/30 p-5 rounded-2xl border border-white/5">
          {/* DIAGRAM RENDER */}
          <div className="flex flex-col items-center justify-center bg-black/40 border border-white/5 rounded-xl p-4 min-h-[250px] relative overflow-hidden">
            <span className="absolute left-3 top-3 text-[9px] font-mono tracking-widest text-zinc-500 uppercase">Interactive SVG Schematic</span>
            
            {/* Draw schematic */}
            {selectedId === 'fvg' && (
              <svg width="180" height="200" viewBox="0 0 180 200" className="drop-shadow-[0_0_10px_rgba(255,255,255,0.05)]">
                {/* Candle 1 (Bearish red or Neutral grey) */}
                <line x1="40" y1="20" x2="40" y2="100" stroke="#71717a" strokeWidth="2" />
                <rect x="30" y="40" width="20" height="40" fill="#27272a" stroke="#71717a" strokeWidth="1.5" />
                {/* Note line for candle 1 low */}
                <line x1="40" y1="80" x2="160" y2="80" stroke="#6366f1" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                
                {/* Candle 2 (Giant expansion green) */}
                <line x1="90" y1="50" x2="90" y2="160" stroke="#10b981" strokeWidth="2" />
                <rect x="80" y="60" width="20" height="85" fill="#047857" stroke="#10b981" strokeWidth="1.5" />

                {/* Candle 3 (Normal green) */}
                <line x1="140" y1="120" x2="140" y2="180" stroke="#71717a" strokeWidth="2" />
                <rect x="130" y="130" width="20" height="30" fill="#27272a" stroke="#71717a" strokeWidth="1.5" />
                {/* Note line for candle 3 high */}
                <line x1="140" y1="130" x2="20" y2="130" stroke="#6366f1" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

                {/* Draw shaded gap */}
                <rect x="25" y="80" width="130" height="50" fill="rgba(99,102,241,0.12)" stroke="rgba(99,102,241,0.4)" strokeWidth="1" />
                <text x="90" y="108" fill="#a5b4fc" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle" letterSpacing="1">FAIR VALUE GAP</text>
                <text x="90" y="120" fill="#a5b4fc" fontSize="7" fontWeight="bold" fontFamily="monospace" textAnchor="middle" opacity="0.6">IMBALANCE REGION</text>
              </svg>
            )}

            {selectedId === 'pinbar' && (
              <svg width="180" height="200" viewBox="0 0 180 200">
                {/* Support baseline */}
                <line x1="10" y1="150" x2="170" y2="150" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 2" />
                <text x="90" y="165" fill="#ef4444" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">RETAIL SUPPORT (STOP LEVEL)</text>

                {/* Prior consolidation candles */}
                <rect x="40" y="90" width="12" height="40" fill="#ef4444" opacity="0.4" />
                
                {/* Pinbar candle */}
                {/* Long wick that spikes through support */}
                <line x1="90" y1="70" x2="90" y2="185" stroke="#10b981" strokeWidth="3" />
                {/* Small bullish body at top */}
                <rect x="78" y="80" width="24" height="20" fill="#10b981" stroke="#34d399" strokeWidth="1.5" />

                {/* Sweep Arrow */}
                <path d="M 90 185 L 120 185 M 120 185 L 115 180 M 120 185 L 115 190" stroke="#f59e0b" strokeWidth="1.2" />
                <text x="123" y="188" fill="#f59e0b" fontSize="8" fontWeight="bold" fontFamily="monospace">STOPS SWEPT</text>
              </svg>
            )}

            {selectedId === 'engulfing' && (
              <svg width="180" height="200" viewBox="0 0 180 200">
                {/* Candle 1: Tiny red */}
                <line x1="60" y1="100" x2="60" y2="155" stroke="#ef4444" strokeWidth="2" />
                <rect x="50" y="110" width="20" height="30" fill="#991b1b" stroke="#f87171" strokeWidth="1.5" />

                {/* Candle 2: Big green completely engulfing */}
                <line x1="120" y1="65" x2="120" y2="170" stroke="#10b981" strokeWidth="2" />
                <rect x="110" y="85" width="20" height="70" fill="#065f46" stroke="#34d399" strokeWidth="1.5" />

                {/* Highlights bounding box */}
                <rect x="45" y="80" width="90" height="85" fill="none" stroke="#6366f1" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
                <text x="90" y="55" fill="#818cf8" fontSize="8" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">ENGULFING WRAPPER</text>
              </svg>
            )}

            {selectedId === 'london-sweep' && (
              <svg width="180" height="200" viewBox="0 0 180 200">
                {/* Asian box */}
                <rect x="15" y="90" width="80" height="40" fill="rgba(0, 255, 255, 0.04)" stroke="#06b6d4" strokeWidth="1" strokeDasharray="3 3" />
                <text x="55" y="112" fill="#06b6d4" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">ASIAN RANGE</text>

                {/* High sweep candle in London */}
                <line x1="115" y1="50" x2="115" y2="150" stroke="#e11d48" strokeWidth="2.5" />
                <rect x="105" y="70" width="20" height="60" fill="rgba(225, 29, 72, 0.2)" stroke="#e11d48" strokeWidth="1.5" />

                {/* Sweep Indicator line */}
                <line x1="15" y1="90" x2="140" y2="90" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="4 2" />
                <path d="M 115 50 L 150 50 M 150 50 L 145 46 M 150 50 L 145 54" stroke="#f59e0b" strokeWidth="1" />
                <text x="130" y="80" fill="#f59e0b" fontSize="7" fontWeight="bold" fontFamily="monospace" textAnchor="middle">SWEEP LEVEL</text>
                <text x="145" y="42" fill="#f59e0b" fontSize="7" fontWeight="bold" fontFamily="sans-serif" textAnchor="start">Fake Buy Breakout</text>
              </svg>
            )}
          </div>

          {/* BLUEPRINT DESCRIPTION */}
          <div className="flex flex-col gap-4 font-sans text-xs">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Concept Brief</span>
              <p className="text-zinc-300 leading-relaxed">{activePattern.description}</p>
            </div>

            <div className="flex flex-col gap-1 border-t border-white/5 pt-3">
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> Candle Anatomy Breakdown
              </span>
              <p className="text-zinc-400 leading-relaxed">{activePattern.anatomy}</p>
            </div>

            <div className="flex flex-col gap-1 border-t border-white/5 pt-3">
              <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${selectedId === 'london-sweep' || selectedId === 'pinbar' ? 'text-amber-400' : 'text-rose-400'}`}>
                <ShieldAlert className="w-3.5 h-3.5 animate-pulse" /> Algorithmic Stop Harvesting
              </span>
              <p className="text-zinc-400 leading-relaxed font-sans">{activePattern.liquidityZone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
