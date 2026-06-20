// src/calendar-bridge/api/sync.ts

import { getNormalizedEventsDb, getConnectedCalendarsDb } from '../services/calendar-sync';
import { matchEconomicEvents, EconomicEvent, EconomicConflict } from '../services/economic-matcher';
import { NormalizedEvent } from '../services/event-normalizer';

export interface SyncStatistics {
  success: boolean;
  timestamp: string;
  calendarsSyncedCount: number;
  totalEventsFetched: number;
  detectedConflictsCount: number;
  conflicts: EconomicConflict[];
  events: NormalizedEvent[];
}

/**
 * Executes a full synchronization run: fetches all stored connected calendars,
 * retrieves normalized events, feeds them to the collision matching filters, and returns conflict alerts.
 */
export async function syncAllCalendars(
  economicEvents: EconomicEvent[],
  subscribedTickers?: string[]
): Promise<SyncStatistics> {
  const calendars = await getConnectedCalendarsDb();
  const events = await getNormalizedEventsDb();
  
  // Calculate conflicts on the active feeds
  const conflicts = matchEconomicEvents(events, economicEvents, subscribedTickers);

  return {
    success: true,
    timestamp: new Date().toISOString(),
    calendarsSyncedCount: calendars.length,
    totalEventsFetched: events.length,
    detectedConflictsCount: conflicts.length,
    conflicts,
    events
  };
}
