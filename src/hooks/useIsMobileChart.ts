import { useEffect, useState } from 'react';

const MOBILE_CHART_QUERY = '(max-width: 767px)';

/** True on phone-sized viewports where pattern HUDs must not cover the chart. */
export function useIsMobileChart(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(MOBILE_CHART_QUERY).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_CHART_QUERY);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}

export const MOBILE_PATTERN_LOOKBACK = 200;
