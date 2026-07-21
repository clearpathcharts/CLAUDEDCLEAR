import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Send, Code2, Play, Loader2 } from 'lucide-react';
import { useChartVision } from '../hooks/useChartVision';
import type { CompatibilityReport } from '../river/compat/report';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  pineCode?: string | null;
  suggestedFileName?: string | null;
}

export interface RiverGenieWorkstationContext {
  rawSource: string;
  fileName: string;
  step: string;
  compileError: string;
  errorLine: number | null;
  compat: CompatibilityReport | null;
  hints: string[];
  activeIndicatorName: string | null;
  compiledTitle: string | null;
}

const STORAGE_KEY = 'river_genie_messages';
const PRESETS = [
  'I want to build a custom indicator — help me describe it.',
  'I have Pine code from TradingView — what should I do next?',
  'Recommend a simple trend indicator I can run on ClearPath charts.',
  'Fix my compile error and rewrite the script.',
];

export default function RiverGeniePanel({
  context,
  onUseCode,
  onCompileAndApply,
}: {
  context: RiverGenieWorkstationContext;
  onUseCode: (source: string, fileName?: string) => void;
  onCompileAndApply: (source: string, fileName?: string) => void;
}) {
  const { mentorContext } = useChartVision();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch { /* storage full */ }
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content:
            "Hi — I'm River Genie. Want to build a special indicator? Paste code you already have, or describe what you want (signals, overlays, inputs). I'll write Pine Script you can compile and apply to every ClearPath chart.",
        },
      ]);
    }
  }, []);

  const send = useCallback(
    async (preset?: string) => {
      const question = (preset ?? input).trim();
      if (!question || loading) return;

      const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: question }];
      setMessages(nextMessages);
      setInput('');
      setLoading(true);

      try {
        const res = await fetch('/api/river/genie/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            question,
            userName: localStorage.getItem('cpt_buddy_username') || undefined,
            conversationHistory: nextMessages.slice(-16).map((m) => ({ role: m.role, content: m.content })),
            pineSource: context.rawSource || undefined,
            compileError: context.compileError || undefined,
            errorLine: context.errorLine,
            activeIndicatorName: context.activeIndicatorName || undefined,
            compatSummary: context.compat ? `${context.compat.score}% · ${context.compat.issues.length} issue(s)` : undefined,
            compatIssues: context.compat?.issues?.slice(0, 12),
            localHints: context.hints,
            chartContext: mentorContext || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Genie unavailable');

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.answer || 'Try rephrasing — what indicator do you want?',
            pineCode: data.pineCode,
            suggestedFileName: data.suggestedFileName,
          },
        ]);
      } catch (e: any) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: e?.message || 'Connection issue — try again in a moment.' },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages, context, mentorContext],
  );

  return (
    <div className="bg-gradient-to-b from-[#00D9FF]/5 to-transparent border border-[#00D9FF]/20 rounded-2xl flex flex-col h-full min-h-[420px]">
      <div className="px-4 py-3 border-b border-[#00D9FF]/10 flex items-center gap-2">
        <Sparkles size={18} className="text-[#00D9FF]" />
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-white">River Genie</h3>
          <p className="text-[10px] text-white/40">AI Pine co-pilot · build · fix · apply</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[360px]">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-xs leading-relaxed rounded-xl px-3 py-2 ${
              msg.role === 'user'
                ? 'bg-[#00D9FF]/10 border border-[#00D9FF]/20 text-white/90 ml-6'
                : 'bg-black/40 border border-white/5 text-white/70 mr-4'
            }`}
          >
            <p className="whitespace-pre-wrap">{msg.content}</p>
            {msg.pineCode && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onUseCode(msg.pineCode!, msg.suggestedFileName || 'river-genie.pine')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 text-[10px] uppercase tracking-wider"
                >
                  <Code2 size={12} /> Use in Workstation
                </button>
                <button
                  type="button"
                  onClick={() => onCompileAndApply(msg.pineCode!, msg.suggestedFileName || 'river-genie.pine')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FFD700]/15 border border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/25 text-[10px] uppercase tracking-wider font-bold"
                >
                  <Play size={12} /> Compile & Apply
                </button>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-[#00D9FF]/70 text-xs">
            <Loader2 size={14} className="animate-spin" /> Genie is drafting Pine...
          </div>
        )}
      </div>

      <div className="px-3 pb-2 flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => send(p)}
            disabled={loading}
            className="text-[10px] px-2 py-1 rounded-md bg-black/40 border border-white/5 text-white/45 hover:text-[#00D9FF] hover:border-[#00D9FF]/30 transition-colors text-left"
          >
            {p.length > 42 ? `${p.slice(0, 40)}…` : p}
          </button>
        ))}
      </div>

      <div className="p-3 border-t border-[#00D9FF]/10 flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Describe your indicator or paste a question..."
          rows={2}
          className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white resize-none focus:outline-none focus:border-[#00D9FF]/40 placeholder:text-white/25"
        />
        <button
          type="button"
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="self-end p-2.5 rounded-xl bg-[#00D9FF]/15 border border-[#00D9FF]/40 text-[#00D9FF] disabled:opacity-30 hover:bg-[#00D9FF]/25 transition-all"
          aria-label="Send to River Genie"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
