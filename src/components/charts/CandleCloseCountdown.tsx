import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import {
  formatCandleCountdown,
  secondsUntilCandleClose,
} from '../../patterns/timeframeDuration';

interface CandleCloseCountdownProps {
  /** Unix seconds of the current bar open. */
  barOpenTime: number | null | undefined;
  timeframe: string;
  compact?: boolean;
  className?: string;
}

/** Informational timer until the current candle is expected to close. */
export function CandleCloseCountdown({
  barOpenTime,
  timeframe,
  compact = false,
  className = '',
}: CandleCloseCountdownProps) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (barOpenTime == null || !Number.isFinite(barOpenTime)) {
      setRemaining(0);
      return;
    }
    const tick = () => setRemaining(secondsUntilCandleClose(barOpenTime, timeframe));
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [barOpenTime, timeframe]);

  if (barOpenTime == null || !Number.isFinite(barOpenTime)) return null;

  return (
    <div
      className={`inline-flex items-center gap-1.5 font-mono ${
        compact ? 'text-[10px]' : 'text-xs'
      } text-[#00E5FF]/90 ${className}`}
      title="Seconds until the current candle is expected to close — informational only"
    >
      <Clock size={compact ? 11 : 13} className="shrink-0 opacity-80" />
      <span className="uppercase tracking-wide text-white/45">Candle close</span>
      <span className="font-black tabular-nums text-[#00E5FF]">{formatCandleCountdown(remaining)}</span>
    </div>
  );
}
