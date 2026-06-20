// src/calendar-bridge/api/connect.ts

import { CALENDAR_PROVIDERS } from '../services/provider-registry';
import { connectCalendarDb, ConnectedCalendar } from '../services/calendar-sync';
import { NormalizedEvent } from '../services/event-normalizer';

export interface ConnectResult {
  success: boolean;
  provider: string;
  calendar: ConnectedCalendar;
  events: NormalizedEvent[];
}

export async function connectCalendar(
  provider: string,
  emailOrUrl: string,
  credentials?: any
): Promise<ConnectResult> {
  const config = CALENDAR_PROVIDERS[provider];

  if (!config) {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  // Engage the connector db controller
  const result = await connectCalendarDb(provider, emailOrUrl, credentials);

  return {
    success: result.success,
    provider,
    calendar: result.calendar,
    events: result.events
  };
}
