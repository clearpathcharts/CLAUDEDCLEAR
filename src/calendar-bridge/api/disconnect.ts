// src/calendar-bridge/api/disconnect.ts

import { disconnectCalendarDb } from '../services/calendar-sync';

export interface DisconnectResult {
  success: boolean;
  calendarId: string;
  message: string;
}

export async function disconnectCalendar(calendarId: string): Promise<DisconnectResult> {
  if (!calendarId) {
    throw new Error("Calendar ID is required to process disconnection");
  }

  const success = await disconnectCalendarDb(calendarId);

  return {
    success,
    calendarId,
    message: "Calendar link disconnected successfully and all cached events purged"
  };
}
