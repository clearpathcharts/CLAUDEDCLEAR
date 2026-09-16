import React from 'react';
import type { IChartApi } from 'lightweight-charts';
import {
  FoldHorizontal,
  FoldVertical,
  Minus,
  Plus,
  RotateCcw,
  UnfoldHorizontal,
  UnfoldVertical,
} from 'lucide-react';
import {
  resetChartZoom,
  scalePriceOnly,
  stretchTimeOnly,
  zoomChartIn,
  zoomChartOut,
} from '../../lib/charts/chartZoom';

interface ChartZoomControlsProps {
  chartRef: React.RefObject<IChartApi | null>;
  className?: string;
}

function AxisButton({
  label,
  title,
  onClick,
  children,
}: {
  label: string;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={title}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-[#00D9FF]/25 text-[#00D9FF] transition-all hover:border-[#00D9FF]/60 hover:bg-[#00D9FF]/10 active:scale-95"
    >
      {children}
    </button>
  );
}

/** Zoom, independent time stretch, and price lift/squish — every lightweight-charts instance. */
export function ChartZoomControls({ chartRef, className = 'flex-col' }: ChartZoomControlsProps) {
  const invoke = (action: (chart: IChartApi | null | undefined) => void) => {
    action(chartRef.current);
  };

  return (
    <div
      className={`pointer-events-auto flex flex-nowrap gap-1 rounded-lg border border-white/15 bg-black/85 p-1 shadow-lg backdrop-blur-md ${className}`}
      aria-label="Chart zoom and axis scale controls"
    >
      <AxisButton
        label="Stretch time (fewer, wider bars)"
        title="Stretch time — fatter candles, fewer bars"
        onClick={() => invoke((c) => stretchTimeOnly(c, 'wider'))}
      >
        <UnfoldHorizontal size={14} strokeWidth={2.5} />
      </AxisButton>
      <AxisButton
        label="Squeeze time (more, thinner bars)"
        title="Squeeze time — more history in view"
        onClick={() => invoke((c) => stretchTimeOnly(c, 'tighter'))}
      >
        <FoldHorizontal size={14} strokeWidth={2.5} />
      </AxisButton>
      <AxisButton
        label="Lift price scale"
        title="Lift price — more vertical room"
        onClick={() => invoke((c) => scalePriceOnly(c, 'lift'))}
      >
        <UnfoldVertical size={14} strokeWidth={2.5} />
      </AxisButton>
      <AxisButton
        label="Squish price scale"
        title="Squish price — taller candles"
        onClick={() => invoke((c) => scalePriceOnly(c, 'squish'))}
      >
        <FoldVertical size={14} strokeWidth={2.5} />
      </AxisButton>
      <AxisButton label="Zoom in" title="Zoom in (time and price)" onClick={() => invoke(zoomChartIn)}>
        <Plus size={14} strokeWidth={2.5} />
      </AxisButton>
      <AxisButton label="Zoom out" title="Zoom out (time and price)" onClick={() => invoke(zoomChartOut)}>
        <Minus size={14} strokeWidth={2.5} />
      </AxisButton>
      <button
        type="button"
        onClick={() => invoke(resetChartZoom)}
        aria-label="Reset zoom"
        title="Reset zoom (fit all candles) — does not change panel size"
        className="flex h-8 w-8 items-center justify-center rounded-md border border-[#BF00FF]/25 text-[#BF00FF] transition-all hover:border-[#BF00FF]/60 hover:bg-[#BF00FF]/10 active:scale-95"
      >
        <RotateCcw size={13} strokeWidth={2.5} />
      </button>
    </div>
  );
}
