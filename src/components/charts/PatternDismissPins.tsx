import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { IChartApi, ISeriesApi, SeriesType } from 'lightweight-charts';
import type { DetectedPattern } from '../../patterns';
import { chartPatternDismissAnchor, chartPatternDismissKey } from '../../patterns/overlay';

type Pin = {
  key: string;
  label: string;
  nested: boolean;
  x: number;
  y: number;
};

function collectPins(
  chart: IChartApi,
  series: ISeriesApi<SeriesType>,
  patterns: DetectedPattern[],
): Pin[] {
  const pins: Pin[] = [];
  for (const pattern of patterns) {
    if (pattern.category !== 'chart') continue;
    const anchor = chartPatternDismissAnchor(pattern);
    if (!anchor) continue;
    const x = chart.timeScale().timeToCoordinate(anchor.time as never);
    const y = series.priceToCoordinate(anchor.price);
    if (x == null || y == null) continue;
    if (x < 8 || y < 8) continue;
    pins.push({
      key: chartPatternDismissKey(pattern),
      label: pattern.scale === 'nested' ? `${pattern.label} (nested)` : pattern.label,
      nested: pattern.scale === 'nested',
      x,
      y,
    });
  }
  return pins;
}

export function PatternDismissPins({
  chart,
  series,
  patterns,
  onDismiss,
}: {
  chart: IChartApi | null;
  series: ISeriesApi<SeriesType> | null;
  patterns: DetectedPattern[];
  onDismiss: (key: string) => void;
}) {
  const [pins, setPins] = useState<Pin[]>([]);

  useEffect(() => {
    if (!chart || !series) {
      setPins([]);
      return;
    }
    const sync = () => setPins(collectPins(chart, series, patterns));
    sync();
    const ts = chart.timeScale();
    ts.subscribeVisibleLogicalRangeChange(sync);
    ts.subscribeVisibleTimeRangeChange(sync);
    return () => {
      ts.unsubscribeVisibleLogicalRangeChange(sync);
      ts.unsubscribeVisibleTimeRangeChange(sync);
    };
  }, [chart, series, patterns]);

  if (!chart || pins.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[45]" data-pattern-dismiss-pins="">
      {pins.map((pin) => (
        <button
          key={pin.key}
          type="button"
          data-pattern-dismiss={pin.key}
          aria-label={`Remove ${pin.label} from this chart`}
          title={`Remove ${pin.label}`}
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(pin.key);
          }}
          className={`pointer-events-auto absolute flex h-5 w-5 -translate-x-1/2 -translate-y-[130%] items-center justify-center rounded-full border bg-black/90 text-[10px] shadow-[0_0_10px_rgba(0,0,0,0.65)] transition-transform hover:scale-110 ${
            pin.nested
              ? 'border-[#00D9FF] text-[#00D9FF] hover:bg-[#00D9FF] hover:text-black'
              : 'border-[#FF1493] text-[#FF1493] hover:bg-[#FF1493] hover:text-white'
          }`}
          style={{ left: pin.x, top: pin.y }}
        >
          <X size={11} strokeWidth={3} />
        </button>
      ))}
    </div>
  );
}
