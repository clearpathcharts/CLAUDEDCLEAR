import React, { useMemo } from 'react';

export type IndicatorVisualType =
  | 'overlay'
  | 'oscillator'
  | 'macd'
  | 'bands'
  | 'volume'
  | 'ichimoku'
  | 'fibonacci'
  | 'pivot'
  | 'sar'
  | 'breadth'
  | 'fundamental'
  | 'options'
  | 'pattern'
  | 'channels'
  | 'cloud_metric';

/** Map indicator name → accurate chart visualization family. */
export function classifyIndicatorVisual(name: string, category: string): IndicatorVisualType {
  const n = name.toLowerCase();

  if (category === 'Fundamental') return 'fundamental';
  if (n.includes('macd')) return 'macd';
  if (n.includes('ichimoku') || n.includes('alligator') || n.includes('lagging span')) return 'ichimoku';
  if (n.includes('fibonacci') || n.includes('gann') || n.includes('wolfe')) return 'fibonacci';
  if (n.includes('pivot') || n.includes('camarilla') || n.includes('quadrant')) return 'pivot';
  if (n.includes('parabolic sar') || n === 'sar') return 'sar';
  if (n.includes('bollinger') || n.includes('keltner') || n.includes('donchian') || n.includes('envelope') || n.includes('turtle channel') || n.includes('acceleration band')) return 'bands';
  if (n.includes('volume') || n.includes('obv') || n.includes('vwap') || n.includes('money flow') || n.includes('chaikin') || n.includes('ease of movement') || n.includes('accumulation') || n.includes('distribution') || n.includes('pvt') || n.includes('price volume')) return 'volume';
  if (n.includes('advance') || n.includes('decline') || n.includes('breadth') || n.includes('mcclellan') || n.includes('trin') || n.includes('new high') || n.includes('tick index') || n.includes('put call')) return 'breadth';
  if (n.includes('option') || n.includes('delta') || n.includes('gamma') || n.includes('theta') || n.includes('vega') || n.includes('implied volatility')) return 'options';
  if (n.includes('harmonic') || n.includes('candlestick pattern') || n.includes('support and resistance') || n.includes('zig zag') || n.includes('triple top') || n.includes('fractal') || n.includes('fair value gap') || n.includes('liquidity void') || n.includes('heikin')) return 'pattern';
  if (n.includes('channel') || n.includes('pitchfork') || n.includes('linear regression') || n.includes('andrews')) return 'channels';
  if (n.includes('vix') || n.includes('volatility') || n.includes('atr') || n.includes('ulcer')) return 'cloud_metric';
  if (
    n.includes('rsi') || n.includes('stochastic') || n.includes('oscillator') || n.includes('cci') ||
    n.includes('momentum') || n.includes('roc') || n.includes('williams') || n.includes('ultimate') ||
    n.includes('demarker') || n.includes('fisher') || n.includes('adx') || n.includes('dmi') ||
    n.includes('aroon') || n.includes('tsi') || n.includes('kst') || n.includes('ppo') ||
    n.includes('detrended') || n.includes('schaff') || n.includes('connors')
  ) return 'oscillator';

  return 'overlay';
}

function hashSeed(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

function candleSeries(seed: number, count: number): { o: number; c: number; h: number; l: number }[] {
  const out: { o: number; c: number; h: number; l: number }[] = [];
  let price = 42 + (seed % 7);
  for (let i = 0; i < count; i++) {
    const drift = Math.sin((i + seed % 5) * 0.55) * 2.2 + ((seed >> (i % 8)) & 1 ? 0.6 : -0.4);
    const o = price;
    const c = price + drift;
    const h = Math.max(o, c) + 1.1 + (i % 3) * 0.2;
    const l = Math.min(o, c) - 1.1 - (i % 2) * 0.15;
    out.push({ o, c, h, l });
    price = c;
  }
  return out;
}

function yMap(v: number, min: number, max: number, top: number, height: number): number {
  return top + height - ((v - min) / (max - min)) * height;
}

function Candles({ seed, x0, w, top, h }: { seed: number; x0: number; w: number; top: number; h: number }) {
  const candles = candleSeries(seed, 14);
  const min = Math.min(...candles.map((c) => c.l)) - 1;
  const max = Math.max(...candles.map((c) => c.h)) + 1;
  const step = w / candles.length;
  return (
    <g>
      {candles.map((c, i) => {
        const cx = x0 + i * step + step * 0.5;
        const bull = c.c >= c.o;
        const color = bull ? '#00E5A0' : '#FF4D6D';
        const bodyTop = yMap(Math.max(c.o, c.c), min, max, top, h);
        const bodyBot = yMap(Math.min(c.o, c.c), min, max, top, h);
        const wickTop = yMap(c.h, min, max, top, h);
        const wickBot = yMap(c.l, min, max, top, h);
        const bodyH = Math.max(2, bodyBot - bodyTop);
        return (
          <g key={i}>
            <line x1={cx} x2={cx} y1={wickTop} y2={wickBot} stroke={color} strokeWidth="1" opacity="0.9" />
            <rect x={cx - step * 0.22} y={bodyTop} width={step * 0.44} height={bodyH} fill={color} rx="0.5" />
          </g>
        );
      })}
    </g>
  );
}

function IndicatorThumbnailSvg({ name, type, className }: { name: string; type: IndicatorVisualType; className?: string }) {
  const seed = useMemo(() => hashSeed(name), [name]);

  return (
    <svg viewBox="0 0 320 180" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`bg-${seed}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#071226" />
          <stop offset="100%" stopColor="#0A1C3A" />
        </linearGradient>
        <linearGradient id={`cloud-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00B6FF" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8A2EFF" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#bg-${seed})`} />
      <rect x="8" y="8" width="304" height="164" rx="8" fill="#030810" stroke="#00B6FF33" strokeWidth="1" />

      {type === 'fundamental' && (
        <g>
          <polyline
            fill="none"
            stroke="#00FFD1"
            strokeWidth="2"
            points="24,130 56,118 88,122 120,95 152,88 184,72 216,78 248,55 280,48 296,42"
          />
          {[24, 56, 88, 120, 152, 184, 216, 248, 280].map((x, i) => (
            <rect key={i} x={x - 8} y={130 - (i % 4) * 8} width="14" height={(i % 4) * 8 + 12} fill="#00B6FF55" rx="2" />
          ))}
          <text x="24" y="28" fill="#00FFD180" fontSize="9" fontFamily="monospace">MACRO SERIES</text>
        </g>
      )}

      {type === 'overlay' && (
        <g>
          <Candles seed={seed} x0={20} w={280} top={24} h={120} />
          <polyline
            fill="none"
            stroke="#FFD700"
            strokeWidth="2"
            points="20,118 45,110 70,108 95,98 120,95 145,88 170,82 195,78 220,72 245,68 270,62 300,58"
          />
        </g>
      )}

      {type === 'bands' && (
        <g>
          <Candles seed={seed} x0={20} w={280} top={30} h={110} />
          <path d="M20,52 Q80,38 160,48 T300,42" fill="none" stroke="#00E5FF" strokeWidth="1.5" opacity="0.8" />
          <path d="M20,118 Q80,128 160,118 T300,124" fill="none" stroke="#00E5FF" strokeWidth="1.5" opacity="0.8" />
          <path d="M20,85 Q80,78 160,82 T300,80" fill="none" stroke="#FFD700" strokeWidth="2" />
        </g>
      )}

      {type === 'volume' && (
        <g>
          <Candles seed={seed} x0={20} w={280} top={20} h={80} />
          {Array.from({ length: 14 }).map((_, i) => {
            const h = 12 + ((seed >> i) % 5) * 8;
            const x = 24 + i * 20;
            const bull = i % 3 !== 0;
            return <rect key={i} x={x} y={148 - h} width="12" height={h} fill={bull ? '#00B6FFAA' : '#FF4D6DAA'} rx="1" />;
          })}
          <polyline fill="none" stroke="#00FFD1" strokeWidth="1.5" points="24,130 64,125 104,118 144,110 184,105 224,98 264,92 296,88" />
        </g>
      )}

      {type === 'oscillator' && (
        <g>
          <Candles seed={seed} x0={20} w={280} top={16} h={70} />
          <rect x="20" y="96" width="280" height="64" fill="#00B6FF08" stroke="#00B6FF33" />
          <line x1="20" y1="128" x2="300" y2="128" stroke="#FFFFFF22" strokeDasharray="4 3" />
          <polyline
            fill="none"
            stroke="#FF1493"
            strokeWidth="2"
            points="20,140 50,125 80,132 110,108 140,115 170,95 200,102 230,88 260,96 290,82 300,78"
          />
          <text x="24" y="108" fill="#FF149366" fontSize="8" fontFamily="monospace">OSC</text>
        </g>
      )}

      {type === 'macd' && (
        <g>
          <Candles seed={seed} x0={20} w={280} top={16} h={60} />
          <rect x="20" y="82" width="280" height="78" fill="#8A2EFF08" stroke="#8A2EFF33" />
          <polyline fill="none" stroke="#00FFD1" strokeWidth="1.5" points="20,118 60,110 100,115 140,100 180,105 220,92 260,98 300,88" />
          <polyline fill="none" stroke="#FFD700" strokeWidth="1.5" points="20,125 60,120 100,122 140,112 180,115 220,108 260,112 300,104" />
          {Array.from({ length: 12 }).map((_, i) => {
            const x = 28 + i * 22;
            const bull = i % 2 === 0;
            const h = 8 + (i % 4) * 4;
            return <rect key={i} x={x} y={bull ? 148 - h : 148} width="10" height={h} fill={bull ? '#00E5A0' : '#FF4D6D'} />;
          })}
        </g>
      )}

      {type === 'ichimoku' && (
        <g>
          <Candles seed={seed} x0={20} w={280} top={24} h={100} />
          <path d="M20,95 Q90,70 160,78 T300,62" fill={`url(#cloud-${seed})`} stroke="none" />
          <polyline fill="none" stroke="#00E5FF" strokeWidth="1.5" points="20,88 80,75 140,80 200,68 260,72 300,65" />
          <polyline fill="none" stroke="#FF4D6D" strokeWidth="1.5" points="20,102 80,95 140,98 200,90 260,92 300,86" />
          <polyline fill="none" stroke="#FFD700" strokeWidth="1" strokeDasharray="3 3" points="20,72 300,58" />
        </g>
      )}

      {type === 'fibonacci' && (
        <g>
          <Candles seed={seed} x0={20} w={280} top={24} h={110} />
          {[38, 58, 78, 98, 118].map((y, i) => (
            <g key={i}>
              <line x1="20" y1={y} x2="300" y2={y} stroke={['#00FFD1', '#00B6FF', '#FFD700', '#FF1493', '#8A2EFF'][i]} strokeWidth="1" strokeDasharray="5 4" opacity="0.85" />
              <text x="286" y={y - 2} fill="#FFFFFF55" fontSize="7" fontFamily="monospace">{['61.8%', '50%', '38.2%', '23.6%', '0%'][i]}</text>
            </g>
          ))}
        </g>
      )}

      {type === 'pivot' && (
        <g>
          <Candles seed={seed} x0={20} w={280} top={24} h={110} />
          {[
            { y: 42, label: 'R2', color: '#FF4D6D' },
            { y: 62, label: 'R1', color: '#FF1493' },
            { y: 88, label: 'PP', color: '#FFD700' },
            { y: 108, label: 'S1', color: '#00B6FF' },
            { y: 128, label: 'S2', color: '#00FFD1' },
          ].map((lvl) => (
            <g key={lvl.label}>
              <line x1="20" y1={lvl.y} x2="300" y2={lvl.y} stroke={lvl.color} strokeWidth="1.2" opacity="0.9" />
              <text x="24" y={lvl.y - 3} fill={lvl.color} fontSize="8" fontFamily="monospace">{lvl.label}</text>
            </g>
          ))}
        </g>
      )}

      {type === 'sar' && (
        <g>
          <Candles seed={seed} x0={20} w={280} top={24} h={110} />
          {Array.from({ length: 14 }).map((_, i) => {
            const x = 28 + i * 20;
            const below = i < 7;
            return <circle key={i} cx={x} cy={below ? 138 : 38} r="3" fill={below ? '#00E5A0' : '#FF4D6D'} />;
          })}
        </g>
      )}

      {type === 'breadth' && (
        <g>
          <polyline fill="none" stroke="#00FFD1" strokeWidth="2" points="24,130 56,120 88,115 120,100 152,105 184,88 216,92 248,70 280,75 296,65" />
          <polyline fill="none" stroke="#FF1493" strokeWidth="1.5" strokeDasharray="4 3" points="24,110 88,108 152,95 216,88 280,80" />
          <text x="24" y="28" fill="#00B6FF88" fontSize="9" fontFamily="monospace">BREADTH</text>
        </g>
      )}

      {type === 'options' && (
        <g>
          <path d="M24,130 Q120,40 200,70 T296,55" fill="none" stroke="#00FFD1" strokeWidth="2" />
          <path d="M24,120 Q140,90 220,95 T296,100" fill="none" stroke="#FFD700" strokeWidth="1.5" strokeDasharray="4 3" />
          <text x="24" y="28" fill="#8A2EFF99" fontSize="9" fontFamily="monospace">GREEKS / IV</text>
        </g>
      )}

      {type === 'pattern' && (
        <g>
          <Candles seed={seed} x0={20} w={280} top={40} h={90} />
          <polyline fill="none" stroke="#FF1493" strokeWidth="2" points="24,120 80,70 136,110 192,60 248,100 296,55" />
          <line x1="24" y1="130" x2="296" y2="130" stroke="#00B6FF88" strokeWidth="1" />
          <line x1="24" y1="55" x2="296" y2="55" stroke="#00B6FF88" strokeWidth="1" />
        </g>
      )}

      {type === 'channels' && (
        <g>
          <Candles seed={seed} x0={20} w={280} top={30} h={110} />
          <line x1="20" y1="120" x2="300" y2="50" stroke="#00E5FF" strokeWidth="1.5" />
          <line x1="20" y1="140" x2="300" y2="70" stroke="#00E5FF" strokeWidth="1.5" />
          <line x1="160" y1="30" x2="160" y2="150" stroke="#FFD70055" strokeDasharray="4 3" />
        </g>
      )}

      {type === 'cloud_metric' && (
        <g>
          <path d="M24,120 Q80,60 140,80 T260,50 T296,70" fill="none" stroke="#FF4D6D" strokeWidth="2" />
          <path d="M24,120 Q80,90 140,100 T260,85" fill="#FF4D6D22" stroke="none" />
          <text x="24" y="28" fill="#FF4D6D99" fontSize="9" fontFamily="monospace">VOLATILITY</text>
        </g>
      )}
    </svg>
  );
}

export function IndicatorThumbnail({
  name,
  visualType,
  className = 'w-full h-full',
}: {
  name: string;
  visualType: IndicatorVisualType;
  className?: string;
}) {
  return <IndicatorThumbnailSvg name={name} type={visualType} className={className} />;
}
