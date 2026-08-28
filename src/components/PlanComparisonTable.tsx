import React from 'react';
import {
  CANONICAL_PLANS,
  FEATURE_ACCURACY,
  PLAN_CATALOG,
  formatLimit,
  isUnlimited,
  type CanonicalPlanId,
  type FeatureAccuracy,
} from '../lib/planCatalog';

const ROWS: { label: string; accuracy: FeatureAccuracy; value: (id: CanonicalPlanId) => string }[] = [
  { label: 'Charts per window', accuracy: FEATURE_ACCURACY.chartsPerWindow, value: (id) => formatLimit(PLAN_CATALOG[id].limits.chartsPerWindow) },
  { label: 'Indicators', accuracy: FEATURE_ACCURACY.indicators, value: (id) => formatLimit(PLAN_CATALOG[id].limits.indicators) },
  { label: 'Drawing tools', accuracy: FEATURE_ACCURACY.drawingTools, value: (id) => PLAN_CATALOG[id].limits.drawingTools === 'all' ? 'All' : 'Basic' },
  { label: 'Alerts', accuracy: FEATURE_ACCURACY.alerts, value: (id) => formatLimit(PLAN_CATALOG[id].limits.alerts) },
  { label: 'Watchlists', accuracy: FEATURE_ACCURACY.watchlists, value: (id) => formatLimit(PLAN_CATALOG[id].limits.watchlists) },
  { label: 'Historical data (sheet)', accuracy: FEATURE_ACCURACY.historicalYearsClaim, value: (id) => {
    const y = PLAN_CATALOG[id].limits.historicalYearsClaim;
    return y == null || isUnlimited(y) ? 'Unlimited (vendor-capped candles)' : `${y} year (vendor-capped candles)`;
  } },
  { label: 'Intraday charts', accuracy: FEATURE_ACCURACY.intradayCharts, value: (id) => PLAN_CATALOG[id].limits.intradayCharts ? 'Yes' : 'Daily+' },
  { label: 'Neuro-divergent layouts', accuracy: FEATURE_ACCURACY.neurodivergentLayouts, value: (id) => PLAN_CATALOG[id].flags.neurodivergentLayouts ? 'Yes' : '—' },
  { label: 'No platform manipulation', accuracy: FEATURE_ACCURACY.noPlatformManipulation, value: (id) => PLAN_CATALOG[id].flags.noPlatformManipulation ? 'Yes' : '—' },
  { label: 'Real-time news', accuracy: FEATURE_ACCURACY.realTimeNews, value: (id) => PLAN_CATALOG[id].flags.realTimeNews ? 'Yes' : '—' },
  { label: 'Paper trading', accuracy: FEATURE_ACCURACY.paperTrading, value: (id) => PLAN_CATALOG[id].flags.paperTrading ? 'Yes' : '—' },
  { label: 'Market replay', accuracy: FEATURE_ACCURACY.marketReplay, value: (id) => PLAN_CATALOG[id].flags.marketReplay ? 'Planned' : '—' },
  { label: 'Blackout mode', accuracy: FEATURE_ACCURACY.blackoutMode, value: (id) => PLAN_CATALOG[id].flags.blackoutMode ? 'Yes' : '—' },
  { label: 'No ads', accuracy: FEATURE_ACCURACY.noAds, value: (id) => PLAN_CATALOG[id].flags.noAds ? 'Yes' : '—' },
  { label: 'Custom dashboard', accuracy: FEATURE_ACCURACY.customDashboard, value: (id) => PLAN_CATALOG[id].flags.customDashboard ? 'Yes' : '—' },
  { label: 'Education', accuracy: FEATURE_ACCURACY.education, value: (id) => PLAN_CATALOG[id].flags.education ? 'Yes' : '—' },
  { label: 'Gold Bar', accuracy: FEATURE_ACCURACY.goldBar, value: (id) => PLAN_CATALOG[id].flags.goldBar ? 'Yes' : '—' },
  { label: 'Encyclopedia', accuracy: FEATURE_ACCURACY.encyclopedia, value: (id) => PLAN_CATALOG[id].flags.encyclopedia ? 'Yes' : '—' },
  { label: 'Affiliate', accuracy: FEATURE_ACCURACY.affiliate, value: (id) => PLAN_CATALOG[id].flags.affiliate ? 'Yes' : '—' },
  { label: 'Social hub', accuracy: FEATURE_ACCURACY.socialHub, value: (id) => PLAN_CATALOG[id].flags.socialHub ? 'Partial' : '—' },
  { label: 'Pattern overlay', accuracy: FEATURE_ACCURACY.patternOverlay, value: (id) => PLAN_CATALOG[id].flags.patternOverlay ? 'Yes' : '—' },
  { label: 'IndaCreator', accuracy: FEATURE_ACCURACY.indaCreator, value: (id) => PLAN_CATALOG[id].flags.indaCreator ? 'Yes' : '—' },
  { label: 'AI pattern scanner', accuracy: FEATURE_ACCURACY.aiPatternScanner, value: (id) => PLAN_CATALOG[id].flags.aiPatternScanner ? 'Partial' : '—' },
  { label: 'Bots', accuracy: FEATURE_ACCURACY.bots, value: (id) => PLAN_CATALOG[id].flags.bots ? 'Partial' : '—' },
];

const ACCENT: Record<CanonicalPlanId, string> = {
  basic: 'text-zinc-300',
  silver: 'text-zinc-100',
  gold: 'text-amber-300',
  platinum: 'text-cyan-300',
};

function accuracyDot(a: FeatureAccuracy) {
  if (a === 'enforced') return 'bg-emerald-400';
  if (a === 'vendor_capped') return 'bg-amber-400';
  if (a === 'partial') return 'bg-sky-400';
  return 'bg-zinc-500';
}

export function PlanComparisonTable() {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/60 overflow-hidden" data-testid="plan-comparison-table">
      <div className="px-4 py-3 border-b border-white/10 flex flex-wrap items-center gap-4 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Enforced</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Vendor-capped</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-400" /> Partial</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-zinc-500" /> Planned</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/10">
              <th className="p-3 text-zinc-500 font-mono uppercase tracking-widest text-[10px]">Feature</th>
              {CANONICAL_PLANS.map((id) => (
                <th key={id} className={`p-3 font-black uppercase tracking-widest ${ACCENT[id]}`}>
                  {PLAN_CATALOG[id].label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="p-3 text-zinc-400">
                  <span className="inline-flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${accuracyDot(row.accuracy)}`} />
                    {row.label}
                  </span>
                </td>
                {CANONICAL_PLANS.map((id) => (
                  <td key={id} className="p-3 text-zinc-200 font-mono">
                    {row.value(id)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
