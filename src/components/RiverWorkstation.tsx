import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle, XCircle, AlertTriangle, Zap, FileCode, Waves, Cpu, Trash2 } from 'lucide-react';
import {
  compilePine,
  RiverCompileSuccess,
  setActiveRiverIndicator,
  getActiveRiverIndicator,
  clearActiveRiverIndicator,
} from '../river/riverEngine';
import { buildCompatibilityReport, formatCompatSummary, type CompatibilityReport } from '../river/compat/report';
import { getLocalHints } from '../river/assist/localHints';
import { suggestPineMigration } from '../river/assist/pineMigrator';
import { checkCompilerUpdate } from '../river/compiler/updateChecker';
import { saveToCatalog, entryFromActive, publishToPublicCatalog } from '../river/catalog';
import { saveToPrivateVault } from '../river/storage/privateCatalog';
import type { Value } from '../river/pine/interpreter';
import RiverCatalogPanel from './RiverCatalogPanel';
import RiverGeniePanel from './RiverGeniePanel';
import RiverHero from './RiverHero';
import { RIVER_PAGE_CONTENT } from '../river/marketing/riverPageContent';

type WorkflowStep = 'upload' | 'compiling' | 'compiled' | 'failed' | 'applied';

interface RiverState {
  step: WorkflowStep;
  rawSource: string;
  fileName: string;
  compiled: RiverCompileSuccess | null;
  errorMessage: string;
  errorLine: number | null;
  inputValues: Record<string, Value>;
  compat: CompatibilityReport | null;
  hints: string[];
}

const INITIAL_STATE: RiverState = {
  step: 'upload',
  rawSource: '',
  fileName: '',
  compiled: null,
  errorMessage: '',
  errorLine: null,
  inputValues: {},
  compat: null,
  hints: [],
};

// A real UT Bot-style ATR trailing stop indicator — the classic "Gold Bar"
// pattern — so users can see The River working before pasting their own code.
const EXAMPLE_SCRIPT = `//@version=5
indicator("Gold Bar — ATR Trailing Stop", overlay=true)
a = input.float(1.0, title="Sensitivity")
c = input.int(10, title="ATR Period")
xATR = ta.atr(c)
nLoss = a * xATR
src = close
var float xATRTrailingStop = na
xATRTrailingStop := if src > nz(xATRTrailingStop[1], 0) and src[1] > nz(xATRTrailingStop[1], 0)
    math.max(nz(xATRTrailingStop[1]), src - nLoss)
else if src < nz(xATRTrailingStop[1], 0) and src[1] < nz(xATRTrailingStop[1], 0)
    math.min(nz(xATRTrailingStop[1]), src + nLoss)
else if src > nz(xATRTrailingStop[1], 0)
    src - nLoss
else
    src + nLoss
buy = src > xATRTrailingStop and src[1] <= nz(xATRTrailingStop[1], 0)
sell = src < xATRTrailingStop and src[1] >= nz(xATRTrailingStop[1], 0)
plot(xATRTrailingStop, title="Trailing Stop", color=color.orange, linewidth=2)
plotshape(buy, title="Buy", style=shape.labelup, location=location.belowbar, color=color.green, text="Buy")
plotshape(sell, title="Sell", style=shape.labeldown, location=location.abovebar, color=color.red, text="Sell")
barcolor(buy or sell ? #FFD700 : na)
alertcondition(buy, title="Long Signal", message="Gold Bar: Long")
alertcondition(sell, title="Short Signal", message="Gold Bar: Short")
`;

export default function RiverWorkstation() {
  const [state, setState] = useState<RiverState>(INITIAL_STATE);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeName, setActiveName] = useState<string | null>(() => getActiveRiverIndicator()?.name ?? null);
  const [catalogRefresh, setCatalogRefresh] = useState(0);
  const [compilerNote, setCompilerNote] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    const onUpdate = (e: any) => setActiveName(e?.detail?.name ?? null);
    window.addEventListener('river-indicator-updated', onUpdate);
    return () => window.removeEventListener('river-indicator-updated', onUpdate);
  }, []);

  useEffect(() => {
    checkCompilerUpdate().then(({ updateAvailable, remote }) => {
      if (updateAvailable && remote) {
        setCompilerNote(`River compiler ${remote.version} available (you have ${remote.channel}).`);
      }
    }).catch(() => { /* offline */ });
  }, []);

  const processSource = useCallback((source: string, fileName: string, autoApply = false) => {
    setState(s => ({ ...s, step: 'compiling', rawSource: source, fileName }));
    setTimeout(() => {
      const compat = buildCompatibilityReport(source);
      const result = compilePine(source);
      if (result.status === "ok") {
        const inputValues: Record<string, Value> = {};
        result.inputs.forEach(inp => { inputValues[inp.id] = inp.value; });
        if (autoApply) {
          setActiveRiverIndicator({
            name: fileName || `${result.title}.pine`,
            source,
            inputs: inputValues,
          });
        }
        setState(s => ({
          ...s,
          step: autoApply ? 'applied' : 'compiled',
          compiled: result,
          inputValues,
          errorMessage: '',
          errorLine: null,
          compat,
          hints: getLocalHints(source, '', compat.issues),
        }));
      } else {
        const { error, line } = result;
        setState(s => ({
          ...s,
          step: 'failed',
          compiled: null,
          errorMessage: error,
          errorLine: line,
          compat,
          hints: getLocalHints(source, error, compat.issues),
        }));
      }
    }, 30);
  }, []);

  const processFile = useCallback(async (file: File) => {
    try {
      const source = await file.text();
      if (!source.trim()) {
        setState(s => ({ ...s, step: 'failed', errorMessage: 'The file appears to be empty.', errorLine: null }));
        return;
      }
      processSource(source, file.name);
    } catch {
      setState(s => ({ ...s, step: 'failed', errorMessage: 'Could not read the file. Try pasting your code directly.', errorLine: null }));
    }
  }, [processSource]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const applyToCharts = useCallback(() => {
    setState(s => {
      if (!s.compiled) return s;
      setActiveRiverIndicator({
        name: s.fileName || `${s.compiled.title}.pine`,
        source: s.rawSource,
        inputs: s.inputValues,
      });
      return { ...s, step: 'applied' };
    });
  }, []);

  const removeFromCharts = useCallback(() => {
    clearActiveRiverIndicator();
    setActiveName(null);
  }, []);

  const reset = useCallback(() => {
    setSaveStatus('');
    setState(INITIAL_STATE);
  }, []);

  const runMigration = useCallback(() => {
    const { migrated, changes } = suggestPineMigration(state.rawSource);
    if (changes.length === 0) return;
    processSource(migrated, state.fileName.replace(/\.pine$/i, '') + '-migrated.pine');
  }, [state.rawSource, state.fileName, processSource]);

  const saveLocal = useCallback(() => {
    if (!state.compiled) return;
    saveToCatalog(entryFromActive(
      { name: state.fileName || `${state.compiled.title}.pine`, source: state.rawSource, inputs: state.inputValues },
      { author: 'You', source: 'local', version: state.compiled.version, tags: ['local'] },
    ));
    setCatalogRefresh(n => n + 1);
    setSaveStatus('Saved to local catalog.');
  }, [state]);

  const savePublic = useCallback(async () => {
    if (!state.compiled) return;
    setSaveStatus('');
    try {
      await publishToPublicCatalog({
        name: state.compiled.title,
        author: 'Community',
        description: `Imported via The River — Pine v${state.compiled.version}`,
        pineSource: state.rawSource,
        pineVersion: state.compiled.version,
        tags: ['community'],
      });
      setCatalogRefresh(n => n + 1);
      setSaveStatus('Published to public catalog.');
    } catch (e: any) {
      setSaveStatus(e?.message || 'Publish failed.');
    }
  }, [state]);

  const savePrivate = useCallback(async () => {
    if (!state.compiled) return;
    setSaveStatus('');
    try {
      await saveToPrivateVault({
        name: state.compiled.title,
        description: `Private vault — Pine v${state.compiled.version}`,
        pineSource: state.rawSource,
        pineVersion: state.compiled.version,
        tags: ['private'],
      });
      setCatalogRefresh(n => n + 1);
      setSaveStatus('Saved to your private vault.');
    } catch (e: any) {
      setSaveStatus(e?.message || 'Private save failed.');
    }
  }, [state]);

  const genieContext = {
    rawSource: state.rawSource,
    fileName: state.fileName,
    step: state.step,
    compileError: state.errorMessage,
    errorLine: state.errorLine,
    compat: state.compat,
    hints: state.hints,
    activeIndicatorName: activeName,
    compiledTitle: state.compiled?.title ?? null,
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono p-4 md:p-8" id="river-terminal-workstation">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start">
        <div>
      <RiverHero />

      <div className="mb-8 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <Waves size={28} className="text-[#00D9FF]" />
          <h1 className="text-2xl font-black tracking-tight uppercase text-white">Workstation</h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20 uppercase tracking-widest">Compile · Apply · Catalog</span>
        </div>
        <p className="text-sm text-white/40 max-w-xl">
          {RIVER_PAGE_CONTENT.discovery.subtitle}
        </p>
        {activeName && (
          <div className="mt-4 flex items-center gap-3 text-xs bg-[#FFD700]/5 border border-[#FFD700]/20 rounded-xl px-4 py-2.5 max-w-xl">
            <Cpu size={14} className="text-[#FFD700] shrink-0" />
            <span className="text-white/60">Running on charts now:</span>
            <span className="text-[#FFD700] font-bold truncate">{activeName}</span>
            <button onClick={removeFromCharts} className="ml-auto flex items-center gap-1 text-white/40 hover:text-red-400 transition-colors shrink-0" title="Remove from charts">
              <Trash2 size={12} /> Remove
            </button>
          </div>
        )}
        {compilerNote && (
          <p className="mt-3 text-xs text-[#00D9FF]/70 max-w-xl">{compilerNote}</p>
        )}
      </div>

      <AnimatePresence mode="wait">

        {(state.step === 'upload' || state.step === 'compiling') && (
          <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${isDragOver ? 'border-[#00D9FF] bg-[#00D9FF]/5' : 'border-white/10 hover:border-white/20'}`}
            >
              <Upload size={40} className="mx-auto mb-4 text-white/20" />
              <p className="text-white/60 mb-2">Drop your Pine Script file here</p>
              <p className="text-white/30 text-xs mb-6">.pine or .txt — v4, v5 or v6</p>
              <label className="px-6 py-2.5 bg-[#00D9FF]/10 border border-[#00D9FF]/30 text-[#00D9FF] rounded-xl text-sm cursor-pointer hover:bg-[#00D9FF]/20 transition-all">
                Browse Files
                <input type="file" accept=".pine,.txt" className="hidden" onChange={handleFileInput} />
              </label>
            </div>

            <PastePanel
              onSubmit={src => processSource(src, 'pasted-code.pine')}
              onLoadExample={() => processSource(EXAMPLE_SCRIPT, 'gold-bar-atr-trailing-stop.pine')}
            />

            {state.step === 'compiling' && (
              <div className="flex items-center gap-3 text-[#00D9FF] text-sm">
                <div className="w-4 h-4 border-2 border-[#00D9FF] border-t-transparent rounded-full animate-spin" />
                Tokenizing, parsing and test-running your script...
              </div>
            )}
          </motion.div>
        )}

        {state.step === 'compiled' && state.compiled && (
          <motion.div key="compiled" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <CheckCircle size={20} className="text-green-400 shrink-0" />
              <div>
                <p className="text-green-400 font-bold text-sm uppercase tracking-wider">Compiled Successfully</p>
                <p className="text-white/60 text-xs mt-0.5">
                  "{state.compiled.title}" — Pine v{state.compiled.version} · {state.compiled.overlay ? 'price overlay' : 'separate pane'} ·{' '}
                  {state.compiled.stats.tokens.toLocaleString()} tokens → {state.compiled.stats.statements} statements
                </p>
              </div>
              <span className="ml-auto text-xs text-white/30">{state.fileName}</span>
            </div>

            {state.compiled.inputs.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FileCode size={16} className="text-[#00D9FF]" />
                  <span className="text-xs text-white/40 uppercase tracking-wider">Script Inputs — edit before applying</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {state.compiled.inputs.map(input => (
                    <label key={input.id} className="bg-black/40 rounded-lg p-3 border border-white/5 block">
                      <span className="text-white/30 text-xs uppercase tracking-wider mb-1 block truncate" title={input.title}>{input.title}</span>
                      {input.type === 'bool' ? (
                        <input
                          type="checkbox"
                          checked={!!state.inputValues[input.id]}
                          onChange={e => setState(s => ({ ...s, inputValues: { ...s.inputValues, [input.id]: e.target.checked } }))}
                          className="w-4 h-4 rounded mt-1"
                        />
                      ) : input.type === 'int' || input.type === 'float' ? (
                        <input
                          type="number"
                          step={input.type === 'int' ? 1 : 0.1}
                          value={Number(state.inputValues[input.id] ?? 0)}
                          onChange={e => {
                            const v = input.type === 'int' ? parseInt(e.target.value) : parseFloat(e.target.value);
                            setState(s => ({ ...s, inputValues: { ...s.inputValues, [input.id]: Number.isFinite(v) ? v : input.defval } }));
                          }}
                          className="w-full bg-transparent border-b border-white/10 text-white font-bold text-sm focus:outline-none focus:border-[#00D9FF]/50 py-0.5"
                        />
                      ) : (
                        <span className="text-white font-bold text-sm block truncate">{String(state.inputValues[input.id] ?? input.defval ?? '—')}</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {state.compiled.warnings.length > 0 && (
              <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-5">
                <p className="text-yellow-400/70 text-xs uppercase tracking-wider mb-2">Honest notes about this script:</p>
                <div className="space-y-1">
                  {state.compiled.warnings.map((w, i) => (
                    <p key={i} className="text-yellow-500/60 text-xs font-mono bg-yellow-500/5 px-2 py-1 rounded">{w}</p>
                  ))}
                </div>
              </div>
            )}

            {state.compat && <CompatReportPanel report={state.compat} />}

            <div className="flex flex-wrap gap-2">
              <button onClick={saveLocal} className="px-4 py-2 bg-white/5 border border-white/10 text-white/70 rounded-lg text-xs hover:bg-white/10">
                Save Local
              </button>
              <button onClick={savePublic} className="px-4 py-2 bg-[#00D9FF]/10 border border-[#00D9FF]/30 text-[#00D9FF] rounded-lg text-xs hover:bg-[#00D9FF]/20">
                Publish Public
              </button>
              <button onClick={savePrivate} className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-lg text-xs hover:bg-purple-500/20">
                Save to Vault
              </button>
            </div>
            {saveStatus && <p className="text-xs text-white/50">{saveStatus}</p>}

            <div className="flex gap-3">
              <button onClick={applyToCharts} className="flex-1 py-3 bg-[#FFD700] text-black font-black uppercase tracking-widest rounded-xl hover:bg-[#FFE44D] transition-all active:scale-95">
                Apply to All Charts
              </button>
              <button onClick={reset} className="px-6 py-3 bg-white/5 border border-white/10 text-white/50 rounded-xl hover:bg-white/10 transition-all">
                Upload Different File
              </button>
            </div>

            <RiverCatalogPanel refreshToken={catalogRefresh} onApplied={(name) => setActiveName(name)} />
          </motion.div>
        )}

        {state.step === 'applied' && (
          <motion.div key="applied" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-16">
            <div className="text-6xl mb-6">🥇</div>
            <h2 className="text-2xl font-black text-[#FFD700] mb-3 uppercase tracking-wider">Indicator Live on Your Charts</h2>
            <p className="text-white/40 text-sm mb-8 max-w-md mx-auto">
              Your script is compiled and running bar-by-bar on real chart data. Open any chart and toggle
              <span className="text-[#FF007F] font-bold"> MINE </span>
              to see it — plots, buy/sell shapes and signal-colored candles included.
            </p>
            <button onClick={reset} className="px-8 py-3 bg-white/5 border border-white/10 text-white/50 rounded-xl hover:bg-white/10 transition-all">
              Import Another Indicator
            </button>
          </motion.div>
        )}

        {state.step === 'failed' && (
          <motion.div key="failed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="flex items-start gap-3 p-5 bg-red-500/10 border border-red-500/20 rounded-xl">
              {state.errorLine !== null ? <AlertTriangle size={20} className="text-yellow-400 shrink-0 mt-0.5" /> : <XCircle size={20} className="text-red-400 shrink-0 mt-0.5" />}
              <div className="flex-1">
                <p className={`font-bold text-sm uppercase tracking-wider mb-2 ${state.errorLine !== null ? 'text-yellow-400' : 'text-red-400'}`}>
                  {state.errorLine !== null ? `Problem on line ${state.errorLine}` : 'Could Not Compile'}
                </p>
                <p className="text-white/50 text-sm whitespace-pre-line">{state.errorMessage}</p>
                {state.errorLine !== null && state.rawSource && (
                  <SourceContext source={state.rawSource} line={state.errorLine} />
                )}
              </div>
            </div>

            {state.compat && <CompatReportPanel report={state.compat} />}

            {state.hints.length > 0 && (
              <div className="bg-[#00D9FF]/5 border border-[#00D9FF]/20 rounded-xl p-5">
                <p className="text-[#00D9FF] text-xs uppercase tracking-wider mb-2">Local assist — try these fixes</p>
                <ul className="space-y-1">
                  {state.hints.map((h, i) => (
                    <li key={i} className="text-white/50 text-xs">{h}</li>
                  ))}
                </ul>
                <button onClick={runMigration} className="mt-3 px-4 py-2 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] rounded-lg text-xs hover:bg-[#FFD700]/20">
                  Auto-migrate v4 patterns
                </button>
              </div>
            )}

            <button onClick={reset} className="w-full py-3 bg-white/5 border border-white/10 text-white/50 rounded-xl hover:bg-white/10 transition-all">
              Try a Different File
            </button>
          </motion.div>
        )}

      </AnimatePresence>
        </div>

        <div className="xl:sticky xl:top-4">
          <RiverGeniePanel
            context={genieContext}
            onUseCode={(source, fileName) => processSource(source, fileName || 'river-genie.pine')}
            onCompileAndApply={(source, fileName) => processSource(source, fileName || 'river-genie.pine', true)}
          />
        </div>
      </div>
    </div>
  );
}

/** Shows the offending line and its neighbors so failures are actionable. */
function SourceContext({ source, line }: { source: string; line: number }) {
  const lines = source.split('\n');
  const start = Math.max(0, line - 3);
  const end = Math.min(lines.length, line + 2);
  return (
    <div className="mt-3 space-y-0.5">
      {lines.slice(start, end).map((text, i) => {
        const n = start + i + 1;
        const isBad = n === line;
        return (
          <p key={n} className={`text-xs font-mono px-2 py-0.5 rounded ${isBad ? 'bg-red-500/20 text-red-300' : 'text-white/30'}`}>
            <span className="inline-block w-8 text-right mr-3 opacity-50">{n}</span>{text}
          </p>
        );
      })}
    </div>
  );
}

/** Full compatibility report — all issues, not just the first error. */
function CompatReportPanel({ report }: { report: CompatibilityReport }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <p className="text-xs text-white/40 uppercase tracking-wider mb-2">
        Compatibility report · {formatCompatSummary(report)}
      </p>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {report.issues.map((issue, i) => (
          <div
            key={`${issue.code}-${issue.line}-${i}`}
            className={`text-xs font-mono px-2 py-1 rounded border ${
              issue.severity === 'error'
                ? 'bg-red-500/10 border-red-500/20 text-red-300'
                : issue.severity === 'warning'
                  ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300/80'
                  : 'bg-white/5 border-white/5 text-white/40'
            }`}
          >
            {issue.line ? `L${issue.line}: ` : ''}{issue.message}
            {issue.hint && <span className="block text-white/30 mt-0.5">{issue.hint}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function PastePanel({ onSubmit, onLoadExample }: { onSubmit: (source: string) => void; onLoadExample: () => void }) {
  const [text, setText] = useState('');
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Or paste your Pine Script directly</p>
      <textarea value={text} onChange={e => setText(e.target.value)}
        placeholder={`//@version=5\nindicator("My Indicator", overlay=true)\n// paste your code here...`}
        className="w-full h-36 bg-black/40 border border-white/10 rounded-lg p-3 text-white/70 text-xs font-mono resize-none focus:outline-none focus:border-[#00D9FF]/30 placeholder:text-white/20" />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button onClick={() => onSubmit(text)} disabled={!text.trim()}
          className="px-5 py-2 bg-[#00D9FF]/10 border border-[#00D9FF]/30 text-[#00D9FF] rounded-lg text-sm hover:bg-[#00D9FF]/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
          Compile Code
        </button>
        <button onClick={onLoadExample}
          className="px-5 py-2 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] rounded-lg text-sm hover:bg-[#FFD700]/20 transition-all flex items-center gap-1.5"
          id="river_load_example_btn">
          <Zap size={13} /> Try the Gold Bar example
        </button>
      </div>
    </div>
  );
}
