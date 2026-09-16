/**
 * Neurodivergent desk: SEARCH ASSET keystrokes must not re-render the desk.
 *
 * Guards the render → effect → setState loop that froze /desk/neurodivergent
 * for ~44 s per keystroke (useRetailIntelligence keyed its workspace memo on an
 * inline `{}` argument). Mounts the real desk under jsdom.
 *
 * Run: npx tsx scripts/neuro-desk-render-loop.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { register } from 'node:module';
import { JSDOM } from 'jsdom';

// Desk graph imports .css (Vite handles it); Node needs an empty module for those.
register(
  'data:text/javascript,' +
    encodeURIComponent(
      `export async function load(url, context, next) {
        if (/\\.css(\\?.*)?$/.test(url)) return { format: 'module', source: 'export default {};', shortCircuit: true };
        return next(url, context);
      }`,
    ),
);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------------------
// Static guards (cheap, no DOM): the exact shapes that caused / prevent the loop.
// ---------------------------------------------------------------------------
const deskSrc = fs.readFileSync(
  path.join(root, 'src/components/desks/neuro/NeurodivergentDashboard.tsx'),
  'utf8',
);
assert.doesNotMatch(
  deskSrc,
  /useRetailIntelligence\([^)]*?,\s*\{\s*\}\s*,/,
  'Neuro desk must not pass an inline {} to useRetailIntelligence (render loop)',
);
assert.match(deskSrc, /NO_SLOT_OVERRIDES/);
assert.match(deskSrc, /onSubmit=\{handleSearchSubmit\}/, 'ChartSymbolSearch needs a stable onSubmit');
assert.doesNotMatch(deskSrc, /console\.count\(/, 'temporary render instrumentation left in desk');

const hookSrc = fs.readFileSync(
  path.join(root, 'src/components/desks/retail/useRetailIntelligence.ts'),
  'utf8',
);
assert.match(hookSrc, /slotOverridesKey/, 'workspace slots must key on a serialised value, not object identity');
assert.doesNotMatch(hookSrc, /\[primarySymbol, layout, slotOverrides, primaryTimeframe\]/);
assert.match(hookSrc, /sameCandleMap\(prev, next\) \? prev : next/, 'setCandlesByKey must bail out on equal data');
assert.match(hookSrc, /workspaceReqRef/, 'stale workspace completions must be ignored');

const syncSrc = fs.readFileSync(path.join(root, 'src/hooks/useDeskMonitorSync.ts'), 'utf8');
assert.match(syncSrc, /DESK_MONITOR_TAB_ID/);
assert.match(syncSrc, /msg\.origin === DESK_MONITOR_TAB_ID\) return/, 'listener must drop its own broadcasts');

const searchSrc = fs.readFileSync(path.join(root, 'src/components/charts/ChartSymbolSearch.tsx'), 'utf8');
assert.match(searchSrc, /export const ChartSymbolSearch = memo\(/);

const chartSrc = fs.readFileSync(path.join(root, 'src/components/charts/LightweightCandles.tsx'), 'utf8');
assert.match(chartSrc, /if \(!replayMode && active && !disposedRef\.current\) \{/, 'live tick must not arm after cleanup');

// ---------------------------------------------------------------------------
// jsdom environment for the behavioural tests.
// ---------------------------------------------------------------------------
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/desk/neurodivergent',
  pretendToBeVisual: true,
});
const w = dom.window as unknown as Window & typeof globalThis & Record<string, unknown>;
const g = globalThis as unknown as Record<string, unknown>;
for (const k of [
  'window',
  'document',
  'navigator',
  'localStorage',
  'sessionStorage',
  'HTMLElement',
  'HTMLInputElement',
  'Element',
  'Node',
  'Event',
  'CustomEvent',
  'MutationObserver',
  'getComputedStyle',
]) {
  Object.defineProperty(g, k, { value: (w as Record<string, unknown>)[k], configurable: true, writable: true });
}
g.requestAnimationFrame = (cb: (t: number) => void) => setTimeout(() => cb(Date.now()), 16);
g.cancelAnimationFrame = (id: ReturnType<typeof setTimeout>) => clearTimeout(id);
const fakeMatchMedia = () => ({
  matches: false,
  media: '',
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
});
g.matchMedia = fakeMatchMedia;
(w as Record<string, unknown>).matchMedia = fakeMatchMedia;
g.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
(w as Record<string, unknown>).ResizeObserver = g.ResizeObserver;
g.IS_REACT_ACT_ENVIRONMENT = true;

/** In-process BroadcastChannel: delivers to every *other* instance on the name (like browsers). */
class FakeBroadcastChannel {
  static registry = new Map<string, Set<FakeBroadcastChannel>>();
  onmessage: ((ev: { data: unknown }) => void) | null = null;
  constructor(public readonly name: string) {
    if (!FakeBroadcastChannel.registry.has(name)) FakeBroadcastChannel.registry.set(name, new Set());
    FakeBroadcastChannel.registry.get(name)!.add(this);
  }
  postMessage(data: unknown) {
    for (const other of FakeBroadcastChannel.registry.get(this.name) ?? []) {
      if (other !== this) queueMicrotask(() => other.onmessage?.({ data }));
    }
  }
  close() {
    FakeBroadcastChannel.registry.get(this.name)?.delete(this);
  }
}
Object.defineProperty(g, 'BroadcastChannel', { value: FakeBroadcastChannel, configurable: true, writable: true });
(w as Record<string, unknown>).BroadcastChannel = FakeBroadcastChannel;

/** Count API calls; history is 503 (no vendor key) so the chart never mounts a canvas. */
const apiCalls: Record<string, number> = {};
g.fetch = async (input: RequestInfo | URL) => {
  const url = String(input instanceof Request ? input.url : input);
  const p = url.replace(/^https?:\/\/[^/]+/, '').split('?')[0];
  apiCalls[p] = (apiCalls[p] ?? 0) + 1;
  if (p === '/api/quotes') {
    const u = new URL(url, 'http://localhost');
    const quotes: Record<string, unknown> = {};
    for (const s of (u.searchParams.get('symbols') ?? '').split(',').filter(Boolean)) {
      quotes[s] = { close: '100.5', percent_change: '0.5', volume: '10' };
    }
    return new Response(JSON.stringify({ quotes }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  return new Response(JSON.stringify({ error: 'Data Unavailable' }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  });
};

const React = await import('react');
const { act } = React;
const { createRoot } = await import('react-dom/client');
const { useRetailIntelligence } = await import('../src/components/desks/retail/useRetailIntelligence.ts');
const { ChartSymbolSearch } = await import('../src/components/charts/ChartSymbolSearch.tsx');
const deskMod = await import('../src/components/desks/neuro/NeurodivergentDashboard.tsx');
const NeurodivergentDashboard = deskMod.default;
const { useDeskMonitorSync, DESK_MONITOR_TAB_ID } = await import('../src/hooks/useDeskMonitorSync.ts');
const { DESK_MONITOR_CHANNEL } = await import('../src/lib/deskMonitorTree.ts');

const settle = async (ms = 60) => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
};

function typeInto(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new w.Event('input', { bubbles: true }));
}

// Hard cap: a regression would otherwise spin forever inside act().
const RENDER_CAP = 500;

// ---------------------------------------------------------------------------
// Test 1 — hook: fetch-all runs once on mount and once per real symbol change,
// never on unrelated parent re-renders, even with an inline {} argument.
// ---------------------------------------------------------------------------
{
  let hookRenders = 0;
  let rerender: (() => void) | null = null;
  let setSymbolExt: ((s: string) => void) | null = null;
  const NO_POLL = {
    pollWorkspace: false,
    pollRibbon: false,
    pollWatchlist: false,
    pollMovers: false,
    pollNews: false,
    pollEcon: false,
    pollFundamentals: false,
  };
  const EMPTY: string[] = [];

  function HookProbe({ symbol }: { symbol: string }) {
    hookRenders += 1;
    if (hookRenders > RENDER_CAP) throw new Error(`useRetailIntelligence render loop: ${hookRenders} renders`);
    // Worst case on purpose: inline {} and inline options object each render.
    const intel = useRetailIntelligence(symbol, '1h', EMPTY, 1, {}, undefined, { ...NO_POLL });
    return React.createElement('span', null, intel.candleError ?? 'ok');
  }
  function HookParent() {
    const [, setTick] = React.useState(0);
    const [symbol, setSymbol] = React.useState('BTCUSD');
    rerender = () => setTick((t) => t + 1);
    setSymbolExt = setSymbol;
    return React.createElement(HookProbe, { symbol });
  }

  const host = w.document.createElement('div');
  w.document.body.appendChild(host);
  const hookRoot = createRoot(host);
  await act(async () => {
    hookRoot.render(React.createElement(HookParent));
  });
  await settle();
  const historyAfterMount = apiCalls['/api/market/history'] ?? 0;
  assert.equal(historyAfterMount, 1, `history fetched ${historyAfterMount}x on mount (want 1)`);
  const rendersAfterMount = hookRenders;
  assert.ok(rendersAfterMount <= 4, `hook probe rendered ${rendersAfterMount}x on mount (want <= 4)`);

  for (let i = 0; i < 5; i++) {
    await act(async () => {
      rerender?.();
    });
  }
  await settle();
  assert.equal(apiCalls['/api/market/history'], 1, 'unrelated parent re-renders must not refetch history');
  assert.ok(
    hookRenders <= rendersAfterMount + 5,
    `5 parent re-renders caused ${hookRenders - rendersAfterMount} probe renders (want <= 5)`,
  );

  await act(async () => {
    setSymbolExt?.('ETHUSD');
  });
  await settle();
  assert.equal(apiCalls['/api/market/history'], 2, 'a real symbol change must fetch history exactly once more');

  await act(async () => {
    hookRoot.unmount();
  });
  host.remove();
  console.log(`hook: mount renders=${rendersAfterMount}, total=${hookRenders}, history fetches=2 — ok`);
}

// ---------------------------------------------------------------------------
// Test 2 — search input isolation: typing must not reach a memoised parent.
// ---------------------------------------------------------------------------
{
  let parentRenders = 0;
  function SearchParent() {
    parentRenders += 1;
    if (parentRenders > RENDER_CAP) throw new Error('ChartSymbolSearch parent render loop');
    const [symbol, setSymbol] = React.useState('BTCUSD');
    const onSubmit = React.useCallback((raw: string) => setSymbol(raw.toUpperCase()), []);
    return React.createElement(ChartSymbolSearch, { onSubmit, activeSymbol: symbol, placeholder: 'probe' });
  }
  const host = w.document.createElement('div');
  w.document.body.appendChild(host);
  const searchRoot = createRoot(host);
  await act(async () => {
    searchRoot.render(React.createElement(SearchParent));
  });
  const input = host.querySelector('input[placeholder="probe"]') as HTMLInputElement | null;
  assert.ok(input, 'search input rendered');
  const before = parentRenders;
  await act(async () => {
    typeInto(input!, 'E');
  });
  await settle();
  assert.equal(input!.value, 'E');
  assert.equal(parentRenders, before, `typing re-rendered the memoised parent ${parentRenders - before}x`);
  await act(async () => {
    searchRoot.unmount();
  });
  host.remove();
  console.log('search input: keystroke isolated from parent — ok');
}

// ---------------------------------------------------------------------------
// Test 3 — the real desk: one keystroke into SEARCH ASSET renders the desk
// component <= 3 times (React Profiler onRender counts commits of this tree).
// ---------------------------------------------------------------------------
{
  let deskCommits = 0;
  const onRender = () => {
    deskCommits += 1;
    if (deskCommits > RENDER_CAP) throw new Error(`Neurodivergent desk render loop: ${deskCommits} commits`);
  };
  const host = w.document.getElementById('root')!;
  const deskRoot = createRoot(host);
  await act(async () => {
    deskRoot.render(
      React.createElement(
        React.Profiler,
        { id: 'neuro-desk', onRender },
        React.createElement(NeurodivergentDashboard),
      ),
    );
  });
  await settle(150);
  const commitsAtLoad = deskCommits;
  assert.ok(commitsAtLoad <= 12, `desk committed ${commitsAtLoad}x at load (want <= 12; loop was thousands)`);

  const search = host.querySelector('input[placeholder^="Search BTC"]') as HTMLInputElement | null;
  assert.ok(search, 'SEARCH ASSET input present on the desk');
  const beforeKey = deskCommits;
  await act(async () => {
    typeInto(search!, 'E');
  });
  await settle(100);
  assert.equal(search!.value, 'E');
  const perKey = deskCommits - beforeKey;
  assert.ok(perKey <= 3, `one keystroke committed the desk ${perKey}x (want <= 3)`);

  // LOAD still swaps the symbol (submit path unchanged).
  const form = search!.closest('form')!;
  await act(async () => {
    typeInto(search!, 'ETHUSD');
    form.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
  });
  await settle(100);
  assert.match(host.textContent ?? '', /ETHUSD/);

  await act(async () => {
    deskRoot.unmount();
  });
  console.log(`desk: commits at load=${commitsAtLoad}, per keystroke=${perKey} — ok`);
}

// ---------------------------------------------------------------------------
// Test 4 — BroadcastChannel sync: a foreign tab's change applies once; our own
// broadcast echoed back (same-tab delivery) is dropped — no ping-pong.
// ---------------------------------------------------------------------------
{
  let symbolSets = 0;
  let currentSymbol = 'BTCUSD';
  function SyncProbe() {
    const [symbol, setSymbolRaw] = React.useState('BTCUSD');
    const [timeframe, setTimeframe] = React.useState('1h');
    const setSymbol = React.useCallback((s: string) => {
      symbolSets += 1;
      setSymbolRaw(s);
    }, []);
    currentSymbol = symbol;
    useDeskMonitorSync('neurodivergent', symbol, timeframe, setSymbol, setTimeframe);
    return React.createElement('i', null, `${symbol}:${timeframe}`);
  }
  w.localStorage.clear(); // drop the desk test's snapshot so hydration is a no-op
  const foreign = new FakeBroadcastChannel(DESK_MONITOR_CHANNEL);
  const seen: Array<Record<string, unknown>> = [];
  foreign.onmessage = (ev) => seen.push(ev.data as Record<string, unknown>);

  const host = w.document.createElement('div');
  w.document.body.appendChild(host);
  const syncRoot = createRoot(host);
  await act(async () => {
    syncRoot.render(React.createElement(SyncProbe));
  });
  await settle(20);
  assert.equal(seen.length, 1, 'mount broadcasts one snapshot');
  assert.equal(seen[0].origin, DESK_MONITOR_TAB_ID, 'outgoing snapshot carries this tab id');

  await act(async () => {
    foreign.postMessage({ deskId: 'neurodivergent', symbol: 'ETHUSD', timeframe: '1h', at: Date.now(), origin: 'other-tab' });
  });
  await settle(20);
  assert.equal(currentSymbol, 'ETHUSD', 'foreign tab change applied');
  assert.equal(symbolSets, 1, 'applied exactly once');
  assert.equal(seen.length, 2, 're-broadcast once after applying');

  // Echo our own snapshot back (this is what the browser does to a same-tab listener).
  await act(async () => {
    foreign.postMessage({ ...seen[1], symbol: 'BTCUSD' });
  });
  await settle(20);
  assert.equal(currentSymbol, 'ETHUSD', 'own-origin message must be ignored');
  assert.equal(symbolSets, 1, 'no ping-pong');
  assert.equal(seen.length, 2, 'ignored messages produce no further broadcasts');

  foreign.close();
  await act(async () => {
    syncRoot.unmount();
  });
  host.remove();
  console.log('desk monitor sync: foreign change applied once, own echo dropped — ok');
}

console.log('neuro-desk-render-loop.selftest: ok');
process.exit(0);
