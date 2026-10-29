/**
 * Guard: member-facing market / macro numbers must come from a vendor or render
 * DATA UNAVAILABLE. Fails CI if known fabrication patterns reappear anywhere in src/.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

const BANNED: Array<{ pattern: RegExp; why: string }> = [
  { pattern: /returning simulated/i, why: 'fallback that substitutes simulated values' },
  { pattern: /Randomize market prices/i, why: 'random price nudges presented as live' },
  { pattern: /(high|low):\s*\(Math\.(max|min)\(price/, why: 'padded high/low not from market data' },
  { pattern: /latency:\s*['"]\d+(\.\d+)?ms['"]/, why: 'hardcoded latency reported as measured' },
  { pattern: /latencyMs\s*\|\|\s*\d+/, why: 'invented latency default' },
  { pattern: /value:\s*26000\s*\+/, why: 'synthetic GDP series' },
  { pattern: /'5\.25 - 5\.50%'/, why: 'hardcoded Fed Funds rate' },
  { pattern: /Locked in \+45 pips/, why: 'fabricated trade testimonial' },
  { pattern: /value:\s*68420/, why: 'hardcoded BTC price' },
  {
    pattern: /\b(BTC|ETH|SOL|EUR|GBP|JPY|XAU|XAG|SPX|SP500|NDX|NASDAQ|DJI|DOW|AAPL|NVDA|TSLA|MSFT|AMZN|GOOGL|META|GOLD|SILVER|BITCOIN|VIX|DXY|YIELD|TREASURY)[A-Za-z0-9/_]*\b[^\n]{0,80}\b(price|basePrice|val|value|rate)\s*:\s*['"]?\$?\d/i,
    why: 'hardcoded price next to a real ticker — use useLiveQuotes or DATA UNAVAILABLE',
  },
  {
    pattern: /source:\s*['"](Bloomberg|Wall Street Journal|WSJ|Financial Times|FT|Reuters|TechCrunch|CNBC|Barron'?s|MarketWatch)/i,
    why: 'invented headline attributed to a real publisher',
  },
  { pattern: /lastUpdate:\s*['"]Just now['"]/, why: 'static value labelled as freshly updated' },
  { pattern: /Simulated Market Feed|REAL-TIME TELEMETRY RATE|synced directly with Frankfurt/i, why: 'simulated numbers labelled as a live feed' },
  { pattern: /seededRandom\s*\(/, why: 'seeded generator — tickers, coins, companies, and terms must come from real lists' },
  { pattern: /fromCharCode\(\s*\d+\s*\+\s*Math\.floor\(/, why: 'generated ticker/symbol letters' },
  { pattern: /(list|catalog|out)\.length\s*<\s*\d{4,}/, why: 'padding a market catalog to a target size' },
];

/**
 * Math.random is banned in shipped code except where the output is not a market number.
 * Each exception names the file and the only lines it may appear on.
 */
const RANDOM_ALLOWED: Array<{ file: string; line: RegExp; why: string }> = [
  { file: '*', line: /toString\(36\)/, why: 'opaque id generation' },
  { file: 'src/components/Auth.tsx', line: /drops\[i\]|dropColors\[i\]|tipChar/, why: 'login background animation' },
  { file: 'src/components/ReidsGamesWidget.tsx', line: /.*/, why: 'game particles' },
  { file: 'src/components/profile/AffiliateDashboard.tsx', line: /setAudioBars|mediaPool/, why: 'audio meter animation / media pick' },
  { file: 'src/hooks/useChatRoom.ts', line: /Trader_/, why: 'guest display name' },
  { file: 'src/components/encyclopedia/OrderBookSimulator.tsx', line: /new(Bid|Ask)(Price|Size)/, why: 'DEMO-A practice book (banner required)' },
  { file: 'src/river/runtime/fixtures/sampleCandles.ts', line: /.*/, why: 'self-test fixture only' },
];

/** Practice tools that may move made-up numbers must show the practice banner. */
const PRACTICE_FILES = [
  'src/components/encyclopedia/OrderBookSimulator.tsx',
  'src/components/encyclopedia/MarketPsychologyView.tsx',
  'src/components/encyclopedia/StockDetailsView.tsx',
];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const rel = (file: string) => path.relative(ROOT, file).split(path.sep).join('/');
const isSelfTest = (file: string) => /\.selftest\.tsx?$/.test(file);

const files = [...walk(path.join(ROOT, 'src')), path.join(ROOT, 'websockets.ts'), path.join(ROOT, 'server.ts')];
const failures: string[] = [];

for (const file of files) {
  const r = rel(file);
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const { pattern, why } of BANNED) {
      if (pattern.test(line)) failures.push(`${r}:${i + 1} — ${why}`);
    }
    if (/Math\.random\s*\(/.test(line) && !isSelfTest(file)) {
      const ok = RANDOM_ALLOWED.some((a) => (a.file === '*' || a.file === r) && a.line.test(line));
      if (!ok) failures.push(`${r}:${i + 1} — Math.random outside the reviewed allowlist (random numbers must never reach a market display)`);
    }
  });
  if (/fixtures\/sampleCandles/.test(src) && !isSelfTest(file)) {
    failures.push(`${r} — imports the random sampleCandles fixture outside a self-test`);
  }
}

for (const p of PRACTICE_FILES) {
  const full = path.join(ROOT, p);
  if (fs.existsSync(full) && !fs.readFileSync(full, 'utf8').includes('PRACTICE_BANNER')) {
    failures.push(`${p} — practice simulation without the on-screen PRACTICE_BANNER`);
  }
}

// The guard must still trip on the patterns it exists for.
const canaries = [
  "{ symbol: 'BTCUSD', name: 'Bitcoin', price: 67482.50 }",
  "sp500: { val: 5278.40, change: 1.82 }",
  "{ headline: 'x', source: 'Bloomberg Terminal' }",
  "{ label: 'GOLD RESERVE DESK', val: '$2,364.80', chg: '+$18.2' }",
  "{ label: 'DXY EXCHANGE RATE', val: '104.12' }",
  'const r1 = seededRandom(seed);',
  'const char1 = String.fromCharCode(65 + Math.floor(r1 * 26));',
  'for (let i = 1; list.length < 20112; i++) {',
];
for (const c of canaries) {
  assert.ok(BANNED.some(({ pattern }) => pattern.test(c)), `guard regression: canary not caught: ${c}`);
}

assert.deepEqual(failures, [], `Invented market data found:\n${failures.join('\n')}`);
console.log(`no-invented-market-data.selftest: OK (${files.length} files scanned)`);
