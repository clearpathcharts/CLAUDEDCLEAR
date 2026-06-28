import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle, XCircle, AlertTriangle, Zap, BarChart2, FileCode, Waves } from 'lucide-react';
import { recognizePineScript, RecognitionResult } from '../river/pineRecognizer';
import { calculateGoldBar, GOLD_BAR_DEFAULTS, GoldBarParams } from '../river/goldBarIndicator';

type WorkflowStep = 'upload' | 'recognizing' | 'recognized' | 'failed' | 'applied';

interface RiverState {
  step: WorkflowStep;
  rawSource: string;
  fileName: string;
  recognition: RecognitionResult | null;
  errorMessage: string;
  goldBarParams: GoldBarParams;
}

const INITIAL_STATE: RiverState = {
  step: 'upload',
  rawSource: '',
  fileName: '',
  recognition: null,
  errorMessage: '',
  goldBarParams: { ...GOLD_BAR_DEFAULTS },
};

const PLATFORM_LABELS: Record<string, string> = {
  atr_trailing_stop: 'ATR Trailing Stop / Gold Bar Pattern',
};

const UNRECOGNIZED_MESSAGE = `The River currently supports Pine Script v4/v5 indicators built around ATR-based trailing stop logic.

If your indicator uses a different pattern (RSI crossovers, MACD, Bollinger Bands, etc.), support for those is being added. The River will tell you exactly what it found and what it didn't — no fake success messages.`;

export default function RiverWorkstation() {
  const [state, setState] = useState<RiverState>(INITIAL_STATE);
  const [isDragOver, setIsDragOver] = useState(false);

  const processSource = useCallback((source: string, fileName: string) => {
    setState(s => ({ ...s, step: 'recognizing', rawSource: source, fileName }));
    try {
      const recognition = recognizePineScript(source);
      setState(s => ({
        ...s,
        step: recognition.patternMatched ? 'recognized' : 'failed',
        recognition,
        errorMessage: recognition.patternMatched ? '' : UNRECOGNIZED_MESSAGE,
      }));
    } catch (err: any) {
      setState(s => ({ ...s, step: 'failed', errorMessage: `Recognition error: ${err?.message || 'Unknown error'}` }));
    }
  }, []);

  const processFile = useCallback(async (file: File) => {
    try {
      const source = await file.text();
      if (!source.trim()) {
        setState(s => ({ ...s, step: 'failed', errorMessage: 'The file appears to be empty.' }));
        return;
      }
      processSource(source, file.name);
    } catch {
      setState(s => ({ ...s, step: 'failed', errorMessage: 'Could not read the file. Try pasting your code directly.' }));
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
    setState(s => ({ ...s, step: 'applied' }));
  }, []);

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono p-4 md:p-8">
      <div className="mb-8 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <Waves size={28} className="text-[#00D9FF]" />
          <h1 className="text-2xl font-black tracking-tight uppercase text-white">The River</h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20 uppercase tracking-widest">v1 — Pine Script</span>
        </div>
        <p className="text-sm text-white/40 max-w-xl">
          Bring your Pine Script indicator from TradingView. The River reads it, tells you what it found honestly, and wires real math into your ClearPath charts.
        </p>
      </div>

      <AnimatePresence mode="wait">

        {(state.step === 'upload' || state.step === 'recognizing') && (
          <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${isDragOver ? 'border-[#00D9FF] bg-[#00D9FF]/5' : 'border-white/10 hover:border-white/20'}`}
            >
              <Upload size={40} className="mx-auto mb-4 text-white/20" />
              <p className="text-white/60 mb-2">Drop your Pine Script file here</p>
              <p className="text-white/30 text-xs mb-6">.pine or .txt — v4 or v5</p>
              <label className="px-6 py-2.5 bg-[#00D9FF]/10 border border-[#00D9FF]/30 text-[#00D9FF] rounded-xl text-sm cursor-pointer hover:bg-[#00D9FF]/20 transition-all">
                Browse Files
                <input type="file" accept=".pine,.txt" className="hidden" onChange={handleFileInput} />
              </label>
            </div>

            <PastePanel onSubmit={src => processSource(src, 'pasted-code.pine')} />

            {state.step === 'recognizing' && (
              <div className="flex items-center gap-3 text-[#00D9FF] text-sm">
                <div className="w-4 h-4 border-2 border-[#00D9FF] border-t-transparent rounded-full animate-spin" />
                Reading your script...
              </div>
            )}
          </motion.div>
        )}

        {state.step === 'recognized' && state.recognition && (
          <motion.div key="recognized" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <CheckCircle size={20} className="text-green-400 shrink-0" />
              <div>
                <p className="text-green-400 font-bold text-sm uppercase tracking-wider">Pattern Recognized</p>
                <p className="text-white/60 text-xs mt-0.5">{PLATFORM_LABELS[state.recognition.patternMatched!] || state.recognition.patternMatched}</p>
              </div>
              <span className="ml-auto text-xs text-white/30">{state.fileName}</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileCode size={16} className="text-[#00D9FF]" />
                <span className="text-xs text-white/40 uppercase tracking-wider">Extracted Parameters</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {state.recognition.inputs.map(input => (
                  <div key={input.name} className="bg-black/40 rounded-lg p-3 border border-white/5">
                    <p className="text-white/30 text-xs uppercase tracking-wider mb-1">{input.name}</p>
                    <p className="text-white font-bold">{String(input.value)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 size={16} className="text-[#FFD700]" />
                <span className="text-xs text-white/40 uppercase tracking-wider">What The River understood</span>
              </div>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex-1 bg-black/40 rounded-full h-2">
                  <div className="bg-[#FFD700] h-2 rounded-full transition-all" style={{ width: `${Math.round((state.recognition.recognizedLines / state.recognition.totalLines) * 100)}%` }} />
                </div>
                <span className="text-white/50 text-xs">{state.recognition.recognizedLines}/{state.recognition.totalLines} lines</span>
              </div>
              {state.recognition.unrecognizedSnippets.length > 0 && (
                <div className="mt-3">
                  <p className="text-white/30 text-xs uppercase tracking-wider mb-2">Lines not yet supported — shown honestly:</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {state.recognition.unrecognizedSnippets.map((line, i) => (
                      <p key={i} className="text-yellow-500/60 text-xs font-mono bg-yellow-500/5 px-2 py-1 rounded">{line}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#FFD700]/5 border border-[#FFD700]/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={16} className="text-[#FFD700]" />
                <span className="text-xs text-[#FFD700]/60 uppercase tracking-wider">Gold Bar Settings</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <label className="block">
                  <span className="text-white/30 text-xs uppercase tracking-wider block mb-1">Sensitivity</span>
                  <input type="number" min={0.1} max={5} step={0.1} value={state.goldBarParams.sensitivity}
                    onChange={e => setState(s => ({ ...s, goldBarParams: { ...s.goldBarParams, sensitivity: parseFloat(e.target.value) || 1 } }))}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FFD700]/40" />
                </label>
                <label className="block">
                  <span className="text-white/30 text-xs uppercase tracking-wider block mb-1">ATR Period</span>
                  <input type="number" min={2} max={50} step={1} value={state.goldBarParams.atrPeriod}
                    onChange={e => setState(s => ({ ...s, goldBarParams: { ...s.goldBarParams, atrPeriod: parseInt(e.target.value) || 10 } }))}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FFD700]/40" />
                </label>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={state.goldBarParams.useHeikinAshi}
                  onChange={e => setState(s => ({ ...s, goldBarParams: { ...s.goldBarParams, useHeikinAshi: e.target.checked } }))}
                  className="w-4 h-4 rounded" />
                <span className="text-white/50 text-sm">Use Heikin Ashi source (smooths signals)</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button onClick={applyToCharts} className="flex-1 py-3 bg-[#FFD700] text-black font-black uppercase tracking-widest rounded-xl hover:bg-[#FFE44D] transition-all active:scale-95">
                Apply Gold Bar to All Charts
              </button>
              <button onClick={reset} className="px-6 py-3 bg-white/5 border border-white/10 text-white/50 rounded-xl hover:bg-white/10 transition-all">
                Upload Different File
              </button>
            </div>
          </motion.div>
        )}

        {state.step === 'applied' && (
          <motion.div key="applied" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-16">
            <div className="text-6xl mb-6">🥇</div>
            <h2 className="text-2xl font-black text-[#FFD700] mb-3 uppercase tracking-wider">Gold Bar Active</h2>
            <p className="text-white/40 text-sm mb-8 max-w-md mx-auto">Running on every chart. Signal candles turn gold automatically.</p>
            <button onClick={reset} className="px-8 py-3 bg-white/5 border border-white/10 text-white/50 rounded-xl hover:bg-white/10 transition-all">
              Import Another Indicator
            </button>
          </motion.div>
        )}

        {state.step === 'failed' && (
          <motion.div key="failed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="flex items-start gap-3 p-5 bg-red-500/10 border border-red-500/20 rounded-xl">
              {state.recognition ? <AlertTriangle size={20} className="text-yellow-400 shrink-0 mt-0.5" /> : <XCircle size={20} className="text-red-400 shrink-0 mt-0.5" />}
              <div>
                <p className={`font-bold text-sm uppercase tracking-wider mb-2 ${state.recognition ? 'text-yellow-400' : 'text-red-400'}`}>
                  {state.recognition ? 'Pattern Not Yet Supported' : 'Could Not Read File'}
                </p>
                <p className="text-white/50 text-sm whitespace-pre-line">{state.errorMessage}</p>
              </div>
            </div>
            <button onClick={reset} className="w-full py-3 bg-white/5 border border-white/10 text-white/50 rounded-xl hover:bg-white/10 transition-all">
              Try a Different File
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

function PastePanel({ onSubmit }: { onSubmit: (source: string) => void }) {
  const [text, setText] = useState('');
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Or paste your Pine Script directly</p>
      <textarea value={text} onChange={e => setText(e.target.value)}
        placeholder={`//@version=5\nindicator("My Indicator", overlay=true)\n// paste your code here...`}
        className="w-full h-36 bg-black/40 border border-white/10 rounded-lg p-3 text-white/70 text-xs font-mono resize-none focus:outline-none focus:border-[#00D9FF]/30 placeholder:text-white/20" />
      <button onClick={() => onSubmit(text)} disabled={!text.trim()}
        className="mt-3 px-5 py-2 bg-[#00D9FF]/10 border border-[#00D9FF]/30 text-[#00D9FF] rounded-lg text-sm hover:bg-[#00D9FF]/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
        Analyze Code
      </button>
    </div>
  );
}
