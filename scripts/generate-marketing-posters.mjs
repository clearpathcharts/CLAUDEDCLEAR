import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const outputDir = path.join(root, 'public', 'marketing', 'posters');
const markPath = path.join(root, 'public', 'brand', 'clearpath-mark-256.png');
const markData = fs.readFileSync(markPath).toString('base64');

const posters = [
  {
    id: 'basic-chart-first',
    tier: 'FREE / BASIC',
    accent: '#00F0FF',
    accent2: '#FF1493',
    eyebrow: 'CLARITY STARTS HERE',
    title: ['CHART FIRST.', 'NOISE LAST.'],
    subtitle: 'A focused market workspace with education beside the chart.',
    features: ['1 CHART', '5 INDICATORS', 'NEURO LAYOUTS'],
    cta: 'EXPLORE FREE BASIC',
    motif: 'single',
  },
  {
    id: 'silver-build-workspace',
    tier: 'SILVER',
    accent: '#D5DEEA',
    accent2: '#00F0FF',
    eyebrow: 'BUILD CONTEXT',
    title: ['MORE CONTEXT.', 'SAME CLEAR PATH.'],
    subtitle: 'Four charts, replay, education, and a workspace you control.',
    features: ['4 CHARTS', 'MARKET REPLAY', 'INTRADAY'],
    cta: 'COMPARE SILVER',
    motif: 'quad',
  },
  {
    id: 'gold-pattern-literacy',
    tier: 'GOLD',
    accent: '#FFD447',
    accent2: '#FF1493',
    eyebrow: 'PATTERN LITERACY',
    title: ['SEE THE PATTERN.', 'LEARN THE STRUCTURE.'],
    subtitle: 'Pattern Overlay and INDACREATOR inside the chart-first workspace.',
    features: ['10 CHARTS', 'PATTERN OVERLAY', 'INDACREATOR'],
    cta: 'EXPLORE GOLD',
    motif: 'pattern',
  },
  {
    id: 'platinum-pattern-scanner',
    tier: 'PLATINUM',
    accent: '#C478FF',
    accent2: '#00F0FF',
    eyebrow: 'SCAN THEN VERIFY',
    title: ['FIND STRUCTURE.', 'VERIFY ON CHART.'],
    subtitle: 'AI Pattern Scanner with the complete ClearPath workspace.',
    features: ['AI SCANNER', 'ALL INDICATORS', 'COMPLETE DESK'],
    cta: 'EXPLORE PLATINUM',
    motif: 'scanner',
  },
];

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function chartPath(offsetX = 0, offsetY = 0, scale = 1) {
  const points = [
    [0, 165],
    [65, 118],
    [130, 145],
    [205, 55],
    [280, 92],
    [360, 25],
    [430, 70],
    [510, 10],
  ]
    .map(([x, y]) => `${offsetX + x * scale},${offsetY + y * scale}`)
    .join(' ');
  return points;
}

function grid(x, y, width, height) {
  const vertical = Array.from({ length: 7 }, (_, index) => {
    const px = x + (width / 6) * index;
    return `<line x1="${px}" y1="${y}" x2="${px}" y2="${y + height}"/>`;
  }).join('');
  const horizontal = Array.from({ length: 5 }, (_, index) => {
    const py = y + (height / 4) * index;
    return `<line x1="${x}" y1="${py}" x2="${x + width}" y2="${py}"/>`;
  }).join('');
  return `<g stroke="#29314A" stroke-width="1" opacity=".55">${vertical}${horizontal}</g>`;
}

function candles(x, y) {
  const values = [
    [40, 76, 120, 92, '#00F0FF'],
    [95, 50, 98, 66, '#FF1493'],
    [150, 84, 132, 102, '#00F0FF'],
    [205, 36, 95, 58, '#00F0FF'],
    [260, 64, 110, 82, '#FF1493'],
    [315, 28, 82, 44, '#00F0FF'],
    [370, 52, 100, 72, '#FF1493'],
    [425, 18, 70, 36, '#00F0FF'],
  ];
  return values
    .map(([dx, top, bottom, body, color]) => {
      const bodyTop = Math.min(top + 14, body);
      const bodyHeight = Math.max(18, Math.abs(body - bodyTop));
      return `<g stroke="${color}" stroke-width="4"><line x1="${x + dx}" y1="${y + top}" x2="${x + dx}" y2="${y + bottom}"/><rect x="${x + dx - 10}" y="${y + bodyTop}" width="20" height="${bodyHeight}" rx="3" fill="${color}" fill-opacity=".28"/></g>`;
    })
    .join('');
}

function terminalMotif(poster) {
  if (poster.motif === 'quad') {
    return [0, 1, 2, 3]
      .map((index) => {
        const x = 104 + (index % 2) * 390;
        const y = 600 + Math.floor(index / 2) * 190;
        return `<g><rect x="${x}" y="${y}" width="350" height="150" rx="16" fill="#080B13" stroke="${poster.accent}" stroke-opacity=".42" stroke-width="2"/>${grid(x + 12, y + 12, 326, 126)}<polyline points="${chartPath(x + 18, y + 24, 0.6)}" fill="none" stroke="#00F0FF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>`;
      })
      .join('');
  }

  const base = `<rect x="96" y="582" width="760" height="370" rx="24" fill="#080B13" stroke="${poster.accent}" stroke-opacity=".5" stroke-width="3"/>${grid(116, 606, 720, 320)}${candles(180, 675)}`;
  if (poster.motif === 'pattern') {
    return `${base}<path d="M185 875 L345 790 L510 825 L675 690 L820 735" fill="none" stroke="${poster.accent}" stroke-width="5" stroke-dasharray="14 12"/><path d="M185 925 L345 840 L510 875 L675 740 L820 785" fill="none" stroke="${poster.accent}" stroke-width="5" stroke-dasharray="14 12"/><circle cx="675" cy="690" r="16" fill="${poster.accent}"/>`;
  }
  if (poster.motif === 'scanner') {
    return `${base}<circle cx="665" cy="735" r="118" fill="none" stroke="${poster.accent}" stroke-width="3" opacity=".75"/><circle cx="665" cy="735" r="72" fill="none" stroke="#00F0FF" stroke-width="2" opacity=".55"/><path d="M665 595V875M525 735H805" stroke="${poster.accent2}" stroke-width="2" opacity=".7"/><circle cx="665" cy="735" r="19" fill="${poster.accent}"/><text x="705" y="646" fill="${poster.accent}" font-family="Arial,Helvetica,sans-serif" font-size="18" font-weight="700">PATTERN CANDIDATE</text>`;
  }
  return `${base}<polyline points="${chartPath(175, 665, 1.2)}" fill="none" stroke="${poster.accent}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function svgFor(poster) {
  const titleLines = poster.title
    .map(
      (line, index) =>
        `<text x="72" y="${300 + index * 92}" fill="#FFFFFF" font-family="Arial,Helvetica,sans-serif" font-size="${line.length > 20 ? 63 : 72}" font-weight="900" letter-spacing="-2">${escapeXml(line)}</text>`,
    )
    .join('');
  const chips = poster.features
    .map((feature, index) => {
      const x = 72 + index * 300;
      return `<rect x="${x}" y="1035" width="275" height="54" rx="27" fill="${poster.accent}" fill-opacity=".1" stroke="${poster.accent}" stroke-opacity=".55"/><text x="${x + 137.5}" y="1069" text-anchor="middle" fill="${poster.accent}" font-family="Arial,Helvetica,sans-serif" font-size="18" font-weight="800" letter-spacing="1">${escapeXml(feature)}</text>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350" role="img" aria-labelledby="title desc">
  <title id="title">ClearPath Trader ${escapeXml(poster.tier)} campaign poster</title>
  <desc id="desc">${escapeXml(poster.subtitle)} Educational content only.</desc>
  <defs>
    <linearGradient id="frame" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00F0FF"/><stop offset=".5" stop-color="#FF1493"/><stop offset="1" stop-color="#BF00FF"/></linearGradient>
    <radialGradient id="glowA"><stop offset="0" stop-color="${poster.accent}" stop-opacity=".22"/><stop offset="1" stop-color="${poster.accent}" stop-opacity="0"/></radialGradient>
    <radialGradient id="glowB"><stop offset="0" stop-color="#FF1493" stop-opacity=".14"/><stop offset="1" stop-color="#FF1493" stop-opacity="0"/></radialGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="24"/></filter>
  </defs>
  <rect width="1080" height="1350" fill="#03050A"/>
  <circle cx="910" cy="180" r="330" fill="url(#glowA)" filter="url(#soft)"/>
  <circle cx="170" cy="980" r="360" fill="url(#glowB)" filter="url(#soft)"/>
  <rect x="24" y="24" width="1032" height="1302" rx="38" fill="none" stroke="url(#frame)" stroke-width="4"/>
  <image href="data:image/png;base64,${markData}" x="66" y="62" width="92" height="92"/>
  <text x="178" y="100" fill="#FFFFFF" font-family="Arial,Helvetica,sans-serif" font-size="30" font-weight="900" letter-spacing="2">CLEARPATH TRADER</text>
  <text x="178" y="135" fill="#9AA6BA" font-family="Arial,Helvetica,sans-serif" font-size="17" font-weight="700" letter-spacing="2">ONE CHART SITE / FOUR DESKS</text>
  <rect x="820" y="72" width="190" height="54" rx="27" fill="${poster.accent}" fill-opacity=".14" stroke="${poster.accent}" stroke-width="2"/>
  <text x="915" y="106" text-anchor="middle" fill="${poster.accent}" font-family="Arial,Helvetica,sans-serif" font-size="19" font-weight="900" letter-spacing="2">${escapeXml(poster.tier)}</text>
  <text x="72" y="226" fill="${poster.accent}" font-family="Arial,Helvetica,sans-serif" font-size="20" font-weight="900" letter-spacing="5">${escapeXml(poster.eyebrow)}</text>
  ${titleLines}
  <text x="72" y="500" fill="#CDD5E3" font-family="Arial,Helvetica,sans-serif" font-size="27">${escapeXml(poster.subtitle)}</text>
  ${terminalMotif(poster)}
  <rect x="72" y="968" width="936" height="2" fill="url(#frame)" opacity=".7"/>
  ${chips}
  <rect x="72" y="1135" width="390" height="82" rx="18" fill="${poster.accent}"/>
  <text x="267" y="1187" text-anchor="middle" fill="#03050A" font-family="Arial,Helvetica,sans-serif" font-size="27" font-weight="900">${escapeXml(poster.cta)}</text>
  <text x="1008" y="1187" text-anchor="end" fill="#FFFFFF" font-family="Arial,Helvetica,sans-serif" font-size="29" font-weight="900">clearpathtrader.com</text>
  <text x="72" y="1260" fill="#A9B4C5" font-family="Arial,Helvetica,sans-serif" font-size="18" font-weight="700">INSTITUTIONAL / FUNDAMENTAL / RETAIL / NEURODIVERGENT</text>
  <text x="72" y="1294" fill="#69758A" font-family="Arial,Helvetica,sans-serif" font-size="16">Educational content only - Not financial advice - ClearPath Trader is not a brokerage.</text>
</svg>`;
}

fs.mkdirSync(outputDir, { recursive: true });

for (const poster of posters) {
  const svg = svgFor(poster);
  if (/[^\x00-\x7F]/.test(svg)) throw new Error(`${poster.id} contains non-ASCII output`);
  const svgPath = path.join(outputDir, `${poster.id}.svg`);
  const pngPath = path.join(outputDir, `${poster.id}.png`);
  fs.writeFileSync(svgPath, svg, 'ascii');
  await sharp(Buffer.from(svg, 'ascii')).png({ compressionLevel: 9 }).toFile(pngPath);
  console.log(`generated ${path.relative(root, svgPath)} and ${path.relative(root, pngPath)}`);
}
