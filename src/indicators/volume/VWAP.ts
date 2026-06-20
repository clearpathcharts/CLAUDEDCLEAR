import { Candle } from "../../types/indicators";

export function calculateVWAP(data: Candle[]): { time: number; value: number }[] {
  if (data.length === 0) return [];

  let cumulativePv = 0;
  let cumulativeVol = 0;

  return data.map((d) => {
    // Typical Price: (High + Low + Close) / 3
    const typicalPrice = (d.high + d.low + d.close) / 3;
    const vol = d.volume || 1; // Safeguard if volume is 0 or missing

    cumulativePv += typicalPrice * vol;
    cumulativeVol += vol;

    return {
      time: d.time,
      value: cumulativePv / (cumulativeVol || 1)
    };
  });
}
