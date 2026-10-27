import { useEffect } from 'react';
import { trackMarketingVisit } from '../lib/marketingAttribution';

export default function MarketingAttributionTracker() {
  useEffect(() => {
    trackMarketingVisit();
  }, []);

  return null;
}
