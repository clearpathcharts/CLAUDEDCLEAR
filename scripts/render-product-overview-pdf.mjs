#!/usr/bin/env node
/**
 * Render docs/marketing/product-overview.html → public/press/ClearPath-Trader-Product-Overview.pdf
 *
 * Uses the VM's Google Chrome (headless) so print CSS, backgrounds, and webfonts survive.
 * Run: node scripts/render-product-overview-pdf.mjs
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync, copyFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'docs/marketing');
const htmlName = 'product-overview.html';
const outPdf = join(root, 'public/press/ClearPath-Trader-Product-Overview.pdf');
const chrome =
  process.env.CHROME_PATH ||
  ['/usr/bin/google-chrome-stable', '/usr/bin/google-chrome', '/usr/local/bin/google-chrome'].find((p) =>
    existsSync(p),
  );

if (!chrome) {
  console.error('Google Chrome not found. Set CHROME_PATH.');
  process.exit(1);
}

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const server = createServer((req, res) => {
  const file = join(srcDir, decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\//, '') || htmlName);
  if (!file.startsWith(srcDir)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const body = readFileSync(file);
    res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();
const url = `http://127.0.0.1:${port}/${htmlName}`;
mkdirSync(dirname(outPdf), { recursive: true });

console.log(`Rendering ${url}`);
console.log(`Chrome ${chrome}`);

const args = [
  '--headless=new',
  '--disable-gpu',
  '--no-pdf-header-footer',
  '--no-first-run',
  '--disable-extensions',
  '--hide-scrollbars',
  '--disable-dev-shm-usage',
  '--no-sandbox',
  '--virtual-time-budget=20000',
  `--print-to-pdf=${outPdf}`,
  url,
];

const code = await new Promise((resolve) => {
  const child = spawn(chrome, args, { stdio: 'inherit' });
  child.on('exit', (c) => resolve(c ?? 1));
});

server.close();

if (code !== 0) {
  console.error(`Chrome exited ${code}`);
  process.exit(code);
}

const bytes = statSync(outPdf).size;
if (bytes < 20_000) {
  console.error(`PDF too small (${bytes} bytes) — render likely failed.`);
  process.exit(1);
}

const artifactDir = '/opt/cursor/artifacts';
try {
  mkdirSync(artifactDir, { recursive: true });
  copyFileSync(outPdf, join(artifactDir, 'ClearPath-Trader-Product-Overview.pdf'));
} catch (err) {
  console.warn('Could not copy to artifacts:', err.message);
}

console.log(`Wrote ${outPdf} (${bytes} bytes)`);
