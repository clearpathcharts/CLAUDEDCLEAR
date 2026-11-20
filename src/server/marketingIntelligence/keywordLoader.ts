import searchIntelligence from '../../../data/marketing/global-search-intelligence.json';
import { getAllKeywordRouteAssignments } from '../../lib/marketingRouteRegistry';

export function loadMarketingKeywordCatalog() {
  const assignments = getAllKeywordRouteAssignments();
  return {
    schemaVersion: searchIntelligence.schemaVersion,
    updatedAt: searchIntelligence.updatedAt,
    name: searchIntelligence.name,
    assignments,
    sourceCounts: {
      master: assignments.filter((item) => item.source === 'master').length,
      platform: assignments.filter((item) => item.source === 'platform').length,
      brandAcquisition: assignments.filter((item) => item.source === 'brand_acquisition').length,
      officialBrand: assignments.filter((item) => item.source === 'official_brand').length,
      neurodivergent: assignments.filter((item) => item.source === 'neurodivergent').length,
    },
  };
}
