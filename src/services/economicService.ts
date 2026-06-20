import { EconomicEvent } from '../types';

// Mock/Proxy for TradingEconomics or similar
export async function fetchEconomicCalendar(): Promise<EconomicEvent[]> {
  // In a real app, you'd fetch from an API. 
  // We'll return high-quality mock data focusing on the "desc" requirement.
  
  return [
    { event: "Non-Farm Payrolls", country: "USD", impact: "High", date: "2024-05-03 12:30", forecast: "243K", actual: "175K", previous: "315K" },
    { event: "Unemployment Rate", country: "USD", impact: "High", date: "2024-05-03 12:30", forecast: "3.8%", actual: "3.9%", previous: "3.8%" },
    { event: "CPI m/m", country: "USD", impact: "High", date: "2024-05-15 12:30", forecast: "0.3%", previous: "0.4%" },
    { event: "ECB Interest Rate Decision", country: "EUR", impact: "High", date: "2024-06-06 12:15", forecast: "4.25%", previous: "4.50%" },
    { event: "S&P Global Services PMI", country: "GBP", impact: "Medium", date: "2024-05-03 08:30", actual: "55.0", previous: "53.1" }
  ];
}
