import { IndicatorRegistry } from './IndicatorRegistry';

/** Chart indicator picker — only indicators with real math in IndicatorBank. */
export const CHART_INDICATOR_PICKER = IndicatorRegistry.map((ind) => ({
  name: ind.name,
  category: ind.category,
  abbr: ind.abbr,
  activeColor: ind.activeColor,
}));
