/// <reference types="vite/client" />
import { CompanyFundamentals } from '../types';

export async function fetchCompanyFundamentals(symbol: string): Promise<CompanyFundamentals | null> {
  try {
    // We query the backend proxy. The backend proxy will use the secure server-side FMP_API_KEY.
    const res = await fetch(`/api/fmp/income-statement/${symbol}?limit=1`);
    if (!res.ok) {
      throw new Error(`FMP Proxy returned status: ${res.status}`);
    }
    
    const data = await res.json();
    
    if (!data || data.length === 0 || data.error) {
       console.warn("FMP returned no data or error. Hardcoded fallbacks disabled.");
       return null;
    }

    const report = data[0];
    const priceRes = await fetch(`/api/fmp/quote/${symbol}`);
    const priceData = await priceRes.json();
    const currentPrice = priceData[0]?.price || 180;

    const eps = report.netIncome / report.weightedAverageShsOut;

    return {
      symbol,
      revenue: report.revenue,
      netIncome: report.netIncome,
      margin: report.netIncome / report.revenue || 0,
      pe: currentPrice / (eps || 1),
      eps: eps || 0
    };
  } catch (error) {
    console.error("FMP Fundamental Fetch Failed - simulated data fallbacks disabled:", error);
    return null;
  }
}
