#!/usr/bin/env node
/**
 * Generates accurate characteristic chart SVGs for Encyclopedia of Indicators.
 * Each image depicts the indicator's typical visual signature on a dark terminal chart.
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../public/encyclopedia-indicators');
mkdirSync(OUT, { recursive: true });

const W = 800;
const H = 600;
const PAD = { l: 48, r: 28, t: 56, b: 40 };

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[()%/]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function seedFrom(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function series(n, rng, opts = {}) {
  const {
    start = 50,
    drift = 0.05,
    vol = 1.8,
    meanReversion = 0.02,
    mean = 50,
    floor = 5,
    ceil = 95,
  } = opts;
  const out = [start];
  for (let i = 1; i < n; i++) {
    const prev = out[i - 1];
    const shock = (rng() - 0.5) * 2 * vol;
    const next = prev + drift + shock + meanReversion * (mean - prev);
    out.push(clamp(next, floor, ceil));
  }
  return out;
}

function ema(arr, period) {
  const k = 2 / (period + 1);
  const out = [arr[0]];
  for (let i = 1; i < arr.length; i++) out.push(arr[i] * k + out[i - 1] * (1 - k));
  return out;
}

function sma(arr, period) {
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    if (i < period - 1) {
      out.push(arr[i]);
      continue;
    }
    let s = 0;
    for (let j = i - period + 1; j <= i; j++) s += arr[j];
    out.push(s / period);
  }
  return out;
}

function rollingStd(arr, period) {
  const m = sma(arr, period);
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    if (i < period - 1) {
      out.push(2);
      continue;
    }
    let s = 0;
    for (let j = i - period + 1; j <= i; j++) s += (arr[j] - m[i]) ** 2;
    out.push(Math.sqrt(s / period) || 1);
  }
  return out;
}

function xAt(i, n) {
  return PAD.l + (i / (n - 1)) * (W - PAD.l - PAD.r);
}

function yAt(v, min, max, top = PAD.t, bottom = H - PAD.b) {
  const t = (v - min) / (max - min || 1);
  return bottom - t * (bottom - top);
}

function pathFrom(values, min, max, top, bottom) {
  return values
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${xAt(i, values.length).toFixed(1)},${yAt(v, min, max, top, bottom).toFixed(1)}`)
    .join(' ');
}

function areaPath(upper, lower, min, max, top, bottom) {
  const n = upper.length;
  let d = upper
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${xAt(i, n).toFixed(1)},${yAt(v, min, max, top, bottom).toFixed(1)}`)
    .join(' ');
  for (let i = n - 1; i >= 0; i--) {
    d += ` L${xAt(i, n).toFixed(1)},${yAt(lower[i], min, max, top, bottom).toFixed(1)}`;
  }
  return d + ' Z';
}

function candles(n, rng) {
  const closes = series(n, rng, { start: 48, drift: 0.08, vol: 2.2, meanReversion: 0.04 });
  const bars = [];
  for (let i = 0; i < n; i++) {
    const c = closes[i];
    const o = i === 0 ? c : closes[i - 1] + (rng() - 0.5) * 1.2;
    const hi = Math.max(o, c) + rng() * 1.5;
    const lo = Math.min(o, c) - rng() * 1.5;
    bars.push({ o, h: hi, l: lo, c });
  }
  return bars;
}

function frame(title, subtitle = 'TECHNICAL ANALYSIS') {
  return `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#071226"/>
      <stop offset="55%" stop-color="#0A1C3A"/>
      <stop offset="100%" stop-color="#06101f"/>
    </linearGradient>
    <linearGradient id="cyanFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#00B6FF" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#00B6FF" stop-opacity="0.02"/>
    </linearGradient>
    <linearGradient id="tealFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#00FFD1" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#00FFD1" stop-opacity="0.02"/>
    </linearGradient>
    <linearGradient id="magentaFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#D946EF" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#D946EF" stop-opacity="0.02"/>
    </linearGradient>
    <linearGradient id="cloudUp" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#00FFD1" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#00FFD1" stop-opacity="0.08"/>
    </linearGradient>
    <linearGradient id="cloudDn" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FF2D95" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#FF2D95" stop-opacity="0.06"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0H0V40" fill="none" stroke="#00B6FF" stroke-opacity="0.07" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="${PAD.l}" y="${PAD.t}" width="${W - PAD.l - PAD.r}" height="${H - PAD.t - PAD.b}" fill="url(#grid)" rx="8"/>
  <rect x="${PAD.l}" y="${PAD.t}" width="${W - PAD.l - PAD.r}" height="${H - PAD.t - PAD.b}" fill="none" stroke="#00B6FF" stroke-opacity="0.25" rx="8"/>
  <text x="${PAD.l}" y="28" fill="#00FFD1" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="13" font-weight="700" letter-spacing="2">${escapeXml(title.toUpperCase())}</text>
  <text x="${PAD.l}" y="46" fill="#00B6FF" fill-opacity="0.7" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10" letter-spacing="1.5">${escapeXml(subtitle)}</text>
  <circle cx="${W - 36}" cy="28" r="5" fill="#00FFD1"/>
  <text x="${W - 48}" y="32" text-anchor="end" fill="#00FFD1" fill-opacity="0.8" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="9" letter-spacing="1">LIVE</text>`;
}

function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function drawCandles(bars, min, max, top, bottom) {
  const n = bars.length;
  const bw = Math.max(2, ((W - PAD.l - PAD.r) / n) * 0.55);
  return bars
    .map((b, i) => {
      const x = xAt(i, n);
      const yO = yAt(b.o, min, max, top, bottom);
      const yC = yAt(b.c, min, max, top, bottom);
      const yH = yAt(b.h, min, max, top, bottom);
      const yL = yAt(b.l, min, max, top, bottom);
      const up = b.c >= b.o;
      const color = up ? '#00FFD1' : '#FF2D95';
      const bodyTop = Math.min(yO, yC);
      const bodyH = Math.max(1.5, Math.abs(yC - yO));
      return `<line x1="${x}" y1="${yH}" x2="${x}" y2="${yL}" stroke="${color}" stroke-width="1" opacity="0.85"/>
        <rect x="${x - bw / 2}" y="${bodyTop}" width="${bw}" height="${bodyH}" fill="${color}" opacity="0.9"/>`;
    })
    .join('\n');
}

function hLine(y, color, dash = false, label = '') {
  const d = dash ? 'stroke-dasharray="4 4"' : '';
  const lab = label
    ? `<text x="${PAD.l + 6}" y="${y - 4}" fill="${color}" fill-opacity="0.85" font-family="ui-monospace, Menlo, monospace" font-size="9">${escapeXml(label)}</text>`
    : '';
  return `<line x1="${PAD.l}" y1="${y}" x2="${W - PAD.r}" y2="${y}" stroke="${color}" stroke-opacity="0.55" stroke-width="1" ${d}/>${lab}`;
}

function classify(name) {
  const n = name.toLowerCase();
  if (/(bollinger|keltner|donchian|envelope|acceleration bands|turtle|price action channel|linear regression channel|bull market support)/.test(n)) return 'bands';
  if (/(ichimoku|lagging span)/.test(n)) return 'ichimoku';
  if (/(macd|ppo|percent price|price oscillator|oscillator of moving|know sure thing|kst|schaff|coppock|true strength|tsi|chaikin oscillator|elder force|force index|elliott wave)/.test(n)) return 'macd';
  if (/(rsi|stochastic|stoch|williams %r|cci|aroon|demarker|connors|fisher|momentum|roc|rate of change|chande|ulcer|ultimate oscillator|vortex|mass index|mfi|money flow|relative vigor|qstick|balance of power|bull bear|dpo|detrended|center of gravity|gravity center|kairi|swing index|vhf|vertical horizontal)/.test(n)) return 'oscillator';
  if (/(volume profile|market profile|value area)/.test(n)) return 'volumeProfile';
  if (/(obv|volume|vwap|chaikin money|accumulation\/distribution|williams accumulation|negative volume|positive volume|price volume|cumulative delta|volume delta|ease of movement|market facilitation|time segmented|average volume)/.test(n)) return 'volume';
  if (/(fibonacci)/.test(n)) return 'fibonacci';
  if (/(gann)/.test(n)) return 'gann';
  if (/(parabolic|sar)/.test(n)) return 'sar';
  if (/(supertrend|alligator|adx|directional movement|dmi|xtl)/.test(n)) return 'trend';
  if (/(pivot|camarilla|support and resistance|quadrant)/.test(n)) return 'pivots';
  if (/(andrews|pitchfork)/.test(n)) return 'pitchfork';
  if (/(harmonic|wolfe|zig zag|elliott|fair value gap|liquidity void|triple top|fractal|renko|heikin)/.test(n)) return 'pattern';
  if (/(sma|ema|tema|t3|hull|jurik|zlema|zero lag|moving average|wma|weighted|smoothed|variable|median price|average price|golden cross)/.test(n)) return 'ma';
  if (/(atr|volatility|vix|standard deviation|standard error|bollinger band width|percent b|historical|implied|local|rolling|downside|bid-ask)/.test(n)) return 'volatility';
  if (/(gdp|unemployment|nfp|inflation|interest|yield|alpha|beta|sharpe|sortino|cot|commitment)/.test(n)) return 'fundamental';
  if (/(option|delta|gamma|theta|vega|put call|open interest)/.test(n)) return 'options';
  if (/(advance|decline|breadth|mcclellan|trin|tick index|new high|nasdaq)/.test(n)) return 'breadth';
  if (/(z-score|zero line|log return|net change|correlation|risk reward|spread indicator|seasonal)/.test(n)) return 'stats';
  return 'generic';
}

function renderBands(name, rng) {
  const n = 48;
  const price = series(n, rng, { start: 45, drift: 0.12, vol: 2.4 });
  const mid = sma(price, 14);
  const sd = rollingStd(price, 14);
  const mult = /donchian|turtle/i.test(name) ? 0 : /keltner/i.test(name) ? 1.6 : 2;
  let upper, lower;
  if (/donchian|turtle/i.test(name)) {
    upper = price.map((_, i) => Math.max(...price.slice(Math.max(0, i - 13), i + 1)));
    lower = price.map((_, i) => Math.min(...price.slice(Math.max(0, i - 13), i + 1)));
  } else {
    upper = mid.map((m, i) => m + sd[i] * (mult || 2));
    lower = mid.map((m, i) => m - sd[i] * (mult || 2));
  }
  const all = [...price, ...upper, ...lower];
  const min = Math.min(...all) - 2;
  const max = Math.max(...all) + 2;
  const top = PAD.t + 10;
  const bottom = H - PAD.b - 10;
  return `
    ${frame(name, 'BAND / CHANNEL OVERLAY')}
    <path d="${areaPath(upper, lower, min, max, top, bottom)}" fill="url(#cyanFill)"/>
    <path d="${pathFrom(upper, min, max, top, bottom)}" fill="none" stroke="#00B6FF" stroke-width="2"/>
    <path d="${pathFrom(lower, min, max, top, bottom)}" fill="none" stroke="#00B6FF" stroke-width="2"/>
    <path d="${pathFrom(mid, min, max, top, bottom)}" fill="none" stroke="#D946EF" stroke-width="1.5" stroke-dasharray="5 4"/>
    <path d="${pathFrom(price, min, max, top, bottom)}" fill="none" stroke="#00FFD1" stroke-width="2.5"/>
  `;
}

function renderMA(name, rng) {
  const n = 52;
  const price = series(n, rng, { start: 42, drift: 0.15, vol: 2.1 });
  const ma1 = ema(price, /sma|simple/i.test(name) ? 20 : 12);
  const ma2 = ema(price, 26);
  const all = [...price, ...ma1, ...ma2];
  const min = Math.min(...all) - 2;
  const max = Math.max(...all) + 2;
  const top = PAD.t + 8;
  const bottom = H - PAD.b - 8;
  const cross = /golden/i.test(name);
  return `
    ${frame(name, 'MOVING AVERAGE OVERLAY')}
    <path d="${pathFrom(price, min, max, top, bottom)}" fill="none" stroke="#94a3b8" stroke-width="1.5" opacity="0.7"/>
    <path d="${pathFrom(ma1, min, max, top, bottom)}" fill="none" stroke="#00FFD1" stroke-width="2.5"/>
    ${cross || /moving average(?! envelope)/i.test(name) ? `<path d="${pathFrom(ma2, min, max, top, bottom)}" fill="none" stroke="#FF2D95" stroke-width="2"/>` : ''}
    ${cross ? `<circle cx="${xAt(36, n)}" cy="${yAt(ma1[36], min, max, top, bottom)}" r="7" fill="none" stroke="#FFF000" stroke-width="2"/><text x="${xAt(36, n) + 12}" y="${yAt(ma1[36], min, max, top, bottom) - 8}" fill="#FFF000" font-family="ui-monospace, Menlo, monospace" font-size="11">CROSS</text>` : ''}
  `;
}

function renderOscillator(name, rng) {
  const n = 60;
  const isWilliams = /williams %r/i.test(name);
  const isStoch = /stoch/i.test(name);
  const osc = series(n, rng, {
    start: isWilliams ? -50 : 50,
    drift: 0,
    vol: isWilliams ? 12 : 10,
    meanReversion: 0.12,
    mean: isWilliams ? -50 : 50,
    floor: isWilliams ? -100 : 0,
    ceil: isWilliams ? 0 : 100,
  });
  const signal = ema(osc, 5);
  const top = PAD.t + 20;
  const bottom = H - PAD.b - 20;
  const min = isWilliams ? -100 : 0;
  const max = isWilliams ? 0 : 100;
  const hi = isWilliams ? -20 : 70;
  const lo = isWilliams ? -80 : 30;
  const mid = isWilliams ? -50 : 50;
  return `
    ${frame(name, 'OSCILLATOR PANEL')}
    ${hLine(yAt(hi, min, max, top, bottom), '#FF2D95', true, String(hi))}
    ${hLine(yAt(lo, min, max, top, bottom), '#00FFD1', true, String(lo))}
    ${hLine(yAt(mid, min, max, top, bottom), '#00B6FF', true, String(mid))}
    <path d="${areaPath(osc, osc.map(() => mid), min, max, top, bottom)}" fill="url(#magentaFill)" opacity="0.5"/>
    <path d="${pathFrom(osc, min, max, top, bottom)}" fill="none" stroke="#D946EF" stroke-width="2.5"/>
    ${isStoch || /rsi|connors/i.test(name) ? `<path d="${pathFrom(signal, min, max, top, bottom)}" fill="none" stroke="#00FFD1" stroke-width="1.8"/>` : ''}
  `;
}

function renderMACD(name, rng) {
  const n = 56;
  const price = series(n, rng, { start: 50, drift: 0.1, vol: 2.5 });
  const macd = ema(price, 12).map((v, i) => v - ema(price, 26)[i]);
  const signal = ema(macd, 9);
  const hist = macd.map((v, i) => v - signal[i]);
  const top = PAD.t + 16;
  const midY = (top + H - PAD.b) / 2;
  const bottom = H - PAD.b - 12;
  const scale = 18;
  const bars = hist
    .map((h, i) => {
      const x = xAt(i, n);
      const bh = Math.abs(h) * scale;
      const y = h >= 0 ? midY - bh : midY;
      const color = h >= 0 ? '#00FFD1' : '#FF2D95';
      const bw = Math.max(2, ((W - PAD.l - PAD.r) / n) * 0.6);
      return `<rect x="${x - bw / 2}" y="${y}" width="${bw}" height="${Math.max(1, bh)}" fill="${color}" opacity="0.85"/>`;
    })
    .join('\n');
  const linePts = (arr) =>
    arr
      .map((v, i) => `${i === 0 ? 'M' : 'L'}${xAt(i, n).toFixed(1)},${(midY - v * scale).toFixed(1)}`)
      .join(' ');
  return `
    ${frame(name, 'MACD / HISTOGRAM')}
    <line x1="${PAD.l}" y1="${midY}" x2="${W - PAD.r}" y2="${midY}" stroke="#00B6FF" stroke-opacity="0.4" stroke-dasharray="4 4"/>
    ${bars}
    <path d="${linePts(macd)}" fill="none" stroke="#00B6FF" stroke-width="2.5"/>
    <path d="${linePts(signal)}" fill="none" stroke="#FFF000" stroke-width="2"/>
  `;
}

function renderIchimoku(name, rng) {
  const n = 55;
  const price = series(n, rng, { start: 48, drift: 0.1, vol: 2 });
  const tenkan = sma(price, 9);
  const kijun = sma(price, 26);
  const spanA = tenkan.map((t, i) => (t + kijun[i]) / 2);
  const spanB = sma(price, 52);
  const all = [...price, ...tenkan, ...kijun, ...spanA, ...spanB];
  const min = Math.min(...all) - 2;
  const max = Math.max(...all) + 2;
  const top = PAD.t + 10;
  const bottom = H - PAD.b - 10;
  // split cloud by which span is higher
  let cloud = '';
  for (let i = 0; i < n - 1; i++) {
    const a1 = spanA[i], b1 = spanB[i], a2 = spanA[i + 1], b2 = spanB[i + 1];
    const up = (a1 + a2) / 2 >= (b1 + b2) / 2;
    const fill = up ? 'url(#cloudUp)' : 'url(#cloudDn)';
    cloud += `<path d="M${xAt(i, n)},${yAt(a1, min, max, top, bottom)} L${xAt(i + 1, n)},${yAt(a2, min, max, top, bottom)} L${xAt(i + 1, n)},${yAt(b2, min, max, top, bottom)} L${xAt(i, n)},${yAt(b1, min, max, top, bottom)} Z" fill="${fill}"/>`;
  }
  return `
    ${frame(name, 'ICHIMOKU CLOUD')}
    ${cloud}
    <path d="${pathFrom(tenkan, min, max, top, bottom)}" fill="none" stroke="#00B6FF" stroke-width="2"/>
    <path d="${pathFrom(kijun, min, max, top, bottom)}" fill="none" stroke="#FF2D95" stroke-width="2"/>
    <path d="${pathFrom(price, min, max, top, bottom)}" fill="none" stroke="#ffffff" stroke-width="2"/>
  `;
}

function renderVolume(name, rng) {
  const n = 40;
  const price = series(n, rng, { start: 50, drift: 0.08, vol: 2 });
  const vol = Array.from({ length: n }, () => 20 + rng() * 60);
  const priceTop = PAD.t + 8;
  const priceBottom = H * 0.58;
  const volTop = priceBottom + 16;
  const volBottom = H - PAD.b;
  const pMin = Math.min(...price) - 2;
  const pMax = Math.max(...price) + 2;
  const vMax = Math.max(...vol);
  const bw = Math.max(3, ((W - PAD.l - PAD.r) / n) * 0.65);
  const bars = vol
    .map((v, i) => {
      const x = xAt(i, n);
      const h = ((v / vMax) * (volBottom - volTop)) | 0;
      const up = i === 0 || price[i] >= price[i - 1];
      return `<rect x="${x - bw / 2}" y="${volBottom - h}" width="${bw}" height="${h}" fill="${up ? '#00B6FF' : '#D946EF'}" opacity="0.75"/>`;
    })
    .join('\n');
  const isVWAP = /vwap/i.test(name);
  const vwap = ema(price, 8);
  return `
    ${frame(name, 'VOLUME / FLOW')}
    <path d="${pathFrom(price, pMin, pMax, priceTop, priceBottom)}" fill="none" stroke="#00FFD1" stroke-width="2.2"/>
    ${isVWAP ? `<path d="${pathFrom(vwap, pMin, pMax, priceTop, priceBottom)}" fill="none" stroke="#FFF000" stroke-width="2" stroke-dasharray="6 3"/>` : ''}
    <line x1="${PAD.l}" y1="${priceBottom + 8}" x2="${W - PAD.r}" y2="${priceBottom + 8}" stroke="#00B6FF" stroke-opacity="0.25"/>
    ${bars}
  `;
}

function renderVolumeProfile(name, rng) {
  const n = 36;
  const bars = candles(n, rng);
  const prices = bars.flatMap((b) => [b.o, b.h, b.l, b.c]);
  const min = Math.min(...prices) - 1;
  const max = Math.max(...prices) + 1;
  const top = PAD.t + 10;
  const bottom = H - PAD.b - 10;
  const levels = 18;
  const hist = Array(levels).fill(0);
  for (const b of bars) {
    const mid = (b.h + b.l) / 2;
    const idx = clamp(Math.floor(((mid - min) / (max - min)) * (levels - 1)), 0, levels - 1);
    hist[idx] += 10 + rng() * 40;
  }
  const hMax = Math.max(...hist);
  const profileW = 180;
  const profile = hist
    .map((v, i) => {
      const y0 = yAt(min + ((i + 1) / levels) * (max - min), min, max, top, bottom);
      const y1 = yAt(min + (i / levels) * (max - min), min, max, top, bottom);
      const w = (v / hMax) * profileW;
      const isVA = i >= 6 && i <= 12;
      return `<rect x="${PAD.l}" y="${y0}" width="${w}" height="${Math.max(2, y1 - y0 - 1)}" fill="${isVA ? '#00FFD1' : '#00B6FF'}" opacity="${isVA ? 0.55 : 0.3}"/>`;
    })
    .join('\n');
  const poc = 9;
  const pocY = yAt(min + ((poc + 0.5) / levels) * (max - min), min, max, top, bottom);
  return `
    ${frame(name, 'VOLUME / MARKET PROFILE')}
    ${profile}
    ${drawCandles(bars, min, max, top, bottom)}
    <line x1="${PAD.l}" y1="${pocY}" x2="${W - PAD.r}" y2="${pocY}" stroke="#FFF000" stroke-width="1.5" stroke-dasharray="5 3"/>
    <text x="${W - PAD.r - 4}" y="${pocY - 6}" text-anchor="end" fill="#FFF000" font-family="ui-monospace, Menlo, monospace" font-size="10">POC</text>
  `;
}

function renderFibonacci(name, rng) {
  const n = 45;
  const price = series(n, rng, { start: 35, drift: 0.35, vol: 1.8, meanReversion: 0.01 });
  // force a swing high/low story
  for (let i = 0; i < 18; i++) price[i] = 30 + i * 1.8 + (rng() - 0.5);
  for (let i = 18; i < n; i++) price[i] = 62 - (i - 18) * 0.7 + (rng() - 0.5) * 1.5;
  const hi = Math.max(...price);
  const lo = Math.min(...price);
  const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
  const min = lo - 3;
  const max = hi + 3;
  const top = PAD.t + 10;
  const bottom = H - PAD.b - 10;
  const isFan = /fan/i.test(name);
  const isArc = /arc/i.test(name);
  let extras = '';
  if (isFan) {
    const x0 = xAt(5, n);
    const y0 = yAt(lo, min, max, top, bottom);
    for (const lv of [0.236, 0.382, 0.5, 0.618]) {
      const y1 = yAt(hi - (hi - lo) * lv, min, max, top, bottom);
      extras += `<line x1="${x0}" y1="${y0}" x2="${W - PAD.r}" y2="${y1}" stroke="#D946EF" stroke-opacity="0.7" stroke-width="1.5"/>`;
    }
  } else if (isArc) {
    const cx = xAt(18, n);
    const cy = yAt(hi, min, max, top, bottom);
    for (const lv of [0.382, 0.5, 0.618]) {
      const r = 40 + lv * 180;
      extras += `<path d="M${cx - r},${cy} A${r},${r * 0.45} 0 0 1 ${cx + r},${cy}" fill="none" stroke="#00B6FF" stroke-opacity="0.7" stroke-width="1.5"/>`;
    }
  } else {
    extras = levels
      .map((lv) => {
        const v = hi - (hi - lo) * lv;
        const y = yAt(v, min, max, top, bottom);
        return `${hLine(y, '#00B6FF', true, `${(lv * 100).toFixed(1)}%`)}`;
      })
      .join('\n');
  }
  return `
    ${frame(name, 'FIBONACCI TOOL')}
    ${extras}
    <path d="${pathFrom(price, min, max, top, bottom)}" fill="none" stroke="#00FFD1" stroke-width="2.5"/>
  `;
}

function renderGann(name, rng) {
  const n = 40;
  const price = series(n, rng, { start: 40, drift: 0.2, vol: 1.6 });
  const min = Math.min(...price) - 5;
  const max = Math.max(...price) + 5;
  const top = PAD.t + 10;
  const bottom = H - PAD.b - 10;
  const x0 = PAD.l + 40;
  const y0 = bottom - 30;
  let fans = '';
  const angles = [1 / 8, 1 / 4, 1 / 3, 1 / 2, 1, 2, 3, 4, 8];
  for (const a of angles) {
    const x1 = W - PAD.r;
    const rise = (x1 - x0) * (a / (1 + a)) * 0.9;
    const y1 = y0 - rise;
    fans += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${clamp(y1, top, bottom)}" stroke="#FFF000" stroke-opacity="0.55" stroke-width="1.2"/>`;
  }
  if (/grid|square/i.test(name)) {
    for (let i = 0; i < 8; i++) {
      const x = PAD.l + i * 90;
      const y = top + i * 55;
      fans += `<line x1="${x}" y1="${top}" x2="${x}" y2="${bottom}" stroke="#00B6FF" stroke-opacity="0.2"/>`;
      fans += `<line x1="${PAD.l}" y1="${y}" x2="${W - PAD.r}" y2="${y}" stroke="#00B6FF" stroke-opacity="0.2"/>`;
    }
  }
  return `
    ${frame(name, 'GANN GEOMETRY')}
    ${fans}
    <circle cx="${x0}" cy="${y0}" r="5" fill="#FF2D95"/>
    <path d="${pathFrom(price, min, max, top, bottom)}" fill="none" stroke="#00FFD1" stroke-width="2"/>
  `;
}

function renderSAR(name, rng) {
  const n = 42;
  const bars = candles(n, rng);
  const prices = bars.flatMap((b) => [b.h, b.l]);
  const min = Math.min(...prices) - 2;
  const max = Math.max(...prices) + 2;
  const top = PAD.t + 10;
  const bottom = H - PAD.b - 10;
  let trendUp = true;
  const dots = bars
    .map((b, i) => {
      if (i > 0 && i % 9 === 0) trendUp = !trendUp;
      const y = yAt(trendUp ? b.l - 1.5 : b.h + 1.5, min, max, top, bottom);
      return `<circle cx="${xAt(i, n)}" cy="${y}" r="3.5" fill="${trendUp ? '#00FFD1' : '#FF2D95'}"/>`;
    })
    .join('\n');
  return `
    ${frame(name, 'PARABOLIC SAR')}
    ${drawCandles(bars, min, max, top, bottom)}
    ${dots}
  `;
}

function renderTrend(name, rng) {
  const n = 48;
  const bars = candles(n, rng);
  const closes = bars.map((b) => b.c);
  const prices = bars.flatMap((b) => [b.h, b.l]);
  const min = Math.min(...prices) - 2;
  const max = Math.max(...prices) + 2;
  const top = PAD.t + 8;
  const chartBottom = /adx|dmi|directional/i.test(name) ? H * 0.55 : H - PAD.b - 10;
  let overlay = '';
  if (/supertrend|alligator|xtl/i.test(name)) {
    const st = ema(closes, 10);
    const atr = rollingStd(closes, 10).map((s) => s * 1.8);
    const up = st.map((v, i) => v + atr[i]);
    const dn = st.map((v, i) => v - atr[i]);
    overlay = `
      <path d="${pathFrom(up, min, max, top, chartBottom)}" fill="none" stroke="#00FFD1" stroke-width="2"/>
      <path d="${pathFrom(dn, min, max, top, chartBottom)}" fill="none" stroke="#FF2D95" stroke-width="2"/>
    `;
    if (/alligator/i.test(name)) {
      const jaw = ema(closes, 13);
      const teeth = ema(closes, 8);
      const lips = ema(closes, 5);
      overlay = `
        <path d="${pathFrom(jaw, min, max, top, chartBottom)}" fill="none" stroke="#00B6FF" stroke-width="2.5"/>
        <path d="${pathFrom(teeth, min, max, top, chartBottom)}" fill="none" stroke="#FF2D95" stroke-width="2"/>
        <path d="${pathFrom(lips, min, max, top, chartBottom)}" fill="none" stroke="#7CFF00" stroke-width="2"/>
      `;
    }
  }
  let adxPane = '';
  if (/adx|dmi|directional/i.test(name)) {
    const adx = series(n, rng, { start: 25, vol: 6, meanReversion: 0.08, mean: 28, floor: 5, ceil: 60 });
    const pdi = series(n, rng, { start: 22, vol: 5, meanReversion: 0.1, mean: 20, floor: 0, ceil: 50 });
    const mdi = series(n, rng, { start: 18, vol: 5, meanReversion: 0.1, mean: 18, floor: 0, ceil: 50 });
    const ot = chartBottom + 20;
    const ob = H - PAD.b;
    const omin = 0;
    const omax = 65;
    adxPane = `
      <path d="${pathFrom(adx, omin, omax, ot, ob)}" fill="none" stroke="#FFF000" stroke-width="2.5"/>
      <path d="${pathFrom(pdi, omin, omax, ot, ob)}" fill="none" stroke="#00FFD1" stroke-width="1.8"/>
      <path d="${pathFrom(mdi, omin, omax, ot, ob)}" fill="none" stroke="#FF2D95" stroke-width="1.8"/>
      ${hLine(yAt(25, omin, omax, ot, ob), '#00B6FF', true, '25')}
    `;
  }
  return `
    ${frame(name, 'TREND INDICATOR')}
    ${drawCandles(bars, min, max, top, chartBottom)}
    ${overlay}
    ${adxPane}
  `;
}

function renderPivots(name, rng) {
  const n = 36;
  const bars = candles(n, rng);
  const prices = bars.flatMap((b) => [b.h, b.l]);
  const min = Math.min(...prices) - 3;
  const max = Math.max(...prices) + 3;
  const top = PAD.t + 10;
  const bottom = H - PAD.b - 10;
  const mid = (min + max) / 2;
  const levels = [
    { v: mid + 8, c: '#FF2D95', l: 'R2' },
    { v: mid + 4, c: '#FF2D95', l: 'R1' },
    { v: mid, c: '#FFF000', l: 'PP' },
    { v: mid - 4, c: '#00FFD1', l: 'S1' },
    { v: mid - 8, c: '#00FFD1', l: 'S2' },
  ];
  return `
    ${frame(name, 'PIVOT / S-R LEVELS')}
    ${levels.map((lv) => hLine(yAt(lv.v, min, max, top, bottom), lv.c, false, lv.l)).join('\n')}
    ${drawCandles(bars, min, max, top, bottom)}
  `;
}

function renderPitchfork(name, rng) {
  const n = 50;
  const price = series(n, rng, { start: 35, drift: 0.25, vol: 1.5 });
  const min = Math.min(...price) - 4;
  const max = Math.max(...price) + 4;
  const top = PAD.t + 10;
  const bottom = H - PAD.b - 10;
  const p1 = { i: 4, v: price[4] };
  const p2 = { i: 16, v: price[16] };
  const p3 = { i: 22, v: price[22] };
  const medianEnd = { i: n - 1, v: (p2.v + p3.v) / 2 + (price[n - 1] - price[22]) * 0.3 };
  const lines = [
    [p1, p2],
    [p1, p3],
    [p2, { i: n - 1, v: p2.v + (medianEnd.v - (p2.v + p3.v) / 2) }],
    [p3, { i: n - 1, v: p3.v + (medianEnd.v - (p2.v + p3.v) / 2) }],
    [{ i: 16, v: (p2.v + p3.v) / 2 }, medianEnd],
  ];
  const draw = lines
    .map(
      ([a, b]) =>
        `<line x1="${xAt(a.i, n)}" y1="${yAt(a.v, min, max, top, bottom)}" x2="${xAt(b.i, n)}" y2="${yAt(b.v, min, max, top, bottom)}" stroke="#D946EF" stroke-width="1.8" stroke-opacity="0.85"/>`
    )
    .join('\n');
  return `
    ${frame(name, 'ANDREWS PITCHFORK')}
    ${draw}
    <path d="${pathFrom(price, min, max, top, bottom)}" fill="none" stroke="#00FFD1" stroke-width="2.2"/>
    ${[p1, p2, p3].map((p) => `<circle cx="${xAt(p.i, n)}" cy="${yAt(p.v, min, max, top, bottom)}" r="5" fill="#FFF000"/>`).join('\n')}
  `;
}

function renderPattern(name, rng) {
  const n = 44;
  const bars = candles(n, rng);
  // sculpt characteristic shapes
  if (/zig zag/i.test(name)) {
    const pivots = [0, 8, 16, 24, 32, 43];
    const vals = [30, 70, 35, 75, 40, 68];
    const price = Array(n).fill(50);
    for (let p = 0; p < pivots.length - 1; p++) {
      for (let i = pivots[p]; i <= pivots[p + 1]; i++) {
        const t = (i - pivots[p]) / (pivots[p + 1] - pivots[p]);
        price[i] = lerp(vals[p], vals[p + 1], t);
      }
    }
    const min = 20;
    const max = 85;
    const top = PAD.t + 10;
    const bottom = H - PAD.b - 10;
    return `
      ${frame(name, 'SWING STRUCTURE')}
      <path d="${pathFrom(price, min, max, top, bottom)}" fill="none" stroke="#94a3b8" stroke-width="1.5" opacity="0.5"/>
      <path d="${pivots.map((pi, idx) => `${idx === 0 ? 'M' : 'L'}${xAt(pi, n)},${yAt(vals[idx], min, max, top, bottom)}`).join(' ')}" fill="none" stroke="#FFF000" stroke-width="3"/>
      ${pivots.map((pi, idx) => `<circle cx="${xAt(pi, n)}" cy="${yAt(vals[idx], min, max, top, bottom)}" r="5" fill="#FF2D95"/>`).join('\n')}
    `;
  }
  if (/heikin|renko/i.test(name)) {
    const prices = bars.flatMap((b) => [b.h, b.l]);
    const min = Math.min(...prices) - 2;
    const max = Math.max(...prices) + 2;
    return `
      ${frame(name, 'ALTERNATE PRICE CHART')}
      ${drawCandles(bars, min, max, PAD.t + 10, H - PAD.b - 10)}
    `;
  }
  if (/fair value|liquidity/i.test(name)) {
    const closes = bars.map((b) => b.c);
    const min = Math.min(...closes) - 4;
    const max = Math.max(...closes) + 4;
    const top = PAD.t + 10;
    const bottom = H - PAD.b - 10;
    const gapY1 = yAt(58, min, max, top, bottom);
    const gapY2 = yAt(48, min, max, top, bottom);
    return `
      ${frame(name, 'PRICE IMBALANCE')}
      <rect x="${xAt(18, n)}" y="${Math.min(gapY1, gapY2)}" width="${xAt(28, n) - xAt(18, n)}" height="${Math.abs(gapY2 - gapY1)}" fill="#D946EF" opacity="0.25" stroke="#D946EF" stroke-width="1.5"/>
      <path d="${pathFrom(closes, min, max, top, bottom)}" fill="none" stroke="#00FFD1" stroke-width="2.5"/>
      <text x="${xAt(23, n)}" y="${(gapY1 + gapY2) / 2}" text-anchor="middle" fill="#D946EF" font-family="ui-monospace, Menlo, monospace" font-size="11">FVG</text>
    `;
  }
  // harmonic / wolfe default
  const pts = [
    { i: 5, v: 40 },
    { i: 14, v: 72 },
    { i: 22, v: 48 },
    { i: 30, v: 68 },
    { i: 38, v: 42 },
  ];
  const min = 25;
  const max = 85;
  const top = PAD.t + 10;
  const bottom = H - PAD.b - 10;
  const price = series(n, rng, { start: 45, vol: 2 });
  return `
    ${frame(name, 'HARMONIC / WAVE PATTERN')}
    <path d="${pathFrom(price, min, max, top, bottom)}" fill="none" stroke="#64748b" stroke-width="1.2" opacity="0.6"/>
    <path d="${pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${xAt(p.i, n)},${yAt(p.v, min, max, top, bottom)}`).join(' ')}" fill="none" stroke="#00B6FF" stroke-width="2.5"/>
    ${pts.map((p, i) => `<circle cx="${xAt(p.i, n)}" cy="${yAt(p.v, min, max, top, bottom)}" r="5" fill="#FFF000"/><text x="${xAt(p.i, n)}" y="${yAt(p.v, min, max, top, bottom) - 10}" text-anchor="middle" fill="#FFF000" font-size="10" font-family="ui-monospace, Menlo, monospace">${'XABCD'[i] || ''}</text>`).join('\n')}
  `;
}

function renderVolatility(name, rng) {
  const n = 55;
  const atr = series(n, rng, { start: 18, vol: 4, meanReversion: 0.08, mean: 20, floor: 5, ceil: 45 });
  const top = PAD.t + 20;
  const bottom = H - PAD.b - 20;
  const min = 0;
  const max = 50;
  return `
    ${frame(name, 'VOLATILITY MEASURE')}
    ${hLine(yAt(20, min, max, top, bottom), '#00B6FF', true, 'AVG')}
    <path d="${areaPath(atr, atr.map(() => 0), min, max, top, bottom)}" fill="url(#tealFill)"/>
    <path d="${pathFrom(atr, min, max, top, bottom)}" fill="none" stroke="#00FFD1" stroke-width="2.5"/>
  `;
}

function renderFundamental(name, rng) {
  const n = 24;
  const data = series(n, rng, {
    start: /unemployment/i.test(name) ? 6 : 40,
    drift: /gdp|inflation/i.test(name) ? 0.4 : -0.05,
    vol: 3,
    meanReversion: 0.05,
    mean: 45,
    floor: 5,
    ceil: 90,
  });
  const top = PAD.t + 20;
  const bottom = H - PAD.b - 20;
  const min = Math.min(...data) - 5;
  const max = Math.max(...data) + 5;
  const bw = Math.max(8, ((W - PAD.l - PAD.r) / n) * 0.55);
  const bars = data
    .map((v, i) => {
      const x = xAt(i, n);
      const y = yAt(v, min, max, top, bottom);
      const h = bottom - y;
      return `<rect x="${x - bw / 2}" y="${y}" width="${bw}" height="${h}" fill="#00B6FF" opacity="0.75" rx="2"/>`;
    })
    .join('\n');
  return `
    ${frame(name, 'FUNDAMENTAL / MACRO')}
    ${bars}
    <path d="${pathFrom(data, min, max, top, bottom)}" fill="none" stroke="#00FFD1" stroke-width="2"/>
  `;
}

function renderOptions(name, rng) {
  const n = 50;
  // greek-style curve
  const pts = Array.from({ length: n }, (_, i) => {
    const x = i / (n - 1);
    if (/delta/i.test(name)) return 1 / (1 + Math.exp(-10 * (x - 0.5)));
    if (/gamma/i.test(name)) return Math.exp(-30 * (x - 0.5) ** 2);
    if (/theta/i.test(name)) return -0.2 - 0.8 * Math.exp(-20 * (x - 0.5) ** 2);
    if (/vega/i.test(name)) return Math.exp(-12 * (x - 0.5) ** 2);
    if (/put call/i.test(name)) return 0.7 + 0.3 * Math.sin(x * 8) + (rng() - 0.5) * 0.05;
    return 0.3 + x * 0.5 + (rng() - 0.5) * 0.05;
  }).map((v) => v * 80 + 10);
  const min = Math.min(...pts) - 5;
  const max = Math.max(...pts) + 5;
  const top = PAD.t + 20;
  const bottom = H - PAD.b - 20;
  return `
    ${frame(name, 'OPTIONS / DERIVATIVES')}
    ${hLine(yAt((min + max) / 2, min, max, top, bottom), '#00B6FF', true, '0')}
    <path d="${pathFrom(pts, min, max, top, bottom)}" fill="none" stroke="#D946EF" stroke-width="3"/>
    <path d="${areaPath(pts, pts.map(() => (min + max) / 2), min, max, top, bottom)}" fill="url(#magentaFill)"/>
  `;
}

function renderBreadth(name, rng) {
  const n = 55;
  const line = series(n, rng, { start: 50, drift: 0.15, vol: 3, meanReversion: 0.04 });
  const top = PAD.t + 16;
  const bottom = H - PAD.b - 16;
  const min = Math.min(...line) - 5;
  const max = Math.max(...line) + 5;
  const zero = (min + max) / 2;
  return `
    ${frame(name, 'MARKET BREADTH')}
    ${hLine(yAt(zero, min, max, top, bottom), '#00B6FF', true, '0')}
    <path d="${areaPath(line, line.map(() => zero), min, max, top, bottom)}" fill="url(#cyanFill)"/>
    <path d="${pathFrom(line, min, max, top, bottom)}" fill="none" stroke="#00B6FF" stroke-width="2.5"/>
  `;
}

function renderStats(name, rng) {
  const n = 50;
  const z = series(n, rng, { start: 0, vol: 0.8, meanReversion: 0.15, mean: 0, floor: -3, ceil: 3 });
  const top = PAD.t + 20;
  const bottom = H - PAD.b - 20;
  const min = -3.5;
  const max = 3.5;
  return `
    ${frame(name, 'STATISTICAL SIGNAL')}
    ${hLine(yAt(2, min, max, top, bottom), '#FF2D95', true, '+2σ')}
    ${hLine(yAt(-2, min, max, top, bottom), '#00FFD1', true, '-2σ')}
    ${hLine(yAt(0, min, max, top, bottom), '#00B6FF', true, '0')}
    <path d="${pathFrom(z, min, max, top, bottom)}" fill="none" stroke="#FFF000" stroke-width="2.5"/>
  `;
}

function renderGeneric(name, rng) {
  const n = 48;
  const bars = candles(n, rng);
  const closes = bars.map((b) => b.c);
  const ma = ema(closes, 12);
  const prices = bars.flatMap((b) => [b.h, b.l]);
  const min = Math.min(...prices) - 2;
  const max = Math.max(...prices) + 2;
  const top = PAD.t + 10;
  const bottom = H - PAD.b - 10;
  return `
    ${frame(name, 'TECHNICAL MODEL')}
    ${drawCandles(bars, min, max, top, bottom)}
    <path d="${pathFrom(ma, min, max, top, bottom)}" fill="none" stroke="#00B6FF" stroke-width="2"/>
  `;
}

const RENDERERS = {
  bands: renderBands,
  ma: renderMA,
  oscillator: renderOscillator,
  macd: renderMACD,
  ichimoku: renderIchimoku,
  volume: renderVolume,
  volumeProfile: renderVolumeProfile,
  fibonacci: renderFibonacci,
  gann: renderGann,
  sar: renderSAR,
  trend: renderTrend,
  pivots: renderPivots,
  pitchfork: renderPitchfork,
  pattern: renderPattern,
  volatility: renderVolatility,
  fundamental: renderFundamental,
  options: renderOptions,
  breadth: renderBreadth,
  stats: renderStats,
  generic: renderGeneric,
};

export const INDICATOR_NAMES = [
  'Acceleration Bands',
  'Accumulation/Distribution Line',
  'Advance/Decline Line',
  'Advance-Decline Ratio',
  'ADX (Average Directional Index)',
  'Alligator Indicator',
  'Alpha',
  'Andrews Pitchfork',
  'Aroon Indicator',
  'Aroon Oscillator',
  'ATR (Average True Range)',
  'Average Price',
  'Average Volume',
  'Balance of Power',
  'Beta',
  'Bid-Ask Spread',
  'Bollinger Bands',
  'Bollinger Band Width',
  'Breadth Thrust',
  'Bull Bear Power',
  'Bull Market Support Band',
  'Camarilla Pivot Points',
  'Candlestick Pattern Index',
  'CCI (Commodity Channel Index)',
  'Center of Gravity',
  'Chaikin Money Flow',
  'Chaikin Oscillator',
  'Chande Forecast Oscillator',
  'Chande Momentum Oscillator',
  'Channel Index',
  'Closing Price Location Value',
  'Commitment of Traders (COT)',
  'Commodity Selection Index',
  'Composite Index',
  'Connors RSI',
  'Coppock Curve',
  'Correlation Coefficient',
  'Cumulative Delta',
  'Detrended Price Oscillator',
  'Demand Index',
  'DeMarker Indicator',
  'Directional Movement Index (DMI)',
  'Donchian Channels',
  'Downside Deviation',
  'DPO',
  'Ease of Movement',
  'Elder Force Index',
  'Elder Ray',
  'Elliott Wave Oscillator',
  'EMA (Exponential Moving Average)',
  'Envelope Indicator',
  'Fair Value Gap',
  'Fast Stochastic',
  'Fibonacci Arcs',
  'Fibonacci Channels',
  'Fibonacci Expansion',
  'Fibonacci Fan',
  'Fibonacci Retracement',
  'Fisher Transform',
  'Force Index',
  'Fractal Indicator',
  'Gann Fan',
  'Gann Grid',
  'Gann Square',
  'Golden Cross',
  'Gravity Center',
  'Gross Domestic Product (GDP)',
  'Harmonic Patterns',
  'Heikin Ashi',
  'Historical Volatility',
  'Hull Moving Average',
  'Ichimoku Cloud',
  'Implied Volatility',
  'Inflation Rate',
  'Interest Coverage Ratio',
  'Interest Rate Differential',
  'Internal Bar Strength',
  'Jurik Moving Average',
  'Kairi Relative Index',
  'Keltner Channels',
  'Know Sure Thing (KST)',
  'Lagging Span',
  'Linear Regression',
  'Linear Regression Channel',
  'Liquidity Void',
  'Local Volatility',
  'Log Return',
  'MACD',
  'MACD Histogram',
  'Market Breadth',
  'Market Facilitation Index',
  'Market Profile',
  'Market Sentiment Index',
  'Mass Index',
  'McClellan Oscillator',
  'McClellan Summation Index',
  'Median Price',
  'Momentum',
  'Money Flow Index',
  'Moving Average',
  'Moving Average Envelope',
  'Nasdaq Advance Decline',
  'Negative Volume Index',
  'Net Change',
  'New High New Low Index',
  'NFP (Non-Farm Payrolls)',
  'OBV (On Balance Volume)',
  'Open Interest',
  'Option Delta',
  'Option Gamma',
  'Option Theta',
  'Option Vega',
  'Oscillator of Moving Average',
  'Parabolic SAR',
  'Percent B',
  'Percent Price Oscillator',
  'Pivot Points',
  'Positive Volume Index',
  'PPO',
  'Price Action Channel',
  'Price Oscillator',
  'Price Rate of Change',
  'Price Volume Trend',
  'Put Call Ratio',
  'Qstick Indicator',
  'Quadrant Lines',
  'Rate of Change',
  'Relative Strength Index (RSI)',
  'Relative Vigor Index',
  'Renko Trend',
  'Risk Reward Ratio',
  'ROC',
  'Rolling Volatility',
  'Schaff Trend Cycle',
  'Seasonal Index',
  'Sharpe Ratio',
  'Slow Stochastic',
  'SMA (Simple Moving Average)',
  'Smoothed Moving Average',
  'Sortino Ratio',
  'Spread Indicator',
  'Standard Deviation',
  'Standard Error',
  'Stochastic Momentum Index',
  'Stochastic RSI',
  'SuperTrend',
  'Support and Resistance',
  'Swing Index',
  'T3 Moving Average',
  'TEMA',
  'Tick Index',
  'Time Segmented Volume',
  'TRIN (Arms Index)',
  'Triple EMA',
  'Triple Top Bottom',
  'True Strength Index',
  'Turtle Channels',
  'Ulcer Index',
  'Ultimate Oscillator',
  'Unemployment Rate',
  'Upside Downside Ratio',
  'Value Area',
  'Variable Moving Average',
  'Vertical Horizontal Filter',
  'VIX',
  'Volume',
  'Volume Delta',
  'Volume Oscillator',
  'Volume Profile',
  'Volume Rate of Change',
  'Volume Weighted Average Price (VWAP)',
  'Vortex Indicator',
  'Weighted Moving Average',
  'Williams %R',
  'Williams Accumulation Distribution',
  'Wolfe Waves',
  'XTL Trend Indicator',
  'Yield Curve',
  'Yield Spread',
  'Zig Zag Indicator',
  'Z-Score',
  'Zero Lag EMA',
  'Zero Line Cross',
  'ZLEMA',
];

function wrap(body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">
${body}
</svg>
`;
}

const manifest = {};
for (const name of INDICATOR_NAMES) {
  const slug = slugify(name);
  const kind = classify(name);
  const rng = mulberry32(seedFrom(name));
  const renderer = RENDERERS[kind] || renderGeneric;
  const svg = wrap(renderer(name, rng));
  const file = `${slug}.svg`;
  writeFileSync(join(OUT, file), svg);
  manifest[name] = `/encyclopedia-indicators/${file}`;
}

writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Generated ${INDICATOR_NAMES.length} indicator SVGs → ${OUT}`);
