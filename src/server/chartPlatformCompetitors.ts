import catalog from '../../data/marketing/chart-platform-competitors.json';

export type ChartPlatformCategory = {
  id: string;
  label: string;
  description: string;
};

export type ChartPlatformCompetitor = {
  id: string;
  name: string;
  website: string;
  categoryId: string;
  focus: string;
};

export type ChartPlatformCompetitorCatalog = {
  version: number;
  updated: string;
  scope: string;
  metricool: {
    competitorsHelpUrl: string;
    analyticsPath: string;
    important: string;
    freePlanLimitPerNetwork: number;
    paidPlanLimitPerNetwork: number;
    paidYouTubeLimit: number;
    networksSupported: string[];
    freePlanStarterIds: string[];
    note: string;
  };
  categories: ChartPlatformCategory[];
  competitors: ChartPlatformCompetitor[];
};

const DATA = catalog as ChartPlatformCompetitorCatalog;

export function getChartPlatformCompetitorCatalog(): ChartPlatformCompetitorCatalog {
  return DATA;
}

export function chartPlatformCompetitorsByCategory(): Array<{
  category: ChartPlatformCategory;
  competitors: ChartPlatformCompetitor[];
}> {
  const byId = new Map(DATA.categories.map((c) => [c.id, c]));
  const groups = new Map<string, ChartPlatformCompetitor[]>();
  for (const row of DATA.competitors) {
    const list = groups.get(row.categoryId) ?? [];
    list.push(row);
    groups.set(row.categoryId, list);
  }
  return DATA.categories
    .map((category) => ({
      category,
      competitors: (groups.get(category.id) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((g) => g.competitors.length > 0);
}

export function metricoolStarterCompetitors(): ChartPlatformCompetitor[] {
  const byId = new Map(DATA.competitors.map((c) => [c.id, c]));
  return DATA.metricool.freePlanStarterIds
    .map((id) => byId.get(id))
    .filter((c): c is ChartPlatformCompetitor => Boolean(c));
}
