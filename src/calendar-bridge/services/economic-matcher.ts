// src/calendar-bridge/services/economic-matcher.ts

import { NormalizedEvent } from './event-normalizer';

export interface EconomicEvent {
  id: string;
  title: string;       // e.g., "US CPI Release", "FOMC Rate Decision", "ECB Press Conference"
  start: string;       // ISO string format
  end: string;         // ISO string format
  importance: 'High' | 'Medium' | 'Low';
  category: string;    // e.g., "Forex", "Central Banks", "Commodities"
  impactTicker?: string; // e.g., "EURUSD", "GBPUSD", "XAUUSD"
}

export interface EconomicConflict {
  userEvent: NormalizedEvent;
  economicEvent: EconomicEvent;
  conflictType: 'strict_overlap' | 'buffer_warning';
  message: string;
}

/**
 * Checks if two date ranges overlap.
 */
export function datesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const aStart = new Date(startA).getTime();
  const aEnd = new Date(endA).getTime();
  const bStart = new Date(startB).getTime();
  const bEnd = new Date(endB).getTime();

  return aStart < bEnd && bStart < aEnd;
}

/**
 * Matches user calendar events against upcoming economic indicators to expose scheduling vulnerabilities.
 * It also supports AI-layered asset filter preferences (e.g. tracks EURUSD, ignore Livestock)
 */
export function matchEconomicEvents(
  userEvents: NormalizedEvent[],
  economicEvents: EconomicEvent[],
  subscribedTickers: string[] = ["EURUSD", "GBPUSD", "XAUUSD", "GOLD"]
): EconomicConflict[] {
  const conflicts: EconomicConflict[] = [];

  // Filter out economic events that do not align with user's trade preferences
  const relevantEconEvents = economicEvents.filter(econ => {
    // If user is tracking certain symbols (EURUSD, Gold), only follow relevant central banks/events.
    // We parse titles for keywords (ECB, BOE, Fed, CPI, NFP, CPI, Jobless, Rates, Gold)
    const titleUpper = econ.title.toUpperCase();
    const isCentralBank = titleUpper.includes("FED") || titleUpper.includes("ECB") || titleUpper.includes("BOE") || titleUpper.includes("FOMC");
    const isCoreIndicator = titleUpper.includes("CPI") || titleUpper.includes("NFP") || titleUpper.includes("INFLATION") || titleUpper.includes("EMPLOYMENT") || titleUpper.includes("JOBLESS");
    const isGoldRelated = titleUpper.includes("GOLD") || titleUpper.includes("RESERVE") || titleUpper.includes("XAU");

    // Ignored commodities (e.g. Soybeans, Cotton, Livestock, Wheat)
    const isIgnoredCommodity = titleUpper.includes("SOYBEAN") || titleUpper.includes("COTTON") || titleUpper.includes("LIVESTOCK") || titleUpper.includes("WHEAT") || titleUpper.includes("CATTLE");

    if (isIgnoredCommodity) return false;

    // By default, match high-impact releases or matching active tickers
    if (econ.importance === 'High') return true;
    
    // Check if matching selected tickers
    const hasTickerMatch = subscribedTickers.some(ticker => {
      const parts = ticker.toUpperCase();
      if (parts === 'GOLD' || parts === 'XAUUSD') {
        return isGoldRelated || titleUpper.includes("COMMODITIES");
      }
      if (parts === 'EURUSD') {
        return titleUpper.includes("ECB") || titleUpper.includes("FED") || titleUpper.includes("EURO");
      }
      if (parts === 'GBPUSD') {
        return titleUpper.includes("BOE") || titleUpper.includes("FED") || titleUpper.includes("BRITISH") || titleUpper.includes("STERLING");
      }
      return false;
    });

    return hasTickerMatch;
  });

  for (const userEv of userEvents) {
    for (const econEv of relevantEconEvents) {
      // Direct overlap
      if (datesOverlap(userEv.start, userEv.end, econEv.start, econEv.end)) {
        conflicts.push({
          userEvent: userEv,
          economicEvent: econEv,
          conflictType: 'strict_overlap',
          message: `HIGH IMPACT COLLISION: "${econEv.title}" overlaps with your appointment "${userEv.title}"`
        });
      } else {
        // Warning if economic event is within 1 hour before or after user event (Buffer block warning)
        const userStart = new Date(userEv.start).getTime();
        const econStart = new Date(econEv.start).getTime();
        const bufferMs = 60 * 60 * 1000; // 1 Hour buffer

        const diff = Math.abs(userStart - econStart);
        if (diff <= bufferMs) {
          conflicts.push({
            userEvent: userEv,
            economicEvent: econEv,
            conflictType: 'buffer_warning',
            message: `PRE-MARKET ALIGNMENT WARNING: "${econEv.title}" is scheduled within 1 hour of your appointment "${userEv.title}"`
          });
        }
      }
    }
  }

  return conflicts;
}
