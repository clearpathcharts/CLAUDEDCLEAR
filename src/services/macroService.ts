/// <reference types="vite/client" />
/**
 * MACRO ANALYTICS SERVICE (Files 59, 61)
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

export async function fetchGDP(): Promise<MacroObservation[]> {
  try {
    // We query our secure server-side proxy
    const res = await fetch(`/api/fred/observations?series_id=GDP&limit=10`);
    if (!res.ok) {
      throw new Error(`FRED proxy GDP returned status: ${res.status}`);
    }
    const data = await res.json();
    return data.observations.map((obs: any) => ({
      date: obs.date,
      value: parseFloat(obs.value)
    }));
  } catch (error) {
    console.warn("GDP Fetch from FRED failed - returning simulated macro observations:", error);
    return Array.from({ length: 10 }, (_, i) => ({
      date: `202${3 + Math.floor(i / 4)}-Q${(i % 4) + 1}`,
      value: 26000 + (i * 200)
    }));
  }
}

export async function fetchYieldCurve(): Promise<YieldData[]> {
  const series = [
    { id: "DGS2", label: "2 Year" },
    { id: "DGS5", label: "5 Year" },
    { id: "DGS10", label: "10 Year" },
    { id: "DGS30", label: "30 Year" }
  ];

  try {
    const results = await Promise.all(
      series.map(s => 
        fetch(`/api/fred/observations?series_id=${s.id}&limit=1`)
          .then(res => {
            if (!res.ok) throw new Error("Proxy error");
            return res.json();
          })
      )
    );

    return results.map((res, i) => ({
      maturity: series[i].id.replace('DGS', '') + 'Y',
      value: parseFloat(res.observations[0].value),
      label: series[i].label
    }));
  } catch (error) {
    console.warn("Yield Curve Fetch from FRED failed - returning simulated macro data:", error);
    return [
      { maturity: "2Y", value: 4.54, label: "2 Year" },
      { maturity: "5Y", value: 4.12, label: "5 Year" },
      { maturity: "10Y", value: 4.15, label: "10 Year" },
      { maturity: "30Y", value: 4.28, label: "30 Year" }
    ];
  }
}
