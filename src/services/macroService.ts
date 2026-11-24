/// <reference types="vite/client" />
/**
 * MACRO ANALYTICS SERVICE (Files 59, 61)
 *
 * FRED via the server proxy only. On any failure these return empty / null so the
 * UI shows DATA UNAVAILABLE — never substitute simulated macro values.
 */

export interface YieldData {
  maturity: string;
  value: number;
  label: string;
}

export interface MacroObservation {
  date: string;
  value: number;
}

export interface MacroHeadline {
  fedFunds: MacroObservation | null;
  coreInflationYoY: MacroObservation | null;
  unemployment: MacroObservation | null;
}

/** Newest-first numeric observations (FRED marks missing days with "."). */
async function fetchFredSeries(seriesId: string, limit: number): Promise<MacroObservation[]> {
  const res = await fetch(`/api/fred/observations?series_id=${encodeURIComponent(seriesId)}&limit=${limit}`);
  if (!res.ok) throw new Error(`FRED proxy ${seriesId} returned status: ${res.status}`);
  const data = await res.json();
  const rows: unknown[] = Array.isArray(data?.observations) ? data.observations : [];
  return rows
    .map((obs: any) => ({ date: String(obs?.date || ''), value: parseFloat(obs?.value) }))
    .filter((obs) => obs.date && Number.isFinite(obs.value));
}

export async function fetchGDP(): Promise<MacroObservation[]> {
  try {
    return await fetchFredSeries('GDP', 10);
  } catch (error) {
    console.warn('GDP fetch from FRED failed — DATA UNAVAILABLE:', error);
    return [];
  }
}

export async function fetchYieldCurve(): Promise<YieldData[]> {
  const series = [
    { id: 'DGS2', label: '2 Year' },
    { id: 'DGS5', label: '5 Year' },
    { id: 'DGS10', label: '10 Year' },
    { id: 'DGS30', label: '30 Year' },
  ];

  try {
    const results = await Promise.all(series.map((s) => fetchFredSeries(s.id, 5)));
    if (results.some((rows) => rows.length === 0)) return [];
    return results.map((rows, i) => ({
      maturity: series[i].id.replace('DGS', '') + 'Y',
      value: rows[0].value,
      label: series[i].label,
    }));
  } catch (error) {
    console.warn('Yield curve fetch from FRED failed — DATA UNAVAILABLE:', error);
    return [];
  }
}

export async function fetchMacroHeadline(): Promise<MacroHeadline> {
  const settle = async <T,>(task: Promise<T>): Promise<T | null> => {
    try {
      return await task;
    } catch {
      return null;
    }
  };
  const [fedFunds, coreCpi, unemployment] = await Promise.all([
    settle(fetchFredSeries('FEDFUNDS', 1)),
    settle(fetchFredSeries('CPILFESL', 13)),
    settle(fetchFredSeries('UNRATE', 1)),
  ]);
  let coreInflationYoY: MacroObservation | null = null;
  if (coreCpi && coreCpi.length >= 13 && coreCpi[12].value > 0) {
    coreInflationYoY = {
      date: coreCpi[0].date,
      value: ((coreCpi[0].value / coreCpi[12].value) - 1) * 100,
    };
  }
  return {
    fedFunds: fedFunds?.[0] ?? null,
    coreInflationYoY,
    unemployment: unemployment?.[0] ?? null,
  };
}
