import { useEffect, useMemo, useState } from 'react';
import {
  formatChartVisionForMentor,
  getAllFormingBriefs,
  getAllPatternScans,
  subscribeFormingBrief,
  subscribePatternScan,
} from '../patterns';
import type { ChartPatternScan, FormingStructureBrief } from '../patterns';

/** Single React hook for HUD + mentor — one subscription, no duplicate state. */
export function useChartVision() {
  const [briefs, setBriefs] = useState<FormingStructureBrief[]>(getAllFormingBriefs);
  const [scans, setScans] = useState<ChartPatternScan[]>(getAllPatternScans);

  useEffect(() => {
    const unsubBriefs = subscribeFormingBrief(() => setBriefs(getAllFormingBriefs()));
    const unsubScans = subscribePatternScan(() => setScans(getAllPatternScans()));
    return () => {
      unsubBriefs();
      unsubScans();
    };
  }, []);

  const mentorContext = useMemo(
    () => formatChartVisionForMentor(briefs, scans),
    [briefs, scans],
  );

  const livePatternCount = useMemo(
    () => scans.reduce((n, s) => n + s.scan.patterns.length, 0),
    [scans],
  );

  return { briefs, scans, mentorContext, livePatternCount };
}
