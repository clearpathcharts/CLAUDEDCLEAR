import React, { useEffect, useState } from 'react';
import { BookOpen, ChevronRight, X } from 'lucide-react';
import { EDUCATIONAL_DISCLAIMER, LITERACY_FOOTER } from '../../patterns/complianceCopy';

const TOUR_STORAGE_KEY = 'cp_rick_pattern_literacy_tour_v1';

const STEPS = [
  {
    title: 'Structure Read',
    body: 'The Structure Read line summarizes the strongest measured chart pattern on your open candles — label, resolution bias of that pattern class, and geometric fit %. It is literacy, not a trade call.',
  },
  {
    title: 'Lifecycle badges',
    body: 'Possible → Forming → Confirmed → Triggered describe geometry states on the chart. Confirmed means the structure is complete and respected. Triggered means price crossed a measured boundary. Never treat these as buy or sell instructions.',
  },
  {
    title: 'Methodology clocks',
    body: 'The 12-candle and 16-candle clocks count bars on your current timeframe after incomplete impulse legs — classic Rick Floyd pattern-recognition methodology for watching how structure develops.',
  },
  {
    title: 'Candle close timer',
    body: 'Candle close shows how long until the current bar is expected to finish. Use it to understand timing of structure updates — not as a signal to place an order.',
  },
  {
    title: 'Market structure state',
    body: 'Market structure state classifies the recent window as trending, ranging, volatile, or transition. It describes the chart environment for study — never a “risk-on buy” style recommendation.',
  },
  {
    title: 'Multi-timeframe agreement',
    body: 'MTF structure agreement compares pattern family and resolution bias across timeframes you have scanned. Agreement is educational confluence, not a stacked trade signal.',
  },
  {
    title: 'Ramp vs wall',
    body: 'A wedge is two ramps squeezing to a point. An ascending or descending triangle is one ramp hitting a flat wall. A falling wedge usually resolves up; a descending triangle usually resolves down. Study the pictures in Chart Shapes school before you trust a live label.',
  },
];

interface PatternLiteracyTourProps {
  open: boolean;
  onClose: () => void;
}

/** Rick Floyd 2-min pattern literacy tour — education only. */
export function PatternLiteracyTour({ open, onClose }: PatternLiteracyTourProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  if (!open) return null;

  const current = STEPS[step];
  const last = step >= STEPS.length - 1;

  const finish = () => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#FF1493]/40 bg-[#0a0014] p-5 font-mono shadow-[0_0_40px_rgba(255,20,147,0.25)]">
        <button
          type="button"
          onClick={finish}
          aria-label="Close literacy tour"
          className="absolute right-3 top-3 rounded-full border border-white/20 p-1.5 text-white/60 hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="mb-3 flex items-center gap-2 pr-8">
          <BookOpen size={16} className="text-[#FF1493]" />
          <span className="text-xs font-black uppercase tracking-wider text-white">
            Rick&apos;s pattern literacy tour
          </span>
          <span className="ml-auto text-[10px] text-[#BF00FF]">
            {step + 1}/{STEPS.length}
          </span>
        </div>

        <h3 className="mb-2 text-sm font-black text-[#FF1493]">{current.title}</h3>
        <p className="mb-4 text-xs leading-relaxed text-white/75">{current.body}</p>

        <p className="mb-1 text-[10px] text-white/40">{EDUCATIONAL_DISCLAIMER}</p>
        <p className="mb-4 text-[9px] leading-snug text-white/30">{LITERACY_FOOTER}</p>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white/60 disabled:opacity-30"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => {
              if (last) finish();
              else setStep((s) => s + 1);
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-[#FF1493]/50 bg-[#FF1493]/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-[#FF1493] hover:bg-[#FF1493]/25"
          >
            {last ? 'Done' : 'Next'}
            {!last && <ChevronRight size={12} />}
          </button>
        </div>
      </div>
    </div>
  );
}

export function shouldAutoOfferPatternLiteracyTour(): boolean {
  try {
    return localStorage.getItem(TOUR_STORAGE_KEY) !== '1';
  } catch {
    return false;
  }
}
