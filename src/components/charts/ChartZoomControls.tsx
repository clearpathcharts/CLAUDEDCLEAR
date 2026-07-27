import React from 'react';
import type { IChartApi } from 'lightweight-charts';
import { Maximize2, Minus, Plus } from 'lucide-react';
import { resetChartZoom, zoomChartIn, zoomChartOut } from '../../lib/charts/chartZoom';

interface ChartZoomControlsProps {
  chartRef: React.RefObject<IChartApi | null>;
  className?: string;
}

/** Zoom in / out / reset — shared by every lightweight-charts instance. */
export function ChartZoomControls({ chartRef, className = 'flex-col' }: ChartZoomControlsProps) {
  const invoke = (action: (chart: IChartApi | null | undefined) => void) => {
    action(chartRef.current);
  };

  return (
    <div
      className={`pointer-events-auto flex gap-1 rounded-lg border border-white/15 bg-black/85 p-1 shadow-lg backdrop-blur-md ${className}`}
      aria-label="Chart zoom controls"
    >
      <button
        type="button"
        onClick={() => invoke(zoomChartIn)}
        aria-label="Zoom in"
        title="Zoom in"
        className="flex h-8 w-8 items-center justify-center rounded-md border border-[#00D9FF]/25 text-[#00D9FF] transition-all hover:border-[#00D9FF]/60 hover:bg-[#00D9FF]/10 active:scale-95"
      >
        <Plus size={14} strokeWidth={2.5} />
      </button>
      <button
        type="button"
        onClick={() => invoke(zoomChartOut)}
        aria-label="Zoom out"
        title="Zoom out"
        className="flex h-8 w-8 items-center justify-center rounded-md border border-[#00D9FF]/25 text-[#00D9FF] transition-all hover:border-[#00D9FF]/60 hover:bg-[#00D9FF]/10 active:scale-95"
      >
        <Minus size={14} strokeWidth={2.5} />
      </button>
      <button
        type="button"
        onClick={() => invoke(resetChartZoom)}
        aria-label="Reset zoom"
        title="Reset zoom (fit all candles)"
        className="flex h-8 w-8 items-center justify-center rounded-md border border-[#BF00FF]/25 text-[#BF00FF] transition-all hover:border-[#BF00FF]/60 hover:bg-[#BF00FF]/10 active:scale-95"
      >
        <Maximize2 size={13} strokeWidth={2.5} />
      </button>
    </div>
  );
}
